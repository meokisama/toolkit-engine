import React, { useState, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertTriangle, CheckCircle, X, Monitor } from "lucide-react";
import { toast } from "sonner";
import { CONSTANTS } from "@/constants";
import { NetworkUnitSelector, useNetworkUnitSelector } from "@/components/shared/network-unit-selector";

// Helper function to get barcode from unit type
const getUnitBarcode = (unitType) => {
  const unitInfo = CONSTANTS.UNIT.TYPES.find((u) => u.name === unitType);
  return unitInfo ? unitInfo.barcode : null;
};

function FirmwareUpdateDialogComponent({ open, onOpenChange, onFirmwareUpdate, targetUnit = null }) {
  const { selectedUnitIds, handleSelectionChange, clearSelection } = useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [updateResults, setUpdateResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      if (!targetUnit) {
        clearSelection();
      }
      setSelectedFile(null);
      setShowResults(false);
      setUpdateResults([]);
      setProgress(0);
      setCurrentStatus("");
    }
  }, [open, clearSelection, targetUnit]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.toLowerCase().endsWith(".hex")) {
        setSelectedFile(file);
        setShowResults(false);
        setUpdateResults([]);
      } else {
        toast.error("Please select a valid HEX file");
        event.target.value = "";
      }
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setShowResults(false);
    setUpdateResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateFirmware = async () => {
    // Get units to update - either target unit or selected units from NetworkUnitSelector
    const unitsToUpdate = targetUnit ? [targetUnit] : networkUnitSelectorRef.current?.getSelectedUnits() || [];

    if (!selectedFile) {
      toast.error("Please select a HEX file");
      return;
    }

    if (unitsToUpdate.length === 0) {
      toast.error(targetUnit ? "Target unit not available" : "Please select at least one unit");
      return;
    }

    setIsUpdating(true);
    setProgress(0);
    setCurrentStatus("Starting firmware update...");
    setUpdateResults([]);
    setShowResults(false);

    try {
      const hexContent = await selectedFile.text();
      const results = [];
      const totalUnits = unitsToUpdate.length;

      for (let i = 0; i < unitsToUpdate.length; i++) {
        const unit = unitsToUpdate[i];
        const unitProgress = (i / totalUnits) * 100;

        setCurrentStatus(`Updating firmware for ${unit.ip_address}/${unit.id_can} (${i + 1}/${totalUnits})`);
        setProgress(unitProgress);

        try {
          // Get barcode from unit type for firmware validation
          const unitBarcode = getUnitBarcode(unit.type);

          const result = await window.electronAPI.firmware.update(
            unit.ip_address,
            unit.id_can,
            hexContent,
            (fileProgress, status) => {
              const totalProgress = unitProgress + fileProgress / totalUnits;
              setProgress(Math.min(totalProgress, 100));
              setCurrentStatus(`${unit.ip_address}/${unit.id_can}: ${status}`);
            },
            unitBarcode // Pass unit barcode for board validation
          );

          results.push({
            unit: `${unit.ip_address}/${unit.id_can}`,
            success: true,
            message: result.message || "Firmware updated successfully",
          });

          toast.success(`Firmware updated successfully for ${unit.ip_address}/${unit.id_can}`);
        } catch (error) {
          console.error(`Firmware update failed for ${unit.ip_address}/${unit.id_can}:`, error);

          results.push({
            unit: `${unit.ip_address}/${unit.id_can}`,
            success: false,
            message: error.message || "Firmware update failed",
          });

          toast.error(`Firmware update failed for ${unit.ip_address}/${unit.id_can}: ${error.message}`);
        }
      }

      setProgress(100);
      setCurrentStatus("Firmware update completed");
      setUpdateResults(results);
      setShowResults(true);

      // Call the callback if provided
      if (onFirmwareUpdate) {
        onFirmwareUpdate(results);
      }
    } catch (error) {
      console.error("Firmware update error:", error);
      setCurrentStatus("Firmware update failed");
      toast.error(`Firmware update failed: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      setSelectedFile(null);
      setProgress(0);
      setCurrentStatus("");
      setUpdateResults([]);
      setShowResults(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    }
  };

  const successCount = updateResults.filter((r) => r.success).length;
  const failureCount = updateResults.filter((r) => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Update Firmware
          </DialogTitle>
          <DialogDescription>
            {targetUnit ? `Update firmware for unit ${targetUnit.ip_address}/${targetUnit.id_can}` : "Update firmware for selected network units"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Network Units - only show when no target unit */}
          {!targetUnit && (
            <NetworkUnitSelector
              selectedUnitIds={selectedUnitIds}
              onSelectionChange={handleSelectionChange}
              disabled={isUpdating}
              ref={networkUnitSelectorRef}
              height="h-40"
            />
          )}

          {/* Target Unit Info - show when target unit is specified */}
          {targetUnit && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Target Unit</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>IP Address: {targetUnit.ip_address}</div>
                <div>CAN ID: {targetUnit.id_can}</div>
                <div>Type: {targetUnit.type}</div>
                {targetUnit.firmware_version && <div>Current Firmware: v{targetUnit.firmware_version}</div>}
              </div>
            </div>
          )}

          {/* File Selection */}
          <div>
            <Label htmlFor="hex-file" className="text-sm font-medium">
              HEX File:
            </Label>
            <div className="mt-2">
              {!selectedFile ? (
                <div
                  onClick={handleFileUpload}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to select HEX file</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={handleRemoveFile} disabled={isUpdating}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input ref={fileInputRef} type="file" accept=".hex" onChange={handleFileSelect} className="hidden" />
            </div>
          </div>

          {/* Progress */}
          {isUpdating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Progress:</Label>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{currentStatus}</p>
            </div>
          )}

          {/* Results */}
          {showResults && updateResults.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Update Results:</Label>
              <div className="space-y-2">
                {successCount > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Successfully updated firmware for {successCount} unit
                      {successCount !== 1 ? "s" : ""}
                    </AlertDescription>
                  </Alert>
                )}
                {failureCount > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to update firmware for {failureCount} unit
                      {failureCount !== 1 ? "s" : ""}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/50">
                {updateResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm py-1">
                    {result.success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />}
                    <span className="font-medium">{result.unit}:</span>
                    <span className={result.success ? "text-green-600" : "text-red-600"}>{result.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            {showResults ? "Close" : "Cancel"}
          </Button>
          <Button onClick={handleUpdateFirmware} disabled={!selectedFile || isUpdating || (!targetUnit && selectedUnitIds.length === 0)}>
            {isUpdating ? "Updating..." : "Update Firmware"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Memoized export for optimal performance
export const FirmwareUpdateDialog = memo(FirmwareUpdateDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.onFirmwareUpdate === nextProps.onFirmwareUpdate &&
    prevProps.targetUnit?.id === nextProps.targetUnit?.id
  );
});
