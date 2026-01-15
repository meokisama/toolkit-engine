import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { KNXAddressInput } from "@/components/custom/knx-input";
import { Shuffle } from "lucide-react";
import { toast } from "sonner";
import log from "electron-log/renderer";

export function GenerateFromSequenceSheet({ open, onOpenChange }) {
  const { projectItems, createItem } = useProjectDetail();
  const [loading, setLoading] = useState(false);
  const [sequenceItems, setSequenceItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [knxData, setKnxData] = useState({});

  // Find next available KNX addresses for multiple items
  const findAvailableKnxAddresses = useCallback(
    (count) => {
      if (!projectItems.knx || projectItems.knx.length === 0) {
        // If no existing KNX items, return sequential addresses starting from 0
        return Array.from({ length: count }, (_, i) => i);
      }

      const existingAddresses = new Set(
        projectItems.knx.map((item) => parseInt(item.address)).filter((addr) => !isNaN(addr) && addr >= 0 && addr <= 511)
      );

      const availableAddresses = [];
      let currentAddress = 0;

      // Find available addresses
      while (availableAddresses.length < count && currentAddress <= 511) {
        if (!existingAddresses.has(currentAddress)) {
          availableAddresses.push(currentAddress);
        }
        currentAddress++;
      }

      // Check if we found enough addresses
      if (availableAddresses.length < count) {
        throw new Error(`Only ${availableAddresses.length} addresses available, but ${count} requested`);
      }

      return availableAddresses;
    },
    [projectItems.knx]
  );

  // Initialize sequence items and KNX data when sheet opens
  useEffect(() => {
    if (open && projectItems.sequences) {
      const items = projectItems.sequences || [];
      setSequenceItems(items);

      // Initialize KNX data for each sequence item
      const initialKnxData = {};

      items.forEach((item) => {
        initialKnxData[item.id] = {
          factor: 1,
          feedback: 0,
          knx_switch_group: "", // Single KNX address for sequence trigger
          knx_status_group: "",
        };
      });

      setKnxData(initialKnxData);
      setSelectedItems(new Set());
    }
  }, [open, projectItems.sequences]);

  // Handle item selection
  const handleItemSelect = useCallback((itemId, checked) => {
    setSelectedItems((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (checked) {
        newSelected.add(itemId);
      } else {
        newSelected.delete(itemId);
      }
      return newSelected;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedItems(new Set(sequenceItems.map((item) => item.id)));
      } else {
        setSelectedItems(new Set());
      }
    },
    [sequenceItems]
  );

  // Handle KNX data change
  const handleKnxDataChange = useCallback((itemId, field, value) => {
    setKnxData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  }, []);

  // Handle create KNX items
  const handleCreate = useCallback(async () => {
    const selectedItemsList = Array.from(selectedItems);

    if (selectedItemsList.length === 0) {
      toast.error("Please select at least one sequence item");
      return;
    }

    setLoading(true);
    try {
      // Get available addresses for all selected items at once
      const availableAddresses = findAvailableKnxAddresses(selectedItemsList.length);

      // Prepare all items data first
      const itemsToCreate = [];
      let addressIndex = 0;

      for (const itemId of selectedItemsList) {
        const sequenceItem = sequenceItems.find((item) => item.id === itemId);
        const knxItemData = knxData[itemId];

        if (!sequenceItem || !knxItemData) continue;

        const itemData = {
          name: sequenceItem.name || `Sequence ${sequenceItem.address}`,
          address: availableAddresses[addressIndex],
          type: 6, // Fixed type for sequence (KNX_OUTPUT_MULTI_SCENE_SEQ)
          factor: parseInt(knxItemData.factor),
          feedback: parseInt(knxItemData.feedback),
          rcu_group_id: sequenceItem.id, // Link to sequence item
          rcu_group_type: "sequences", // Specify the RCU group type
          knx_switch_group: knxItemData.knx_switch_group,
          knx_dimming_group: "", // Not used for sequence
          knx_value_group: "", // Not used for sequence
          knx_status_group: knxItemData.knx_status_group,
          description: `Generated from sequence: ${sequenceItem.name || sequenceItem.address}`,
        };

        itemsToCreate.push(itemData);
        addressIndex++; // Move to next available address
      }

      // Create all items in parallel
      const results = await Promise.allSettled(itemsToCreate.map((itemData) => createItem("knx", itemData)));

      // Count results
      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          errorCount++;
          log.error(`Failed to create KNX item for sequence ${selectedItemsList[index]}:`, result.reason);
        }
      });

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} KNX items`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to create ${errorCount} KNX items`);
      }

      if (successCount > 0) {
        onOpenChange(false);
      }
    } catch (error) {
      log.error("Failed to create KNX items:", error);
      toast.error("Failed to create KNX items");
    } finally {
      setLoading(false);
    }
  }, [selectedItems, sequenceItems, knxData, findAvailableKnxAddresses, createItem, onOpenChange]);

  const selectedCount = selectedItems.size;
  const totalCount = sequenceItems.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="sm:max-w-[900px] w-full max-w-[90vw] p-4 pb-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Generate KNX from Sequence
          </SheetTitle>
          <SheetDescription>Select sequence items to generate corresponding KNX devices.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Header row */}
          <div className="flex gap-2 p-3 bg-muted/50 rounded-lg font-medium text-sm">
            <div className="w-[6%] flex items-center justify-center">
              <Checkbox checked={selectedCount === totalCount && totalCount > 0} onCheckedChange={handleSelectAll} />
            </div>
            <div className="w-[24%]">Sequence</div>
            <div className="w-[10%] flex items-center justify-center">Factor</div>
            <div className="w-[12%] flex items-center justify-center">Feedback</div>
            <div className="w-[24%] flex items-center justify-center gap-1">
              KNX Trigger <span className="font-light">(Addr 1)</span>
            </div>
            <div className="w-[24%] flex items-center justify-center gap-1">
              KNX Status <span className="font-light">(Addr 2)</span>
            </div>
          </div>

          {/* Items list */}
          <ScrollArea className="h-[calc(100vh-330px)]">
            <div className="space-y-2">
              {sequenceItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const itemKnxData = knxData[item.id] || {};

                return (
                  <div
                    key={item.id}
                    className={`flex gap-2 p-3 border rounded-lg items-center ${isSelected ? "border-gray-600/30 bg-gray-100/50" : "border-border"}`}
                  >
                    {/* Select checkbox */}
                    <div className="w-[6%] flex items-center justify-center">
                      <Checkbox checked={isSelected} onCheckedChange={(checked) => handleItemSelect(item.id, checked)} />
                    </div>

                    {/* Sequence item info */}
                    <div className="w-[24%]">
                      <div className="flex items-center gap-2">
                        <span className="truncate">
                          {item.name || `Sequence ${item.address}`} <span className="font-light">({item.address})</span>
                        </span>
                      </div>
                    </div>

                    {/* Factor */}
                    <div className="w-[10%]">
                      <Input
                        type="number"
                        min="1"
                        value={itemKnxData.factor || 1}
                        onChange={(e) => handleKnxDataChange(item.id, "factor", parseInt(e.target.value) || 1)}
                        className="h-8 w-full"
                        disabled={!isSelected}
                      />
                    </div>

                    {/* Feedback */}
                    <div className="w-[12%]">
                      <Select
                        value={itemKnxData.feedback?.toString() || "0"}
                        onValueChange={(value) => handleKnxDataChange(item.id, "feedback", parseInt(value))}
                        disabled={!isSelected}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Disable</SelectItem>
                          <SelectItem value="1">Enable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* KNX Trigger */}
                    <div className="w-[24%] flex items-center justify-center">
                      <KNXAddressInput
                        value={itemKnxData.knx_switch_group || ""}
                        onChange={(value) => handleKnxDataChange(item.id, "knx_switch_group", value)}
                        placeholder="0/0/1"
                        className="h-8"
                        disabled={!isSelected}
                      />
                    </div>

                    {/* KNX Status */}
                    <div className="w-[24%] flex items-center justify-center">
                      <KNXAddressInput
                        value={itemKnxData.knx_status_group || ""}
                        onChange={(value) => handleKnxDataChange(item.id, "knx_status_group", value)}
                        placeholder="0/0/2"
                        className="h-8"
                        disabled={!isSelected}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        <SheetFooter className="px-0">
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedCount} of {totalCount} items selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading || selectedCount === 0}>
                {loading ? "Creating..." : `Create ${selectedCount} KNX Items`}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
