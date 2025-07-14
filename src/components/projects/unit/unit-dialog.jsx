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
import { Combobox } from "@/components/custom/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { UNIT_TYPES, UNIT_MODES } from "@/constants";
import { RS485ConfigDialog } from "./common/rs485-config-dialog";
import { Settings } from "lucide-react";
import {
  supportsRS485,
  getUnitTypeConstraints,
  getModeConstraints,
  createDefaultRS485Config,
} from "@/utils/rs485-utils";
import { createDefaultIOConfig } from "@/utils/io-config-utils";

export function UnitDialog({
  open,
  onOpenChange,
  item = null,
  mode = "create",
}) {
  const { createItem, updateItem } = useProjectDetail();
  const [formData, setFormData] = useState({
    type: "",
    serial_no: "",
    ip_address: "",
    id_can: "",
    id_can_last_part: "",
    mode: "",
    firmware_version: "",
    hardware_version: "",
    can_load: false,
    recovery_mode: false,
    description: "",
    rs485_config: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rs485DialogOpen, setRS485DialogOpen] = useState(false);
  const [unitConstraints, setUnitConstraints] = useState(null);
  const [modeConstraints, setModeConstraints] = useState(null);
  const [originalUnitType, setOriginalUnitType] = useState(null); // Track original unit type for edit mode

  // Create options for combobox from UNIT_TYPES
  const unitTypeOptions = UNIT_TYPES.map((unit) => ({
    value: unit.name,
    label: unit.name,
  }));

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

  // Validate ID CAN last part (should be positive integer 1-255)
  const validateIdCanLastPart = (value) => {
    if (!value.trim()) {
      return null; // ID CAN is optional
    }

    const num = parseInt(value, 10);
    if (
      isNaN(num) ||
      num < 1 ||
      num > 255 ||
      !Number.isInteger(parseFloat(value))
    ) {
      return "ID CAN last part must be a number between 1-255";
    }

    return null;
  };

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && item) {
        // Extract last part from existing CAN ID or default to empty
        const canIdParts = (item.id_can || "").split(".");
        const lastPart = canIdParts.length === 4 ? canIdParts[3] : "";

        const newFormData = {
          type: item.type || "",
          serial_no: item.serial_no || "",
          ip_address: item.ip_address || "",
          id_can: item.id_can || "",
          id_can_last_part: lastPart,
          mode: item.mode || "",
          firmware_version: item.firmware_version || "",
          hardware_version: item.hardware_version || "",
          can_load: item.can_load || false,
          recovery_mode: item.recovery_mode || false,
          description: item.description || "",
          rs485_config: item.rs485_config || null,
        };
        setFormData(newFormData);
        setOriginalUnitType(newFormData.type); // Track original unit type

        // Initialize constraints for existing item
        if (newFormData.type) {
          const constraints = getUnitTypeConstraints(newFormData.type);
          setUnitConstraints(constraints);

          if (newFormData.mode) {
            const modeConstraints = getModeConstraints(newFormData.mode);
            setModeConstraints(modeConstraints);
          }
        }
      } else {
        setFormData({
          type: "",
          serial_no: "",
          ip_address: "",
          id_can: "",
          id_can_last_part: "",
          mode: "",
          firmware_version: "",
          hardware_version: "",
          can_load: false,
          recovery_mode: false,
          description: "",
          rs485_config: null,
        });
        setOriginalUnitType(null); // Reset for create mode
        setUnitConstraints(null);
        setModeConstraints(null);
      }
      setErrors({});
    }
  }, [open, mode, item]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Handle CAN ID last part change
      if (field === "id_can_last_part") {
        if (value.trim()) {
          // Get the first 3 parts from existing CAN ID or default to 0.0.0
          const existingCanId = prev.id_can || "0.0.0.1";
          const canIdParts = existingCanId.split(".");
          const prefix =
            canIdParts.length >= 3
              ? `${canIdParts[0]}.${canIdParts[1]}.${canIdParts[2]}`
              : "0.0.0";
          newData.id_can = `${prefix}.${value}`;
        } else {
          newData.id_can = "";
        }
      }

      // Handle unit type change
      if (field === "type" && value) {
        const constraints = getUnitTypeConstraints(value);
        setUnitConstraints(constraints);

        // Apply unit type constraints
        if (constraints.defaultValues) {
          newData.can_load = constraints.defaultValues.canLoad;
          newData.recovery_mode = constraints.defaultValues.recovery;
        }

        // Set default mode
        newData.mode = constraints.defaultMode;

        // Update mode constraints
        const modeConstraints = getModeConstraints(constraints.defaultMode);
        setModeConstraints(modeConstraints);

        // Apply mode constraints
        if (modeConstraints.canLoad.value !== null) {
          newData.can_load = modeConstraints.canLoad.value;
        }

        // Reset RS485 config when unit type changes
        newData.rs485_config = Array.from({ length: 2 }, () =>
          createDefaultRS485Config()
        );

        // Reset I/O config when unit type changes
        newData.io_config = createDefaultIOConfig(value);

        // Mark that we need to clear I/O configs from database tables if this is an edit
        if (mode === "edit" && originalUnitType && originalUnitType !== value) {
          newData._clearIOConfigs = true;
        }
      }

      // Handle mode change
      if (field === "mode" && value) {
        const modeConstraints = getModeConstraints(value);
        setModeConstraints(modeConstraints);

        // Apply mode constraints
        if (modeConstraints.canLoad.value !== null) {
          newData.can_load = modeConstraints.canLoad.value;
        }
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleRS485ConfigSave = (config) => {
    setFormData((prev) => ({ ...prev, rs485_config: config }));
  };

  // Check if unit supports RS485 (not all unit types support RS485)
  const unitSupportsRS485 = () => {
    return supportsRS485(formData.type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required type field
    if (!formData.type.trim()) {
      setErrors({ type: "Unit type is required" });
      return;
    }

    // Validate IP address and ID CAN before submitting
    const ipError = validateIpAddress(formData.ip_address);
    const idCanError = validateIdCanLastPart(formData.id_can_last_part);

    if (ipError || idCanError) {
      setErrors({
        ip_address: ipError,
        id_can_last_part: idCanError,
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare form data for submission
      const submitData = { ...formData };

      // If unit supports RS485 and no RS485 config is set, create default config
      if (unitSupportsRS485() && !submitData.rs485_config) {
        // Create default RS485 configurations for both RS485-1 and RS485-2
        submitData.rs485_config = Array.from({ length: 2 }, () =>
          createDefaultRS485Config()
        );
      }

      if (mode === "edit" && item) {
        // Check if we need to clear I/O configurations from database tables
        if (submitData._clearIOConfigs) {
          await window.electronAPI.unit.clearAllIOConfigs(item.id);
          // Remove the flag from submitData before saving
          const { _clearIOConfigs, ...cleanSubmitData } = submitData;
          await updateItem("unit", item.id, cleanSubmitData);
        } else {
          await updateItem("unit", item.id, submitData);
        }
      } else {
        await createItem("unit", submitData);
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
          <div className="grid gap-6 py-4">
            {/* Type */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="type" className="text-right">
                Type *
              </Label>
              <div className="col-span-3">
                <Combobox
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                  options={unitTypeOptions}
                  placeholder="Select unit type"
                  searchPlaceholder="Search unit types..."
                  emptyMessage="No unit types found."
                  error={!!errors.type}
                />
                {errors.type && (
                  <p className="text-sm text-red-500 mt-1">{errors.type}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full">
              {/* IP Address */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="ip_address" className="text-right">
                  IP Address
                </Label>
                <div>
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="id_can_last_part" className="text-right">
                  ID CAN
                </Label>
                <div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="text-muted-foreground w-20 tracking-[2px] text-center"
                      readOnly
                      value={(() => {
                        if (formData.id_can) {
                          const parts = formData.id_can.split(".");
                          return parts.length >= 3
                            ? `${parts[0]}.${parts[1]}.${parts[2]}.`
                            : "0.0.0.";
                        }
                        return "0.0.0.";
                      })()}
                    />
                    <Input
                      id="id_can_last_part"
                      type="number"
                      min="1"
                      max="255"
                      value={formData.id_can_last_part}
                      onChange={(e) =>
                        handleInputChange("id_can_last_part", e.target.value)
                      }
                      className={`w-15 text-center [&::-webkit-inner-spin-button]:appearance-none ${
                        errors.id_can_last_part ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.id_can_last_part && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.id_can_last_part}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              {/* Mode */}
              <div className="flex flex-col gap-2 w-1/2">
                <Label htmlFor="mode" className="text-right">
                  Mode
                </Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value) => handleInputChange("mode", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_MODES.map((mode) => {
                      // Check if mode is enabled based on unit type constraints
                      const isEnabled =
                        !unitConstraints ||
                        (mode === "Master" && unitConstraints.modes.master) ||
                        (mode === "Slave" && unitConstraints.modes.slave) ||
                        (mode === "Stand-Alone" &&
                          unitConstraints.modes.standAlone);

                      return (
                        <SelectItem
                          key={mode}
                          value={mode}
                          disabled={!isEnabled}
                          className={
                            !isEnabled ? "opacity-50 cursor-not-allowed" : ""
                          }
                        >
                          {mode}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Firmware Version */}
              <div className="flex flex-col gap-2 w-1/2">
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
            </div>

            <div className="flex gap-4">
              {/* Can Load */}
              <div className="flex items-center space-x-2 w-1/2">
                <Checkbox
                  id="can_load"
                  checked={formData.can_load}
                  disabled={
                    // Disabled based on unit type constraints or mode constraints
                    (unitConstraints && !unitConstraints.checkboxes.canLoad) ||
                    (modeConstraints && !modeConstraints.canLoad.enabled)
                  }
                  onCheckedChange={(checked) =>
                    handleInputChange("can_load", checked)
                  }
                />
                <Label
                  htmlFor="can_load"
                  className={`text-sm font-normal ${
                    (unitConstraints && !unitConstraints.checkboxes.canLoad) ||
                    (modeConstraints && !modeConstraints.canLoad.enabled)
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  Enable CAN Load
                </Label>
              </div>
              {/* Recovery Mode */}
              <div className="flex items-center space-x-2 w-1/2">
                <Checkbox
                  id="recovery_mode"
                  checked={formData.recovery_mode}
                  disabled={
                    // Disabled based on unit type constraints
                    unitConstraints && !unitConstraints.checkboxes.recovery
                  }
                  onCheckedChange={(checked) =>
                    handleInputChange("recovery_mode", checked)
                  }
                />
                <Label
                  htmlFor="recovery_mode"
                  className={`text-sm font-normal ${
                    unitConstraints && !unitConstraints.checkboxes.recovery
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  Line Cut Recovery
                </Label>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
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

            {/* RS485 Configuration */}
            {unitSupportsRS485() && (
              <div className="flex flex-col gap-2">
                <Label className="text-right">RS485 Configuration</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRS485DialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configure RS485
                </Button>
              </div>
            )}
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
                !formData.type.trim() ||
                errors.type ||
                errors.ip_address ||
                errors.id_can_last_part
              }
            >
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* RS485 Configuration Dialog */}
      <RS485ConfigDialog
        open={rs485DialogOpen}
        onOpenChange={setRS485DialogOpen}
        config={formData.rs485_config}
        onSave={handleRS485ConfigSave}
      />
    </Dialog>
  );
}
