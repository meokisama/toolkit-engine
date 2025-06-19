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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { udpScanner } from "@/services/udp";
import { toast } from "sonner";
import {
  Send,
  Network,
  Loader2,
  Scan,
  Wifi,
  CircleCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function SendItemsDialog({
  open,
  onOpenChange,
  items = [],
  itemType = "item", // "scene" or "schedule"
  onLoadSingleItem,
  onSendSingle,
  onSendBulk,
  validateSingleItem,
}) {
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [singleItemData, setSingleItemData] = useState(null);
  const [networkUnits, setNetworkUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const isBulkMode = items.length > 1;

  // Load single item data and cached network units when dialog opens
  useEffect(() => {
    if (open && items.length > 0) {
      if (!isBulkMode && onLoadSingleItem) {
        loadSingleItemData();
      }
      setSelectedUnitIds([]);
      setShowResults(false);
      setResults([]);
      setProgress(0);
      setCurrentItem("");

      // Auto-load cached network units if available
      const cachedUnits = udpScanner.getLastScanResults();
      if (cachedUnits.length > 0 && udpScanner.isCacheValid()) {
        setNetworkUnits(cachedUnits);
        console.log(`Auto-loaded ${cachedUnits.length} cached network units`);
      } else {
        setNetworkUnits([]);
      }
    }
  }, [open, items, isBulkMode, onLoadSingleItem]);

  const loadSingleItemData = async () => {
    if (isBulkMode || !items[0] || !onLoadSingleItem) return;

    try {
      const data = await onLoadSingleItem(items[0]);
      setSingleItemData(data);
    } catch (error) {
      console.error(`Failed to load ${itemType} data:`, error);
      toast.error(`Failed to load ${itemType} data`);
    }
  };

  const handleScanNetwork = async () => {
    setScanLoading(true);
    try {
      toast.info("Scanning network units...");

      const discoveredUnits = await udpScanner.getNetworkUnits(true);
      setNetworkUnits(discoveredUnits);
      setSelectedUnitIds([]);

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

  const handleUnitToggle = (unitId, checked) => {
    setSelectedUnitIds((prev) =>
      checked ? [...prev, unitId] : prev.filter((id) => id !== unitId)
    );
  };

  const handleSendItems = async () => {
    if (selectedUnitIds.length === 0) {
      toast.error("Please select at least one network unit");
      return;
    }

    if (items.length === 0) {
      toast.error(`No ${itemType}s to send`);
      return;
    }

    // Validate single item mode
    if (!isBulkMode && validateSingleItem && !validateSingleItem(singleItemData)) {
      return;
    }

    const selectedUnits = networkUnits.filter((unit) =>
      selectedUnitIds.includes(unit.id)
    );

    setLoading(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);

    try {
      if (isBulkMode && onSendBulk) {
        await handleBulkSend(selectedUnits);
      } else if (!isBulkMode && onSendSingle) {
        await handleSingleSend(selectedUnits);
      }
    } catch (error) {
      console.error(`Error sending ${itemType}s:`, error);
      toast.error(`Error sending ${itemType}s: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSend = async (selectedUnits) => {
    if (!onSendSingle) return;

    try {
      await onSendSingle(items[0], singleItemData, selectedUnits);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error sending ${itemType}:`, error);
      toast.error(`Error sending ${itemType}: ${error.message}`);
    }
  };

  const handleBulkSend = async (selectedUnits) => {
    if (!onSendBulk) return;

    try {
      const operationResults = await onSendBulk(
        items,
        selectedUnits,
        (progress, currentItemName) => {
          setProgress(progress);
          setCurrentItem(currentItemName);
        }
      );

      setResults(operationResults);
      setShowResults(true);

      const successCount = operationResults.filter((r) => r.success).length;
      const failCount = operationResults.filter((r) => !r.success).length;

      if (failCount === 0) {
        toast.success(
          `All ${itemType}s sent successfully! (${successCount} operations completed)`
        );
      } else {
        toast.warning(
          `Bulk send completed with ${successCount} successes and ${failCount} failures`
        );
      }
    } catch (error) {
      console.error(`Bulk send failed:`, error);
      toast.error("Bulk send operation failed");
    } finally {
      setCurrentItem("");
    }
  };

  const handleDialogOpenChange = (newOpen) => {
    if (!loading) {
      onOpenChange(newOpen);
    }
  };

  if (items.length === 0) return null;

  const itemTypePlural = itemType + "s";
  const ItemTypeCapitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1);
  const ItemTypePluralCapitalized = ItemTypeCapitalized + "s";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {isBulkMode
              ? `Send All ${ItemTypePluralCapitalized} to Network Units`
              : `Send ${items[0].name} to Network Unit`}
          </DialogTitle>
          <DialogDescription>
            {isBulkMode
              ? `Send all ${items.length} ${itemTypePlural} to selected network units.`
              : `Send ${itemType} "${items[0].name}" configuration to a network unit.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Network Units */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network Units ({selectedUnitIds.length} selected)
                </CardTitle>
                <Button
                  onClick={handleScanNetwork}
                  disabled={scanLoading || loading}
                  size="sm"
                  variant="outline"
                >
                  {scanLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Scan className="h-4 w-4 mr-2" />
                  )}
                  {scanLoading ? "Scanning..." : "Scan Network"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
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
                        className="relative ring-[1px] ring-border rounded-lg px-4 py-3 text-start text-muted-foreground data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:text-primary flex flex-row items-center gap-3 cursor-pointer"
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

          {/* Progress for bulk mode */}
          {isBulkMode && loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Sending: {currentItem}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results for bulk mode */}
          {isBulkMode && showResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Send Results</span>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-600">
                      ✓ {results.filter((r) => r.success).length} Success
                    </span>
                    <span className="text-red-600">
                      ✗ {results.filter((r) => !r.success).length} Failed
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border-l-4"
                        style={{
                          borderLeftColor: result.success ? "#22c55e" : "#ef4444",
                        }}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {result.item || result.scene || result.schedule}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.unit}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-xs">{result.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading || scanLoading}
          >
            Cancel
          </Button>
          {!showResults ? (
            <Button
              onClick={handleSendItems}
              disabled={loading || scanLoading || selectedUnitIds.length === 0}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isBulkMode
                ? loading
                  ? "Sending..."
                  : `Send All (${items.length} ${itemTypePlural})`
                : selectedUnitIds.length === 0
                ? `Send ${ItemTypeCapitalized}`
                : `Send ${ItemTypeCapitalized} to ${selectedUnitIds.length} Unit${
                    selectedUnitIds.length !== 1 ? "s" : ""
                  }`}
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
