import React, { useState, useEffect } from "react";
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
import { useProjectDetail } from "@/contexts/project-detail-context";
import { OBJECT_TYPES, CURTAIN_TYPES } from "@/constants";

export function CurtainDialog({
  open,
  onOpenChange,
  item = null,
  mode = "create",
}) {
  const { createItem, updateItem, projectItems } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    object_type: OBJECT_TYPES.CURTAIN,
    curtain_type: "CURTAIN_PULSE_2P",
    open_group: "",
    close_group: "",
    stop_group: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Get lighting items for group selection
  const lightingItems = projectItems.lighting || [];
  const lightingOptions = lightingItems.map(item => ({
    value: item.address,
    label: item.name ? `${item.name} (${item.address})` : `Group ${item.address}`,
  }));

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      setErrors({}); // Clear errors when dialog opens
      if (mode === "edit" && item) {
        setFormData({
          name: item.name || "",
          address: item.address || "",
          description: item.description || "",
          object_type: item.object_type || OBJECT_TYPES.CURTAIN,
          curtain_type: item.curtain_type || "CURTAIN_PULSE_2P",
          open_group: item.open_group || "",
          close_group: item.close_group || "",
          stop_group: item.stop_group || "",
        });
      } else {
        setFormData({
          name: "",
          address: "",
          description: "",
          object_type: OBJECT_TYPES.CURTAIN,
          curtain_type: "CURTAIN_PULSE_2P",
          open_group: "",
          close_group: "",
          stop_group: "",
        });
      }
    }
  }, [open, item, mode]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
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
        newErrors.address = "Address must be a number between 1 and 255";
      }
    }

    if (!formData.open_group?.trim()) {
      newErrors.open_group = "Open group is required";
    }

    if (!formData.close_group?.trim()) {
      newErrors.close_group = "Close group is required";
    }

    // For 3P type, stop group is also required
    if (formData.curtain_type === "CURTAIN_PULSE_3P" && !formData.stop_group?.trim()) {
      newErrors.stop_group = "Stop group is required for 3-Point Pulse type";
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
      if (mode === "edit" && item) {
        await updateItem("curtain", item.id, formData);
      } else {
        await createItem("curtain", formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save curtain item:", error);

      // Handle duplicate address error specifically
      if (error.message && error.message.includes("already exists")) {
        const cleanMessage = error.message.split(": ").pop();
        setErrors({ address: cleanMessage });
      } else {
        setErrors({ general: "Failed to save curtain item. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const curtainTypeOptions = CURTAIN_TYPES.map(type => ({
    value: type.value,
    label: type.label,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Curtain Item" : "Create New Curtain Item"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the curtain item details below."
              : "Add a new curtain item to your project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {errors.general && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="col-span-3"
                placeholder="Enter curtain name"
              />
              {errors.name && (
                <div className="col-span-4 text-sm text-red-600">{errors.name}</div>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address *
              </Label>
              <Input
                id="address"
                type="number"
                min="1"
                max="255"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="col-span-3"
                placeholder="1-255"
              />
              {errors.address && (
                <div className="col-span-4 text-sm text-red-600">{errors.address}</div>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="curtain_type" className="text-right">
                Type *
              </Label>
              <Select
                value={formData.curtain_type}
                onValueChange={(value) => handleInputChange("curtain_type", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select curtain type" />
                </SelectTrigger>
                <SelectContent>
                  {curtainTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="open_group" className="text-right">
                Open Group *
              </Label>
              <Select
                value={formData.open_group}
                onValueChange={(value) => handleInputChange("open_group", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select lighting group for open" />
                </SelectTrigger>
                <SelectContent>
                  {lightingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.open_group && (
                <div className="col-span-4 text-sm text-red-600">{errors.open_group}</div>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="close_group" className="text-right">
                Close Group *
              </Label>
              <Select
                value={formData.close_group}
                onValueChange={(value) => handleInputChange("close_group", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select lighting group for close" />
                </SelectTrigger>
                <SelectContent>
                  {lightingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.close_group && (
                <div className="col-span-4 text-sm text-red-600">{errors.close_group}</div>
              )}
            </div>

            {formData.curtain_type === "CURTAIN_PULSE_3P" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stop_group" className="text-right">
                  Stop Group *
                </Label>
                <Select
                  value={formData.stop_group}
                  onValueChange={(value) => handleInputChange("stop_group", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select lighting group for stop" />
                  </SelectTrigger>
                  <SelectContent>
                    {lightingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stop_group && (
                  <div className="col-span-4 text-sm text-red-600">{errors.stop_group}</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="col-span-3"
                placeholder="Optional description"
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
