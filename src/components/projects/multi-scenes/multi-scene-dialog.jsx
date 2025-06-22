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
import { SlidersHorizontal, CircleCheck, Lightbulb } from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
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

  const handleSceneToggle = (sceneId, checked) => {
    setSelectedSceneIds((prev) => {
      const availableScenes = projectItems.scene || [];
      const clickedScene = availableScenes.find(scene => scene.id === sceneId);

      if (!clickedScene) return prev;

      // Find all scenes with the same address
      const scenesWithSameAddress = availableScenes.filter(
        scene => scene.address === clickedScene.address
      );
      const sceneIdsWithSameAddress = scenesWithSameAddress.map(scene => scene.id);

      if (checked) {
        // Check if adding this address would exceed the limit of 20 addresses
        const currentSelectedScenes = availableScenes.filter(scene => prev.includes(scene.id));
        const currentAddresses = new Set(currentSelectedScenes.map(scene => scene.address));

        if (!currentAddresses.has(clickedScene.address) && currentAddresses.size >= 20) {
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

        return newSelectedIds;
      } else {
        // If the clicked scene is being deselected, remove all scenes with the same address
        return prev.filter(id => !sceneIdsWithSameAddress.includes(id));
      }
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

          {/* Scene Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Select Scenes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select the scenes you want to include in this multi-scene (max 20 addresses).
                {selectedScenes.length > 0 && (
                  <span className="ml-2">
                    <Badge variant="secondary">
                      {selectedScenes.length} scenes ({Object.keys(selectedSceneGroups).length} addresses)
                    </Badge>
                  </span>
                )}
              </p>
              {errors.scenes && (
                <p className="text-sm text-red-500">{errors.scenes}</p>
              )}
            </CardHeader>
            <CardContent>
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
