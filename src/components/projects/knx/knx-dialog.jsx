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
import { Textarea } from "@/components/ui/textarea";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { CONSTANTS } from "@/constants";
import { KNXAddressInput } from "@/components/ui/knx-input";

export function KnxItemDialog({ open, onOpenChange, mode, item }) {
  const { createItem, updateItem, selectedProject } = useProjectDetail();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    object_type: CONSTANTS.OBJECT_TYPES.KNX,
  });
  const [errors, setErrors] = useState({});

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && item) {
        setFormData({
          name: item.name || "",
          address: item.address || "",
          description: item.description || "",
          object_type: item.object_type || CONSTANTS.OBJECT_TYPES.KNX,
        });
      } else {
        setFormData({
          name: "",
          address: "",
          description: "",
          object_type: CONSTANTS.OBJECT_TYPES.KNX,
        });
      }
      setErrors({});
    }
  }, [open, mode, item]);

  const validateForm = () => {
    const newErrors = {};

    // Address is required and must be valid KNX format
    if (!formData.address.trim()) {
      newErrors.address = "KNX address is required";
    } else {
      // Validate KNX address format (x/y/z or x.y.z)
      const addressPattern = /^(\d{1,2})[\/\.](\d{1})[\/\.](\d{1,3})$/;
      const match = formData.address.match(addressPattern);

      if (!match) {
        newErrors.address = "Invalid KNX address format. Use x/y/z format.";
      } else {
        const [, area, line, device] = match;
        const areaNum = parseInt(area);
        const lineNum = parseInt(line);
        const deviceNum = parseInt(device);

        if (areaNum < 0 || areaNum > 31) {
          newErrors.address = "Area must be between 0-31";
        } else if (lineNum < 0 || lineNum > 7) {
          newErrors.address = "Line must be between 0-7";
        } else if (deviceNum < 0 || deviceNum > 255) {
          newErrors.address = "Device must be between 0-255";
        }
      }
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
      // Normalize address format to use dots instead of slashes for consistency
      const normalizedAddress = formData.address.replace(/\//g, ".");

      const itemData = {
        ...formData,
        address: normalizedAddress,
      };

      if (mode === "edit" && item) {
        await updateItem("knx", item.id, itemData);
      } else {
        await createItem("knx", itemData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save KNX device:", error);
      if (error.message.includes("already exists")) {
        setErrors({ address: "This address is already in use" });
      } else {
        setErrors({ submit: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddressChange = (value) => {
    handleInputChange("address", value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit KNX Device" : "Add KNX Device"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the KNX device information."
              : "Add a new KNX device to your project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter device name (optional)"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="address">KNX Address *</Label>
            <KNXAddressInput
              value={formData.address}
              onChange={handleAddressChange}
              error={!!errors.address}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
            <p className="text-xs text-muted-foreground">
              E.g. Format: 0/0/1, 0/0/255, 1/1/100,...
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter device description (optional)"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {errors.submit && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {errors.submit}
            </div>
          )}

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
