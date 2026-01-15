import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectDetail } from "@/contexts/project-detail-context";
import log from "electron-log/renderer";

export function DmxDialog({ open, onOpenChange, item = null, mode = "create" }) {
  const { createItem, updateItem, projectItems, selectedProject, loadTabData, loadedTabs } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
    source_unit: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Bulk create state (only for create mode)
  const [bulkCreate, setBulkCreate] = useState(false);
  const [bulkCount, setBulkCount] = useState(1);
  const [bulkStartAddress, setBulkStartAddress] = useState("");

  // Function to find next available DMX address
  const findNextAvailableDmxAddress = useCallback(() => {
    if (!projectItems.dmx || projectItems.dmx.length === 0) {
      return "1";
    }

    // Get all existing addresses
    const existingAddresses = projectItems.dmx.map((item) => item.address).filter((addr) => addr && addr.trim() !== "");

    if (existingAddresses.length === 0) {
      return "1";
    }

    // Try to find numeric addresses and get the max
    const numericAddresses = existingAddresses
      .map((addr) => parseInt(addr))
      .filter((addr) => !isNaN(addr))
      .sort((a, b) => a - b);

    if (numericAddresses.length === 0) {
      return "1";
    }

    return (numericAddresses[numericAddresses.length - 1] + 1).toString();
  }, [projectItems.dmx]);

  // Load unit data if not already loaded
  useEffect(() => {
    if (selectedProject && !loadedTabs.has("unit")) {
      loadTabData(selectedProject.id, "unit");
    }
  }, [selectedProject, loadedTabs, loadTabData]);

  // Create unit options
  const unitOptions = (projectItems.unit || []).map((unit) => ({
    value: unit.id,
    label: `${unit.type || "Unknown"} (${unit.ip_address || unit.serial_no || "N/A"})`,
  }));

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      setErrors({});
      setBulkCreate(false);
      setBulkCount(1);

      if (mode === "edit" && item) {
        setFormData({
          name: item.name || "",
          address: item.address || "",
          description: item.description || "",
          source_unit: item.source_unit || null,
        });
      } else {
        // For new items, auto-fill the next available address
        const nextAddress = findNextAvailableDmxAddress();
        setFormData({
          name: "",
          address: nextAddress,
          description: "",
          source_unit: null,
        });
        setBulkStartAddress(nextAddress);
      }
    }
  }, [open, item, mode, findNextAvailableDmxAddress]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (bulkCreate) {
      if (!bulkStartAddress?.trim()) {
        newErrors.bulkStartAddress = "Start address is required";
      }
      if (bulkCount < 1 || bulkCount > 100) {
        newErrors.bulkCount = "Count must be between 1 and 100";
      }
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
        await updateItem("dmx", item.id, formData);
        onOpenChange(false);
      } else {
        // Create mode
        if (bulkCreate) {
          // Bulk create multiple items
          const promises = [];
          for (let i = 0; i < bulkCount; i++) {
            const itemData = {
              name: formData.name ? `${formData.name} ${i + 1}` : "",
              address: bulkStartAddress ? (parseInt(bulkStartAddress) + i).toString() : "",
              description: formData.description || "",
            };
            promises.push(createItem("dmx", itemData));
          }
          await Promise.all(promises);
        } else {
          // Single create
          await createItem("dmx", formData);
        }
        onOpenChange(false);
      }
    } catch (error) {
      log.error("Failed to save DMX item:", error);
      setErrors({
        general: "Failed to save DMX item. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit DMX Item" : "Create New DMX Item"}</DialogTitle>
          <DialogDescription>{mode === "edit" ? "Update the DMX item details below." : "Add a new DMX item to your project."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid gap-6 py-4 w-full">
            {errors.general && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{errors.general}</div>}

            {mode === "create" && (
              <div className="flex items-center space-x-2">
                <Checkbox id="bulkCreate" checked={bulkCreate} onCheckedChange={setBulkCreate} />
                <Label htmlFor="bulkCreate" className="text-sm font-normal cursor-pointer">
                  Create multiple items at once
                </Label>
              </div>
            )}

            {bulkCreate && mode === "create" ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name Prefix</Label>
                  <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="e.g., DMX Device" />
                  <p className="text-xs text-muted-foreground">
                    Items will be named: "{formData.name || "DMX"} 1", "{formData.name || "DMX"} 2", etc.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="bulkStartAddress">Start Address *</Label>
                    <Input
                      id="bulkStartAddress"
                      value={bulkStartAddress}
                      onChange={(e) => {
                        setBulkStartAddress(e.target.value);
                        if (errors.bulkStartAddress) {
                          setErrors((prev) => ({ ...prev, bulkStartAddress: null }));
                        }
                      }}
                      placeholder="Starting address"
                    />
                    {errors.bulkStartAddress && <div className="text-sm text-red-600">{errors.bulkStartAddress}</div>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="bulkCount">Number of Items *</Label>
                    <Input
                      id="bulkCount"
                      type="number"
                      min="1"
                      max="100"
                      value={bulkCount}
                      onChange={(e) => {
                        setBulkCount(parseInt(e.target.value) || 1);
                        if (errors.bulkCount) {
                          setErrors((prev) => ({ ...prev, bulkCount: null }));
                        }
                      }}
                    />
                    {errors.bulkCount && <div className="text-sm text-red-600">{errors.bulkCount}</div>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter description"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="source_unit">Source Unit</Label>
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
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter DMX name" />
                  {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter address"
                  />
                  {errors.address && <div className="text-sm text-red-600">{errors.address}</div>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter description"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="source_unit">Source Unit</Label>
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
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "edit" ? "Update" : bulkCreate ? `Create ${bulkCount} Items` : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
