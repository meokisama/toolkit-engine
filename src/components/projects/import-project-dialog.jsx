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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function ImportDialog({ open, onOpenChange, onImport }) {
  const [importData, setImportData] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const data = JSON.parse(text);

          // Validate import data structure
          if (!validateImportData(data)) {
            toast.error("Invalid project file format");
            return;
          }

          setImportData(data);
          setProjectName(data.project.name);
          setProjectDescription(data.project.description || "");
          toast.success("Project file loaded successfully");
        } catch (error) {
          console.error("Failed to read file:", error);
          const errorMessage = error.message || "Failed to read project file";
          toast.error(errorMessage);
        }
      };

      input.click();
    } catch (error) {
      console.error("File selection failed:", error);
      const errorMessage = error.message || "Failed to select file";
      toast.error(errorMessage);
    }
  };

  const validateImportData = (data) => {
    if (!data || typeof data !== "object") return false;
    if (!data.project || typeof data.project !== "object") return false;
    if (!data.project.name || typeof data.project.name !== "string")
      return false;
    if (!data.items || typeof data.items !== "object") return false;

    // Check if items has valid categories
    const validCategories = ["lighting", "aircon", "unit", "curtain", "scene"];
    for (const category of validCategories) {
      if (data.items[category] && !Array.isArray(data.items[category])) {
        return false;
      }
    }

    return true;
  };

  const handleImport = async () => {
    if (!importData) {
      toast.error("Please select a project file first");
      return;
    }

    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        name: projectName.trim(),
        description: projectDescription.trim(),
      };

      await onImport(projectData, importData.items);
      handleClose();
    } catch (error) {
      console.error("Import failed:", error);
      const errorMessage = error.message || "Failed to import project";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImportData(null);
    setProjectName("");
    setProjectDescription("");
    setLoading(false);
    onOpenChange(false);
  };

  const getItemsCount = () => {
    if (!importData?.items) return 0;

    return Object.values(importData.items).reduce((total, items) => {
      return total + (Array.isArray(items) ? items.length : 0);
    }, 0);
  };

  const getCategoriesInfo = () => {
    if (!importData?.items) return [];

    const categories = ["lighting", "aircon", "unit", "curtain", "scene"];
    return categories
      .map((category) => ({
        name: category,
        count: importData.items[category]?.length || 0,
      }))
      .filter((cat) => cat.count > 0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
          <DialogDescription>
            Import a project from a JSON file. You can modify the project name
            and description before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!importData ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Select a project JSON file to import
              </p>
              <Button onClick={handleFileSelect} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    File loaded successfully
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Total items: {getItemsCount()}</p>
                  {getCategoriesInfo().length > 0 && (
                    <div className="mt-1">
                      Categories:{" "}
                      {getCategoriesInfo()
                        .map((cat) => `${cat.name} (${cat.count})`)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>
                  This will create a new project with the imported data.
                </span>
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
              <Button
                onClick={handleImport}
                disabled={loading || !projectName.trim()}
              >
                {loading ? "Importing..." : "Import Project"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
