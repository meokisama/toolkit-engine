import React, { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { udpScanner } from "@/services/udp";
import { toast } from "sonner";
import {
  Send,
  Network,
  SlidersHorizontal,
  Loader2,
  Scan,
  Wifi,
  CircleCheck,
} from "lucide-react";

export function SendSceneDialog({ open, onOpenChange, scene = null }) {
  const { selectedProject } = useProjectDetail();
  const [formData, setFormData] = useState({
    sceneIndex: 0,
  });
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [sceneItems, setSceneItems] = useState([]);
  const [networkUnits, setNetworkUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);

  // Load scene items and cached network units when dialog opens
  useEffect(() => {
    if (open && scene) {
      loadSceneItems();
      setFormData({
        sceneIndex: 0,
      });
      setSelectedUnitIds([]);

      // Auto-load cached network units if available
      const cachedUnits = udpScanner.getLastScanResults();
      if (cachedUnits.length > 0 && udpScanner.isCacheValid()) {
        setNetworkUnits(cachedUnits);
        console.log(`Auto-loaded ${cachedUnits.length} cached network units`);
      } else {
        setNetworkUnits([]);
      }
    }
  }, [open, scene]);

  const loadSceneItems = async () => {
    if (!scene) return;

    try {
      const items = await window.electronAPI.scene.getItemsWithDetails(
        scene.id
      );
      setSceneItems(items);
    } catch (error) {
      console.error("Failed to load scene items:", error);
      toast.error("Failed to load scene items");
    }
  };

  const handleScanNetwork = async () => {
    setScanLoading(true);
    try {
      toast.info("Scanning network units...");

      const discoveredUnits = await udpScanner.getNetworkUnits(true); // Always force scan when button is clicked

      setNetworkUnits(discoveredUnits);
      setSelectedUnitIds([]);

      if (discoveredUnits.length > 0) {
        toast.success(`Found ${discoveredUnits.length} unit(s) on network`);
      } else {
        toast.warning("No units found on network");
      }
    } catch (error) {
      console.error("Failed to scan network:", error);
      toast.error("Failed to scan network: " + error.message);
    } finally {
      setScanLoading(false);
    }
  };

  const handleUnitToggle = useCallback((unitId, checked) => {
    setSelectedUnitIds((prev) => {
      if (checked) {
        return [...prev, unitId];
      } else {
        return prev.filter((id) => id !== unitId);
      }
    });
  }, []);

  const handleSendScene = async () => {
    if (!scene || selectedUnitIds.length === 0) {
      toast.error("Please select at least one network unit");
      return;
    }

    if (sceneItems.length === 0) {
      toast.error("Scene has no items to send");
      return;
    }

    const selectedUnits = networkUnits.filter((unit) =>
      selectedUnitIds.includes(unit.id)
    );

    setLoading(true);
    try {
      // Prepare scene items data for sending
      const sceneItemsData = sceneItems.map((item) => ({
        object_value: item.object_value || 0,
        item_address: item.item_address || "0",
        item_value: item.item_value || "0",
      }));

      let successCount = 0;
      let failedUnits = [];

      // Send scene to all selected units
      for (const unit of selectedUnits) {
        try {
          console.log("Sending scene to unit:", {
            unitIp: unit.ip_address,
            canId: unit.id_can,
            sceneIndex: formData.sceneIndex,
            sceneName: scene.name,
            sceneAddress: scene.address,
            sceneItems: sceneItemsData,
          });

          const response = await window.electronAPI.rcuController.setupScene(
            unit.ip_address,
            unit.id_can,
            formData.sceneIndex,
            scene.name,
            scene.address,
            sceneItemsData
          );

          console.log(`Scene sent successfully to ${unit.ip_address}:`, {
            responseLength: response?.msg?.length,
            success: response?.result?.success,
          });

          successCount++;
        } catch (error) {
          console.error(
            `Failed to send scene to unit ${unit.ip_address}:`,
            error
          );

          // Extract more detailed error information
          let errorDetail = error.message;
          if (error.message.includes("RCU Error:")) {
            // Extract just the error part for display
            errorDetail = error.message.replace("RCU Error: ", "");
          } else if (error.message.includes("Command timeout")) {
            errorDetail = "Timeout - Unit not responding";
          } else if (error.message.includes("Command failed:")) {
            errorDetail = error.message.replace("Command failed: ", "");
          }

          failedUnits.push(`${unit.type} (${unit.ip_address}): ${errorDetail}`);
        }
      }

      // Show results
      if (successCount === selectedUnits.length) {
        toast.success(
          `Scene "${scene.name}" sent to ${successCount} unit${
            successCount > 1 ? "s" : ""
          } successfully`
        );
      } else if (successCount > 0) {
        toast.warning(
          `Scene sent to ${successCount}/${
            selectedUnits.length
          } units. Failed: ${failedUnits.join(", ")}`
        );
      } else {
        toast.error(
          `Failed to send scene to all units: ${failedUnits.join(", ")}`
        );
      }

      if (successCount > 0) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to send scene:", error);
      toast.error(`Failed to send scene: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpenChange = (newOpen) => {
    if (!loading) {
      onOpenChange(newOpen);
    }
  };

  if (!scene) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send {scene.name} to Network Unit
          </DialogTitle>
          <DialogDescription>
            Send scene "{scene.name}" configuration to a network unit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Scene Configuration */}
          <div className="space-y-2">
            <Label htmlFor="scene-index">Scene Index (0-99)</Label>
            <Input
              id="scene-index"
              type="number"
              min="0"
              max="99"
              value={formData.sceneIndex}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sceneIndex: Math.max(
                    0,
                    Math.min(99, parseInt(e.target.value) || 0)
                  ),
                }))
              }
              placeholder="0"
            />
          </div>

          {/* Network Unit Selection */}
          <Card>
            <CardHeader className="flex items-center justify-between -mt-1 -mx-1">
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="h-4 w-4" />
                Network Unit Selection
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleScanNetwork}
                  disabled={scanLoading}
                  className="flex items-center gap-2"
                >
                  {scanLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4" />
                  )}
                  {scanLoading ? "Scanning..." : "Scan Network"}
                </Button>
                {selectedUnitIds.length > 0 && (
                  <Badge variant="secondary">
                    {selectedUnitIds.length} unit
                    {selectedUnitIds.length > 1 ? "s" : ""} selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
                {networkUnits.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No network units found.</p>
                    <p className="text-sm">
                      Click "Scan Network" to discover units on your network.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                    {networkUnits.map((unit) => (
                      <CheckboxPrimitive.Root
                        key={unit.id}
                        checked={selectedUnitIds.includes(unit.id)}
                        onCheckedChange={(checked) =>
                          handleUnitToggle(unit.id, checked)
                        }
                        className="relative ring-[1px] ring-border rounded-lg px-4 py-3 text-start text-muted-foreground data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:text-primary flex flex-row items-center gap-3 cursor-pointer"
                      >
                        <Network className="h-6 w-6" />
                        <div className="space-y-1">
                          <span className="font-medium tracking-tight text-sm">
                            {unit.type || "Unknown Unit"}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            IP: {unit.ip_address}
                          </p>
                          {unit.id_can && (
                            <p className="text-xs text-muted-foreground">
                              CAN ID: {unit.id_can}
                            </p>
                          )}
                        </div>

                        <CheckboxPrimitive.Indicator className="absolute top-2 right-2">
                          <CircleCheck className="fill-primary text-primary-foreground h-4 w-4" />
                        </CheckboxPrimitive.Indicator>
                      </CheckboxPrimitive.Root>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || scanLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendScene}
            disabled={loading || scanLoading || selectedUnitIds.length === 0}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {selectedUnitIds.length === 0
              ? "Send Scene"
              : `Send Scene to ${selectedUnitIds.length} Unit${
                  selectedUnitIds.length !== 1 ? "s" : ""
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
