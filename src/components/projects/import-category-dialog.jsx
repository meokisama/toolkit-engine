import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { exportImportService } from "@/services/export-import";

export function ImportItemsDialog({ open, onOpenChange, onImport, category, onConfirm }) {
  const [importData, setImportData] = useState(null);
  const [loading, setLoading] = useState(false);

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
          let items;

          // Use exportImportService for scene parsing, fallback to local parsing for others
          if (category === 'scene') {
            items = exportImportService.parseCSVToItems(text, category);
          } else {
            items = parseCSVToItems(text, category);
          }

          if (!items || items.length === 0) {
            toast.error("No valid items found in CSV file");
            return;
          }

          setImportData(items);
          toast.success(`${items.length} items loaded successfully`);
        } catch (error) {
          console.error("Failed to read file:", error);
          toast.error(error.message || "Failed to read CSV file");
        }
      };

      input.click();
    } catch (error) {
      console.error("File selection failed:", error);
      toast.error("Failed to select file");
    }
  };

  const parseCSVToItems = (csvContent, category) => {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const items = [];

    // Validate headers based on category
    const expectedHeaders =
      category === "unit"
        ? [
          "name",
          "type",
          "serial_no",
          "ip_address",
          "id_can",
          "mode",
          "firmware_version",
          "description",
        ]
        : ["name", "address", "description"];

    const hasValidHeaders = expectedHeaders.every((header) =>
      headers.includes(header)
    );
    if (!hasValidHeaders) {
      throw new Error(
        `Invalid CSV headers for ${category} items. Expected: ${expectedHeaders.join(
          ", "
        )}`
      );
    }

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] || "";
      });

      // Validate required fields
      if (item.name && item.name.trim()) {
        items.push(item);
      }
    }

    return items;
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
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
      console.error("Import failed:", error);
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

  const getExpectedHeaders = () => {
    if (category === "unit") {
      return [
        "type",
        "serial_no",
        "ip_address",
        "id_can",
        "mode",
        "firmware_version",
        "description",
      ];
    } else if (category === "aircon") {
      return ["name", "address", "description"];
    } else if (category === "curtain") {
      return [
        "name",
        "address",
        "description",
        "object_type",
        "curtain_type",
        "open_group",
        "close_group",
        "stop_group",
      ];
    } else if (category === "scene") {
      return ["SCENE NAME", "ITEM NAME", "TYPE", "ADDRESS", "VALUE"];
    } else {
      return ["name", "address", "description", "object_type"];
    }
  };

  const categoryDisplayName =
    category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:!max-w-[600px]">
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
                <p className="text-sm text-muted-foreground mb-4">
                  Select a CSV file to import {category} items
                </p>
                <Button onClick={handleFileSelect} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Required CSV Headers
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Your CSV file must include these headers (in any order):
                  </p>
                  <div className="mt-1 font-mono text-xs bg-background rounded px-2 py-1">
                    {getExpectedHeaders().join(", ")}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    CSV file loaded successfully
                  </span>
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
                      <div
                        key={index}
                        className="font-mono text-xs bg-background rounded px-2 py-1"
                      >
                        {category === "scene"
                          ? `${item.name} (${item.items?.length || 0} items)${item.name.includes('(Part') ? ' - Auto-split' : ''}`
                          : `${item.name} ${item.address && `- ${item.address}`} ${item.type && `(${item.type})`}`
                        }
                      </div>
                    ))}
                    {importData.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {importData.length - 3} more items
                      </div>
                    )}
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
              <Button
                variant="outline"
                onClick={handleFileSelect}
                disabled={loading}
              >
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
