import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Blinds, Loader2, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";
import { ZigbeeDeviceCardWrapper } from "./zigbee-device-card-wrapper";

export function ZigbeeCurtainCard({ device, onRemove }) {
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

  // Get number of curtains (1 or 2 gang)
  const numCurtains = device.device_type === 4 ? 1 : 2; // 4: 1-Gang, 5: 2-Gang
  const deviceName =
    device.device_name ||
    deviceTypeInfo?.label ||
    `Curtain ${numCurtains}-Gang`;

  // Get endpoints data with local state values
  const endpoints = [];
  for (let i = 1; i <= numCurtains && i <= 4; i++) {
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

  const handleControl = async (endpoint, command) => {
    if (!device.unit_ip || !device.unit_can_id) {
      toast.error("Unit information not found");
      return;
    }

    const key = `endpoint${endpoint.index}`;
    setLoadingEndpoints((prev) => ({ ...prev, [key]: true }));

    try {
      const result =
        await window.electronAPI.zigbeeController.sendZigbeeCommand({
          unitIp: device.unit_ip,
          canId: device.unit_can_id,
          ieeeAddress: device.ieee_address,
          deviceType: device.device_type,
          endpointId: endpoint.id,
          command: command, // 0: Close, 1: Open
          deviceId: device.id,
        });

      if (result.success) {
        const action = command === 1 ? "opened" : "closed";
        toast.success(`Curtain ${endpoint.index} ${action}`);

        // Update local state with response data
        if (result.statusUpdate) {
          setEndpointValues((prev) => ({
            ...prev,
            [endpoint.index]: result.statusUpdate.endpointValue,
          }));
        }
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
      icon={Blinds}
      title={deviceName}
      showStatus={true}
    >
      {/* Curtain Controls */}
      <div className="space-y-2.5">
        {endpoints.map((endpoint) => {
          const key = `endpoint${endpoint.index}`;
          const isOpen = endpoint.value > 0;
          const isLoading = loadingEndpoints[key];

          return (
            <div
              key={endpoint.id}
              className={`p-3.5 rounded-lg border-2 transition-all duration-200 ${
                isOpen
                  ? "bg-blue-500/5 border-blue-500/20"
                  : "bg-background border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0 group">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isOpen ? "bg-blue-500/20" : "bg-muted"
                    }`}
                  >
                    <Blinds
                      className={`h-4 w-4 ${
                        isOpen ? "text-blue-600" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <span className="font-medium truncate">
                    {endpointNames[endpoint.index] ||
                      `Curtain ${endpoint.index}`}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                    onClick={() => handleEditEndpointName(endpoint.index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Badge
                    variant={isOpen ? "default" : "secondary"}
                    className="ml-auto shrink-0"
                  >
                    {isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleControl(endpoint, 0)}
                  disabled={isLoading || device.status !== 1}
                  className="gap-2 font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Close
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleControl(endpoint, 1)}
                  disabled={isLoading || device.status !== 1}
                  className="gap-2 font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Open
                    </>
                  )}
                </Button>
              </div>
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
            <DialogTitle>Edit Curtain Name</DialogTitle>
            <DialogDescription>
              Enter a custom name for curtain {editEndpointIndex}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint-name">Name</Label>
              <Input
                id="endpoint-name"
                value={editEndpointNameValue}
                onChange={(e) => setEditEndpointNameValue(e.target.value)}
                placeholder={`Curtain ${editEndpointIndex}`}
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
