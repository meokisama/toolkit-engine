import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Columns2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import lightOn from "@/assets/light-on.png";
import lightOff from "@/assets/light-off.png";
import { CONSTANTS } from "@/constants";
import { ZigbeeDeviceCardWrapper } from "./zigbee-device-card-wrapper";

export function ZigbeeSwitchCard({ device, onRemove }) {
  const [loadingEndpoints, setLoadingEndpoints] = useState({});

  // Local state for endpoint values (for instant UI update)
  const [endpointValues, setEndpointValues] = useState(() => {
    const values = {};
    for (let i = 1; i <= 4; i++) {
      values[i] = device[`endpoint${i}_value`];
    }
    return values;
  });

  // Endpoint names state
  const [endpointNames, setEndpointNames] = useState(() => {
    const names = {};
    for (let i = 1; i <= 4; i++) {
      names[i] = device[`endpoint${i}_name`] || "";
    }
    return names;
  });

  // Edit endpoint name dialog states
  const [editEndpointDialogOpen, setEditEndpointDialogOpen] = useState(false);
  const [editEndpointIndex, setEditEndpointIndex] = useState(null);
  const [editEndpointNameValue, setEditEndpointNameValue] = useState("");

  // Sync local state with props when device changes (for refresh functionality)
  useEffect(() => {
    // Update endpoint values
    const values = {};
    for (let i = 1; i <= 4; i++) {
      values[i] = device[`endpoint${i}_value`];
    }
    setEndpointValues(values);

    // Update endpoint names
    const names = {};
    for (let i = 1; i <= 4; i++) {
      names[i] = device[`endpoint${i}_name`] || "";
    }
    setEndpointNames(names);
  }, [device]);

  // Get device type info
  const deviceTypeInfo = CONSTANTS.ZIGBEE.DEVICE_TYPE.find(
    (type) => type.value === device.device_type
  );

  // Get number of gangs (endpoints)
  const numGangs = device.num_endpoints;
  const deviceName =
    device.device_name || deviceTypeInfo?.label || `Switch ${numGangs}-Gang`;

  // Get endpoints data with local state values
  const endpoints = [];
  for (let i = 1; i <= numGangs && i <= 4; i++) {
    const endpointId = device[`endpoint${i}_id`];
    const endpointValue = endpointValues[i];
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

  const handleEditEndpointName = (endpointIndex) => {
    setEditEndpointIndex(endpointIndex);
    setEditEndpointNameValue(endpointNames[endpointIndex]);
    setEditEndpointDialogOpen(true);
  };

  const handleSaveEndpointName = async () => {
    try {
      await window.electronAPI.zigbee.updateDevice(device.id, {
        [`endpoint${editEndpointIndex}_name`]:
          editEndpointNameValue.trim() || null,
      });

      setEndpointNames((prev) => ({
        ...prev,
        [editEndpointIndex]: editEndpointNameValue.trim(),
      }));

      toast.success("Name updated successfully");
      setEditEndpointDialogOpen(false);
    } catch (error) {
      console.error("Failed to update name:", error);
      toast.error("Failed to update name");
    }
  };

  return (
    <ZigbeeDeviceCardWrapper
      device={device}
      onRemove={onRemove}
      icon={Columns2}
      title={deviceName}
      showStatus={true}
    >
      {/* Switch Controls */}
      <div className="space-y-2.5">
        {endpoints.map((endpoint) => {
          const key = `endpoint${endpoint.index}`;
          const isOn = endpoint.value > 0;
          const isLoading = loadingEndpoints[key];

          return (
            <div
              key={endpoint.id}
              className={`flex items-center justify-between p-3.5 rounded-lg border-2 transition-all duration-200 group ${
                isOn
                  ? "bg-orange-50 border-orange-200 shadow-sm"
                  : "bg-background border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isOn ? "bg-yellow-500/20" : "bg-muted"
                  }`}
                >
                  <img
                    src={isOn ? lightOn : lightOff}
                    alt="Lighting State"
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className={`font-medium truncate ${
                      isOn ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {endpointNames[endpoint.index] ||
                      `Switch ${endpoint.index}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 flex-shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                    onClick={() => handleEditEndpointName(endpoint.index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                )}
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={() => handleToggle(endpoint)}
                disabled={isLoading || device.status !== 1}
                className="flex-shrink-0 data-[state=checked]:bg-orange-500"
              />
            </div>
          );
        })}
      </div>

      {/* Edit Endpoint Name Dialog */}
      <Dialog
        open={editEndpointDialogOpen}
        onOpenChange={setEditEndpointDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Switch Name</DialogTitle>
            <DialogDescription>
              Enter a custom name for switch {editEndpointIndex}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint-name">Name</Label>
              <Input
                id="endpoint-name"
                value={editEndpointNameValue}
                onChange={(e) => setEditEndpointNameValue(e.target.value)}
                placeholder={`Switch ${editEndpointIndex}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditEndpointDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEndpointName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ZigbeeDeviceCardWrapper>
  );
}
