import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { Home, Plus, RefreshCw, Radio, Cable, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AddZigbeeDeviceDialog } from "../zigbee/add-zigbee-device-dialog";
import { ExploreZigbeeDeviceDialog } from "../zigbee/explore-zigbee-device-dialog";
import { AssignEndpointAddressDialog } from "../zigbee/assign-endpoint-address-dialog";
import { FactoryResetZigbeeDialog } from "../zigbee/factory-reset-zigbee-dialog";
import { ZigbeeSwitchCard } from "../zigbee/zigbee-switch-card";
import { ZigbeeCurtainCard } from "../zigbee/zigbee-curtain-card";
import { ZigbeeMotionSensorCard } from "../zigbee/zigbee-motion-sensor-card";
import { ZigbeeDoorContactCard } from "../zigbee/zigbee-door-contact-card";

export function Smarthome() {
  const { selectedProject } = useProjectDetail();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDeviceDialogOpen, setAddDeviceDialogOpen] = useState(false);
  const [exploreDeviceDialogOpen, setExploreDeviceDialogOpen] = useState(false);
  const [assignAddressDialogOpen, setAssignAddressDialogOpen] = useState(false);
  const [factoryResetDialogOpen, setFactoryResetDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Use ref to track loading state for interval
  const loadingRef = useRef(false);

  // Sync loading state with ref
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Load devices when project changes
  useEffect(() => {
    if (selectedProject) {
      loadDevices();
    }
  }, [selectedProject]);

  // Auto refresh interval
  useEffect(() => {
    if (!autoRefresh || !selectedProject) return;

    const intervalId = setInterval(() => {
      if (!loadingRef.current) {
        handleRefresh(true);
      }
    }, 1000); // Refresh every 1 second

    return () => clearInterval(intervalId);
  }, [autoRefresh, selectedProject]);

  const loadDevices = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const devicesData = await window.electronAPI.zigbee.getDevices(
        selectedProject.id
      );
      setDevices(devicesData);
    } catch (error) {
      console.error("Failed to load zigbee devices:", error);
      toast.error("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (silent = false) => {
    if (!selectedProject) return;

    if (!silent) {
      setLoading(true);
    }

    try {
      // 1. Get all devices from database to find unique units
      const devicesData = await window.electronAPI.zigbee.getDevices(
        selectedProject.id
      );

      if (devicesData.length === 0) {
        if (!silent) {
          toast.info("No devices to refresh");
          setLoading(false);
        }
        return;
      }

      // 2. Group devices by unit (unit_ip + unit_can_id)
      const unitMap = new Map();
      devicesData.forEach((device) => {
        const unitKey = `${device.unit_ip}|${device.unit_can_id}`;
        if (!unitMap.has(unitKey)) {
          unitMap.set(unitKey, {
            unit_ip: device.unit_ip,
            unit_can_id: device.unit_can_id,
            devices: [],
          });
        }
        unitMap.get(unitKey).devices.push(device);
      });

      console.log(`Found ${unitMap.size} unique units to refresh`);

      let totalUpdated = 0;
      let totalDeleted = 0;
      let totalErrors = 0;

      // 3. For each unit, send getZigbeeDevices command
      for (const unitData of unitMap.values()) {
        try {
          console.log(
            `Refreshing devices from unit ${unitData.unit_ip} (CAN ID: ${unitData.unit_can_id})`
          );

          let response;
          try {
            response = await window.electronAPI.rcuController.getZigbeeDevices({
              unitIp: unitData.unit_ip,
              canId: unitData.unit_can_id,
            });
          } catch (connectionError) {
            console.error(
              `Connection error to unit ${unitData.unit_ip}:`,
              connectionError
            );
            response = { success: false };
          }

          if (!response.success || !response.devices) {
            console.warn(`Failed to get devices from unit ${unitData.unit_ip}`);

            // Set all devices from this unit to offline
            for (const dbDevice of unitData.devices) {
              try {
                await window.electronAPI.zigbee.updateDevice(dbDevice.id, {
                  status: 0, // Offline
                });
                console.log(
                  `Set device ${dbDevice.ieee_address} to offline (unit unreachable)`
                );
              } catch (updateError) {
                console.error(
                  `Failed to update device ${dbDevice.ieee_address} to offline:`,
                  updateError
                );
              }
            }

            totalErrors++;
            continue;
          }

          console.log(
            `Received ${response.devices.length} devices from unit ${unitData.unit_ip}`
          );

          // 4. Update or create devices from unit response
          for (const receivedDevice of response.devices) {
            const dbDevice = unitData.devices.find(
              (d) =>
                d.ieee_address.toUpperCase() ===
                receivedDevice.ieee_address.toUpperCase()
            );

            if (dbDevice) {
              try {
                await window.electronAPI.zigbee.updateDevice(dbDevice.id, {
                  device_type: receivedDevice.device_type,
                  num_endpoints: receivedDevice.num_endpoints,
                  endpoint1_id: receivedDevice.endpoint1_id,
                  endpoint1_value: receivedDevice.endpoint1_value,
                  endpoint1_address: receivedDevice.endpoint1_address,
                  endpoint2_id: receivedDevice.endpoint2_id,
                  endpoint2_value: receivedDevice.endpoint2_value,
                  endpoint2_address: receivedDevice.endpoint2_address,
                  endpoint3_id: receivedDevice.endpoint3_id,
                  endpoint3_value: receivedDevice.endpoint3_value,
                  endpoint3_address: receivedDevice.endpoint3_address,
                  endpoint4_id: receivedDevice.endpoint4_id,
                  endpoint4_value: receivedDevice.endpoint4_value,
                  endpoint4_address: receivedDevice.endpoint4_address,
                  rssi: receivedDevice.rssi,
                  status: receivedDevice.status,
                });

                totalUpdated++;
              } catch (updateError) {
                console.error(
                  `Failed to update device ${receivedDevice.ieee_address}:`,
                  updateError
                );
                totalErrors++;
              }
            } else {
              try {
                const newDeviceData = {
                  unit_ip: unitData.unit_ip,
                  unit_can_id: unitData.unit_can_id,
                  ieee_address: receivedDevice.ieee_address,
                  device_type: receivedDevice.device_type,
                  num_endpoints: receivedDevice.num_endpoints,
                  endpoint1_id: receivedDevice.endpoint1_id,
                  endpoint1_value: receivedDevice.endpoint1_value,
                  endpoint1_address: receivedDevice.endpoint1_address,
                  endpoint2_id: receivedDevice.endpoint2_id,
                  endpoint2_value: receivedDevice.endpoint2_value,
                  endpoint2_address: receivedDevice.endpoint2_address,
                  endpoint3_id: receivedDevice.endpoint3_id,
                  endpoint3_value: receivedDevice.endpoint3_value,
                  endpoint3_address: receivedDevice.endpoint3_address,
                  endpoint4_id: receivedDevice.endpoint4_id,
                  endpoint4_value: receivedDevice.endpoint4_value,
                  endpoint4_address: receivedDevice.endpoint4_address,
                  rssi: receivedDevice.rssi,
                  status: receivedDevice.status,
                };

                await window.electronAPI.zigbee.createDevice(
                  selectedProject.id,
                  newDeviceData
                );

                console.log(
                  `Created new device ${receivedDevice.ieee_address} from unit ${unitData.unit_ip}`
                );
                totalUpdated++;
              } catch (createError) {
                console.error(
                  `Failed to create device ${receivedDevice.ieee_address}:`,
                  createError
                );
                totalErrors++;
              }
            }
          }

          // 5. Delete devices from database that no longer exist on the unit
          // Create a Set of IEEE addresses from received devices (case-insensitive)
          const receivedIeeeAddresses = new Set(
            response.devices.map((d) => d.ieee_address.toUpperCase())
          );

          // Find devices in database that are not in received devices
          const devicesToDelete = unitData.devices.filter(
            (dbDevice) =>
              !receivedIeeeAddresses.has(dbDevice.ieee_address.toUpperCase())
          );

          // Delete each device that no longer exists on the unit
          for (const deviceToDelete of devicesToDelete) {
            try {
              await window.electronAPI.zigbee.deleteDevice(deviceToDelete.id);
              console.log(
                `Deleted device ${deviceToDelete.ieee_address} (no longer exists on unit ${unitData.unit_ip})`
              );
              totalDeleted++;
            } catch (deleteError) {
              console.error(
                `Failed to delete device ${deviceToDelete.ieee_address}:`,
                deleteError
              );
              totalErrors++;
            }
          }
        } catch (unitError) {
          console.error(
            `Error refreshing unit ${unitData.unit_ip}:`,
            unitError
          );
          totalErrors++;
        }
      }

      // 6. Reload devices to show updated data
      const updatedDevices = await window.electronAPI.zigbee.getDevices(
        selectedProject.id
      );
      setDevices(updatedDevices);

      if (!silent) {
        const messages = [];
        if (totalUpdated > 0) {
          messages.push(`Updated ${totalUpdated}`);
        }
        if (totalDeleted > 0) {
          messages.push(`Deleted ${totalDeleted}`);
        }

        if (messages.length > 0) {
          toast.success(`Refresh completed: ${messages.join(", ")} device(s)`);
        } else if (totalErrors > 0) {
          toast.error("Failed to refresh devices");
        } else {
          toast.info("No devices needed updating");
        }
      }
    } catch (error) {
      console.error("Failed to refresh devices:", error);
      if (!silent) {
        toast.error(error.message || "Failed to refresh devices");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleDevicesAdded = () => {
    loadDevices();
    setAddDeviceDialogOpen(false);
  };

  const handleRemoveDevice = async (device) => {
    try {
      // 1. Send remove command to the device's unit
      const result = await window.electronAPI.rcuController.removeZigbeeDevice({
        unitIp: device.unit_ip,
        canId: device.unit_can_id,
        ieeeAddress: device.ieee_address,
        deviceType: device.device_type,
      });

      if (!result.success) {
        throw new Error("Failed to remove device from network");
      }

      // 2. Delete the device from the database
      await window.electronAPI.zigbee.deleteDevice(device.id);

      // 3. Reload the devices list
      await loadDevices();
    } catch (error) {
      console.error("Failed to remove device:", error);
      throw error;
    }
  };

  const renderDeviceCard = (device) => {
    // Device types: 0-3: Switch, 4-5: Curtain, 7: Motion Sensor, 9: Door Contact
    if (device.device_type >= 0 && device.device_type <= 3) {
      return (
        <ZigbeeSwitchCard
          key={device.id}
          device={device}
          onRemove={handleRemoveDevice}
        />
      );
    } else if (device.device_type === 4 || device.device_type === 5) {
      return (
        <ZigbeeCurtainCard
          key={device.id}
          device={device}
          onRemove={handleRemoveDevice}
        />
      );
    } else if (device.device_type === 7) {
      return (
        <ZigbeeMotionSensorCard
          key={device.id}
          device={device}
          onRemove={handleRemoveDevice}
        />
      );
    } else if (device.device_type === 9) {
      return (
        <ZigbeeDoorContactCard
          key={device.id}
          device={device}
          onRemove={handleRemoveDevice}
        />
      );
    } else {
      return (
        <Card key={device.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Unknown Device (Type: {device.device_type})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div>IEEE: {device.ieee_address}</div>
              <div>Unit: {device.unit_ip}</div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  // Don't render if no project is selected
  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Select a project to view smarthome features
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="h-full space-y-4">
        <div className="bg-muted/50 border rounded-lg p-4 shadow">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <span>Smart Home</span>
              {devices.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({devices.length}{" "}
                  {devices.length === 1 ? "device" : "devices"})
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-background/50 shadow">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  disabled={loading}
                />
                <Label
                  htmlFor="auto-refresh"
                  className="cursor-pointer text-sm font-medium"
                >
                  Auto Refresh (1s)
                </Label>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => handleRefresh()}
                  disabled={loading || autoRefresh}
                  className="gap-2 shadow"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setExploreDeviceDialogOpen(true)}
                  className="gap-2 shadow"
                >
                  <Radio className="h-4 w-4" />
                  Explore
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAssignAddressDialogOpen(true)}
                  disabled={devices.length === 0}
                  className="gap-2 shadow"
                >
                  <Cable className="h-4 w-4" />
                  Assign
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFactoryResetDialogOpen(true)}
                  disabled={devices.length === 0}
                  className="gap-2 shadow"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={() => setAddDeviceDialogOpen(true)}
                  className="gap-2 shadow"
                >
                  <Plus className="h-4 w-4" />
                  Add Device
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Device Card */}
        <div>
          {devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <Home className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Zigbee Devices</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Get started by adding your first Zigbee device to your smart
                home network.
              </p>
              <Button
                onClick={() => setAddDeviceDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your First Device
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => renderDeviceCard(device))}
            </div>
          )}
        </div>
      </div>

      <AddZigbeeDeviceDialog
        open={addDeviceDialogOpen}
        onOpenChange={setAddDeviceDialogOpen}
        onDevicesAdded={handleDevicesAdded}
      />

      <ExploreZigbeeDeviceDialog
        open={exploreDeviceDialogOpen}
        onOpenChange={setExploreDeviceDialogOpen}
        onDevicesAdded={handleDevicesAdded}
      />

      <AssignEndpointAddressDialog
        open={assignAddressDialogOpen}
        onOpenChange={setAssignAddressDialogOpen}
        devices={devices}
        onSaved={loadDevices}
      />

      <FactoryResetZigbeeDialog
        open={factoryResetDialogOpen}
        onOpenChange={setFactoryResetDialogOpen}
        devices={devices}
        projectId={selectedProject?.id}
        onSuccess={loadDevices}
      />
    </div>
  );
}
