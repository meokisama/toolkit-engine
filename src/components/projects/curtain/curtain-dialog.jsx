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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { OBJECT_TYPES, CURTAIN_TYPES } from "@/constants";
import { cn } from "@/lib/utils";

// Helper component for combobox
function LightingCombobox({
  value,
  onValueChange,
  options,
  placeholder,
  className,
}) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search lighting groups..." />
          <CommandList>
            <CommandEmpty>No lighting groups found.</CommandEmpty>
            <CommandGroup>
              {/* Clear option */}
              <CommandItem
                value=""
                onSelect={() => {
                  onValueChange("");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-muted-foreground">Clear selection</span>
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
  const lightingOptions = lightingItems.map((item) => ({
    value: item.address,
    label: item.name
      ? `${item.name} (${item.address})`
      : `Group ${item.address}`,
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

    // Open and close groups are optional for curtain items
    // Only stop group is required for 3P type
    if (
      formData.curtain_type === "CURTAIN_PULSE_3P" &&
      !formData.stop_group?.trim()
    ) {
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
        setErrors({
          general: "Failed to save curtain item. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const curtainTypeOptions = CURTAIN_TYPES.map((type) => ({
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
                <div className="col-span-4 text-sm text-red-600">
                  {errors.name}
                </div>
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
                <div className="col-span-4 text-sm text-red-600">
                  {errors.address}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="curtain_type" className="text-right">
                Type *
              </Label>
              <Select
                value={formData.curtain_type}
                onValueChange={(value) =>
                  handleInputChange("curtain_type", value)
                }
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
                Open Group
              </Label>
              <div className="col-span-3">
                <LightingCombobox
                  value={formData.open_group}
                  onValueChange={(value) =>
                    handleInputChange("open_group", value)
                  }
                  options={lightingOptions}
                  placeholder="Select lighting group for open (optional)"
                />
              </div>
              {errors.open_group && (
                <div className="col-span-4 text-sm text-red-600">
                  {errors.open_group}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="close_group" className="text-right">
                Close Group
              </Label>
              <div className="col-span-3">
                <LightingCombobox
                  value={formData.close_group}
                  onValueChange={(value) =>
                    handleInputChange("close_group", value)
                  }
                  options={lightingOptions}
                  placeholder="Select lighting group for close (optional)"
                />
              </div>
              {errors.close_group && (
                <div className="col-span-4 text-sm text-red-600">
                  {errors.close_group}
                </div>
              )}
            </div>

            {formData.curtain_type === "CURTAIN_PULSE_3P" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stop_group" className="text-right">
                  Stop Group *
                </Label>
                <div className="col-span-3">
                  <LightingCombobox
                    value={formData.stop_group}
                    onValueChange={(value) =>
                      handleInputChange("stop_group", value)
                    }
                    options={lightingOptions}
                    placeholder="Select lighting group for stop"
                  />
                </div>
                {errors.stop_group && (
                  <div className="col-span-4 text-sm text-red-600">
                    {errors.stop_group}
                  </div>
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
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
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
