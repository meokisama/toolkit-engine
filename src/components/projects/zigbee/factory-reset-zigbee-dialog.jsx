import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FactoryResetZigbeeDialog({
  open,
  onOpenChange,
  devices,
  projectId,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");

  // Get unique units from devices
  const units = React.useMemo(() => {
    const unitMap = new Map();
    devices.forEach((device) => {
      const key = `${device.unit_ip}|${device.unit_can_id}`;
      if (!unitMap.has(key)) {
        unitMap.set(key, {
          unitIp: device.unit_ip,
          canId: device.unit_can_id,
          deviceCount: 0,
        });
      }
      unitMap.get(key).deviceCount++;
    });
    return Array.from(unitMap.values());
  }, [devices]);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedUnit("");
    }
  }, [open]);

  const handleFactoryReset = async () => {
    if (!selectedUnit) {
      toast.error("Please select a unit");
      return;
    }

    const [unitIp, canId] = selectedUnit.split("|");

    setLoading(true);
    try {
      // Step 1: Send factory reset command to the unit
      const result =
        await window.electronAPI.zigbeeController.factoryResetZigbee({
          unitIp,
          canId,
        });

      if (result.success) {
        // Step 2: Delete all devices for this unit from database
        if (projectId) {
          try {
            await window.electronAPI.zigbee.deleteAllDevicesForUnit(
              projectId,
              unitIp
            );
            console.log(
              `Deleted all Zigbee devices for unit ${unitIp} from database`
            );
          } catch (dbError) {
            console.error("Failed to delete devices from database:", dbError);
            toast.warning(
              `Factory reset successful but failed to delete devices from database: ${dbError.message}`
            );
          }
        }

        toast.success(
          `Factory reset successful for unit ${unitIp}. All paired devices have been removed from both the coordinator and database.`
        );

        // Step 3: Refresh the device list
        if (onSuccess) {
          onSuccess();
        }

        onOpenChange(false);
      } else {
        toast.error("Failed to factory reset Zigbee coordinator");
      }
    } catch (error) {
      console.error("Failed to factory reset:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Factory Reset Zigbee Coordinator
          </DialogTitle>
          <DialogDescription>
            This will remove all paired Zigbee devices from the selected unit's
            coordinator and reset the network. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {units.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No units found with Zigbee devices
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="unit-select">Select Unit to Reset</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger id="unit-select">
                  <SelectValue placeholder="Choose a unit..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem
                      key={`${unit.unitIp}|${unit.canId}`}
                      value={`${unit.unitIp}|${unit.canId}`}
                    >
                      {unit.unitIp} (CAN ID: {unit.canId}) - {unit.deviceCount}{" "}
                      device(s)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-lg bg-destructive/10 p-4 text-sm">
            <p className="font-semibold text-destructive mb-2">Warning:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                All paired Zigbee devices will be removed from coordinator
              </li>
              <li>The Zigbee network will be reset</li>
              <li>All device configurations in database will be deleted</li>
              <li>You will need to re-pair all devices</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleFactoryReset}
            disabled={loading || units.length === 0 || !selectedUnit}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Factory Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
