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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SlidersHorizontal,
  CircleCheck,
  Lightbulb,
  List,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { CONSTANTS } from "@/constants";
import { toast } from "sonner";

// Sortable Address Item Component
function SortableAddressItem({ address, scenes, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: address });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">Address: {address}</span>
          <Badge variant="secondary" className="text-xs">
            {scenes.length} scene{scenes.length > 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {scenes.map((scene) => scene.name).join(", ")}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(address)}
        className="text-red-500 hover:text-red-700"
      >
        Remove
      </Button>
    </div>
  );
}

export function MultiSceneDialog({
  open,
  onOpenChange,
  multiScene = null,
  mode = "create",
}) {
  const {
    selectedProject,
    projectItems,
    createItem,
    updateItem,
    setActiveTab,
    loadTabData,
    loadedTabs,
  } = useProjectDetail();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    type: 0,
    description: "",
  });
  const [selectedSceneIds, setSelectedSceneIds] = useState([]);
  const [addressOrder, setAddressOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load existing multi-scene scenes when editing
  const loadMultiSceneScenes = useCallback(
    async (multiSceneId) => {
      try {
        const scenes = await window.electronAPI.multiScenes.getScenes(
          multiSceneId
        );
        const sceneIds = scenes.map((scene) => scene.scene_id);
        setSelectedSceneIds(sceneIds);

        // Initialize address order based on existing scenes, preserving database order
        const addresses = [];
        const seenAddresses = new Set();
        for (const scene of scenes) {
          if (!seenAddresses.has(scene.scene_address)) {
            addresses.push(scene.scene_address);
            seenAddresses.add(scene.scene_address);
          }
        }
        setAddressOrder(addresses);
      } catch (error) {
        console.error("Failed to load multi-scene scenes:", error);
        toast.error("Failed to load multi-scene scenes");
      }
    },
    [projectItems.scene]
  );

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && multiScene) {
        setFormData({
          name: multiScene.name || "",
          address: multiScene.address || "",
          type: multiScene.type || 0,
          description: multiScene.description || "",
        });
        loadMultiSceneScenes(multiScene.id);
      } else {
        setFormData({
          name: "",
          address: "",
          type: 0,
          description: "",
        });
        setSelectedSceneIds([]);
        setAddressOrder([]);
      }
      setErrors({});

      // Load scene data if not already loaded
      if (selectedProject && !loadedTabs.has("scene")) {
        loadTabData(selectedProject.id, "scene");
      }
    }
  }, [
    open,
    mode,
    multiScene,
    selectedProject,
    loadedTabs,
    loadTabData,
    loadMultiSceneScenes,
  ]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSceneToggle = (sceneId, checked) => {
    setSelectedSceneIds((prev) => {
      const availableScenes = projectItems.scene || [];
      const clickedScene = availableScenes.find(
        (scene) => scene.id === sceneId
      );

      if (!clickedScene) return prev;

      // Find all scenes with the same address
      const scenesWithSameAddress = availableScenes.filter(
        (scene) => scene.address === clickedScene.address
      );
      const sceneIdsWithSameAddress = scenesWithSameAddress.map(
        (scene) => scene.id
      );

      if (checked) {
        // Check if adding this address would exceed the limit of 20 addresses
        const currentSelectedScenes = availableScenes.filter((scene) =>
          prev.includes(scene.id)
        );
        const currentAddresses = new Set(
          currentSelectedScenes.map((scene) => scene.address)
        );

        if (
          !currentAddresses.has(clickedScene.address) &&
          currentAddresses.size >= 20
        ) {
          toast.error("Maximum 20 addresses allowed per multi-scene");
          return prev;
        }

        // If the clicked scene is being selected, add all scenes with the same address
        const newSelectedIds = [...prev];

        for (const id of sceneIdsWithSameAddress) {
          if (!newSelectedIds.includes(id)) {
            newSelectedIds.push(id);
          }
        }

        // Update address order when adding new address
        setAddressOrder((prevOrder) => {
          if (!prevOrder.includes(clickedScene.address)) {
            return [...prevOrder, clickedScene.address];
          }
          return prevOrder;
        });

        return newSelectedIds;
      } else {
        // If the clicked scene is being deselected, remove all scenes with the same address
        const newSelectedIds = prev.filter(
          (id) => !sceneIdsWithSameAddress.includes(id)
        );

        // Remove address from order if no scenes with this address are selected
        setAddressOrder((prevOrder) =>
          prevOrder.filter((addr) => addr !== clickedScene.address)
        );

        return newSelectedIds;
      }
    });
  };

  // Handle drag and drop for address ordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setAddressOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemoveAddress = (addressToRemove) => {
    const availableScenes = projectItems.scene || [];
    const scenesToRemove = availableScenes
      .filter((scene) => scene.address === addressToRemove)
      .map((scene) => scene.id);

    setSelectedSceneIds((prev) =>
      prev.filter((id) => !scenesToRemove.includes(id))
    );
    setAddressOrder((prev) => prev.filter((addr) => addr !== addressToRemove));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 15) {
      newErrors.name = "Name must be 15 characters or less";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (selectedSceneIds.length === 0) {
      newErrors.scenes = "At least one scene must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === "edit" && multiScene) {
        // Update multi-scene basic info
        await updateItem("multi_scenes", multiScene.id, formData);

        // Update scenes in multi-scene with proper ordering
        const orderedSceneIds = [];
        for (const address of addressOrder) {
          const scenesForAddress = selectedScenes.filter(
            (scene) => scene.address === address
          );
          for (const scene of scenesForAddress) {
            orderedSceneIds.push(scene.id);
          }
        }
        await window.electronAPI.multiScenes.updateScenes(
          multiScene.id,
          orderedSceneIds
        );
      } else {
        // Create new multi-scene
        const newMultiScene = await createItem("multi_scenes", formData);

        // Add all selected scenes in the order specified by addressOrder
        let sceneIndex = 0;
        for (const address of addressOrder) {
          const scenesForAddress = selectedScenes.filter(
            (scene) => scene.address === address
          );
          for (const scene of scenesForAddress) {
            await window.electronAPI.multiScenes.addScene(
              newMultiScene.id,
              scene.id,
              sceneIndex
            );
            sceneIndex++;
          }
        }

        // Switch to multi-scenes tab to show the newly created multi-scene
        setActiveTab("multi_scenes");
      }
      onOpenChange(true); // Pass true to indicate success

      // Reset form data after successful creation
      setFormData({
        name: "",
        address: "",
        type: 0,
        description: "",
      });
      setSelectedSceneIds([]);
      setAddressOrder([]);
    } catch (error) {
      console.error("Failed to save multi-scene:", error);
      toast.error("Failed to save multi-scene");
    } finally {
      setLoading(false);
    }
  };

  const availableScenes = projectItems.scene || [];
  const selectedScenes = availableScenes.filter((scene) =>
    selectedSceneIds.includes(scene.id)
  );

  // Group scenes by address for better display
  const groupScenesByAddress = (scenes) => {
    const groups = {};
    scenes.forEach((scene) => {
      if (!groups[scene.address]) {
        groups[scene.address] = [];
      }
      groups[scene.address].push(scene);
    });
    return groups;
  };

  const selectedSceneGroups = groupScenesByAddress(selectedScenes);

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Multi-Scene" : "Create Multi-Scene"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the multi-scene details and selected scenes."
              : "Create a new multi-scene with selected scenes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter multi-scene name"
                maxLength={15}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter address"
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type.toString()}
                onValueChange={(value) =>
                  handleInputChange("type", parseInt(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONSTANTS.MULTI_SCENES.TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value.toString()}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 -mt-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter description (optional)"
            />
          </div>

          {/* Scene Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Select Scenes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select the scenes you want to include in this multi-scene.
                {selectedScenes.length > 0 && (
                  <span className="ml-2">
                    <Badge variant="secondary">
                      {selectedScenes.length} scenes (
                      {Object.keys(selectedSceneGroups).length} addresses)
                    </Badge>
                  </span>
                )}
              </p>
              {errors.scenes && (
                <p className="text-sm text-red-500">{errors.scenes}</p>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="selection" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="selection"
                    className="flex items-center gap-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Scene Selection
                  </TabsTrigger>
                  <TabsTrigger
                    value="ordering"
                    className="flex items-center gap-2"
                  >
                    <List className="h-4 w-4" />
                    Address Ordering
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="selection" className="mt-4">
                  <ScrollArea className="h-60">
                    {availableScenes.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No scenes available.</p>
                        <p className="text-sm">
                          Create scenes first to add them to multi-scenes.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-2">
                        {availableScenes.map((scene) => (
                          <CheckboxPrimitive.Root
                            key={scene.id}
                            checked={selectedSceneIds.includes(scene.id)}
                            onCheckedChange={(checked) =>
                              handleSceneToggle(scene.id, checked)
                            }
                            className="relative ring-[1px] ring-border rounded-lg px-4 py-3 text-start text-muted-foreground data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:text-primary flex flex-row items-center gap-3 cursor-pointer"
                          >
                            <Lightbulb className="h-6 w-6" />
                            <div className="space-y-1">
                              <span className="font-medium tracking-tight text-sm">
                                {scene.name}
                              </span>
                              {scene.address && (
                                <p className="text-xs text-muted-foreground">
                                  Address: {scene.address}
                                </p>
                              )}
                              {scene.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {scene.description}
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
                </TabsContent>

                <TabsContent value="ordering" className="mt-4">
                  <ScrollArea className="h-60">
                    {addressOrder.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No addresses selected.</p>
                        <p className="text-sm">
                          Select scenes first to manage address ordering.
                        </p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={addressOrder}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2 p-2">
                            {addressOrder.map((address) => {
                              const scenesForAddress = selectedScenes.filter(
                                (scene) => scene.address === address
                              );
                              return (
                                <SortableAddressItem
                                  key={address}
                                  address={address}
                                  scenes={scenesForAddress}
                                  onRemove={handleRemoveAddress}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
