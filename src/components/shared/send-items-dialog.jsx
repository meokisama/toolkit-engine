import React, { useState, useEffect, useRef } from "react";
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
import { toast } from "sonner";
import { Send, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  NetworkUnitSelector,
  useNetworkUnitSelector,
} from "@/components/shared/network-unit-selector";

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
  const { selectedUnitIds, handleSelectionChange, clearSelection } =
    useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [singleItemData, setSingleItemData] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const isBulkMode = items.length > 1;

  // Load single item data when dialog opens
  useEffect(() => {
    if (open && items.length > 0) {
      if (!isBulkMode && onLoadSingleItem) {
        loadSingleItemData();
      }
      clearSelection();
      setShowResults(false);
      setResults([]);
      setProgress(0);
      setCurrentItem("");
    }
  }, [open, items, isBulkMode, onLoadSingleItem, clearSelection]);

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
    if (
      !isBulkMode &&
      validateSingleItem &&
      !validateSingleItem(singleItemData)
    ) {
      return;
    }

    // Get selected units from NetworkUnitSelector
    const selectedUnits =
      networkUnitSelectorRef.current?.getSelectedUnits() || [];

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
  const ItemTypeCapitalized =
    itemType.charAt(0).toUpperCase() + itemType.slice(1);
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
                          borderLeftColor: result.success
                            ? "#22c55e"
                            : "#ef4444",
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
            disabled={loading}
          >
            Cancel
          </Button>
          {!showResults ? (
            <Button
              onClick={handleSendItems}
              disabled={loading || selectedUnitIds.length === 0}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isBulkMode
                ? loading
                  ? "Sending..."
                  : `Send All (${items.length} ${itemTypePlural})`
                : selectedUnitIds.length === 0
                  ? `Send ${ItemTypeCapitalized}`
                  : `Send ${ItemTypeCapitalized} to ${selectedUnitIds.length
                  } Unit${selectedUnitIds.length !== 1 ? "s" : ""}`}
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
