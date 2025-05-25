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
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate address field
  const validateAddress = (value) => {
    if (!value.trim()) {
      return null; // Address is optional
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0 || !Number.isInteger(parseFloat(value))) {
      return "Address must be a positive integer";
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
        });
      } else {
        setFormData({
          name: "",
          address: "",
          description: "",
        });
      }
    }
  }, [open, item, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

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
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Real-time validation for address field
    if (field === "address") {
      const error = validateAddress(value);
      setErrors((prev) => ({
        ...prev,
        address: error,
      }));
    }
  };

  const categoryLabel = categoryLabels[category] || category;

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
              ? `Update the ${categoryLabel.toLowerCase()} item details below.`
              : `Add a new ${categoryLabel.toLowerCase()} item to your project.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="col-span-3"
                placeholder="Enter item name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="address" className="text-right pt-2">
                Address
              </Label>
              <div className="col-span-3">
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className={
                    errors.address ? "border-red-500 focus:border-red-500" : ""
                  }
                  placeholder="Enter positive integer (e.g., 1, 2, 100)"
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
              disabled={loading || !formData.name.trim() || errors.address}
            >
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
