import React, { useState, useCallback, useEffect, memo } from "react";
import { toast } from "sonner";
import { Play, GitCompare, List, Trash2, Loader2 } from "lucide-react";
import { DeleteSceneDialog } from "./delete-scene-popover";
import { useProjectDetail } from "@/contexts/project-detail-context";
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
  CONSTANTS,
} from "@/constants";

// Create label mappings directly from CONSTANTS.AIRCON
const AC_POWER_LABELS = CONSTANTS.AIRCON.find(item => item.obj_type === "OBJ_AC_POWER")?.values.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {}) || {};

const AC_MODE_LABELS = CONSTANTS.AIRCON.find(item => item.obj_type === "OBJ_AC_MODE")?.values.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {}) || {};

const AC_FAN_SPEED_LABELS = CONSTANTS.AIRCON.find(item => item.obj_type === "OBJ_AC_FAN_SPEED")?.values.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {}) || {};

const AC_SWING_LABELS = CONSTANTS.AIRCON.find(item => item.obj_type === "OBJ_AC_SWING")?.values.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {}) || {};

const CURTAIN_VALUE_LABELS = CONSTANTS.CURTAIN?.VALUES?.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {}) || {};

// Memoized helper functions for better performance
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

// Initial state for better state management
const initialState = {
  sceneIndex: "",
  scenes: [],
  showScenes: false,
  deleteConfirmDialog: initialDeleteDialogState,
  deletePopoverOpen: false,
};

const initialLoadingState = {
  loading: false,
  loadingInfo: false,
  loadingAllScenes: false,
  loadingSceneDetails: {},
};

// Memoized SceneItem component for better performance
const SceneItem = memo(
  ({ item, index, getObjectTypeInfo, getFormattedValue }) => {
    const typeInfo = getObjectTypeInfo(item.objectValue);
    const formattedValue = getFormattedValue(item.objectValue, item.itemValue);

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
            <span className="font-medium text-xs">{typeInfo.label}</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-background border">
            {formattedValue}
          </span>
        </div>
      </div>
    );
  }
);

SceneItem.displayName = "SceneItem";

// Memoized SceneCard component to prevent unnecessary re-renders
const SceneCard = memo(
  ({
    scene,
    onTrigger,
    onDelete,
    onLoadDetails,
    loading,
    loadingSceneDetails,
    memoizedGetObjectTypeInfo,
    memoizedGetFormattedValue,
    formatSceneName,
  }) => (
    <Card key={scene.index} className="relative">
      <CardContent>
        <div className="flex items-center justify-between">
          <CardTitle className="flex flex-col gap-2">
            <span className="text-lg font-bold">{formatSceneName ? formatSceneName(scene) : (scene.name || "No name")}</span>
            <div className="text-sm text-muted-foreground font-light">
              <span className="font-bold">Scene:</span> #{scene.index}
              <span className="mx-1"> | </span>
              <span className="font-bold">Group:</span> {scene.address}
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
                    if (!scene.items || scene.items.length === 0) {
                      onLoadDetails(scene.index);
                    }
                  }}
                >
                  <span className="font-light">Items:</span> {scene.itemCount}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-108" align="end">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-sm">
                      {formatSceneName ? formatSceneName(scene) : (scene.name || "No name")}
                    </h4>
                    <div className="text-xs text-muted-foreground">
                      <strong>Group:</strong> {scene.address} |{" "}
                      <strong>Total Items:</strong> {scene.itemCount}
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
                          {scene.items.map((item, index) => (
                            <SceneItem
                              key={index}
                              item={item}
                              index={index}
                              getObjectTypeInfo={memoizedGetObjectTypeInfo}
                              getFormattedValue={memoizedGetFormattedValue}
                            />
                          ))}
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
              onClick={() => onDelete(scene.index, scene.name)}
              disabled={loading}
              className="flex items-center gap-1 shadow text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>

            {/* Trigger Scene Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onTrigger(scene.index, scene.address)}
              disabled={loading}
              className="flex items-center gap-1 shadow"
            >
              <Play className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
);

SceneCard.displayName = "SceneCard";

export function TriggerSceneDialog({ open, onOpenChange, unit }) {
  // Consolidated state management
  const [state, setState] = useState(initialState);
  const [loadingState, setLoadingState] = useState(initialLoadingState);

  // Access project context to get database scenes
  const { selectedProject, projectItems, loadTabData, loadedTabs } = useProjectDetail();

  // Load scene data when dialog opens if not already loaded
  useEffect(() => {
    if (open && selectedProject && !loadedTabs.has('scene')) {
      loadTabData(selectedProject.id, 'scene');
    }
  }, [open, selectedProject, loadedTabs, loadTabData]);

  // Memoized helper functions
  const memoizedGetObjectTypeInfo = useCallback(getObjectTypeInfo, []);
  const memoizedGetFormattedValue = useCallback(getFormattedValue, []);

  // Helper function to get database scene name by address
  const getDatabaseSceneName = useCallback((address) => {
    if (!selectedProject || !projectItems.scene) return null;

    const databaseScene = projectItems.scene.find(scene =>
      parseInt(scene.address) === parseInt(address)
    );

    return databaseScene ? databaseScene.name : null;
  }, [selectedProject, projectItems.scene]);

  // Helper function to format scene display name
  const formatSceneName = useCallback((networkScene) => {
    const networkName = networkScene.name || "No name";
    const databaseName = getDatabaseSceneName(networkScene.address);

    if (databaseName && networkName !== databaseName) {
      return `${networkName} - ${databaseName}`;
    }

    return networkName;
  }, [getDatabaseSceneName]);

  // Reset state when dialog opens/closes or unit changes
  useEffect(() => {
    if (!open) {
      setState(initialState);
      setLoadingState(initialLoadingState);
    }
  }, [open, unit?.ip_address, unit?.id_can]);

  const handleLoadSceneInfo = useCallback(async () => {
    if (!unit || !state.sceneIndex) {
      toast.error("Please enter a scene index to load");
      return;
    }

    const index = parseInt(state.sceneIndex, 10);
    if (isNaN(index) || index < 0 || index > 99) {
      toast.error("Scene index must be between 0 and 99");
      return;
    }

    // Use index directly as protocol index (0-99)
    const protocolIndex = index;

    setLoadingState((prev) => ({ ...prev, loadingInfo: true }));
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

        setState((prev) => ({
          ...prev,
          scenes: [sceneCard],
          showScenes: true,
        }));
        toast.success(`Scene ${index} information loaded successfully`);
      }
    } catch (error) {
      console.error("Failed to load scene information:", error);
      toast.error(`Failed to load scene information: ${error.message}`);
      setState((prev) => ({
        ...prev,
        scenes: [],
        showScenes: false,
      }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingInfo: false }));
    }
  }, [unit, state.sceneIndex]);

  const handleLoadAllScenes = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingAllScenes: true }));
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
        // Filter out scenes with group = 0 and itemCount = 0
        const filteredScenes = result.scenes.filter((scene) => {
          return !(scene.address === 0 && scene.itemCount === 0);
        });

        if (filteredScenes.length > 0) {
          setState((prev) => ({
            ...prev,
            scenes: filteredScenes,
            showScenes: true,
          }));
          toast.success(`Loaded ${filteredScenes.length} scenes successfully`);
        } else {
          setState((prev) => ({
            ...prev,
            scenes: [],
            showScenes: false,
          }));
          toast.info("No valid scenes found (filtered out empty scenes)");
        }
      } else {
        setState((prev) => ({
          ...prev,
          scenes: [],
          showScenes: false,
        }));
        toast.info("No scenes found");
      }
    } catch (error) {
      console.error("Failed to load all scenes:", error);
      toast.error(`Failed to load all scenes: ${error.message}`);
      setState((prev) => ({
        ...prev,
        scenes: [],
        showScenes: false,
      }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingAllScenes: false }));
    }
  }, [unit]);

  const handleTriggerSceneFromCard = useCallback(
    async (sceneIndex, sceneAddress) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      setLoadingState((prev) => ({ ...prev, loading: true }));
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
        setLoadingState((prev) => ({ ...prev, loading: false }));
      }
    },
    [unit]
  );

  const handleDeleteSceneFromCard = useCallback((sceneIndex, sceneName) => {
    setState((prev) => ({
      ...prev,
      deleteConfirmDialog: {
        open: true,
        sceneIndex,
        sceneName: sceneName || `Scene ${sceneIndex}`,
      },
    }));
  }, []);

  const handleConfirmDeleteScene = useCallback(async () => {
    if (!unit || state.deleteConfirmDialog.sceneIndex === null) {
      toast.error("No scene selected for deletion");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loading: true }));
    try {
      console.log("Deleting scene from card:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        sceneIndex: state.deleteConfirmDialog.sceneIndex,
      });

      await window.electronAPI.rcuController.deleteScene(
        unit.ip_address,
        unit.id_can,
        state.deleteConfirmDialog.sceneIndex
      );

      toast.success(
        `Scene ${state.deleteConfirmDialog.sceneIndex} deleted successfully`
      );

      // Close the confirmation dialog
      setState((prev) => ({
        ...prev,
        deleteConfirmDialog: initialDeleteDialogState,
      }));

      // Optionally refresh the scenes list
      // You could call handleLoadAllScenes() here if needed
    } catch (error) {
      console.error("Failed to delete scene:", error);
      toast.error(`Failed to delete scene: ${error.message}`);
    } finally {
      setLoadingState((prev) => ({ ...prev, loading: false }));
    }
  }, [unit, state.deleteConfirmDialog]);

  const handleLoadSceneDetails = useCallback(
    async (sceneIndex) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      setLoadingState((prev) => ({
        ...prev,
        loadingSceneDetails: {
          ...prev.loadingSceneDetails,
          [sceneIndex]: true,
        },
      }));
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
          setState((prevState) => ({
            ...prevState,
            scenes: prevState.scenes.map((scene) =>
              scene.index === sceneIndex
                ? { ...scene, items: result.items }
                : scene
            ),
          }));
          toast.success(`Scene ${sceneIndex} details loaded successfully`);
        }
      } catch (error) {
        console.error("Failed to load scene details:", error);
        toast.error(`Failed to load scene details: ${error.message}`);
      } finally {
        setLoadingState((prev) => ({
          ...prev,
          loadingSceneDetails: {
            ...prev.loadingSceneDetails,
            [sceneIndex]: false,
          },
        }));
      }
    },
    [unit]
  );

  const handleSceneIndexChange = useCallback((e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setState((prev) => ({ ...prev, sceneIndex: value }));
    }
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (
        e.key === "Enter" &&
        !loadingState.loading &&
        !loadingState.loadingInfo
      ) {
        handleLoadSceneInfo();
      }
    },
    [handleLoadSceneInfo, loadingState.loading, loadingState.loadingInfo]
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
                  value={state.sceneIndex}
                  onChange={handleSceneIndexChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Scene (0-99)"
                  disabled={
                    loadingState.loading ||
                    loadingState.loadingInfo ||
                    loadingState.loadingAllScenes
                  }
                  autoFocus
                  className="max-w-[150px]"
                />
                <Button
                  onClick={handleLoadSceneInfo}
                  disabled={
                    loadingState.loadingInfo ||
                    !state.sceneIndex ||
                    loadingState.loadingAllScenes
                  }
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  {loadingState.loadingInfo ? "Loading..." : "Load Scene"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DeleteSceneDialog
                  open={state.deletePopoverOpen}
                  onOpenChange={(open) =>
                    setState((prev) => ({ ...prev, deletePopoverOpen: open }))
                  }
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
                  disabled={
                    loadingState.loadingAllScenes || loadingState.loadingInfo
                  }
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  {loadingState.loadingAllScenes
                    ? "Loading..."
                    : "Load All Scenes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Scenes Display - Always show ScrollArea */}
          <div className="space-y-4">
            <ScrollArea className="h-[450px] w-full rounded-md border p-4">
              {state.showScenes && state.scenes.length > 0 ? (
                <div className="grid gap-3">
                  {state.scenes.map((scene) => (
                    <SceneCard
                      key={scene.index}
                      scene={scene}
                      onTrigger={handleTriggerSceneFromCard}
                      onDelete={handleDeleteSceneFromCard}
                      onLoadDetails={handleLoadSceneDetails}
                      loading={loadingState.loading}
                      loadingSceneDetails={loadingState.loadingSceneDetails}
                      memoizedGetObjectTypeInfo={memoizedGetObjectTypeInfo}
                      memoizedGetFormattedValue={memoizedGetFormattedValue}
                      formatSceneName={formatSceneName}
                    />
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
            disabled={
              loadingState.loading ||
              loadingState.loadingInfo ||
              loadingState.loadingAllScenes
            }
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={state.deleteConfirmDialog.open}
        onOpenChange={(open) =>
          !open &&
          setState((prev) => ({
            ...prev,
            deleteConfirmDialog: initialDeleteDialogState,
          }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Scene
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {state.deleteConfirmDialog.sceneName}" from unit{" "}
              {unit?.ip_address}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingState.loading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteScene}
              disabled={loadingState.loading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {loadingState.loading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {loadingState.loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// Export the memoized component for better performance
export default memo(TriggerSceneDialog);
