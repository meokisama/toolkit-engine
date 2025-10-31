import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Blinds, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";

export function ZigbeeCurtainCard({ device }) {
  const [loadingEndpoints, setLoadingEndpoints] = useState({});

  // Get device type info
  const deviceTypeInfo = CONSTANTS.ZIGBEE.DEVICE_TYPE.find(
    (type) => type.value === device.device_type
  );

  // Get number of curtains (1 or 2 gang)
  const numCurtains = device.device_type === 4 ? 1 : 2; // 4: 1-Gang, 5: 2-Gang

  // Get endpoints data
  const endpoints = [];
  for (let i = 1; i <= numCurtains && i <= 4; i++) {
    const endpointId = device[`endpoint${i}_id`];
    const endpointValue = device[`endpoint${i}_value`];
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

  const handleControl = async (endpoint, command) => {
    if (!device.unit_ip || !device.unit_can_id) {
      toast.error("Unit information not found");
      return;
    }

    const key = `endpoint${endpoint.index}`;
    setLoadingEndpoints((prev) => ({ ...prev, [key]: true }));

    try {
      const result = await window.electronAPI.rcuController.sendZigbeeCommand({
        unitIp: device.unit_ip,
        canId: device.unit_can_id,
        ieeeAddress: device.ieee_address,
        deviceType: device.device_type,
        endpointId: endpoint.id,
        command: command, // 0: Close, 1: Open
      });

      if (result.success) {
        const action = command === 1 ? "opened" : "closed";
        toast.success(`Curtain ${endpoint.index} ${action}`);
      } else {
        toast.error(`Failed to control curtain ${endpoint.index}`);
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
            <Blinds className="h-4 w-4" />
            {deviceTypeInfo?.label || `Curtain ${numCurtains}-Gang`}
          </CardTitle>
          <Badge variant={device.status === 1 ? "default" : "secondary"}>
            {device.status === 1 ? "Online" : "Offline"}
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
            <span>{device.rssi} dBm</span>
          </div>
        </div>

        {/* Curtain Controls */}
        <div className="space-y-2">
          {endpoints.map((endpoint) => {
            const key = `endpoint${endpoint.index}`;
            const isOpen = endpoint.value > 0;
            const isLoading = loadingEndpoints[key];

            return (
              <div
                key={endpoint.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Curtain {endpoint.index}</span>
                  <Badge variant={isOpen ? "default" : "outline"}>
                    {isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleControl(endpoint, 0)}
                    disabled={isLoading || device.status !== 1}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Close"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleControl(endpoint, 1)}
                    disabled={isLoading || device.status !== 1}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Open"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
