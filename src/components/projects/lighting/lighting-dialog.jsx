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
import { useProjectDetail } from "@/contexts/project-detail-context";
import { OBJECT_TYPES } from "@/constants";

const categoryLabels = {
  lighting: "Lighting",
  aircon: "Aircon",
  unit: "Unit",
  curtain: "Curtain",
  scene: "Scene",
};

export function ProjectItemDialog({
  open,
  onOpenChange,
  category,
  item = null,
  mode = "create",
}) {
  const { createItem, updateItem } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    object_type: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate address field
  const validateAddress = (value) => {
    // For lighting category, address is required
    if (category === "lighting" && !value.trim()) {
      return "Address is required for lighting items";
    }

    if (!value.trim()) {
      return null; // Address is optional for other categories
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
      return "Address must be an integer";
    }

    // For lighting category, address must be in range 1-255
    if (category === "lighting") {
      if (num < 1 || num > 255) {
        return "Address must be between 1 and 255";
      }
    } else {
      // For other categories, address must be greater than 0
      if (num <= 0) {
        return "Address must be greater than 0";
      }
    }

    return null;
  };

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      setErrors({}); // Clear errors when dialog opens
      if (mode === "edit" && item) {
        setFormData({
          name: item.name || "",
          address: item.address || "",
          description: item.description || "",
          object_type: item.object_type || getDefaultObjectType(category),
        });
      } else {
        setFormData({
          name: "",
          address: "",
          description: "",
          object_type: getDefaultObjectType(category),
        });
      }
    }
  }, [open, item, mode, category]);

  // Get default object type based on category
  const getDefaultObjectType = (category) => {
    switch (category) {
      case "lighting":
        return OBJECT_TYPES.LIGHTING;
      case "curtain":
        return OBJECT_TYPES.CURTAIN;
      case "scene":
        return OBJECT_TYPES.SCENE;
      default:
        return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate address before submitting
    const addressError = validateAddress(formData.address);
    if (addressError) {
      setErrors({ address: addressError });
      return;
    }

    setLoading(true);
    try {
      if (mode === "edit" && item) {
        await updateItem(category, item.id, formData);
      } else {
        await createItem(category, formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save item:", error);

      // Handle duplicate address error specifically
      if (error.message && error.message.includes("already exists")) {
        // Extract the clean error message after the last colon
        const cleanMessage = error.message.split(": ").pop();
        setErrors({ address: cleanMessage });
      } else {
        // Handle other errors generically
        setErrors({ general: "Failed to save item. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear general error when user starts typing
    if (errors.general) {
      setErrors((prev) => ({
        ...prev,
        general: null,
      }));
    }

    // Real-time validation for address field
    if (field === "address") {
      const error = validateAddress(value);
      setErrors((prev) => ({
        ...prev,
        address: error,
      }));
    }
  };

  const categoryLabel = categoryLabels[category] || category || "Item";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? `Edit ${categoryLabel} Item`
              : `Create New ${categoryLabel} Item`}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? `Update the ${
                  categoryLabel?.toLowerCase() || "item"
                } item details below.`
              : `Add a new ${
                  categoryLabel?.toLowerCase() || "item"
                } item to your project.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="col-span-3"
                placeholder="Enter item name"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="address" className="text-right pt-2">
                Address{category === "lighting" ? " *" : ""}
              </Label>
              <div className="col-span-3">
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className={
                    errors.address ? "border-red-500 focus:border-red-500" : ""
                  }
                  placeholder={
                    category === "lighting"
                      ? "Enter integer 1-255 (e.g., 1, 2, 255)"
                      : "Enter integer greater than 0 (e.g., 1, 2, 100)"
                  }
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="col-span-3"
                placeholder="Enter description"
              />
            </div>
          </div>

          {errors.general && (
            <div className="text-sm text-red-500 text-center mt-4">
              {errors.general}
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
            <Button
              type="submit"
              disabled={
                loading ||
                (category === "lighting" && !formData.address.trim()) ||
                errors.address
              }
            >
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
