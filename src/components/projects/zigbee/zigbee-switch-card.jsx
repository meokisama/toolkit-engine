import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Power, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";

export function ZigbeeSwitchCard({ device }) {
  const [loadingEndpoints, setLoadingEndpoints] = useState({});
  // Local state for endpoint values (for instant UI update)
  const [endpointValues, setEndpointValues] = useState(() => {
    const values = {};
    for (let i = 1; i <= 4; i++) {
      values[i] = device[`endpoint${i}_value`];
    }
    return values;
  });
  const [deviceStatus, setDeviceStatus] = useState(device.status);
  const [deviceRssi, setDeviceRssi] = useState(device.rssi);

  // Get device type info
  const deviceTypeInfo = CONSTANTS.ZIGBEE.DEVICE_TYPE.find(
    (type) => type.value === device.device_type
  );

  // Get number of gangs (endpoints)
  const numGangs = device.num_endpoints;

  // Get endpoints data with local state values
  const endpoints = [];
  for (let i = 1; i <= numGangs && i <= 4; i++) {
    const endpointId = device[`endpoint${i}_id`];
    const endpointValue = endpointValues[i]; // Use local state
    const endpointAddress = device[`endpoint${i}_address`];

    if (endpointId > 0) {
      endpoints.push({
        id: endpointId,
        value: endpointValue,
        address: endpointAddress,
        index: i,
      });
    }
  }

  const handleToggle = async (endpoint) => {
    if (!device.unit_ip || !device.unit_can_id) {
      toast.error("Unit information not found");
      return;
    }

    const key = `endpoint${endpoint.index}`;
    setLoadingEndpoints((prev) => ({ ...prev, [key]: true }));

    try {
      // Toggle: if current value is 0 (OFF), send ON (1), otherwise send OFF (0)
      const command = endpoint.value === 0 ? 1 : 0; // 0: OFF, 1: ON

      const result = await window.electronAPI.rcuController.sendZigbeeCommand({
        unitIp: device.unit_ip,
        canId: device.unit_can_id,
        ieeeAddress: device.ieee_address,
        deviceType: device.device_type,
        endpointId: endpoint.id,
        command: command,
        deviceId: device.id, // Pass device ID for database update
      });

      if (result.success) {
        toast.success(
          `Switch ${endpoint.index} turned ${command === 1 ? "ON" : "OFF"}`
        );

        // Update local state with response data
        if (result.statusUpdate) {
          setEndpointValues((prev) => ({
            ...prev,
            [endpoint.index]: result.statusUpdate.endpointValue,
          }));
          setDeviceStatus(result.statusUpdate.onlineStatus);
          setDeviceRssi(result.statusUpdate.rssi);
        }
      } else {
        toast.error(`Failed to control switch ${endpoint.index}`);
      }
    } catch (error) {
      console.error("Failed to send command:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoadingEndpoints((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Power className="h-4 w-4" />
            {deviceTypeInfo?.label || `Switch ${numGangs}-Gang`}
          </CardTitle>
          <Badge variant={deviceStatus === 1 ? "default" : "secondary"}>
            {deviceStatus === 1 ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Info */}
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">IEEE Address:</span>
            <span className="font-mono text-xs">{device.ieee_address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit:</span>
            <span>{device.unit_ip}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RSSI:</span>
            <span>{deviceRssi} dBm</span>
          </div>
        </div>

        {/* Switch Controls */}
        <div className="space-y-2">
          {endpoints.map((endpoint) => {
            const key = `endpoint${endpoint.index}`;
            const isOn = endpoint.value > 0;
            const isLoading = loadingEndpoints[key];

            return (
              <div
                key={endpoint.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-medium">Switch {endpoint.index}</span>
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Badge variant={isOn ? "default" : "outline"} className="ml-auto mr-3">
                    {isOn ? "ON" : "OFF"}
                  </Badge>
                </div>
                <Switch
                  checked={isOn}
                  onCheckedChange={() => handleToggle(endpoint)}
                  disabled={isLoading || deviceStatus !== 1}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
