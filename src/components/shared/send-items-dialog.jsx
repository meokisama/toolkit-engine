import React, { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle, XCircle, Database, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { NetworkUnitSelector, useNetworkUnitSelector } from "@/components/shared/network-unit-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SendItemsDialog({
  open,
  onOpenChange,
  items = [],
  itemType = "item", // "scene" or "schedule"
  onLoadSingleItem,
  onSendSingle,
  onSendBulk,
  validateSingleItem,
  projectItems = null, // Added to access database units
}) {
  const { selectedUnitIds, handleSelectionChange, clearSelection } = useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [singleItemData, setSingleItemData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedSourceUnitId, setSelectedSourceUnitId] = useState("all");

  const databaseUnits = projectItems?.unit || [];

  // Filter items by source unit and add calculated index
  const filteredItems = useMemo(() => {
    if (selectedSourceUnitId === "all") {
      return items.map((item, index) => ({
        ...item,
        calculatedIndex: index,
      }));
    }
    const sourceUnitIdNum = parseInt(selectedSourceUnitId);
    const filtered = items.filter((item) => item.source_unit === sourceUnitIdNum);
    return filtered.map((item, index) => ({
      ...item,
      calculatedIndex: index,
    }));
  }, [items, selectedSourceUnitId]);

  const isBulkMode = filteredItems.length > 1;

  // Load single item data when dialog opens
  useEffect(() => {
    if (open && filteredItems.length > 0) {
      if (!isBulkMode && onLoadSingleItem) {
        loadSingleItemData();
      }
      clearSelection();
      setSelectedSourceUnitId("all");
      setShowResults(false);
      setResults([]);
      setProgress(0);
      setCurrentItem("");
    }
  }, [open, filteredItems, isBulkMode, onLoadSingleItem, clearSelection]);

  const loadSingleItemData = async () => {
    if (isBulkMode || !filteredItems[0] || !onLoadSingleItem) return;

    try {
      const data = await onLoadSingleItem(filteredItems[0]);
      setSingleItemData(data);
    } catch (error) {
      console.error(`Failed to load ${itemType} data:`, error);
      toast.error(`Failed to load ${itemType} data`);
    }
  };

  const handleSendItems = async () => {
    if (selectedUnitIds.length === 0) {
      toast.error("Please select at least one network unit");
      return;
    }

    if (filteredItems.length === 0) {
      toast.error(`No ${itemType}s to send`);
      return;
    }

    // Validate single item mode
    if (!isBulkMode && validateSingleItem && !validateSingleItem(singleItemData)) {
      return;
    }

    // Get selected units from NetworkUnitSelector
    const selectedUnits = networkUnitSelectorRef.current?.getSelectedUnits() || [];

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
      await onSendSingle(filteredItems[0], singleItemData, selectedUnits);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error sending ${itemType}:`, error);
      toast.error(`Error sending ${itemType}: ${error.message}`);
    }
  };

  const handleBulkSend = async (selectedUnits) => {
    if (!onSendBulk) return;

    try {
      const operationResults = await onSendBulk(filteredItems, selectedUnits, (progress, currentItemName) => {
        setProgress(progress);
        setCurrentItem(currentItemName);
      });

      setResults(operationResults);
      setShowResults(true);

      const successCount = operationResults.filter((r) => r.success).length;
      const failCount = operationResults.filter((r) => !r.success).length;

      if (failCount === 0) {
        toast.success(`All ${itemType}s sent successfully! (${successCount} operations completed)`);
      } else {
        toast.warning(`Bulk send completed with ${successCount} successes and ${failCount} failures`);
      }
    } catch (error) {
      console.error(`Bulk send failed:`, error);
      const errorMessage = error.message || "Bulk send operation failed";
      toast.error(errorMessage);
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
            {isBulkMode ? `Send All ${ItemTypePluralCapitalized} to Network Units` : `Send ${filteredItems[0]?.name} to Network Unit`}
          </DialogTitle>
          <DialogDescription>
            {isBulkMode
              ? `Send ${filteredItems.length} ${itemTypePlural} (filtered from ${items.length} total) to selected network units.`
              : `Send ${itemType} "${filteredItems[0]?.name}" configuration to a network unit.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Source Unit Filter - Only show in bulk mode and if projectItems is provided */}
          {isBulkMode && databaseUnits.length > 0 && (
            <Card>
              <CardContent className="flex gap-4">
                <Label className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Source Unit Filter
                </Label>
                <Select value={selectedSourceUnitId} onValueChange={setSelectedSourceUnitId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units ({items.length} items)</SelectItem>
                    {databaseUnits.map((unit) => {
                      const itemCount = items.filter((item) => item.source_unit === unit.id).length;
                      return (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name || unit.type || "Unnamed Unit"} ({unit.ip_address}) - {itemCount} items
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Network Units */}
          <NetworkUnitSelector
            selectedUnitIds={selectedUnitIds}
            onSelectionChange={handleSelectionChange}
            disabled={loading}
            ref={networkUnitSelectorRef}
            height="h-60"
          />

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
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Results</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{results.filter((r) => r.success).length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{results.filter((r) => !r.success).length}</span>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px]" align="end">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Detailed Results</h4>
                            <div className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>{results.filter((r) => r.success).length}</span>
                              </div>
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-3.5 w-3.5" />
                                <span>{results.filter((r) => !r.success).length}</span>
                              </div>
                            </div>
                          </div>
                          <ScrollArea className="h-80">
                            <div className="space-y-1.5 pr-3">
                              {results.map((result, index) => (
                                <div
                                  key={index}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-md ${
                                    result.success ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                                  }`}
                                >
                                  {result.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-sm font-medium truncate">{result.item || result.scene || result.schedule}</span>
                                      <span className="text-xs text-muted-foreground">→</span>
                                      <span className="text-xs text-muted-foreground truncate">{result.unit}</span>
                                    </div>
                                    {result.message && (
                                      <div
                                        className={`text-xs mt-1 ${
                                          result.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                                        }`}
                                      >
                                        {result.message}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {!showResults ? (
            <Button onClick={handleSendItems} disabled={loading || selectedUnitIds.length === 0 || filteredItems.length === 0}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isBulkMode
                ? loading
                  ? "Sending..."
                  : `Send All (${filteredItems.length} ${itemTypePlural})`
                : selectedUnitIds.length === 0
                ? `Send ${ItemTypeCapitalized}`
                : `Send ${ItemTypeCapitalized} to ${selectedUnitIds.length} Unit${selectedUnitIds.length !== 1 ? "s" : ""}`}
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
