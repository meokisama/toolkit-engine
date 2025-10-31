import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { Home, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AddZigbeeDeviceDialog } from "../zigbee/add-zigbee-device-dialog";
import { ZigbeeSwitchCard } from "../zigbee/zigbee-switch-card";
import { ZigbeeCurtainCard } from "../zigbee/zigbee-curtain-card";
import { ZigbeeMotionSensorCard } from "../zigbee/zigbee-motion-sensor-card";
import { ZigbeeDoorContactCard } from "../zigbee/zigbee-door-contact-card";

export function Smarthome() {
  const { selectedProject } = useProjectDetail();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDeviceDialogOpen, setAddDeviceDialogOpen] = useState(false);

  // Load devices when project changes
  useEffect(() => {
    if (selectedProject) {
      loadDevices();
    }
  }, [selectedProject]);

  // Auto refresh every second (silent mode)
  useEffect(() => {
    if (!selectedProject) return;

    // Set up interval for auto refresh
    const intervalId = setInterval(() => {
      handleRefresh(true); // silent = true, no toast
    }, 1000); // 1 second

    // Cleanup interval on unmount or project change
    return () => {
      clearInterval(intervalId);
    };
  }, [selectedProject]);

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

    // Only show loading spinner for manual refresh
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
        }
        if (!silent) {
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
      let totalErrors = 0;

      // 3. For each unit, send getZigbeeDevices command
      for (const [, unitData] of unitMap) {
        try {
          console.log(
            `Refreshing devices from unit ${unitData.unit_ip} (CAN ID: ${unitData.unit_can_id})`
          );

          // Send getZigbeeDevices command to unit
          const response = await window.electronAPI.rcuController.getZigbeeDevices(
            {
              unitIp: unitData.unit_ip,
              canId: unitData.unit_can_id,
            }
          );

          if (!response.success || !response.devices) {
            console.warn(
              `Failed to get devices from unit ${unitData.unit_ip}`
            );
            totalErrors++;
            continue;
          }

          console.log(
            `Received ${response.devices.length} devices from unit ${unitData.unit_ip}`
          );

          // 4. Compare and update devices by IEEE address
          for (const receivedDevice of response.devices) {
            // Find matching device in database by IEEE address
            const dbDevice = unitData.devices.find(
              (d) =>
                d.ieee_address.toUpperCase() ===
                receivedDevice.ieee_address.toUpperCase()
            );

            if (dbDevice) {
              // Update existing device with new values
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

                console.log(
                  `Updated device ${receivedDevice.ieee_address} (RSSI: ${receivedDevice.rssi}, Status: ${receivedDevice.status})`
                );
                totalUpdated++;
              } catch (updateError) {
                console.error(
                  `Failed to update device ${receivedDevice.ieee_address}:`,
                  updateError
                );
                totalErrors++;
              }
            } else {
              // Device not found in database - create new device
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
        } catch (unitError) {
          console.error(
            `Error refreshing unit ${unitData.unit_ip}:`,
            unitError
          );
          totalErrors++;
        }
      }

      // 5. Reload devices to show updated data
      const updatedDevices = await window.electronAPI.zigbee.getDevices(
        selectedProject.id
      );
      setDevices(updatedDevices);

      // Show results (only for manual refresh)
      if (!silent) {
        if (totalUpdated > 0) {
          toast.success(`Refreshed ${totalUpdated} device(s)`);
        } else if (totalErrors > 0) {
          toast.error("Failed to refresh devices");
        } else {
          toast.info("No devices needed updating");
        }
      }
    } catch (error) {
      console.error("Failed to refresh devices:", error);
      if (!silent) {
        toast.error("Failed to refresh devices");
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

  // Helper to render appropriate card based on device type
  const renderDeviceCard = (device) => {
    // Device types: 0-3: Switch, 4-5: Curtain, 7: Motion Sensor, 9: Door Contact
    if (device.device_type >= 0 && device.device_type <= 3) {
      return <ZigbeeSwitchCard key={device.id} device={device} />;
    } else if (device.device_type === 4 || device.device_type === 5) {
      return <ZigbeeCurtainCard key={device.id} device={device} />;
    } else if (device.device_type === 7) {
      return <ZigbeeMotionSensorCard key={device.id} device={device} />;
    } else if (device.device_type === 9) {
      return <ZigbeeDoorContactCard key={device.id} device={device} />;
    } else {
      // Unknown device type - show basic info card
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
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Zigbee Devices
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button onClick={() => setAddDeviceDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No Zigbee devices found.</p>
              <p className="text-sm mt-2">
                Click "Add Device" to scan and add Zigbee devices from your
                units.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => renderDeviceCard(device))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddZigbeeDeviceDialog
        open={addDeviceDialogOpen}
        onOpenChange={setAddDeviceDialogOpen}
        onDevicesAdded={handleDevicesAdded}
      />
    </div>
  );
}
