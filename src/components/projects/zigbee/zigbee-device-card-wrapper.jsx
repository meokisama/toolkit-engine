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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Trash2,
  Loader2,
  Pencil,
  Wifi,
  WifiOff,
  Signal,
  MonitorCog,
  BookUser,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Shared wrapper component for all Zigbee device cards
 * Handles common functionality: header, dropdown menu, remove device dialog, edit name dialog
 */
export function ZigbeeDeviceCardWrapper({
  device,
  onRemove,
  icon: Icon,
  title,
  showStatus = true,
  className = "",
  children,
}) {
  // Remove dialog states
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Edit name dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNameValue, setEditNameValue] = useState(device.device_name || "");

  const handleRemoveDevice = async () => {
    if (!onRemove) return;

    setIsRemoving(true);
    try {
      await onRemove(device);
      toast.success("Device removed successfully");
      setRemoveDialogOpen(false);
    } catch (error) {
      console.error("Failed to remove device:", error);
      toast.error("Failed to remove device");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleEditName = () => {
    setEditNameValue(device.device_name || "");
    setEditDialogOpen(true);
  };

  const handleSaveName = async () => {
    try {
      await window.electronAPI.zigbee.updateDevice(device.id, {
        device_name: editNameValue.trim() || null,
      });

      toast.success("Name updated successfully");
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update name:", error);
      toast.error("Failed to update name");
    }
  };

  const cardClassName = showStatus
    ? device.status === 1
      ? `transition-all duration-200 hover:shadow-lg ${className}`
      : `bg-muted/50 opacity-70 transition-all duration-200 ${className}`
    : `transition-all duration-200 hover:shadow-lg ${className}`;

  const rssiValue = device.rssi > 127 ? device.rssi - 256 : device.rssi;
  const getRssiStrength = (rssi) => {
    if (rssi >= -50) return { label: "Excellent", color: "text-green-600" };
    if (rssi >= -70) return { label: "Good", color: "text-blue-600" };
    if (rssi >= -85) return { label: "Fair", color: "text-yellow-600" };
    return { label: "Weak", color: "text-red-600" };
  };
  const rssiStrength = getRssiStrength(rssiValue);

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`p-1.5 rounded-lg ${
                device.status === 1 ? "bg-primary/10" : "bg-muted"
              }`}
            >
              {Icon && (
                <Icon
                  className={`h-4 w-4 ${
                    device.status === 1
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              )}
            </div>
            <CardTitle className="text-base flex items-center gap-2 truncate">
              <span className="truncate">{title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                onClick={handleEditName}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showStatus && (
              <Badge
                className={
                  device.status === 1
                    ? "bg-green-700 gap-1 font-medium"
                    : "bg-red-700 gap-1 font-medium"
                }
              >
                {device.status === 1 ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </>
                )}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setRemoveDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Device
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Device Info */}
        <div className="grid grid-cols-1 gap-2 p-3 bg-muted/30 rounded-lg border text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <BookUser className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">
                IEEE Address
              </span>
            </div>
            <span className="font-mono text-xs truncate">
              {device.ieee_address}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <MonitorCog className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">Gateway</span>
            </div>
            <span className="font-medium">{device.unit_ip}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Signal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">Signal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${rssiStrength.color}`}>
                {rssiStrength.label}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {rssiValue} dBm
              </span>
            </div>
          </div>
        </div>

        {children}
      </CardContent>

      {/* Edit Name Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device Name</DialogTitle>
            <DialogDescription>
              Enter a custom name for this device
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Name</Label>
              <Input
                id="device-name"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                placeholder={title}
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

      {/* Remove Device Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this device? This action will
              <b>remove the device from the network</b> and{" "}
              <b>delete from the database</b>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveDevice}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
