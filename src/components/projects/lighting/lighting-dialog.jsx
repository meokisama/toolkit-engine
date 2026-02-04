import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { OBJECT_TYPES } from "@/constants";
import { toast } from "sonner";
import log from "electron-log/renderer";

const categoryLabels = {
  lighting: "Lighting",
  aircon: "Aircon",
  unit: "Unit",
  curtain: "Curtain",
  scene: "Scene",
};

export function ProjectItemDialog({ open, onOpenChange, category, item = null, mode = "create" }) {
  const { createItem, updateItem, projectItems } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    object_type: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Parse address range (e.g., "1-10" returns [1,2,3,...,10], "5" returns [5])
  const parseAddressRange = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return { addresses: [], error: null };

    // Check if it's a range (e.g., "1-10")
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);

      if (start > end) {
        return { addresses: [], error: "Start address must be less than or equal to end address" };
      }

      if (category === "lighting") {
        if (start < 1 || end > 255) {
          return { addresses: [], error: "Address range must be between 1 and 255" };
        }
      } else {
        if (start <= 0) {
          return { addresses: [], error: "Address must be greater than 0" };
        }
      }

      const addresses = [];
      for (let i = start; i <= end; i++) {
        addresses.push(i);
      }
      return { addresses, error: null };
    }

    // Single address
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || !Number.isInteger(parseFloat(trimmed))) {
      return { addresses: [], error: "Address must be an integer or range (e.g., 1-10)" };
    }

    if (category === "lighting") {
      if (num < 1 || num > 255) {
        return { addresses: [], error: "Address must be between 1 and 255" };
      }
    } else {
      if (num <= 0) {
        return { addresses: [], error: "Address must be greater than 0" };
      }
    }

    return { addresses: [num], error: null };
  };

  // Validate address field
  const validateAddress = (value) => {
    // For lighting category, address is required
    if (category === "lighting" && !value.trim()) {
      return "Address is required for lighting items";
    }

    if (!value.trim()) {
      return null; // Address is optional for other categories
    }

    // In edit mode, only allow single address
    if (mode === "edit") {
      const num = parseInt(value, 10);
      if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
        return "Address must be an integer";
      }

      if (category === "lighting") {
        if (num < 1 || num > 255) {
          return "Address must be between 1 and 255";
        }
      } else {
        if (num <= 0) {
          return "Address must be greater than 0";
        }
      }
      return null;
    }

    // In create mode, allow range
    const { error } = parseAddressRange(value);
    return error;
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
        return OBJECT_TYPES.LIGHTING.obj_name;
      case "curtain":
        return OBJECT_TYPES.CURTAIN.obj_name;
      case "scene":
        return "OBJ_SCENE"; // Direct string since SCENE is not in new OBJECT_TYPES
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
        onOpenChange(false);
      } else {
        // Parse address range for create mode
        const { addresses } = parseAddressRange(formData.address);

        if (addresses.length === 1) {
          // Single address - use existing logic
          await createItem(category, formData);
          onOpenChange(false);
        } else {
          // Multiple addresses - create multiple items, skip existing
          const existingAddresses = new Set((projectItems[category] || []).map((item) => parseInt(item.address, 10)));

          const addressesToCreate = addresses.filter((addr) => !existingAddresses.has(addr));
          const skippedCount = addresses.length - addressesToCreate.length;

          if (addressesToCreate.length === 0) {
            setErrors({ address: "All addresses in range already exist" });
            setLoading(false);
            return;
          }

          // Create items for each address
          let createdCount = 0;
          for (const addr of addressesToCreate) {
            try {
              await createItem(category, {
                ...formData,
                address: addr.toString(),
                name: formData.name || `${categoryLabels[category] || category} ${addr}`,
              });
              createdCount++;
            } catch (err) {
              log.error(`Failed to create item with address ${addr}:`, err);
              // Continue with other addresses even if one fails
            }
          }

          if (skippedCount > 0) {
            toast.info(`Skipped ${skippedCount} existing address(es)`);
          }

          onOpenChange(false);
        }
      }
    } catch (error) {
      log.error("Failed to save item:", error);

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
          <DialogTitle>{mode === "edit" ? `Edit ${categoryLabel} Item` : `Create New ${categoryLabel} Item`}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? `Update the ${categoryLabel?.toLowerCase() || "item"} item details below.`
              : `Add ${categoryLabel?.toLowerCase() || "item"} item(s) to your project.`}
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
                  className={errors.address ? "border-red-500 focus:border-red-500" : ""}
                  placeholder={
                    mode === "edit"
                      ? category === "lighting"
                        ? "Enter integer 1-255"
                        : "Enter integer greater than 0"
                      : category === "lighting"
                        ? "Enter 1-255 or range (e.g., 1-10)"
                        : "Enter integer or range (e.g., 1-10)"
                  }
                />
                {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="col-span-3"
                placeholder="Enter description"
              />
            </div>
          </div>

          {errors.general && <div className="text-sm text-red-500 text-center mt-4">{errors.general}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (category === "lighting" && !formData.address.trim()) || errors.address}>
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
