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
import { X, SlidersHorizontal } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { CONSTANTS } from "@/constants";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load existing multi-scene scenes when editing
  const loadMultiSceneScenes = useCallback(async (multiSceneId) => {
    try {
      const scenes = await window.electronAPI.multiScenes.getScenes(multiSceneId);
      const sceneIds = scenes.map(scene => scene.scene_id);
      setSelectedSceneIds(sceneIds);
    } catch (error) {
      console.error("Failed to load multi-scene scenes:", error);
      toast.error("Failed to load multi-scene scenes");
    }
  }, []);

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

  const handleSceneToggle = (sceneId) => {
    setSelectedSceneIds((prev) => {
      const availableScenes = projectItems.scene || [];
      const clickedScene = availableScenes.find(scene => scene.id === sceneId);

      if (!clickedScene) return prev;

      // Find all scenes with the same address
      const scenesWithSameAddress = availableScenes.filter(
        scene => scene.address === clickedScene.address
      );
      const sceneIdsWithSameAddress = scenesWithSameAddress.map(scene => scene.id);

      if (prev.includes(sceneId)) {
        // If the clicked scene is selected, remove all scenes with the same address
        return prev.filter(id => !sceneIdsWithSameAddress.includes(id));
      } else {
        // Check if adding this address would exceed the limit of 20 addresses
        const currentSelectedScenes = availableScenes.filter(scene => prev.includes(scene.id));
        const currentAddresses = new Set(currentSelectedScenes.map(scene => scene.address));

        if (!currentAddresses.has(clickedScene.address) && currentAddresses.size >= 20) {
          toast.error("Maximum 20 addresses allowed per multi-scene");
          return prev;
        }

        // If the clicked scene is not selected, add all scenes with the same address
        const newSelectedIds = [...prev];

        for (const id of sceneIdsWithSameAddress) {
          if (!newSelectedIds.includes(id)) {
            newSelectedIds.push(id);
          }
        }

        return newSelectedIds;
      }
    });
  };

  const removeSelectedScene = (sceneId) => {
    setSelectedSceneIds((prev) => {
      const availableScenes = projectItems.scene || [];
      const clickedScene = availableScenes.find(scene => scene.id === sceneId);

      if (!clickedScene) return prev;

      // Find all scenes with the same address and remove them
      const scenesWithSameAddress = availableScenes.filter(
        scene => scene.address === clickedScene.address
      );
      const sceneIdsWithSameAddress = scenesWithSameAddress.map(scene => scene.id);

      return prev.filter(id => !sceneIdsWithSameAddress.includes(id));
    });
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

        // Update scenes in multi-scene
        await window.electronAPI.multiScenes.updateScenes(multiScene.id, selectedSceneIds);
      } else {
        // Create new multi-scene
        const newMultiScene = await createItem("multi_scenes", formData);

        // Add all selected scenes
        for (let i = 0; i < selectedSceneIds.length; i++) {
          await window.electronAPI.multiScenes.addScene(newMultiScene.id, selectedSceneIds[i], i);
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
    } catch (error) {
      console.error("Failed to save multi-scene:", error);
      toast.error("Failed to save multi-scene");
    } finally {
      setLoading(false);
    }
  };

  const availableScenes = projectItems.scene || [];
  const selectedScenes = availableScenes.filter(scene => selectedSceneIds.includes(scene.id));

  // Group scenes by address for better display
  const groupScenesByAddress = (scenes) => {
    const groups = {};
    scenes.forEach(scene => {
      if (!groups[scene.address]) {
        groups[scene.address] = [];
      }
      groups[scene.address].push(scene);
    });
    return groups;
  };

  const availableSceneGroups = groupScenesByAddress(availableScenes);
  const selectedSceneGroups = groupScenesByAddress(selectedScenes);

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Multi-Scene" : "Create Multi-Scene"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the multi-scene details and selected scenes."
              : "Create a new multi-scene with selected scenes (max 20 addresses)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type.toString()}
                onValueChange={(value) => handleInputChange("type", parseInt(value))}
              >
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter description (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Selected Scenes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Selected Scenes ({selectedScenes.length} scenes, {Object.keys(selectedSceneGroups).length}/20 addresses)
                  {errors.scenes && (
                    <span className="text-red-500 text-xs">{errors.scenes}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {selectedScenes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No scenes selected
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(selectedSceneGroups).map(([address, scenes]) => (
                        <div key={address} className="space-y-1">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                Address {address}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {scenes.length} scene{scenes.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectedScene(scenes[0].id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {scenes.length > 1 && (
                            <div className="ml-6 space-y-1">
                              {scenes.map((scene) => (
                                <div key={scene.id} className="text-xs text-gray-600 pl-2">
                                  • {scene.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Available Scenes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Scenes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {availableScenes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No scenes available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(availableSceneGroups).map(([address, scenes]) => {
                        const isGroupSelected = scenes.every(scene => selectedSceneIds.includes(scene.id));
                        const isGroupPartiallySelected = scenes.some(scene => selectedSceneIds.includes(scene.id)) && !isGroupSelected;

                        return (
                          <div key={address} className="space-y-1">
                            <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                              <Checkbox
                                checked={isGroupSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = isGroupPartiallySelected;
                                }}
                                onCheckedChange={() => handleSceneToggle(scenes[0].id)}
                              />
                              <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                Address {address}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {scenes.length} scene{scenes.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {scenes.length > 1 && (
                              <div className="ml-6 space-y-1">
                                {scenes.map((scene) => (
                                  <div key={scene.id} className="text-xs text-gray-600 pl-2">
                                    • {scene.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

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
