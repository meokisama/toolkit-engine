import React, { useState, useEffect, useCallback } from "react";
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
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { CONSTANTS } from "@/constants";
import { KNXAddressInput } from "@/components/custom/knx-input";

export function KnxItemDialog({ open, onOpenChange, mode, item }) {
  const { createItem, updateItem, selectedProject, projectItems, loadedTabs, loadTabData } =
    useProjectDetail();
  const [loading, setLoading] = useState(false);
  const [rcuGroupOpen, setRcuGroupOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    type: 0,
    factor: 1,
    feedback: 0,
    rcu_group_id: null,
    knx_switch_group: "",
    knx_dimming_group: "",
    knx_value_group: "",
    description: "",
  });
  const [errors, setErrors] = useState({});

  // Load RCU Group data based on KNX type
  const loadRcuGroupDataForType = useCallback(async (knxType) => {
    if (!selectedProject) return;

    const typeValue = parseInt(knxType);
    let tabToLoad = null;

    switch (typeValue) {
      case 1: // Switch
      case 2: // Dimmer
        tabToLoad = "lighting";
        break;
      case 3: // Curtain
        tabToLoad = "curtain";
        break;
      case 4: // Scene
        tabToLoad = "scene";
        break;
      case 5: // Multi Scene
      case 6: // Multi Scene Sequence
        tabToLoad = "multi_scenes";
        break;
      case 7: // AC Power
      case 8: // AC Mode
      case 9: // AC Fan Speed
      case 10: // AC Swing
      case 11: // AC Set Point
        tabToLoad = "aircon";
        break;
      default:
        // For type 0 (Disable) or unknown types, no need to load data
        return;
    }

    // Load data if not already loaded
    if (tabToLoad && !loadedTabs.has(tabToLoad)) {
      await loadTabData(selectedProject.id, tabToLoad);
    }
  }, [selectedProject, loadedTabs, loadTabData]);

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && item) {
        setFormData({
          name: item.name || "",
          address: item.address || "",
          type: item.type || 0,
          factor: item.factor || 1,
          feedback: item.feedback || 0,
          rcu_group_id: item.rcu_group_id || null,
          knx_switch_group: item.knx_switch_group || "",
          knx_dimming_group: item.knx_dimming_group || "",
          knx_value_group: item.knx_value_group || "",
          description: item.description || "",
        });
        // Load RCU Group data for the current item's type (lazy loading)
        if (item.type && item.type !== 0) {
          loadRcuGroupDataForType(item.type);
        }
      } else {
        setFormData({
          name: "",
          address: "",
          type: 0,
          factor: 1,
          feedback: 0,
          rcu_group_id: null,
          knx_switch_group: "",
          knx_dimming_group: "",
          knx_value_group: "",
          description: "",
        });
      }
      setErrors({});
    }
  }, [open, mode, item, loadRcuGroupDataForType]);

  const validateForm = () => {
    const newErrors = {};

    // Address is required and must be a number between 0-511
    if (
      formData.address === "" ||
      formData.address === null ||
      formData.address === undefined
    ) {
      newErrors.address = "Address is required";
    } else {
      const addressNum = parseInt(formData.address);
      if (isNaN(addressNum) || addressNum < 0 || addressNum > 511) {
        newErrors.address = "Address must be a number between 0 and 511";
      }
    }

    // Factor must be greater than or equal to 1
    if (formData.factor < 1) {
      newErrors.factor = "Factor must be greater than or equal to 1";
    }

    // Validate KNX address format for the three KNX group fields (only if they are visible)
    const knxAddressPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{1,3})$/;
    const visibility = getKnxGroupVisibility(formData.type);

    if (
      visibility.showSwitch &&
      formData.knx_switch_group &&
      !knxAddressPattern.test(formData.knx_switch_group)
    ) {
      newErrors.knx_switch_group = "Invalid KNX address format. Use a/b/c";
    }

    if (
      visibility.showDimming &&
      formData.knx_dimming_group &&
      !knxAddressPattern.test(formData.knx_dimming_group)
    ) {
      newErrors.knx_dimming_group = "Invalid KNX address format. Use a/b/c";
    }

    if (
      visibility.showValue &&
      formData.knx_value_group &&
      !knxAddressPattern.test(formData.knx_value_group)
    ) {
      newErrors.knx_value_group = "Invalid KNX address format. Use a/b/c";
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
      const itemData = {
        ...formData,
        address: parseInt(formData.address),
        type: parseInt(formData.type),
        factor: parseInt(formData.factor),
        feedback: parseInt(formData.feedback),
        rcu_group_id:
          formData.rcu_group_id === "none" || !formData.rcu_group_id
            ? null
            : formData.rcu_group_id,
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
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // If type changes, clear KNX group fields that are not allowed and reset RCU group
      if (field === "type") {
        const visibility = getKnxGroupVisibility(value);
        if (!visibility.allowInput) {
          // Disable type - clear all KNX groups and RCU group
          newData.knx_switch_group = "";
          newData.knx_dimming_group = "";
          newData.knx_value_group = "";
          newData.rcu_group_id = null;
        } else {
          // Clear fields that are not visible for this type
          if (!visibility.showSwitch) newData.knx_switch_group = "";
          if (!visibility.showDimming) newData.knx_dimming_group = "";
          if (!visibility.showValue) newData.knx_value_group = "";

          // Reset RCU group when type changes to allow selection from appropriate items
          newData.rcu_group_id = null;

          // Load RCU Group data for the new type (lazy loading)
          loadRcuGroupDataForType(value);
        }
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Get appropriate items for RCU Group selection based on KNX type
  const getRcuGroupItems = (knxType) => {
    const typeValue = parseInt(knxType);

    switch (typeValue) {
      case 1: // Switch
      case 2: // Dimmer
        return projectItems?.lighting || [];
      case 3: // Curtain
        return projectItems?.curtain || [];
      case 4: // Scene
        return projectItems?.scene || [];
      case 5: // Multi Scene
      case 6: // Multi Scene Sequence
        return projectItems?.multi_scenes || [];
      case 7: // AC Power
      case 8: // AC Mode
      case 9: // AC Fan Speed
      case 10: // AC Swing
      case 11: // AC Set Point
        return projectItems?.aircon || [];
      default:
        return projectItems?.lighting || [];
    }
  };

  const rcuGroupItems = getRcuGroupItems(formData.type);

  // Determine which KNX group fields to show based on type
  const getKnxGroupVisibility = (type) => {
    const typeValue = parseInt(type);

    // 0: Disable - no groups allowed
    if (typeValue === 0) {
      return {
        showSwitch: false,
        showDimming: false,
        showValue: false,
        allowInput: false,
      };
    }

    // 2: Dimmer - all three groups
    if (typeValue === 2) {
      return {
        showSwitch: true,
        showDimming: true,
        showValue: true,
        allowInput: true,
      };
    }

    // 3: Curtain - switch and dimming only
    if (typeValue === 3) {
      return {
        showSwitch: true,
        showDimming: true,
        showValue: false,
        allowInput: true,
      };
    }

    // All others - switch only
    return {
      showSwitch: true,
      showDimming: false,
      showValue: false,
      allowInput: true,
    };
  };

  const knxGroupVisibility = getKnxGroupVisibility(formData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="number"
                min="0"
                max="511"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter address (0-511)"
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type.toString()}
                onValueChange={(value) =>
                  handleInputChange("type", parseInt(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select KNX output type" />
                </SelectTrigger>
                <SelectContent>
                  {CONSTANTS.KNX.KNX_OUTPUT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value.toString()}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="factor">Factor</Label>
              <Input
                id="factor"
                type="number"
                min="1"
                value={formData.factor}
                onChange={(e) => handleInputChange("factor", e.target.value)}
                placeholder="Enter factor (must be ≥ 1)"
              />
              {errors.factor && (
                <p className="text-sm text-red-500">{errors.factor}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Select
                value={formData.feedback.toString()}
                onValueChange={(value) =>
                  handleInputChange("feedback", parseInt(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select KNX feedback type" />
                </SelectTrigger>
                <SelectContent>
                  {CONSTANTS.KNX.KNX_FEEDBACK_TYPES.map((feedback) => (
                    <SelectItem
                      key={feedback.value}
                      value={feedback.value.toString()}
                    >
                      {feedback.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.feedback && (
                <p className="text-sm text-red-500">{errors.feedback}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rcu_group_id">RCU Group</Label>
              <Popover open={rcuGroupOpen} onOpenChange={setRcuGroupOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={rcuGroupOpen}
                    className="w-full justify-between"
                    disabled={!knxGroupVisibility.allowInput}
                  >
                    <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">
                      {formData.rcu_group_id
                        ? (() => {
                            const selectedItem = rcuGroupItems.find(
                              (item) => item.id === formData.rcu_group_id
                            );
                            return selectedItem
                              ? `${
                                  selectedItem.name ||
                                  `Group ${selectedItem.address}`
                                } (Address: ${selectedItem.address})`
                              : "Select group...";
                          })()
                        : "Select group..."}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search RCU groups..." />
                    <CommandEmpty>No RCU group found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          handleInputChange("rcu_group_id", null);
                          setRcuGroupOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !formData.rcu_group_id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        None
                      </CommandItem>
                      {rcuGroupItems.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={`${item.name || `Group ${item.address}`} ${
                            item.address
                          }`}
                          onSelect={() => {
                            handleInputChange("rcu_group_id", item.id);
                            setRcuGroupOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.rcu_group_id === item.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {item.name || `Group ${item.address}`} (Address:{" "}
                          {item.address})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {errors.rcu_group_id && (
            <p className="text-sm text-red-500">{errors.rcu_group_id}</p>
          )}
          {!knxGroupVisibility.allowInput && (
            <p className="text-sm text-muted-foreground italic">
              RCU Group and KNX Groups are disabled when Type is set to
              "Disable"
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter device description (optional)"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 py-4">
            {knxGroupVisibility.showSwitch && (
              <div className="space-y-4">
                <Label htmlFor="knx_switch_group">
                  KNX Switch{" "}
                  <span className="text-muted-foreground font-light italic">
                    (Address 1)
                  </span>
                </Label>
                <KNXAddressInput
                  value={formData.knx_switch_group}
                  onChange={(value) =>
                    handleInputChange("knx_switch_group", value)
                  }
                  placeholder="0/0/1"
                  error={!!errors.knx_switch_group}
                  disabled={!knxGroupVisibility.allowInput}
                />
                {errors.knx_switch_group && (
                  <p className="text-sm text-red-500">
                    {errors.knx_switch_group}
                  </p>
                )}
              </div>
            )}

            {knxGroupVisibility.showDimming && (
              <div className="space-y-4">
                <Label htmlFor="knx_dimming_group">
                  KNX Dimming{" "}
                  <span className="text-muted-foreground font-light italic">
                    (Address 2)
                  </span>
                </Label>
                <KNXAddressInput
                  value={formData.knx_dimming_group}
                  onChange={(value) =>
                    handleInputChange("knx_dimming_group", value)
                  }
                  placeholder="0/0/2"
                  error={!!errors.knx_dimming_group}
                  disabled={!knxGroupVisibility.allowInput}
                />
                {errors.knx_dimming_group && (
                  <p className="text-sm text-red-500">
                    {errors.knx_dimming_group}
                  </p>
                )}
              </div>
            )}

            {knxGroupVisibility.showValue && (
              <div className="space-y-4">
                <Label htmlFor="knx_value_group">
                  KNX Value
                  <span className="text-muted-foreground font-light italic">
                    (Address 3)
                  </span>
                </Label>
                <KNXAddressInput
                  value={formData.knx_value_group}
                  onChange={(value) =>
                    handleInputChange("knx_value_group", value)
                  }
                  placeholder="0/0/3"
                  error={!!errors.knx_value_group}
                  disabled={!knxGroupVisibility.allowInput}
                />
                {errors.knx_value_group && (
                  <p className="text-sm text-red-500">
                    {errors.knx_value_group}
                  </p>
                )}
              </div>
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
