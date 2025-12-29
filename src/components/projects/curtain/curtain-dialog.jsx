import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { OBJECT_TYPES, CURTAIN_TYPES } from "@/constants";
import { cn } from "@/lib/utils";

// Helper component for combobox
function LightingCombobox({ value, onValueChange, options, placeholder, className }) {
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
          className={cn("w-full justify-between text-left font-normal", !value && "text-muted-foreground", className)}
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
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
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
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
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

export function CurtainDialog({ open, onOpenChange, item = null, mode = "create" }) {
  const { createItem, updateItem, projectItems, loadTabData, loadedTabs, selectedProject } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    object_type: OBJECT_TYPES.CURTAIN.obj_name,
    curtain_type: "",
    curtain_value: 0, // Default to no selection
    open_group_id: null,
    close_group_id: null,
    stop_group_id: null,
    pause_period: 0,
    transition_period: 0,
    source_unit: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Function to find next available curtain address
  const findNextAvailableCurtainAddress = useCallback(() => {
    if (!projectItems.curtain || projectItems.curtain.length === 0) {
      return 1; // Start from 1 if no curtains exist
    }

    // Get all existing addresses and sort them
    const existingAddresses = projectItems.curtain
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
  }, [projectItems.curtain]);

  // Get lighting items for group selection
  const lightingItems = projectItems.lighting || [];
  const lightingOptions = lightingItems.map((item) => ({
    value: item.id,
    label: item.name ? `${item.name} (${item.address})` : `Group ${item.address}`,
  }));

  // Get unit items for source unit selection
  const unitItems = projectItems.unit || [];
  const unitOptions = unitItems.map((unit) => ({
    value: unit.id,
    label: `${unit.type || "Unknown"}-${unit.ip_address || unit.serial_no || "N/A"}`,
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
          object_type: item.object_type || OBJECT_TYPES.CURTAIN.obj_name,
          curtain_type: item.curtain_type || "",
          curtain_value: item.curtain_value || 0,
          open_group_id: item.open_group_id || null,
          close_group_id: item.close_group_id || null,
          stop_group_id: item.stop_group_id || null,
          pause_period: item.pause_period || 0,
          transition_period: item.transition_period || 0,
          source_unit: item.source_unit || null,
        });
      } else {
        // For new items, auto-fill the next available address
        const nextAddress = findNextAvailableCurtainAddress();
        setFormData({
          name: "",
          address: nextAddress !== null ? nextAddress.toString() : "",
          description: "",
          object_type: OBJECT_TYPES.CURTAIN.obj_name,
          curtain_type: "",
          curtain_value: 0,
          open_group_id: null,
          close_group_id: null,
          stop_group_id: null,
          pause_period: 0,
          transition_period: 0,
          source_unit: null,
        });
      }
    }
  }, [open, item, mode, findNextAvailableCurtainAddress]);

  // Load unit data if not already loaded
  useEffect(() => {
    if (selectedProject && !loadedTabs.has("unit")) {
      loadTabData(selectedProject.id, "unit");
    }
  }, [selectedProject, loadedTabs, loadTabData]);

  // Helper function to check if curtain type has 3 groups
  const hasThreeGroups = (curtainType) => {
    return curtainType.includes("3P");
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Update curtain_value when curtain_type changes
      if (field === "curtain_type") {
        const curtainType = CURTAIN_TYPES.find((type) => type.name === value);
        if (curtainType) {
          newData.curtain_value = curtainType.value;
        }
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.address?.trim()) {
      newErrors.address = "Address is required";
    } else {
      const addressNum = parseInt(formData.address);
      if (isNaN(addressNum) || addressNum < 1 || addressNum > 255) {
        newErrors.address = "Address must be a number between 1 and 255";
      }
    }

    // Validate pause_period
    if (formData.pause_period < 0 || formData.pause_period > 65535) {
      newErrors.pause_period = "Pause period must be between 0 and 65535";
    }

    // Validate transition_period
    if (formData.transition_period < 0 || formData.transition_period > 65535) {
      newErrors.transition_period = "Transition period must be between 0 and 65535";
    }

    // Open, close, and stop groups are all optional for curtain items
    // No group validation required for any curtain type

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
      // Prepare item data with proper types
      const itemData = {
        ...formData,
        address: parseInt(formData.address),
        pause_period: parseInt(formData.pause_period) || 0,
        transition_period: parseInt(formData.transition_period) || 0,
        open_group_id: formData.open_group_id || null,
        close_group_id: formData.close_group_id || null,
        stop_group_id: formData.stop_group_id || null,
        source_unit: formData.source_unit || null,
      };

      if (mode === "edit" && item) {
        await updateItem("curtain", item.id, itemData);
      } else {
        await createItem("curtain", itemData);
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

  const curtainTypeOptions = CURTAIN_TYPES.filter((type) => type.value !== 0).map((type) => ({
    value: type.name,
    label: type.label,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Curtain Item" : "Create New Curtain Item"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update the curtain item details below." : "Add a new curtain item to your project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid gap-6 py-4 w-full">
            {errors.general && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.general}</div>}

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter curtain name" />
                {errors.name && <div className="col-span-4 text-sm text-red-600">{errors.name}</div>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="source_unit" className="text-right">
                  Source Unit
                </Label>
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
            </div>

            <div className="flex gap-2">
              <div className="flex flex-col gap-2 w-1/2">
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
                  placeholder="1-255"
                />
                {errors.address && <div className="col-span-4 text-sm text-red-600">{errors.address}</div>}
              </div>

              <div className="flex flex-col gap-2 w-1/2">
                <Label htmlFor="curtain_type" className="text-right">
                  Type *
                </Label>
                <Select value={formData.curtain_type} onValueChange={(value) => handleInputChange("curtain_type", value)}>
                  <SelectTrigger className="w-full">
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
            </div>

            <div className="flex gap-2">
              <div className={`flex flex-col gap-2 ${hasThreeGroups(formData.curtain_type) ? "w-1/3" : "w-1/2"}`}>
                <Label htmlFor="open_group_id" className="text-right">
                  Open Group
                </Label>
                <div>
                  <LightingCombobox
                    value={formData.open_group_id}
                    onValueChange={(value) => handleInputChange("open_group_id", value)}
                    options={lightingOptions}
                    placeholder="Select group"
                    className={`${hasThreeGroups(formData.curtain_type) ? "max-w-36" : "max-w-55"}`}
                  />
                </div>
                {errors.open_group_id && <div className="col-span-4 text-sm text-red-600">{errors.open_group_id}</div>}
              </div>

              <div className={`flex flex-col gap-2 ${hasThreeGroups(formData.curtain_type) ? "w-1/3" : "w-1/2"}`}>
                <Label htmlFor="close_group_id" className="text-right">
                  Close Group
                </Label>
                <div>
                  <LightingCombobox
                    value={formData.close_group_id}
                    onValueChange={(value) => handleInputChange("close_group_id", value)}
                    options={lightingOptions}
                    placeholder="Select group"
                    className={`${hasThreeGroups(formData.curtain_type) ? "max-w-36" : "max-w-55"}`}
                  />
                </div>
                {errors.close_group_id && <div className="col-span-4 text-sm text-red-600">{errors.close_group_id}</div>}
              </div>

              {hasThreeGroups(formData.curtain_type) && (
                <div className="flex flex-col gap-2 w-1/3">
                  <Label htmlFor="stop_group_id" className="text-right">
                    Stop Group
                  </Label>
                  <div>
                    <LightingCombobox
                      value={formData.stop_group_id}
                      onValueChange={(value) => handleInputChange("stop_group_id", value)}
                      options={lightingOptions}
                      placeholder="Select group"
                      className={`${hasThreeGroups(formData.curtain_type) ? "max-w-36" : "max-w-55"}`}
                    />
                  </div>
                  {errors.stop_group_id && <div className="col-span-4 text-sm text-red-600">{errors.stop_group_id}</div>}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-2 w-1/2">
                <Label htmlFor="pause_period" className="text-right">
                  Pause Period (1 = 100ms)
                </Label>
                <Input
                  id="pause_period"
                  type="number"
                  min="0"
                  max="65535"
                  value={formData.pause_period}
                  onChange={(e) => handleInputChange("pause_period", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                {errors.pause_period && <div className="text-sm text-red-600">{errors.pause_period}</div>}
              </div>

              <div className="flex flex-col gap-2 w-1/2">
                <Label htmlFor="transition_period" className="text-right">
                  Transition Period (s)
                </Label>
                <Input
                  id="transition_period"
                  type="number"
                  min="0"
                  max="65535"
                  value={formData.transition_period}
                  onChange={(e) => handleInputChange("transition_period", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                {errors.transition_period && <div className="text-sm text-red-600">{errors.transition_period}</div>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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
