import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/custom/combobox";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { Power, DoorClosed, Loader2, Book } from "lucide-react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";
import lightOn from "@/assets/light-on.png";

export function AssignEndpointAddressDialog({ open, onOpenChange, devices, onSaved }) {
  const { selectedProject } = useProjectDetail();
  const [loading, setLoading] = useState(false);
  const [lightingItems, setLightingItems] = useState([]);
  const [curtainItems, setCurtainItems] = useState([]);
  const [endpointAddresses, setEndpointAddresses] = useState({});

  // Filter only switch and curtain devices
  const switchAndCurtainDevices = devices.filter((device) => {
    return (
      (device.device_type >= 0 && device.device_type <= 3) || // Switch
      device.device_type === 4 ||
      device.device_type === 5 // Curtain
    );
  });

  // Load lighting and curtain items when dialog opens
  useEffect(() => {
    if (open && selectedProject) {
      loadItems();
      // Initialize endpoint addresses from current device data
      initializeEndpointAddresses();
    }
  }, [open, selectedProject, devices]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const [lighting, curtain] = await Promise.all([
        window.electronAPI.lighting.getAll(selectedProject.id),
        window.electronAPI.curtain.getAll(selectedProject.id),
      ]);
      setLightingItems(lighting);
      setCurtainItems(curtain);
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load lighting/curtain items");
    } finally {
      setLoading(false);
    }
  };

  const initializeEndpointAddresses = () => {
    const addresses = {};
    switchAndCurtainDevices.forEach((device) => {
      for (let i = 1; i <= device.num_endpoints && i <= 4; i++) {
        const endpointId = device[`endpoint${i}_id`];
        if (endpointId > 0) {
          const key = `${device.id}_${i}`;
          addresses[key] = device[`endpoint${i}_address`] || 0;
        }
      }
    });
    setEndpointAddresses(addresses);
  };

  const handleAddressChange = (deviceId, endpointIndex, value) => {
    const key = `${deviceId}_${endpointIndex}`;
    const numValue = parseInt(value) || 0;
    setEndpointAddresses((prev) => ({
      ...prev,
      [key]: numValue,
    }));
  };

  const handleSelectFromCombobox = (deviceId, endpointIndex, address) => {
    const key = `${deviceId}_${endpointIndex}`;
    // Convert empty string (from Clear selection) to 0
    const numValue = address === "" ? 0 : address;
    setEndpointAddresses((prev) => ({
      ...prev,
      [key]: numValue,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Group updates by device
      const deviceUpdates = {};
      Object.entries(endpointAddresses).forEach(([key, address]) => {
        const [deviceId, endpointIndex] = key.split("_");
        if (!deviceUpdates[deviceId]) {
          deviceUpdates[deviceId] = {};
        }
        deviceUpdates[deviceId][`endpoint${endpointIndex}_address`] = address;
      });

      // Step 1: Update database
      for (const [deviceId, updates] of Object.entries(deviceUpdates)) {
        await window.electronAPI.zigbee.updateDevice(parseInt(deviceId), updates);
      }

      // Step 2: Send configuration to units
      // Group devices by unit (unitIp + canId)
      const unitMap = new Map();
      switchAndCurtainDevices.forEach((device) => {
        const unitKey = `${device.unit_ip}|${device.unit_can_id}`;
        if (!unitMap.has(unitKey)) {
          unitMap.set(unitKey, {
            unitIp: device.unit_ip,
            canId: device.unit_can_id,
            devices: [],
          });
        }

        // Prepare device config for this device
        const deviceConfig = {
          ieeeAddress: device.ieee_address,
          deviceType: device.device_type,
          endpoint1Address: endpointAddresses[`${device.id}_1`] || device.endpoint1_address || 0,
          endpoint2Address: endpointAddresses[`${device.id}_2`] || device.endpoint2_address || 0,
          endpoint3Address: endpointAddresses[`${device.id}_3`] || device.endpoint3_address || 0,
          endpoint4Address: endpointAddresses[`${device.id}_4`] || device.endpoint4_address || 0,
        };

        unitMap.get(unitKey).devices.push(deviceConfig);
      });

      // Send setup command to each unit (max 50 devices per packet)
      let setupErrors = 0;
      for (const unitData of unitMap.values()) {
        try {
          // Split into batches of 50 devices if necessary
          const batchSize = 50;
          const totalDevices = unitData.devices.length;
          const batchCount = Math.ceil(totalDevices / batchSize);

          console.log(`Unit ${unitData.unitIp}: ${totalDevices} devices, will send ${batchCount} batch(es)`);

          // Send each batch
          for (let i = 0; i < batchCount; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, totalDevices);
            const batch = unitData.devices.slice(start, end);

            console.log(`Sending batch ${i + 1}/${batchCount} to unit ${unitData.unitIp} (${batch.length} devices)`);

            const result = await window.electronAPI.zigbeeController.setupZigbeeDevice({
              unitIp: unitData.unitIp,
              canId: unitData.canId,
              devices: batch,
            });

            if (!result.success) {
              console.error(`Failed to setup batch ${i + 1}/${batchCount} for unit ${unitData.unitIp}`);
              setupErrors++;
              break; // Stop sending remaining batches for this unit if one fails
            }
          }
        } catch (error) {
          console.error(`Error setting up unit ${unitData.unitIp}:`, error);
          setupErrors++;
        }
      }

      if (setupErrors > 0) {
        toast.warning(`Addresses saved to database, but failed to send to ${setupErrors} unit(s)`);
      } else {
        toast.success("Endpoint addresses updated and sent to units successfully");
      }

      if (onSaved) {
        await onSaved();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update addresses:", error);
      toast.error("Failed to update addresses");
    } finally {
      setLoading(false);
    }
  };

  const getDeviceTypeInfo = (deviceType) => {
    return CONSTANTS.ZIGBEE.DEVICE_TYPE.find((type) => type.value === deviceType);
  };

  const isSwitch = (deviceType) => {
    return deviceType >= 0 && deviceType <= 3;
  };

  const isCurtain = (deviceType) => {
    return deviceType === 4 || deviceType === 5;
  };

  const getComboboxOptions = (deviceType) => {
    if (isSwitch(deviceType)) {
      return lightingItems.map((item) => ({
        value: item.address,
        label: `${item.name || "Unnamed"} (Addr: ${item.address})`,
      }));
    } else if (isCurtain(deviceType)) {
      return curtainItems.map((item) => ({
        value: item.address,
        label: `${item.name || "Unnamed"} (Addr: ${item.address})`,
      }));
    }
    return [];
  };

  const renderDeviceEndpoints = (device) => {
    const deviceTypeInfo = getDeviceTypeInfo(device.device_type);
    const deviceName = device.device_name || deviceTypeInfo?.label || `Device ${device.id}`;

    const endpoints = [];
    for (let i = 1; i <= device.num_endpoints && i <= 4; i++) {
      const endpointId = device[`endpoint${i}_id`];
      const endpointName = device[`endpoint${i}_name`];
      if (endpointId > 0) {
        endpoints.push({
          id: endpointId,
          index: i,
          name: endpointName,
        });
      }
    }

    const Icon = isSwitch(device.device_type) ? Power : DoorClosed;
    const comboboxOptions = getComboboxOptions(device.device_type);

    return (
      <Card key={device.id}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4" />
            {deviceName}
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            IEEE: {device.ieee_address} | Unit: {device.unit_ip}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {endpoints.map((endpoint) => {
            const key = `${device.id}_${endpoint.index}`;
            const currentAddress = endpointAddresses[key] || 0;

            return (
              <div key={endpoint.index} className="space-y-2 p-3 border rounded-lg shadow">
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <img src={lightOn} alt="Lighting State" className="w-[25px] h-auto rounded-lg -translate-y-0.5" />
                    {endpoint.name || `Switch ${endpoint.index}`}
                  </div>
                  <div className="space-y-1 relative">
                    <Book className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="number"
                      min="0"
                      max="255"
                      value={currentAddress}
                      onChange={(e) => handleAddressChange(device.id, endpoint.index, e.target.value)}
                      disabled={loading}
                      className="pl-8 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Combobox
                      value={currentAddress}
                      onValueChange={(value) => handleSelectFromCombobox(device.id, endpoint.index, value)}
                      options={comboboxOptions}
                      placeholder="Select..."
                      searchPlaceholder="Search..."
                      emptyMessage={`No ${isSwitch(device.device_type) ? "lighting" : "curtain"} items found.`}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Assign Endpoint Addresses</SheetTitle>
          <SheetDescription>Configure address mappings for switch and curtain device endpoints</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4 flex-1">
          {loading && switchAndCurtainDevices.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : switchAndCurtainDevices.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No switch or curtain devices found</div>
          ) : (
            <div className="space-y-4">{switchAndCurtainDevices.map((device) => renderDeviceEndpoints(device))}</div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
