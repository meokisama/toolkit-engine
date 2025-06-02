import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Settings } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";

export function MultiGroupConfigDialog({
  open,
  onOpenChange,
  inputName = "",
  functionName = "",
  initialGroups = [],
  onSave = () => {},
}) {
  const { projectItems } = useProjectDetail();
  const [selectedGroups, setSelectedGroups] = useState([]);

  // Load lighting items from projectItems
  const lightingItems = useMemo(() => {
    return projectItems?.lighting || [];
  }, [projectItems]);

  // Prepare combobox options
  const lightingOptions = useMemo(() => {
    return lightingItems.map((item) => ({
      value: item.id.toString(),
      label: `${item.name || "Unnamed"} (${item.address})`,
    }));
  }, [lightingItems]);

  // Initialize selected groups
  useEffect(() => {
    if (open) {
      setSelectedGroups(initialGroups || []);
    }
  }, [open, initialGroups]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSave = () => {
    onSave(selectedGroups);
    handleClose();
  };

  const handleAddGroup = () => {
    setSelectedGroups((prev) => [...prev, { lightingId: null, value: "" }]);
  };

  const handleRemoveGroup = (index) => {
    setSelectedGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGroupChange = (index, lightingId) => {
    setSelectedGroups((prev) =>
      prev.map((group, i) => (i === index ? { ...group, lightingId } : group))
    );
  };

  const handleValueChange = (index, value) => {
    setSelectedGroups((prev) =>
      prev.map((group, i) => (i === index ? { ...group, value } : group))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
        aria-describedby="multi-group-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Multiple Group Configuration
          </DialogTitle>
          <DialogDescription id="multi-group-description">
            Configure multiple lighting groups for {inputName} - {functionName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">
                Lighting Groups
                <Badge variant="secondary" className="ml-2">
                  {selectedGroups.length} Groups
                </Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddGroup}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Group
              </Button>
            </CardHeader>
            <CardContent>
              {selectedGroups.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3 pr-4">
                    {selectedGroups.map((group, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div className="flex-1 space-y-2">
                          <Label className="text-sm font-medium">
                            Group {index + 1}
                          </Label>
                          <Combobox
                            options={lightingOptions}
                            value={group.lightingId?.toString() || ""}
                            onValueChange={(value) =>
                              handleGroupChange(
                                index,
                                value ? parseInt(value) : null
                              )
                            }
                            placeholder="Select lighting group..."
                            emptyText="No lighting found"
                          />
                        </div>
                        <div className="w-24 space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            Value
                          </Label>
                          <input
                            type="text"
                            value={group.value || ""}
                            onChange={(e) =>
                              handleValueChange(index, e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="0"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveGroup(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    No Groups Configured
                  </p>
                  <p className="text-sm mb-4">
                    Add lighting groups to configure this input function.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleAddGroup}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Group
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
