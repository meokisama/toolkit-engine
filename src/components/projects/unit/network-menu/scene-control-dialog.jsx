import React, { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Play, GitCompare, List, Trash2, Loader2 } from "lucide-react";
import { DeleteSceneDialog } from "./delete-scene-popover";
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
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  OBJECT_TYPES,
  AC_POWER_LABELS,
  AC_MODE_LABELS,
  AC_FAN_SPEED_LABELS,
  AC_SWING_LABELS,
  CURTAIN_VALUE_LABELS,
} from "@/constants";

// Helper function to get object type label
const getObjectTypeInfo = (objectValue) => {
  switch (objectValue) {
    case OBJECT_TYPES.OUTPUT_NONE.obj_value:
      return { label: "None" };
    case OBJECT_TYPES.LIGHTING.obj_value:
      return { label: "Lighting" };
    case OBJECT_TYPES.CURTAIN.obj_value:
      return { label: "Curtain" };
    case OBJECT_TYPES.AC_POWER.obj_value:
      return { label: "AC Power" };
    case OBJECT_TYPES.AC_MODE.obj_value:
      return { label: "AC Mode" };
    case OBJECT_TYPES.AC_FAN_SPEED.obj_value:
      return { label: "AC Fan Speed" };
    case OBJECT_TYPES.AC_TEMPERATURE.obj_value:
      return { label: "AC Temperature" };
    case OBJECT_TYPES.AC_SWING.obj_value:
      return { label: "AC Swing" };
    case OBJECT_TYPES.TIMER.obj_value:
      return { label: "Timer" };
    default:
      return { label: `Object ${objectValue}` };
  }
};

// Helper function to get formatted value based on object type
const getFormattedValue = (objectValue, itemValue) => {
  const percentage = Math.round((itemValue / 255) * 100);

  switch (objectValue) {
    case OBJECT_TYPES.AC_POWER.obj_value:
      return `${itemValue} (${AC_POWER_LABELS[itemValue] || "Unknown"})`;
    case OBJECT_TYPES.AC_MODE.obj_value:
      return `${itemValue} (${AC_MODE_LABELS[itemValue] || "Unknown"})`;
    case OBJECT_TYPES.AC_FAN_SPEED.obj_value:
      return `${itemValue} (${AC_FAN_SPEED_LABELS[itemValue] || "Unknown"})`;
    case OBJECT_TYPES.AC_SWING.obj_value:
      return `${itemValue} (${AC_SWING_LABELS[itemValue] || "Unknown"})`;
    case OBJECT_TYPES.CURTAIN.obj_value:
      return `${itemValue} (${CURTAIN_VALUE_LABELS[itemValue] || "Unknown"})`;
    case OBJECT_TYPES.LIGHTING.obj_value:
      return `${itemValue} (${percentage}%)`;
    case OBJECT_TYPES.AC_TEMPERATURE.obj_value:
      return `${itemValue} (${itemValue}°C)`;
    default:
      return `${itemValue} (${percentage}%)`;
  }
};

const initialDeleteDialogState = {
  open: false,
  sceneIndex: null,
  sceneName: "",
};

export function TriggerSceneDialog({ open, onOpenChange, unit }) {
  const [sceneIndex, setSceneIndex] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingAllScenes, setLoadingAllScenes] = useState(false);
  const [scenes, setScenes] = useState([]);
  const [showScenes, setShowScenes] = useState(false);
  const [loadingSceneDetails, setLoadingSceneDetails] = useState({});
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(
    initialDeleteDialogState
  );
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);

  // Reset state when unit changes
  useEffect(() => {
    if (open) {
      setSceneIndex("");
      setLoading(false);
      setLoadingInfo(false);
      setLoadingAllScenes(false);
      setScenes([]);
      setShowScenes(false);
      setLoadingSceneDetails({});
      setDeleteConfirmDialog(initialDeleteDialogState);
      setDeletePopoverOpen(false);
    }
  }, [unit?.ip_address, unit?.id_can]);

  const handleLoadSceneInfo = useCallback(async () => {
    if (!unit || !sceneIndex) {
      toast.error("Please enter a scene index to load");
      return;
    }

    const index = parseInt(sceneIndex, 10);
    if (isNaN(index) || index < 0 || index > 99) {
      toast.error("Scene index must be between 0 and 99");
      return;
    }

    // Use index directly as protocol index (0-99)
    const protocolIndex = index;

    setLoadingInfo(true);
    try {
      console.log("Loading scene information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        sceneIndex: protocolIndex,
      });

      const result = await window.electronAPI.rcuController.getSceneInformation(
        {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          sceneIndex: protocolIndex,
        }
      );

      // Convert single scene result to card format
      if (result) {
        const sceneCard = {
          index: protocolIndex,
          name: result.sceneName || `No name`,
          address: result.sceneAddress || 0,
          itemCount: result.itemCount || 0,
          items: result.items || [],
        };

        setScenes([sceneCard]);
        setShowScenes(true);
        toast.success(`Scene ${index} information loaded successfully`);
      }
    } catch (error) {
      console.error("Failed to load scene information:", error);
      toast.error(`Failed to load scene information: ${error.message}`);
      setScenes([]);
      setShowScenes(false);
    } finally {
      setLoadingInfo(false);
    }
  }, [unit, sceneIndex]);

  const handleLoadAllScenes = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingAllScenes(true);
    try {
      console.log("Loading all scenes information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      const result =
        await window.electronAPI.rcuController.getAllScenesInformation({
          unitIp: unit.ip_address,
          canId: unit.id_can,
        });

      if (result.scenes && result.scenes.length > 0) {
        setScenes(result.scenes);
        setShowScenes(true);
        toast.success(`Loaded ${result.scenes.length} scenes successfully`);
      } else {
        setScenes([]);
        setShowScenes(false);
        toast.info("No scenes found");
      }
    } catch (error) {
      console.error("Failed to load all scenes:", error);
      toast.error(`Failed to load all scenes: ${error.message}`);
      setScenes([]);
      setShowScenes(false);
    } finally {
      setLoadingAllScenes(false);
    }
  }, [unit]);

  const handleTriggerSceneFromCard = useCallback(
    async (sceneIndex, sceneAddress) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      setLoading(true);
      try {
        console.log("Triggering scene from card:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          sceneIndex,
          sceneAddress,
        });

        await window.electronAPI.rcuController.triggerScene({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          sceneIndex,
          sceneAddress,
        });

        toast.success(`Scene ${sceneIndex} triggered successfully`);
      } catch (error) {
        console.error("Failed to trigger scene:", error);
        toast.error(`Failed to trigger scene: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [unit]
  );

  const handleDeleteSceneFromCard = useCallback((sceneIndex, sceneName) => {
    setDeleteConfirmDialog({
      open: true,
      sceneIndex,
      sceneName: sceneName || `Scene ${sceneIndex}`,
    });
  }, []);

  const handleConfirmDeleteScene = useCallback(async () => {
    if (!unit || deleteConfirmDialog.sceneIndex === null) {
      toast.error("No scene selected for deletion");
      return;
    }

    setLoading(true);
    try {
      console.log("Deleting scene from card:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        sceneIndex: deleteConfirmDialog.sceneIndex,
      });

      await window.electronAPI.rcuController.deleteScene(
        unit.ip_address,
        unit.id_can,
        deleteConfirmDialog.sceneIndex
      );

      toast.success(
        `Scene ${deleteConfirmDialog.sceneIndex} deleted successfully`
      );

      // Close the confirmation dialog
      setDeleteConfirmDialog(initialDeleteDialogState);

      // Optionally refresh the scenes list
      // You could call handleLoadAllScenes() here if needed
    } catch (error) {
      console.error("Failed to delete scene:", error);
      toast.error(`Failed to delete scene: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [unit, deleteConfirmDialog]);

  const handleLoadSceneDetails = useCallback(
    async (sceneIndex) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      setLoadingSceneDetails((prev) => ({ ...prev, [sceneIndex]: true }));
      try {
        console.log("Loading scene details:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          sceneIndex,
        });

        const result =
          await window.electronAPI.rcuController.getSceneInformation({
            unitIp: unit.ip_address,
            canId: unit.id_can,
            sceneIndex,
          });

        if (result && result.items) {
          // Update the specific scene with detailed items
          setScenes((prevScenes) =>
            prevScenes.map((scene) =>
              scene.index === sceneIndex
                ? { ...scene, items: result.items }
                : scene
            )
          );
          toast.success(`Scene ${sceneIndex} details loaded successfully`);
        }
      } catch (error) {
        console.error("Failed to load scene details:", error);
        toast.error(`Failed to load scene details: ${error.message}`);
      } finally {
        setLoadingSceneDetails((prev) => ({ ...prev, [sceneIndex]: false }));
      }
    },
    [unit]
  );

  const handleSceneIndexChange = useCallback((e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setSceneIndex(value);
    }
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !loading && !loadingInfo) {
        handleLoadSceneInfo();
      }
    },
    [handleLoadSceneInfo, loading, loadingInfo]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scene Control</DialogTitle>
          <DialogDescription>
            Load information and trigger scene on unit {unit?.ip_address} (CAN
            ID: {unit?.id_can}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Scene Index Input and Load Button */}
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  id="sceneIndex"
                  type="text"
                  value={sceneIndex}
                  onChange={handleSceneIndexChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Scene (0-99)"
                  disabled={loading || loadingInfo || loadingAllScenes}
                  autoFocus
                  className="max-w-[150px]"
                />
                <Button
                  onClick={handleLoadSceneInfo}
                  disabled={loadingInfo || !sceneIndex || loadingAllScenes}
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  {loadingInfo ? "Loading..." : "Load Scene"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DeleteSceneDialog
                  open={deletePopoverOpen}
                  onOpenChange={setDeletePopoverOpen}
                  unit={unit}
                  asPopover={true}
                  trigger={
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Scenes
                    </Button>
                  }
                />
                <Button
                  onClick={handleLoadAllScenes}
                  size="lg"
                  disabled={loadingAllScenes || loadingInfo}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  {loadingAllScenes ? "Loading..." : "Load All Scenes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Scenes Display - Always show ScrollArea */}
          <div className="space-y-4">
            <ScrollArea className="h-[450px] w-full rounded-md border p-4">
              {showScenes && scenes.length > 0 ? (
                <div className="grid gap-3">
                  {scenes.map((scene) => (
                    <Card key={scene.index} className="relative">
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex flex-col gap-2">
                            <span className="text-lg font-bold">
                              {scene.name || "No name"}
                            </span>
                            <div className="text-sm text-muted-foreground font-light">
                              <span className="font-bold">Scene:</span> #
                              {scene.index}
                              <span className="mx-1"> | </span>
                              <span className="font-bold">Group:</span>{" "}
                              {scene.address}
                            </div>
                          </CardTitle>

                          <div className="flex items-center gap-2">
                            {/* Items Button with Popover */}
                            <Popover modal={true}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    // Auto-load scene details when popover opens
                                    if (
                                      !scene.items ||
                                      scene.items.length === 0
                                    ) {
                                      handleLoadSceneDetails(scene.index);
                                    }
                                  }}
                                >
                                  <span className="font-light">Items:</span>{" "}
                                  {scene.itemCount}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-108" align="end">
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <h4 className="font-medium text-sm">
                                      {scene.name || "No name"}
                                    </h4>
                                    <div className="text-xs text-muted-foreground">
                                      <strong>Group:</strong> {scene.address} |{" "}
                                      <strong>Total Items:</strong>{" "}
                                      {scene.itemCount}
                                    </div>
                                  </div>

                                  {loadingSceneDetails[scene.index] ? (
                                    <div className="flex items-center justify-center py-4">
                                      <div className="text-xs text-muted-foreground">
                                        Loading items...
                                      </div>
                                    </div>
                                  ) : scene.items && scene.items.length > 0 ? (
                                    <div className="space-y-2">
                                      <ScrollArea className="h-64 w-full rounded border pr-2">
                                        <div className="p-2 space-y-2">
                                          {scene.items.map((item, index) => {
                                            const typeInfo = getObjectTypeInfo(
                                              item.objectValue
                                            );
                                            const formattedValue =
                                              getFormattedValue(
                                                item.objectValue,
                                                item.itemValue
                                              );

                                            return (
                                              <div
                                                key={index}
                                                className="p-3 rounded-lg border bg-muted/20 transition-all hover:shadow-sm"
                                              >
                                                <div className="flex justify-between items-center">
                                                  <div className="flex items-center gap-2">
                                                    <Badge
                                                      variant="outline"
                                                      className="text-xs px-1.5 py-0.5 font-mono"
                                                    >
                                                      Group: {item.itemAddress}
                                                    </Badge>
                                                    <span className="font-medium text-xs">
                                                      {typeInfo.label}
                                                    </span>
                                                  </div>
                                                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-background border">
                                                    {formattedValue}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </ScrollArea>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <p className="text-xs text-muted-foreground">
                                        No items found for this scene.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>

                            {/* Delete Scene Button */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleDeleteSceneFromCard(
                                  scene.index,
                                  scene.name
                                )
                              }
                              disabled={loading}
                              className="flex items-center gap-1 shadow text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>

                            {/* Trigger Scene Button */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleTriggerSceneFromCard(
                                  scene.index,
                                  scene.address
                                )
                              }
                              disabled={loading}
                              className="flex items-center gap-1 shadow"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full mt-10">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-2">No scenes loaded</p>
                    <p className="text-sm">
                      Use "Load Scene" or "Load All Scenes" to display scene
                      information
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || loadingInfo || loadingAllScenes}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteConfirmDialog(initialDeleteDialogState)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Scene
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmDialog.sceneName}"
              from unit {unit?.ip_address}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteScene}
              disabled={loading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
