import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, FileText, AlertCircle, CheckCircle, Download, Info } from "lucide-react";
import { toast } from "sonner";
import { exportImportService } from "@/services/export-import";
import { getSchema } from "@/services/export-import/schemas";
import { useProjectDetail } from "@/contexts/project-detail-context";
import log from "electron-log/renderer";

export function ImportItemsDialog({ open, onOpenChange, onImport, category, onConfirm }) {
  const [importData, setImportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { projectItems } = useProjectDetail();

  const handleFileSelect = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const items = exportImportService.parseCSVToItems(text, category, null, { projectItems });

          if (!items || items.length === 0) {
            toast.error("No valid items found in CSV file");
            return;
          }

          setImportData(items);
          toast.success(`${items.length} items loaded successfully`);
        } catch (error) {
          log.error("Failed to read file:", error);
          toast.error(error.message || "Failed to read CSV file");
        }
      };

      input.click();
    } catch (error) {
      log.error("File selection failed:", error);
      toast.error("Failed to select file");
    }
  };

  const handleImport = async () => {
    if (!importData) {
      toast.error("Please select a CSV file first");
      return;
    }

    setLoading(true);
    try {
      // Use onConfirm if provided (for scene), otherwise use onImport
      if (onConfirm) {
        await onConfirm(importData);
      } else {
        await onImport(importData);
      }
      handleClose();
    } catch (error) {
      log.error("Import failed:", error);
      toast.error(`Failed to import ${category} items`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImportData(null);
    setLoading(false);
    onOpenChange(false);
  };

  const handleDownloadTemplate1 = () => {
    try {
      exportImportService.downloadSceneTemplate1();
      toast.success("Template 1 (Vertical Format) downloaded successfully");
    } catch (error) {
      log.error("Failed to download template 1:", error);
      toast.error("Failed to download template 1");
    }
  };

  const handleDownloadTemplate2 = () => {
    try {
      exportImportService.downloadSceneTemplate2();
      toast.success("Template 2 (Horizontal Format) downloaded successfully");
    } catch (error) {
      log.error("Failed to download template 2:", error);
      toast.error("Failed to download template 2");
    }
  };

  const getExpectedHeaders = () => {
    if (category === "scene") return ["SCENE NAME", "ITEM NAME", "TYPE", "ADDRESS", "VALUE"];
    const schema = getSchema(category);
    return schema ? schema.columns.map((c) => c.csv || c.key) : [];
  };

  const categoryDisplayName = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-150!">
        <DialogHeader>
          <DialogTitle>Import {categoryDisplayName} Items</DialogTitle>
          <DialogDescription>
            {category === "aircon"
              ? "Import aircon cards from a CSV file. Each row will create a card with 5 items (Power, Mode, Fan Speed, Temperature, Swing)."
              : category === "scene"
                ? "Import scenes from a CSV file. Each scene can contain multiple items with their settings."
                : `Import ${category} items from a CSV file. The CSV file should have the correct headers.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!importData ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Select a CSV file to import {category} items</p>
                <Button onClick={handleFileSelect} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
              </div>

              {category === "scene" ? (
                <div className="bg-muted/50 rounded-lg p-4 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Download Template</span>
                  </div>

                  {/* Info icon with popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full transition-colors">
                        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96" align="end">
                      <div className="space-y-3">
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-3 gap-2 font-bold border-b pb-1">
                            <span>TYPE</span>
                            <span className="col-span-2">Value điền chính xác như sau</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 border-b pb-1">
                            <span className="font-mono">LIGHTING</span>
                            <span className="col-span-2">Độ sáng (Ví dụ: 50%, hoặc 50)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 border-b pb-1">
                            <span className="font-mono">CURTAIN</span>
                            <span className="col-span-2">Open - Close - Stop</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 border-b pb-1">
                            <span className="font-mono">AC_POWER</span>
                            <span className="col-span-2">On - Off</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 border-b pb-1">
                            <span className="font-mono">AC_MODE</span>
                            <span className="col-span-2">Cool - Heat - Ventilation - Dry - Auto</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 border-b pb-1">
                            <span className="font-mono">AC_FAN_SPEED</span>
                            <span className="col-span-2">Low - Medium - High - Auto - Off</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="font-mono">AC_TEMPERATURE</span>
                            <span className="col-span-2">Nhiệt độ (Ví dụ: 25, phải là số nguyên)</span>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="text-sm text-muted-foreground mb-3">
                    <p>Download CSV templates to get started with the correct format:</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleDownloadTemplate1} variant="outline" size="sm" className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Template 1 (Vertical)
                    </Button>
                    <Button onClick={handleDownloadTemplate2} variant="outline" size="sm" className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Template 2 (Horizontal)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Required CSV Headers</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Your CSV file must include these headers (in any order):</p>
                    <div className="mt-1 font-mono text-xs bg-background rounded px-2 py-1">{getExpectedHeaders().join(", ")}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">CSV file loaded successfully</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Found {importData.length} valid items to import</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Preview</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>First few items:</p>
                  <div className="mt-2 space-y-1">
                    {importData.slice(0, 3).map((item, index) => (
                      <div key={index} className="font-mono text-xs bg-background rounded px-2 py-1">
                        {category === "scene"
                          ? `${item.name} (${item.items?.length || 0} items)${item.name.includes("(Part") ? " - Auto-split" : ""}`
                          : `${item.name} ${item.address && `- ${item.address}`} ${item.type && `(${item.type})`}`}
                      </div>
                    ))}
                    {importData.length > 3 && <div className="text-xs text-muted-foreground">... and {importData.length - 3} more items</div>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>These items will be added to the current project.</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          {importData && (
            <>
              <Button variant="outline" onClick={handleFileSelect} disabled={loading}>
                Select Different File
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading
                  ? "Importing..."
                  : category === "aircon"
                    ? `Import ${importData.length} Cards`
                    : category === "scene"
                      ? `Import ${importData.length} Scenes`
                      : `Import ${importData.length} Items`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export alias for backward compatibility
export const ImportCategoryDialog = ImportItemsDialog;
