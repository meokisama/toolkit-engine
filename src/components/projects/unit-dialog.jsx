import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { UNIT_TYPES, UNIT_MODES } from "@/constants";

export function UnitDialog({
  open,
  onOpenChange,
  item = null,
  mode = "create",
}) {
  const { createItem, updateItem } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    serial_no: "",
    ip_address: "",
    id_can: "",
    mode: "",
    firmware_version: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate IP address
  const validateIpAddress = (value) => {
    if (!value.trim()) {
      return null; // IP address is optional
    }

    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(value)) {
      return "Please enter a valid IP address";
    }

    return null;
  };

  // Validate ID CAN (should be positive integer)
  const validateIdCan = (value) => {
    if (!value.trim()) {
      return null; // ID CAN is optional
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0 || !Number.isInteger(parseFloat(value))) {
      return "ID CAN must be a positive integer";
    }

    return null;
  };

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && item) {
        setFormData({
          name: item.name || "",
          type: item.type || "",
          serial_no: item.serial_no || "",
          ip_address: item.ip_address || "",
          id_can: item.id_can || "",
          mode: item.mode || "",
          firmware_version: item.firmware_version || "",
          description: item.description || "",
        });
      } else {
        setFormData({
          name: "",
          type: "",
          serial_no: "",
          ip_address: "",
          id_can: "",
          mode: "",
          firmware_version: "",
          description: "",
        });
      }
      setErrors({});
    }
  }, [open, mode, item]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    // Validate IP address and ID CAN before submitting
    const ipError = validateIpAddress(formData.ip_address);
    const idCanError = validateIdCan(formData.id_can);

    if (ipError || idCanError) {
      setErrors({
        ip_address: ipError,
        id_can: idCanError,
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === "edit" && item) {
        await updateItem("unit", item.id, formData);
      } else {
        await createItem("unit", formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save unit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Unit" : "Create New Unit"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the unit details below."
              : "Add a new unit to your project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="col-span-3"
                placeholder="Enter unit name"
                required
              />
            </div>

            {/* Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Serial No */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serial_no" className="text-right">
                Serial No.
              </Label>
              <Input
                id="serial_no"
                value={formData.serial_no}
                onChange={(e) => handleInputChange("serial_no", e.target.value)}
                className="col-span-3"
                placeholder="Enter serial number"
              />
            </div>

            {/* IP Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ip_address" className="text-right">
                IP Address
              </Label>
              <div className="col-span-3">
                <Input
                  id="ip_address"
                  value={formData.ip_address}
                  onChange={(e) =>
                    handleInputChange("ip_address", e.target.value)
                  }
                  placeholder="192.168.1.100"
                  className={errors.ip_address ? "border-red-500" : ""}
                />
                {errors.ip_address && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.ip_address}
                  </p>
                )}
              </div>
            </div>

            {/* ID CAN */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id_can" className="text-right">
                ID CAN
              </Label>
              <div className="col-span-3">
                <Input
                  id="id_can"
                  value={formData.id_can}
                  onChange={(e) => handleInputChange("id_can", e.target.value)}
                  placeholder="Enter CAN ID"
                  className={errors.id_can ? "border-red-500" : ""}
                />
                {errors.id_can && (
                  <p className="text-sm text-red-500 mt-1">{errors.id_can}</p>
                )}
              </div>
            </div>

            {/* Mode */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mode" className="text-right">
                Mode
              </Label>
              <Select
                value={formData.mode}
                onValueChange={(value) => handleInputChange("mode", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Firmware Version */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firmware_version">Firmware</Label>
              <Input
                id="firmware_version"
                value={formData.firmware_version}
                onChange={(e) =>
                  handleInputChange("firmware_version", e.target.value)
                }
                className="col-span-3"
                placeholder="v1.0.0"
              />
            </div>

            {/* Description */}
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
              disabled={
                loading ||
                !formData.name.trim() ||
                errors.ip_address ||
                errors.id_can
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
