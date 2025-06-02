import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OBJECT_TYPES,
  AC_POWER_VALUES,
  AC_FAN_SPEED_VALUES,
  AC_MODE_VALUES,
  AC_SWING_VALUES,
  AC_POWER_LABELS,
  AC_FAN_SPEED_LABELS,
  AC_MODE_LABELS,
  AC_SWING_LABELS,
} from "@/constants";
import { Thermometer, Power, Wind, Settings, Move } from "lucide-react";

const AIRCON_PROPERTIES = [
  {
    objectType: OBJECT_TYPES.AC_POWER,
    label: "Power",
    icon: Power,
    defaultValue: "1",
    options: Object.entries(AC_POWER_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    objectType: OBJECT_TYPES.AC_MODE,
    label: "Mode",
    icon: Settings,
    defaultValue: "0",
    options: Object.entries(AC_MODE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    objectType: OBJECT_TYPES.AC_FAN_SPEED,
    label: "Fan Speed",
    icon: Wind,
    defaultValue: "0",
    options: Object.entries(AC_FAN_SPEED_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
  {
    objectType: OBJECT_TYPES.AC_TEMPERATURE,
    label: "Temperature",
    icon: Thermometer,
    defaultValue: "25",
    isTemperature: true,
  },
  {
    objectType: OBJECT_TYPES.AC_SWING,
    label: "Swing",
    icon: Move,
    defaultValue: "0",
    options: Object.entries(AC_SWING_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
];

export function AirconPropertiesDialog({
  open,
  onOpenChange,
  airconCard,
  airconGroup,
  mode = "add", // "add" or "edit"
  onConfirm,
}) {
  const [selectedProperties, setSelectedProperties] = useState({});
  const [propertyValues, setPropertyValues] = useState({});

  // Get the data source based on mode
  const dataSource = mode === "edit" ? airconGroup : airconCard;

  // Initialize state when dialog opens
  useEffect(() => {
    if (open && mode === "edit" && airconGroup) {
      const selected = {};
      const values = {};

      airconGroup.items.forEach((item) => {
        selected[item.object_type] = true;
        values[item.object_type] =
          item.item_value ||
          AIRCON_PROPERTIES.find((p) => p.objectType === item.object_type)
            ?.defaultValue;
      });

      setSelectedProperties(selected);
      setPropertyValues(values);
    } else if (open && mode === "add") {
      // Reset state for add mode
      setSelectedProperties({});
      setPropertyValues({});
    }
  }, [open, mode, airconGroup]);

  const handlePropertyToggle = (objectType, checked) => {
    setSelectedProperties((prev) => ({
      ...prev,
      [objectType]: checked,
    }));

    // Set default value when property is selected
    if (checked) {
      const property = AIRCON_PROPERTIES.find(
        (p) => p.objectType === objectType
      );
      if (property && !propertyValues[objectType]) {
        setPropertyValues((prev) => ({
          ...prev,
          [objectType]: property.defaultValue,
        }));
      }
    }
  };

  const handleValueChange = (objectType, value) => {
    setPropertyValues((prev) => ({
      ...prev,
      [objectType]: value,
    }));
  };

  const handleConfirm = () => {
    const selectedPropertiesArray = Object.entries(selectedProperties)
      .filter(([_, selected]) => selected)
      .map(([objectType]) => ({
        objectType,
        value:
          propertyValues[objectType] ||
          AIRCON_PROPERTIES.find((p) => p.objectType === objectType)
            ?.defaultValue,
      }));

    if (selectedPropertiesArray.length > 0) {
      onConfirm(dataSource.address, selectedPropertiesArray);
      onOpenChange(false);
      // Reset state only for add mode
      if (mode === "add") {
        setSelectedProperties({});
        setPropertyValues({});
      }
    }
  };

  const renderValueInput = (property) => {
    const value = propertyValues[property.objectType] || property.defaultValue;

    if (property.isTemperature) {
      return (
        <Input
          type="number"
          min="0"
          max="40"
          step="0.5"
          value={value}
          onChange={(e) =>
            handleValueChange(property.objectType, e.target.value)
          }
          className="w-24"
          placeholder="25"
        />
      );
    }

    if (property.options) {
      return (
        <Select
          value={value}
          onValueChange={(newValue) =>
            handleValueChange(property.objectType, newValue)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {property.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return null;
  };

  const hasSelectedProperties = Object.values(selectedProperties).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Aircon Properties" : "Add Aircon to Scene"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Modify" : "Select"} the aircon properties you
            want to control in this scene for{" "}
            <strong>
              {dataSource?.name || `Aircon ${dataSource?.address}`}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {AIRCON_PROPERTIES.map((property) => {
            const Icon = property.icon;
            const isSelected = selectedProperties[property.objectType];

            return (
              <div
                key={property.objectType}
                className="flex items-center justify-between space-x-4 p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={property.objectType}
                    checked={isSelected || false}
                    onCheckedChange={(checked) =>
                      handlePropertyToggle(property.objectType, checked)
                    }
                  />
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor={property.objectType}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {property.label}
                  </Label>
                </div>

                {isSelected && (
                  <div className="flex items-center space-x-2">
                    {renderValueInput(property)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!hasSelectedProperties}>
            {mode === "edit" ? "Update Properties" : "Add to Scene"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
