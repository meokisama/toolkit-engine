import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SceneBasicInfoForm({ formData, errors, onInputChange, projectItems }) {
  // Get unit items for source unit selection
  const unitItems = projectItems?.unit || [];
  const unitOptions = unitItems.map((unit) => ({
    value: unit.id,
    label: `${unit.type || "Unknown"}-${unit.ip_address || unit.serial_no || "N/A"}`,
  }));

  return (
    <>
      <div className="grid grid-cols-4 items-center gap-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-right pl-1">
            Name *
          </Label>
          <div className="col-span-5">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              placeholder="Enter scene name"
              className={errors.name ? "border-red-500" : ""}
              maxLength={15}
              required
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="address" className="text-right pl-1">
            Address <span className="text-red-500">*</span>
          </Label>
          <div className="col-span-5">
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => onInputChange("address", e.target.value)}
              className={errors.address ? "border-red-500 focus:border-red-500" : ""}
              placeholder="Enter integer 1-255 (e.g., 1, 2, 255)"
              required
            />
            {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="source_unit" className="pl-1">
            Source Unit
          </Label>
          <Select
            value={formData.source_unit?.toString() || "none"}
            onValueChange={(value) => onInputChange("source_unit", value === "none" ? null : parseInt(value))}
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="description" className="text-right pl-1">
            Description
          </Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            className="col-span-5"
            placeholder="Enter description"
          />
        </div>
      </div>
    </>
  );
}
