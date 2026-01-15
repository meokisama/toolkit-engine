import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleCheck, Layers } from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { toast } from "sonner";
import log from "electron-log/renderer";

export function SequenceDialog({ open, onOpenChange, sequence = null, mode = "create" }) {
  const { projectItems, createItem, updateItem, setActiveTab, loadTabData, selectedProject } = useProjectDetail();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    source_unit: null,
  });
  const [selectedMultiSceneIds, setSelectedMultiSceneIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMultiScenes, setLoadingMultiScenes] = useState(false);
  const [errors, setErrors] = useState({});

  // Function to find next available sequence address
  const findNextAvailableSequenceAddress = useCallback(() => {
    if (!projectItems.sequences || projectItems.sequences.length === 0) {
      return 1; // Start from 1 if no sequences exist
    }

    // Get all existing addresses and sort them
    const existingAddresses = projectItems.sequences
      .map((item) => parseInt(item.address))
      .filter((addr) => !isNaN(addr) && addr >= 1 && addr <= 255)
      .sort((a, b) => a - b);

    // Find the first gap in the sequence
    let nextAddress = 1;
    for (const addr of existingAddresses) {
      if (nextAddress < addr) {
        break; // Found a gap
      }
      nextAddress = addr + 1;
    }

    // Make sure we don't exceed the maximum address
    return nextAddress <= 255 ? nextAddress : null;
  }, [projectItems.sequences]);

  // Load existing sequence multi-scenes when editing
  const loadSequenceMultiScenes = useCallback(async (sequenceId) => {
    try {
      const multiScenes = await window.electronAPI.sequences.getMultiScenes(sequenceId);
      const multiSceneIds = multiScenes.map((ms) => ms.multi_scene_id);
      setSelectedMultiSceneIds(multiSceneIds);
    } catch (error) {
      log.error("Failed to load sequence multi-scenes:", error);
    }
  }, []);

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === "edit" && sequence) {
        setFormData({
          name: sequence.name || "",
          address: sequence.address || "",
          description: sequence.description || "",
          source_unit: sequence.source_unit || null,
        });
        loadSequenceMultiScenes(sequence.id);
      } else {
        // For new items, auto-fill the next available address
        const nextAddress = findNextAvailableSequenceAddress();
        setFormData({
          name: "",
          address: nextAddress !== null ? nextAddress.toString() : "",
          description: "",
          source_unit: null,
        });
        setSelectedMultiSceneIds([]);
      }
      setErrors({});
    }
  }, [open, mode, sequence, loadSequenceMultiScenes, findNextAvailableSequenceAddress]);

  // Load multi-scenes and unit tab data when dialog opens
  useEffect(() => {
    if (open && selectedProject) {
      const loadData = async () => {
        setLoadingMultiScenes(true);
        try {
          // Always load multi-scenes data when dialog opens to ensure fresh data
          // This ensures the selection list is populated even if the tab hasn't been visited
          await loadTabData(selectedProject.id, "multi_scenes");
          // Load unit data if not already loaded
          await loadTabData(selectedProject.id, "unit");
        } finally {
          setLoadingMultiScenes(false);
        }
      };

      loadData();
    }
  }, [open, selectedProject, loadTabData]);

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
      setSelectedMultiSceneIds((prev) => prev.filter((id) => id !== multiSceneId));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.address?.trim()) {
      newErrors.address = "Address is required";
    } else {
      const addressNum = parseInt(formData.address);
      if (isNaN(addressNum) || addressNum < 1 || addressNum > 255) {
        newErrors.address = "Address must be between 1 and 255";
      } else {
        // Check for duplicate addresses
        const existingSequences = projectItems?.sequences || [];
        const duplicateSequence = existingSequences.find((seq) => seq.address === formData.address.trim() && seq.id !== sequence?.id);
        if (duplicateSequence) {
          newErrors.address = `Address ${formData.address.trim()} is already used by another sequence`;
        }
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
        await window.electronAPI.sequences.updateMultiScenes(sequence.id, selectedMultiSceneIds);
      } else {
        // Create new sequence
        const newSequence = await createItem("sequences", formData);

        // Add all selected multi-scenes
        for (let i = 0; i < selectedMultiSceneIds.length; i++) {
          await window.electronAPI.sequences.addMultiScene(newSequence.id, selectedMultiSceneIds[i], i);
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
        source_unit: null,
      });
      setSelectedMultiSceneIds([]);
    } catch (error) {
      log.error("Failed to save sequence:", error);
      const errorMessage = error.message || "Failed to save sequence";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const availableMultiScenes = projectItems.multi_scenes || [];

  // Get unit items for source unit selection
  const unitItems = projectItems.unit || [];
  const unitOptions = unitItems.map((unit) => ({
    value: unit.id,
    label: `${unit.type || "Unknown"}-${unit.ip_address || unit.serial_no || "N/A"}`,
  }));

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="max-w-5xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Sequence" : "Create Sequence"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update the sequence details and selected multi-scenes." : "Create a new sequence with selected multi-scenes."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          <div className="grid gap-4">
            {/* Basic Information */}
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Sequence name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_unit">Source Unit</Label>
                <Select
                  value={formData.source_unit?.toString() || "none"}
                  onValueChange={(value) => handleInputChange("source_unit", value === "none" ? null : parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default</SelectItem>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>

            {/* Multi-Scene Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Select Multi-Scenes ({selectedMultiSceneIds.length})</CardTitle>
                <p className="text-sm text-muted-foreground">Select the multi-scenes you want to include in this sequence.</p>
                {errors.multiScenes && <p className="text-sm text-red-500">{errors.multiScenes}</p>}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  {loadingMultiScenes ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>Loading multi-scenes...</p>
                    </div>
                  ) : availableMultiScenes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No multi-scenes available.</p>
                      <p className="text-sm">Create multi-scenes first to add them to sequences.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-2">
                      {availableMultiScenes.map((multiScene) => (
                        <CheckboxPrimitive.Root
                          key={multiScene.id}
                          checked={selectedMultiSceneIds.includes(multiScene.id)}
                          onCheckedChange={(checked) => handleMultiSceneToggle(multiScene.id, checked)}
                          className="relative ring-[1px] ring-border rounded-lg px-4 py-3 text-start text-muted-foreground data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:text-primary flex flex-row items-center gap-3 cursor-pointer"
                        >
                          <Layers className="h-6 w-6" />
                          <div className="space-y-1">
                            <span className="font-medium tracking-tight text-sm">{multiScene.name}</span>
                            {multiScene.address && <p className="text-xs text-muted-foreground">Address: {multiScene.address}</p>}
                            {multiScene.description && <p className="text-xs text-muted-foreground line-clamp-2">{multiScene.description}</p>}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
