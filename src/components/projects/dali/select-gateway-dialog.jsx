import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  NetworkUnitSelector,
  useNetworkUnitSelector,
} from "@/components/shared/network-unit-selector";
import { toast } from "sonner";

export function SelectGatewayDialog({ open, onOpenChange, onSelect }) {
  const { selectedUnitIds, handleSelectionChange, clearSelection } =
    useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);

  const handleSelect = useCallback(() => {
    if (selectedUnitIds.length === 0) {
      toast.error("Please select a gateway");
      return;
    }

    const selectedUnits =
      networkUnitSelectorRef.current?.getSelectedUnits() || [];
    if (selectedUnits.length > 0) {
      onSelect(selectedUnits[0]);
      onOpenChange(false);
      clearSelection();
    }
  }, [selectedUnitIds, onSelect, onOpenChange, clearSelection]);

  const handleCancel = useCallback(() => {
    clearSelection();
    onOpenChange(false);
  }, [clearSelection, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select DALI Gateway</DialogTitle>
          <DialogDescription>
            Choose a network unit to use as DALI gateway.
          </DialogDescription>
        </DialogHeader>

        <NetworkUnitSelector
          selectedUnitIds={selectedUnitIds}
          onSelectionChange={handleSelectionChange}
          maxSelection={1}
          title="Network Units"
          height="h-96"
          ref={networkUnitSelectorRef}
        />

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={selectedUnitIds.length === 0}
          >
            Select Gateway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
