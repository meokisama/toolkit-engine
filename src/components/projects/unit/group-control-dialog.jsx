"use client";

import { useState } from "react";
import { Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSTANTS } from "@/constants";
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
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export function GroupControlDialog({
  open,
  onOpenChange,
  unit,
  onGroupControl,
}) {
  const [group, setGroup] = useState(1);
  const [value, setValue] = useState([0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    if (group < 1 || group > 255) {
      toast.error("Group number must be between 1 and 255");
      return;
    }

    if (value[0] < 0 || value[0] > 255) {
      toast.error("Value must be between 0 and 255");
      return;
    }

    setLoading(true);
    try {
      await onGroupControl({
        canId: unit.id_can,
        group: parseInt(group),
        value: value[0],
        unitIp: unit.ip_address,
      });

      toast.success(
        `Group ${group} set to ${value[0]} (${Math.round(
          (value[0] * 100) / 255
        )}%) for unit ${unit.id_can}`
      );
    } catch (error) {
      console.error("Group control failed:", error);
      toast.error("Failed to control group: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Group Control
          </DialogTitle>
          <DialogDescription>
            Control lighting group for unit {unit?.id_can} at {unit?.ip_address}
            :{CONSTANTS.UNIT.UDP_CONFIG.UDP_PORT}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group">Group Number</Label>
              <Input
                id="group"
                type="number"
                min="1"
                max="255"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="1-255"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">
                Value ({Math.round((value[0] * 100) / 255)}%)
              </Label>
              <Input
                id="value"
                type="number"
                min="0"
                max="255"
                value={value[0]}
                onChange={(e) => setValue([parseInt(e.target.value) || 0])}
                placeholder="0-255"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Value Slider</Label>
            <Slider
              value={value}
              onValueChange={setValue}
              max={255}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 (0%)</span>
              <span>255 (100%)</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Command
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
