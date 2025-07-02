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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ListOrdered,
  CircleCheck,
  Layers,
} from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { toast } from "sonner";

export function SequenceDialog({
  open,
  onOpenChange,
  sequence = null,
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
    description: "",
  });
  const [selectedMultiSceneIds, setSelectedMultiSceneIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load existing sequence multi-scenes when editing
  const loadSequenceMultiScenes = useCallback(
    async (sequenceId) => {
      try {
        const multiScenes = await window.electronAPI.sequences.getMultiScenes(
          sequenceId
        );
        const multiSceneIds = multiScenes.map((ms) => ms.multi_scene_id);
        setSelectedMultiSceneIds(multiSceneIds);
      } catch (error) {
        console.error("Failed to load sequence multi-scenes:", error);
      }
    },
    []
  );

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === "edit" && sequence) {
        setFormData({
          name: sequence.name || "",
          address: sequence.address || "",
          description: sequence.description || "",
        });
        loadSequenceMultiScenes(sequence.id);
      } else {
        setFormData({
          name: "",
          address: "",
          description: "",
        });
        setSelectedMultiSceneIds([]);
      }
      setErrors({});
    }
  }, [open, mode, sequence, loadSequenceMultiScenes]);

  // Load multi-scenes tab data if not already loaded
  useEffect(() => {
    if (open && !loadedTabs.has("multi_scenes")) {
      loadTabData("multi_scenes");
    }
  }, [open, loadedTabs, loadTabData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleMultiSceneToggle = (multiSceneId, checked) => {
    if (checked) {
      setSelectedMultiSceneIds((prev) => [...prev, multiSceneId]);
    } else {
      setSelectedMultiSceneIds((prev) =>
        prev.filter((id) => id !== multiSceneId)
      );
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 15) {
      newErrors.name = "Name must be 15 characters or less";
    }

    if (!formData.address?.trim()) {
      newErrors.address = "Address is required";
    } else {
      const addressNum = parseInt(formData.address);
      if (isNaN(addressNum) || addressNum < 1 || addressNum > 255) {
        newErrors.address = "Address must be between 1 and 255";
      }
    }

    if (selectedMultiSceneIds.length === 0) {
      newErrors.multiScenes = "At least one multi-scene must be selected";
    } else if (selectedMultiSceneIds.length > 20) {
      newErrors.multiScenes = "Maximum 20 multi-scenes allowed per sequence";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === "edit" && sequence) {
        // Update sequence basic info
        await updateItem("sequences", sequence.id, formData);

        // Update sequence multi-scenes
        await window.electronAPI.sequences.updateMultiScenes(
          sequence.id,
          selectedMultiSceneIds
        );
      } else {
        // Create new sequence
        const newSequence = await createItem("sequences", formData);

        // Add all selected multi-scenes
        for (let i = 0; i < selectedMultiSceneIds.length; i++) {
          await window.electronAPI.sequences.addMultiScene(
            newSequence.id,
            selectedMultiSceneIds[i],
            i
          );
        }

        // Switch to sequences tab to show the newly created sequence
        setActiveTab("sequences");
      }
      onOpenChange(true); // Pass true to indicate success

      // Reset form data after successful creation
      setFormData({
        name: "",
        address: "",
        description: "",
      });
      setSelectedMultiSceneIds([]);
    } catch (error) {
      console.error("Failed to save sequence:", error);
      toast.error("Failed to save sequence");
    } finally {
      setLoading(false);
    }
  };

  const availableMultiScenes = projectItems.multi_scenes || [];
  const selectedMultiScenes = availableMultiScenes.filter((multiScene) =>
    selectedMultiSceneIds.includes(multiScene.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            {mode === "create" ? "Create New Sequence" : "Edit Sequence"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new sequence by selecting multi-scenes to execute in order."
              : "Edit the sequence details and multi-scene selection."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Basic Information - Left Side */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter sequence name (max 15 chars)"
                    maxLength={15}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    type="number"
                    min="1"
                    max="255"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="1-255"
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter description (optional)"
                  />
                </div>

                {/* Selected Multi-Scenes Summary */}
                {selectedMultiScenes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Multi-Scenes ({selectedMultiScenes.length})</Label>
                    <ScrollArea className="h-32 border rounded-md p-2">
                      <div className="space-y-1">
                        {selectedMultiScenes.map((multiScene, index) => (
                          <div
                            key={multiScene.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            <span>{multiScene.name}</span>
                            <span className="text-muted-foreground">
                              (Address: {multiScene.address})
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Multi-Scene Selection - Right Side */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Multi-Scene Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {availableMultiScenes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No multi-scenes available.</p>
                      <p className="text-sm">
                        Create multi-scenes first to add them to sequences.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 p-2">
                      {availableMultiScenes.map((multiScene) => (
                        <CheckboxPrimitive.Root
                          key={multiScene.id}
                          checked={selectedMultiSceneIds.includes(multiScene.id)}
                          onCheckedChange={(checked) =>
                            handleMultiSceneToggle(multiScene.id, checked)
                          }
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer data-[state=checked]:bg-primary/5 data-[state=checked]:border-primary"
                        >
                          <CheckboxPrimitive.Indicator className="flex items-center justify-center">
                            <CircleCheck className="h-4 w-4 text-primary" />
                          </CheckboxPrimitive.Indicator>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">
                                {multiScene.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                Addr: {multiScene.address}
                              </Badge>
                            </div>
                            {multiScene.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {multiScene.description}
                              </p>
                            )}
                          </div>
                        </CheckboxPrimitive.Root>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {errors.multiScenes && (
                  <p className="text-sm text-red-500 mt-2">{errors.multiScenes}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : mode === "create" ? "Create" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
