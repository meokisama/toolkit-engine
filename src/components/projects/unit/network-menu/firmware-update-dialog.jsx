import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertTriangle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

export function FirmwareUpdateDialog({
  open,
  onOpenChange,
  units = [],
  onFirmwareUpdate,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const [updateResults, setUpdateResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef(null);

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
    if (!selectedFile || units.length === 0) {
      toast.error("Please select a HEX file and ensure units are available");
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
      const totalUnits = units.length;

      for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        const unitProgress = (i / totalUnits) * 100;

        setCurrentStatus(
          `Updating firmware for ${unit.ip_address}/${unit.id_can} (${
            i + 1
          }/${totalUnits})`
        );
        setProgress(unitProgress);

        try {
          const result = await window.electronAPI.firmware.update(
            unit.ip_address,
            unit.id_can,
            hexContent,
            (fileProgress, status) => {
              const totalProgress = unitProgress + fileProgress / totalUnits;
              setProgress(Math.min(totalProgress, 100));
              setCurrentStatus(`${unit.ip_address}/${unit.id_can}: ${status}`);
            },
            unit.type // Pass unit type for board validation
          );

          results.push({
            unit: `${unit.ip_address}/${unit.id_can}`,
            success: true,
            message: result.message || "Firmware updated successfully",
          });

          toast.success(
            `Firmware updated successfully for ${unit.ip_address}/${unit.id_can}`
          );
        } catch (error) {
          console.error(
            `Firmware update failed for ${unit.ip_address}/${unit.id_can}:`,
            error
          );

          results.push({
            unit: `${unit.ip_address}/${unit.id_can}`,
            success: false,
            message: error.message || "Firmware update failed",
          });

          toast.error(
            `Firmware update failed for ${unit.ip_address}/${unit.id_can}: ${error.message}`
          );
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Update Firmware
          </DialogTitle>
          <DialogDescription>
            Update firmware for {units.length} selected unit
            {units.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Unit List */}
          <div>
            <Label className="text-sm font-medium">Selected Units:</Label>
            <div className="mt-2 p-3 border rounded-md bg-muted/50 max-h-32 overflow-y-auto">
              {units.map((unit, index) => (
                <div key={index} className="text-sm">
                  {unit.ip_address}/{unit.id_can} - {unit.type}
                </div>
              ))}
            </div>
          </div>

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
                  <p className="text-sm text-muted-foreground">
                    Click to select HEX file
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <span className="text-sm font-medium">
                    {selectedFile.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isUpdating}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept=".hex"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Progress */}
          {isUpdating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Progress:</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
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
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm py-1"
                  >
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{result.unit}:</span>
                    <span
                      className={
                        result.success ? "text-green-600" : "text-red-600"
                      }
                    >
                      {result.message}
                    </span>
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
          <Button
            onClick={handleUpdateFirmware}
            disabled={!selectedFile || isUpdating || units.length === 0}
          >
            {isUpdating ? "Updating..." : "Update Firmware"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
