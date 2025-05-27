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

export function AirconCardDialog({
  open,
  onOpenChange,
  mode = "create",
  card = null,
}) {
  const { selectedProject, createAirconCard, updateAirconCard } =
    useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (mode === "edit" && card) {
        setFormData({
          name: card.name || "",
          address: card.address || "",
          description: card.description || "",
        });
      } else {
        setFormData({
          name: "",
          address: "",
          description: "",
        });
      }
      setErrors({});
    }
  }, [open, mode, card]);

  const validateAddress = (address) => {
    if (!address || !address.trim()) {
      return "Address is required";
    }

    const addressNum = parseInt(address.trim());
    if (isNaN(addressNum) || addressNum <= 0) {
      return "Address must be a positive integer";
    }

    return null;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: null, general: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.address.trim()) {
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
      if (mode === "edit") {
        await updateAirconCard({
          name: formData.name.trim(),
          address: formData.address.trim(),
          description: formData.description.trim(),
        });
      } else {
        await createAirconCard({
          name: formData.name.trim(),
          address: formData.address.trim(),
          description: formData.description.trim(),
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to ${mode} aircon card:`, error);

      // Handle specific error messages
      if (error.message && error.message.includes("already exists")) {
        setErrors({ address: error.message });
      } else {
        setErrors({ general: `Failed to ${mode} aircon card` });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Aircon Card" : "Create New Aircon Card"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the aircon card details. This will update all 5 items with the same address."
              : "Add a new aircon card to your project. This will create 5 items with different object types."}
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
                placeholder="Enter aircon name"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address *
              </Label>
              <div className="col-span-3">
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address (positive integer)"
                  className={errors.address ? "border-red-500" : ""}
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
            <div className="text-sm text-red-500 text-center py-2">
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
                !formData.name.trim() ||
                !formData.address.trim() ||
                errors.address
              }
            >
              {loading
                ? mode === "edit"
                  ? "Updating..."
                  : "Creating..."
                : mode === "edit"
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
