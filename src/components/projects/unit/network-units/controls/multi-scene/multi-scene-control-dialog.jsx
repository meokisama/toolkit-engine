import { useState, useCallback, memo, useEffect } from "react";
import { Play, Trash2, List, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { DeleteMultiSceneDialog } from "./delete-multi-scene-popover";
import { CONSTANTS } from "@/constants";
import { useProjectDetail } from "@/contexts/project-detail-context";

// Helper function to get multi-scene type label
const getMultiSceneTypeLabel = (type) => {
  const typeObj = CONSTANTS.MULTI_SCENES.TYPES.find((t) => t.value === type);
  return typeObj ? typeObj.label : `Type ${type}`;
};

// Initial state for better state management
const initialState = {
  multiSceneIndex: "",
  multiScenes: [],
  showMultiScenes: false,
  deleteConfirmDialog: {
    open: false,
    multiSceneIndex: null,
    multiSceneName: "",
  },
  deletePopoverOpen: false,
};

const initialLoadingState = {
  loading: false,
  loadingInfo: false,
  loadingAllMultiScenes: false,
};

// Memoized MultiSceneCard component to prevent unnecessary re-renders
const MultiSceneCard = memo(({ multiScene, onTrigger, onDelete, loading, formatMultiSceneName }) => (
  <Card key={multiScene.multiSceneIndex} className="relative">
    <CardContent>
      <div className="flex items-center justify-between">
        <CardTitle className="flex flex-col gap-2">
          <span className="text-lg font-bold">
            {formatMultiSceneName ? formatMultiSceneName(multiScene) : multiScene.multiSceneName || "No name"}
          </span>
          <div className="text-sm text-muted-foreground font-light">
            <span className="font-bold">Multi-Scene:</span> #{multiScene.multiSceneIndex}
            <span className="mx-1"> | </span>
            <span className="font-bold">Address:</span> {multiScene.multiSceneAddress}
            <span className="mx-1"> | </span>
            <span className="font-bold">Type:</span> {getMultiSceneTypeLabel(multiScene.multiSceneType)}
          </div>
        </CardTitle>

        <div className="flex items-center gap-2">
          {/* Scenes Button with Popover */}
          <Popover modal={true}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <span className="font-light">Scenes:</span> {multiScene.sceneCount}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-108" align="end">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-medium text-sm">
                    {formatMultiSceneName ? formatMultiSceneName(multiScene) : multiScene.multiSceneName || "No name"}
                  </h4>
                  <div className="text-xs text-muted-foreground">
                    <strong>Address:</strong> {multiScene.multiSceneAddress} | <strong>Total Scenes:</strong> {multiScene.sceneCount}
                  </div>
                </div>

                {multiScene.sceneAddresses && multiScene.sceneAddresses.length > 0 ? (
                  <div className="space-y-2">
                    <ScrollArea className="h-32 w-full rounded border pr-2">
                      <div className="p-2 space-y-1">
                        {multiScene.sceneAddresses.map((address, index) => (
                          <div key={index} className="flex items-center justify-between text-xs p-1 hover:bg-gray-50 rounded">
                            <span className="font-medium">Scene Address:</span>
                            <Badge variant="outline" className="text-xs">
                              {address}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">No scene addresses found for this multi-scene.</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Delete Multi-Scene Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(multiScene.multiSceneIndex, multiScene.multiSceneName)}
            disabled={loading}
            className="flex items-center gap-1 shadow text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          {/* Trigger Multi-Scene Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onTrigger(multiScene.multiSceneIndex, multiScene.multiSceneAddress)}
            disabled={loading}
            className="flex items-center gap-1 shadow"
          >
            <Play className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
));

MultiSceneCard.displayName = "MultiSceneCard";

export function TriggerMultiSceneDialog({ open, onOpenChange, unit }) {
  const [state, setState] = useState(initialState);
  const [loadingState, setLoadingState] = useState(initialLoadingState);

  // Access project context to get database multi-scenes
  const { selectedProject, projectItems, loadTabData, loadedTabs } = useProjectDetail();

  // Load multi-scene data when dialog opens if not already loaded
  useEffect(() => {
    if (open && selectedProject && !loadedTabs.has("multi_scenes")) {
      loadTabData(selectedProject.id, "multi_scenes");
    }
  }, [open, selectedProject, loadedTabs, loadTabData]);

  // Helper function to get database multi-scene name by address
  const getDatabaseMultiSceneName = useCallback(
    (address) => {
      if (!selectedProject || !projectItems.multi_scenes) return null;

      const databaseMultiScene = projectItems.multi_scenes.find((multiScene) => parseInt(multiScene.address) === parseInt(address));

      return databaseMultiScene ? databaseMultiScene.name : null;
    },
    [selectedProject, projectItems.multi_scenes]
  );

  // Helper function to format multi-scene display name
  const formatMultiSceneName = useCallback(
    (networkMultiScene) => {
      const defaultName = `Multi-Scene ${networkMultiScene.multiSceneIndex}`;
      const networkName = networkMultiScene.multiSceneName || defaultName;
      const databaseName = getDatabaseMultiSceneName(networkMultiScene.multiSceneAddress);

      if (databaseName && networkName !== databaseName) {
        return `${networkName} - ${databaseName}`;
      }

      return networkName;
    },
    [getDatabaseMultiSceneName]
  );

  const handleMultiSceneIndexChange = useCallback((e) => {
    const value = e.target.value;
    // Allow only numbers and limit to 0-39 range
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 39)) {
      setState((prev) => ({ ...prev, multiSceneIndex: value }));
    }
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleLoadMultiSceneInfo();
      }
    },
    [state.multiSceneIndex]
  );

  const handleLoadMultiSceneInfo = useCallback(async () => {
    if (!unit || !state.multiSceneIndex) {
      toast.error("Please enter a multi-scene index");
      return;
    }

    const index = parseInt(state.multiSceneIndex);
    if (index < 0 || index > 39) {
      toast.error("Multi-scene index must be between 0 and 39");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingInfo: true }));
    try {
      console.log("Loading multi-scene information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        multiSceneIndex: index,
      });

      const result = await window.electronAPI.multiScenesController.getMultiSceneInformation({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        multiSceneIndex: index,
      });

      // Convert single multi-scene result to card format
      if (result) {
        const multiSceneCard = {
          multiSceneIndex: index,
          multiSceneName: result.multiSceneName || `Multi-Scene ${index}`,
          multiSceneAddress: result.multiSceneAddress || 0,
          multiSceneType: result.multiSceneType || 0,
          sceneCount: result.sceneCount || 0,
          sceneAddresses: result.sceneAddresses || [],
        };

        setState((prev) => ({
          ...prev,
          multiScenes: [multiSceneCard],
          showMultiScenes: true,
        }));
        toast.success(`Multi-Scene ${index} information loaded successfully`);
      }
    } catch (error) {
      console.error("Failed to load multi-scene information:", error);
      toast.error(`Failed to load multi-scene information: ${error.message}`);
      setState((prev) => ({
        ...prev,
        multiScenes: [],
        showMultiScenes: false,
      }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingInfo: false }));
    }
  }, [unit, state.multiSceneIndex]);

  const handleLoadAllMultiScenes = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loadingAllMultiScenes: true }));
    try {
      console.log("Loading all multi-scenes information:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      const result = await window.electronAPI.multiScenesController.getAllMultiScenesInformation({
        unitIp: unit.ip_address,
        canId: unit.id_can,
      });

      if (result.multiScenes && result.multiScenes.length > 0) {
        // Convert multi-scene data to card format
        const multiSceneCards = result.multiScenes.map((multiScene) => ({
          multiSceneIndex: multiScene.multiSceneIndex,
          multiSceneName: multiScene.multiSceneName || `Multi-Scene ${multiScene.multiSceneIndex}`,
          multiSceneAddress: multiScene.multiSceneAddress || 0,
          multiSceneType: multiScene.multiSceneType || 0,
          sceneCount: multiScene.sceneCount || 0,
          sceneAddresses: multiScene.sceneAddresses || [],
        }));

        // Filter out multi-scenes that have 0 scenes
        const filteredMultiScenes = multiSceneCards.filter((multiScene) => {
          return multiScene.sceneCount > 0;
        });

        setState((prev) => ({
          ...prev,
          multiScenes: filteredMultiScenes,
          showMultiScenes: true,
        }));

        if (filteredMultiScenes.length > 0) {
          toast.success(`Loaded ${filteredMultiScenes.length} multi-scene(s) successfully`);
        } else {
          toast.info("No multi-scenes with scenes found on unit");
        }
      } else {
        setState((prev) => ({
          ...prev,
          multiScenes: [],
          showMultiScenes: true,
        }));
        toast.info("No multi-scenes found on unit");
      }
    } catch (error) {
      console.error("Failed to load all multi-scenes information:", error);
      toast.error(`Failed to load all multi-scenes information: ${error.message}`);
      setState((prev) => ({
        ...prev,
        multiScenes: [],
        showMultiScenes: false,
      }));
    } finally {
      setLoadingState((prev) => ({ ...prev, loadingAllMultiScenes: false }));
    }
  }, [unit]);

  const handleTriggerMultiSceneFromCard = useCallback(
    async (multiSceneIndex, multiSceneAddress) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      setLoadingState((prev) => ({ ...prev, loading: true }));
      try {
        console.log("Triggering multi-scene from card:", {
          unitIp: unit.ip_address,
          canId: unit.id_can,
          multiSceneIndex,
          multiSceneAddress,
        });

        await window.electronAPI.multiScenesController.triggerMultiScene({
          unitIp: unit.ip_address,
          canId: unit.id_can,
          multiSceneAddress,
        });

        toast.success(`Multi-Scene ${multiSceneIndex} triggered successfully`);
      } catch (error) {
        console.error("Failed to trigger multi-scene:", error);
        toast.error(`Failed to trigger multi-scene: ${error.message}`);
      } finally {
        setLoadingState((prev) => ({ ...prev, loading: false }));
      }
    },
    [unit]
  );

  const handleDeleteMultiSceneFromCard = useCallback((multiSceneIndex, multiSceneName) => {
    setState((prev) => ({
      ...prev,
      deleteConfirmDialog: {
        open: true,
        multiSceneIndex,
        multiSceneName,
      },
    }));
  }, []);

  const handleConfirmDeleteMultiScene = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loading: true }));
    try {
      console.log("Deleting multi-scene from card:", {
        unitIp: unit.ip_address,
        canId: unit.id_can,
        multiSceneIndex: state.deleteConfirmDialog.multiSceneIndex,
      });

      await window.electronAPI.multiScenesController.deleteMultiScene(unit.ip_address, unit.id_can, state.deleteConfirmDialog.multiSceneIndex);

      toast.success(`Multi-Scene ${state.deleteConfirmDialog.multiSceneIndex} deleted successfully`);

      // Close the confirmation dialog
      setState((prev) => ({
        ...prev,
        deleteConfirmDialog: {
          open: false,
          multiSceneIndex: null,
          multiSceneName: "",
        },
      }));

      // Optionally refresh the multi-scenes list
      // You could call handleLoadAllMultiScenes() here if needed
    } catch (error) {
      console.error("Failed to delete multi-scene:", error);
      toast.error(`Failed to delete multi-scene: ${error.message}`);
    } finally {
      setLoadingState((prev) => ({ ...prev, loading: false }));
    }
  }, [unit, state.deleteConfirmDialog]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Multi-Scene Control</DialogTitle>
          <DialogDescription>
            Load information and trigger multi-scenes on unit {unit?.ip_address} (CAN ID: {unit?.id_can}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Multi-Scene Index Input and Load Button */}
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  id="multiSceneIndex"
                  type="text"
                  value={state.multiSceneIndex}
                  onChange={handleMultiSceneIndexChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Multi-Scene (0-39)"
                  disabled={loadingState.loading || loadingState.loadingInfo || loadingState.loadingAllMultiScenes}
                  autoFocus
                  className="max-w-[150px]"
                />
                <Button
                  onClick={handleLoadMultiSceneInfo}
                  disabled={loadingState.loadingInfo || !state.multiSceneIndex || loadingState.loadingAllMultiScenes}
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  {loadingState.loadingInfo ? "Loading..." : "Load Multi-Scene"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DeleteMultiSceneDialog
                  open={state.deletePopoverOpen}
                  onOpenChange={(open) => setState((prev) => ({ ...prev, deletePopoverOpen: open }))}
                  unit={unit}
                  asPopover={true}
                  trigger={
                    <Button variant="outline" size="lg" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Multi-Scenes
                    </Button>
                  }
                />
                <Button
                  onClick={handleLoadAllMultiScenes}
                  size="lg"
                  disabled={loadingState.loadingAllMultiScenes || loadingState.loadingInfo}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  {loadingState.loadingAllMultiScenes ? "Loading..." : "Load All Multi-Scenes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Multi-Scenes Display - Always show ScrollArea */}
          <div className="space-y-4">
            <ScrollArea className="h-[450px] w-full rounded-md border p-4">
              {state.showMultiScenes && state.multiScenes.length > 0 ? (
                <div className="grid gap-3">
                  {state.multiScenes.map((multiScene) => (
                    <MultiSceneCard
                      key={multiScene.multiSceneIndex}
                      multiScene={multiScene}
                      onTrigger={handleTriggerMultiSceneFromCard}
                      onDelete={handleDeleteMultiSceneFromCard}
                      loading={loadingState.loading}
                      formatMultiSceneName={formatMultiSceneName}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full mt-10">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg font-medium mb-2">No multi-scenes loaded</p>
                    <p className="text-sm">Use "Load Multi-Scene" or "Load All Multi-Scenes" to display multi-scene information</p>
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
            disabled={loadingState.loading || loadingState.loadingInfo || loadingState.loadingAllMultiScenes}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={state.deleteConfirmDialog.open}
        onOpenChange={(open) =>
          setState((prev) => ({
            ...prev,
            deleteConfirmDialog: { ...prev.deleteConfirmDialog, open },
          }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Multi-Scene #{state.deleteConfirmDialog.multiSceneIndex} ({state.deleteConfirmDialog.multiSceneName})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  deleteConfirmDialog: {
                    open: false,
                    multiSceneIndex: null,
                    multiSceneName: "",
                  },
                }))
              }
              disabled={loadingState.loading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteMultiScene} disabled={loadingState.loading}>
              {loadingState.loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
