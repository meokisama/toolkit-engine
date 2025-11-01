import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { DoorOpen, DoorClosed, Pencil } from "lucide-react";
import { toast } from "sonner";

export function ZigbeeDoorContactCard({ device }) {
  // Door contact typically uses endpoint 1
  // Value 0 = Closed, Value > 0 = Open
  const isOpen = device.endpoint1_value > 0;

  // Name state
  const [deviceName, setDeviceName] = useState(device.device_name || "");

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const handleEditDeviceName = () => {
    setEditNameValue(deviceName);
    setEditDialogOpen(true);
  };

  const handleSaveName = async () => {
    try {
      await window.electronAPI.zigbee.updateDevice(device.id, {
        device_name: editNameValue.trim() || null,
      });

      setDeviceName(editNameValue.trim());
      toast.success("Name updated successfully");
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update name:", error);
      toast.error("Failed to update name");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {isOpen ? (
                <DoorOpen className="h-4 w-4" />
              ) : (
                <DoorClosed className="h-4 w-4" />
              )}
              {deviceName || "Door Contact"}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleEditDeviceName}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
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

        {/* Door Status */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="font-medium">Door Status</span>
            <Badge
              variant={isOpen ? "destructive" : "default"}
              className={isOpen ? "animate-pulse" : ""}
            >
              {isOpen ? "Opened" : "Closed"}
            </Badge>
          </div>
        </div>
      </CardContent>

      {/* Edit Name Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device Name</DialogTitle>
            <DialogDescription>
              Enter a custom name for this door contact sensor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                placeholder="Door Contact"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
