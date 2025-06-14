import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TriggerSceneDialog({ open, onOpenChange, unit }) {
  const [sceneIndex, setSceneIndex] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTriggerScene = useCallback(async () => {
    if (!unit || !sceneIndex) {
      toast.error("Please enter a scene index");
      return;
    }

    const index = parseInt(sceneIndex, 10);
    if (isNaN(index) || index < 0 || index > 255) {
      toast.error("Scene index must be between 0 and 255");
      return;
    }

    setLoading(true);
    try {
      console.log("Triggering scene:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        sceneIndex: index,
      });

      await window.electronAPI.rcuController.triggerScene({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        sceneIndex: index,
      });

      toast.success(`Scene ${index} triggered successfully`);
      onOpenChange(false);
      setSceneIndex("");
    } catch (error) {
      console.error("Failed to trigger scene:", error);
      toast.error(`Failed to trigger scene: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [unit, sceneIndex, onOpenChange]);

  const handleSceneIndexChange = useCallback((e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setSceneIndex(value);
    }
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !loading) {
      handleTriggerScene();
    }
  }, [handleTriggerScene, loading]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Trigger Scene
          </DialogTitle>
          <DialogDescription>
            Enter the scene index to trigger on unit {unit?.ip_address} (CAN ID: {unit?.id_can})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sceneIndex" className="text-right">
              Scene Index
            </Label>
            <Input
              id="sceneIndex"
              type="text"
              value={sceneIndex}
              onChange={handleSceneIndexChange}
              onKeyPress={handleKeyPress}
              placeholder="0-255"
              className="col-span-3"
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleTriggerScene}
            disabled={loading || !sceneIndex}
          >
            {loading ? "Triggering..." : "Trigger Scene"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
