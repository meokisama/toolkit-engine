import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import {
  Network,
  Scan,
  Wifi,
  CircleCheck,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { udpScanner } from "@/services/udp";

export const NetworkUnitSelector = React.forwardRef(
  function NetworkUnitSelector(
    {
      selectedUnitIds = [],
      onSelectionChange,
      disabled = false,
      className = "",
      title = "Units",
      height = "h-60",
      maxSelection = null,
    },
    ref
  ) {
    const [networkUnits, setNetworkUnits] = useState([]);
    const [scanLoading, setScanLoading] = useState(false);

    // Auto-load cached network units on mount
    useEffect(() => {
      const cachedUnits = udpScanner.getLastScanResults();
      if (cachedUnits.length > 0 && udpScanner.isCacheValid()) {
        setNetworkUnits(cachedUnits);
        console.log(`Auto-loaded ${cachedUnits.length} cached network units`);
      } else {
        setNetworkUnits([]);
      }
    }, []);

    // Handle network scan
    const handleScanNetwork = async () => {
      setScanLoading(true);
      try {
        toast.info("Scanning network units...");

        const discoveredUnits = await udpScanner.getNetworkUnits(true);
        setNetworkUnits(discoveredUnits);

        // Clear selection when new units are discovered
        if (onSelectionChange) {
          onSelectionChange([]);
        }

        if (discoveredUnits.length > 0) {
          toast.success(`Found ${discoveredUnits.length} unit(s) on network`);
        } else {
          toast.warning("No units found on network");
        }
      } catch (error) {
        console.error("Failed to scan network:", error);
        toast.error("Failed to scan network: " + error.message);
      } finally {
        setScanLoading(false);
      }
    };

    // Handle unit selection toggle
    const handleUnitToggle = useCallback(
      (unitId, checked) => {
        if (!onSelectionChange) return;

        let newSelection;
        if (checked) {
          // Check maxSelection limit
          if (maxSelection && selectedUnitIds.length >= maxSelection) {
            toast.warning(`Maximum ${maxSelection} unit(s) can be selected`);
            return;
          }
          newSelection = [...selectedUnitIds, unitId];
        } else {
          newSelection = selectedUnitIds.filter((id) => id !== unitId);
        }

        onSelectionChange(newSelection);
      },
      [selectedUnitIds, onSelectionChange, maxSelection]
    );

    // Handle select all units
    const handleSelectAll = useCallback(() => {
      if (!onSelectionChange) return;
      let allUnitIds = networkUnits.map((unit) => unit.id);

      // Respect maxSelection limit
      if (maxSelection && allUnitIds.length > maxSelection) {
        allUnitIds = allUnitIds.slice(0, maxSelection);
        toast.warning(`Only first ${maxSelection} units selected due to limit`);
      }

      onSelectionChange(allUnitIds);
    }, [networkUnits, onSelectionChange, maxSelection]);

    // Handle select none
    const handleSelectNone = useCallback(() => {
      if (!onSelectionChange) return;
      onSelectionChange([]);
    }, [onSelectionChange]);

    // Get selected units data
    const getSelectedUnits = useCallback(() => {
      return networkUnits.filter((unit) => selectedUnitIds.includes(unit.id));
    }, [networkUnits, selectedUnitIds]);

    // Get all units data
    const getAllUnits = useCallback(() => {
      return networkUnits;
    }, [networkUnits]);

    // Expose methods
    React.useImperativeHandle(
      ref,
      () => ({
        getSelectedUnits,
        getAllUnits,
        networkUnits,
      }),
      [getSelectedUnits, getAllUnits, networkUnits]
    );

    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4" />
              {title} ({selectedUnitIds.length} selected)
            </CardTitle>
            <div className="flex items-center gap-2">
              {networkUnits.length > 0 && (
                <>
                  <Button
                    onClick={handleSelectAll}
                    disabled={
                      disabled ||
                      selectedUnitIds.length === networkUnits.length ||
                      (maxSelection && selectedUnitIds.length >= maxSelection)
                    }
                    size="sm"
                    variant="outline"
                  >
                    <CheckSquare className="h-4 w-4" />
                    {maxSelection
                      ? `Select ${Math.min(maxSelection, networkUnits.length)}`
                      : "Select All"}
                  </Button>
                  <Button
                    onClick={handleSelectNone}
                    disabled={disabled || selectedUnitIds.length === 0}
                    size="sm"
                    variant="outline"
                  >
                    <Square className="h-4 w-4" />
                    Select None
                  </Button>
                </>
              )}
              <Button
                onClick={handleScanNetwork}
                disabled={scanLoading || disabled}
                size="sm"
                variant="outline"
              >
                {scanLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Scan className="h-4 w-4" />
                )}
                {scanLoading ? "Scanning..." : "Scan Network"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className={height}>
            {networkUnits.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No network units found.</p>
                <p className="text-sm">
                  Click "Scan Network" to discover units on your network.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                {networkUnits.map((unit) => (
                  <CheckboxPrimitive.Root
                    key={unit.id}
                    checked={selectedUnitIds.includes(unit.id)}
                    onCheckedChange={(checked) =>
                      handleUnitToggle(unit.id, checked)
                    }
                    disabled={disabled}
                    className="relative ring-[1px] ring-border rounded-lg px-4 py-3 text-start text-muted-foreground data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:text-primary flex flex-row items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Network className="h-6 w-6" />
                    <div className="space-y-1">
                      <span className="font-medium tracking-tight text-sm">
                        {unit.type || unit.unit_type || "Unknown Unit"}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        IP: {unit.ip_address}
                      </p>
                      {unit.id_can && (
                        <p className="text-xs text-muted-foreground">
                          CAN ID: {unit.id_can}
                        </p>
                      )}
                    </div>

                    <CheckboxPrimitive.Indicator className="absolute top-2 right-2">
                      <CircleCheck className="fill-primary text-primary-foreground h-4 w-4" />
                    </CheckboxPrimitive.Indicator>
                  </CheckboxPrimitive.Root>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }
);

// Hook to use with the component
export function useNetworkUnitSelector() {
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);

  const handleSelectionChange = useCallback((newSelection) => {
    setSelectedUnitIds(newSelection);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUnitIds([]);
  }, []);

  const selectAll = useCallback((allUnitIds) => {
    setSelectedUnitIds(allUnitIds);
  }, []);

  return {
    selectedUnitIds,
    handleSelectionChange,
    clearSelection,
    selectAll,
  };
}
