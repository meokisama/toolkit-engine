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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectDetail } from "@/contexts/project-detail-context";
import {
  OBJECT_TYPES,
  AC_POWER_VALUES,
  AC_FAN_SPEED_VALUES,
  AC_MODE_VALUES,
  AC_SWING_VALUES,
  AC_POWER_LABELS,
  AC_FAN_SPEED_LABELS,
  AC_MODE_LABELS,
  AC_SWING_LABELS,
} from "@/constants";
import { Plus, Trash2, Lightbulb, Wind, Blinds, Sun } from "lucide-react";

export function SceneDialog({
  open,
  onOpenChange,
  scene = null,
  mode = "create",
}) {
  const {
    selectedProject,
    projectItems,
    createItem,
    updateItem,
    setActiveTab,
  } = useProjectDetail();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [sceneItems, setSceneItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (mode === "edit" && scene) {
        setFormData({
          name: scene.name || "",
          description: scene.description || "",
        });
        loadSceneItems(scene.id);
      } else {
        setFormData({
          name: "",
          description: "",
        });
        setSceneItems([]);
      }
      setErrors({});
    }
  }, [open, mode, scene]);

  const loadSceneItems = async (sceneId) => {
    try {
      const items = await window.electronAPI.scene.getItemsWithDetails(sceneId);
      setSceneItems(items);
    } catch (error) {
      console.error("Failed to load scene items:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const addItemToScene = async (itemType, itemId, itemValue = null) => {
    if (mode === "edit" && scene) {
      try {
        await window.electronAPI.scene.addItem(
          scene.id,
          itemType,
          itemId,
          itemValue
        );
        await loadSceneItems(scene.id);
      } catch (error) {
        console.error("Failed to add item to scene:", error);
      }
    } else {
      // For create mode, add to local state
      const item = getItemDetails(itemType, itemId);
      if (item) {
        const newSceneItem = {
          id: Date.now(), // Temporary ID for create mode
          item_type: itemType,
          item_id: itemId,
          item_value: itemValue,
          item_name: item.name,
          item_address: item.address,
          item_description: item.description,
          object_type: item.object_type,
        };
        setSceneItems((prev) => [...prev, newSceneItem]);
      }
    }
  };

  const removeItemFromScene = async (sceneItemId) => {
    if (mode === "edit" && scene) {
      try {
        await window.electronAPI.scene.removeItem(sceneItemId);
        await loadSceneItems(scene.id);
      } catch (error) {
        console.error("Failed to remove item from scene:", error);
      }
    } else {
      // For create mode, remove from local state
      setSceneItems((prev) => prev.filter((item) => item.id !== sceneItemId));
    }
  };

  const updateSceneItemValue = async (sceneItemId, itemValue) => {
    if (mode === "edit" && scene) {
      try {
        await window.electronAPI.scene.updateItemValue(sceneItemId, itemValue);
        await loadSceneItems(scene.id);
      } catch (error) {
        console.error("Failed to update scene item value:", error);
      }
    } else {
      // For create mode, update local state
      setSceneItems((prev) =>
        prev.map((item) =>
          item.id === sceneItemId ? { ...item, item_value: itemValue } : item
        )
      );
    }
  };

  const getItemDetails = (itemType, itemId) => {
    const items = projectItems[itemType] || [];
    return items.find((item) => item.id === itemId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    setLoading(true);
    try {
      if (mode === "edit" && scene) {
        await updateItem("scene", scene.id, formData);
      } else {
        // Create new scene
        const newScene = await createItem("scene", formData);

        // Add all scene items
        for (const sceneItem of sceneItems) {
          await window.electronAPI.scene.addItem(
            newScene.id,
            sceneItem.item_type,
            sceneItem.item_id,
            sceneItem.item_value
          );
        }

        // Switch to scene tab to show the newly created scene
        setActiveTab("scene");
      }
      onOpenChange(false);

      // Reset form data after successful creation
      setFormData({
        name: "",
        description: "",
      });
      setSceneItems([]);
      setErrors({});
    } catch (error) {
      console.error("Failed to save scene:", error);
    } finally {
      setLoading(false);
    }
  };

  const getValueOptions = (objectType) => {
    switch (objectType) {
      case OBJECT_TYPES.AC_POWER:
        return Object.entries(AC_POWER_LABELS).map(([value, label]) => ({
          value,
          label,
        }));
      case OBJECT_TYPES.AC_FAN_SPEED:
        return Object.entries(AC_FAN_SPEED_LABELS).map(([value, label]) => ({
          value,
          label,
        }));
      case OBJECT_TYPES.AC_MODE:
        return Object.entries(AC_MODE_LABELS).map(([value, label]) => ({
          value,
          label,
        }));
      case OBJECT_TYPES.AC_SWING:
        return Object.entries(AC_SWING_LABELS).map(([value, label]) => ({
          value,
          label,
        }));
      case OBJECT_TYPES.AC_TEMPERATURE:
        return Array.from({ length: 21 }, (_, i) => ({
          value: (i + 16).toString(),
          label: `${i + 16}°C`,
        }));
      default:
        return [];
    }
  };

  const renderValueControl = (sceneItem) => {
    const options = getValueOptions(sceneItem.object_type);

    // For lighting items, always use number input for brightness (0-100)
    if (sceneItem.item_type === "lighting") {
      return (
        <div className="relative">
          <Sun className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="number"
            min="0"
            max="100"
            value={sceneItem.item_value || "100"}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === "") {
                updateSceneItemValue(sceneItem.id, "100");
              } else {
                const value = Math.min(
                  100,
                  Math.max(0, parseInt(inputValue) || 0)
                );
                updateSceneItemValue(sceneItem.id, value.toString());
              }
            }}
            className="w-32 pl-8 font-semibold"
          />
        </div>
      );
    }

    // For aircon items, use select dropdown
    if (options.length > 0) {
      return (
        <Select
          value={sceneItem.item_value || ""}
          onValueChange={(value) => updateSceneItemValue(sceneItem.id, value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For other items (curtain), use generic number input
    return (
      <Input
        type="number"
        value={sceneItem.item_value || ""}
        onChange={(e) => updateSceneItemValue(sceneItem.id, e.target.value)}
        placeholder="Value"
        className="w-32"
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Scene" : "Create New Scene"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the scene details and manage scene items."
              : "Create a new scene and add items from lighting, aircon, and curtain sections."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Scene Basic Info */}
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-right pl-1">
                  Name *
                </Label>
                <div className="col-span-5">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter scene name"
                    className={errors.name ? "border-red-500" : ""}
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description" className="text-right pl-1">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="col-span-5"
                  placeholder="Enter description"
                />
              </div>
            </div>

            {/* Scene Items Management */}
            <div className="space-y-4">
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Scene Items</h3>
                <p className="text-sm text-muted-foreground">
                  Add items from the right panel. You can set values for each
                  item if applicable.
                </p>
              </div>

              {/* Two-column layout for Current Items and Add Items */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current Scene Items - Left Side */}
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-sm">Current Items</CardTitle>
                    <Badge variant="secondary">{sceneItems.length} items</Badge>
                  </CardHeader>
                  <CardContent>
                    {sceneItems.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {sceneItems.map((sceneItem) => (
                          <div
                            key={sceneItem.id}
                            className="flex items-center justify-between p-2 border rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              {sceneItem.item_type === "lighting" && (
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                              )}
                              {sceneItem.item_type === "aircon" && (
                                <Wind className="h-4 w-4 text-blue-500" />
                              )}
                              {sceneItem.item_type === "curtain" && (
                                <Blinds className="h-4 w-4 text-green-500" />
                              )}
                              <div>
                                <div className="font-medium text-sm">
                                  {sceneItem.item_name ||
                                    `${sceneItem.item_type} ${sceneItem.item_address}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Address: {sceneItem.item_address}
                                  {sceneItem.object_type &&
                                    ` | ${sceneItem.object_type}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {(sceneItem.object_type ||
                                sceneItem.item_type === "lighting") &&
                                renderValueControl(sceneItem)}
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  removeItemFromScene(sceneItem.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <p className="text-sm">No items in scene yet</p>
                        <p className="text-xs">
                          Add items from the right panel
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Add Items to Scene - Right Side */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Available Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="lighting" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="lighting">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Lighting
                        </TabsTrigger>
                        <TabsTrigger value="aircon">
                          <Wind className="h-4 w-4 mr-2" />
                          Aircon
                        </TabsTrigger>
                        <TabsTrigger value="curtain">
                          <Blinds className="h-4 w-4 mr-2" />
                          Curtain
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="lighting" className="space-y-2">
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                          {projectItems.lighting?.length > 0 ? (
                            projectItems.lighting
                              .filter(
                                (item) =>
                                  !sceneItems.some(
                                    (si) =>
                                      si.item_type === "lighting" &&
                                      si.item_id === item.id
                                  )
                              )
                              .map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 border rounded-lg"
                                >
                                  <div>
                                    <div className="font-medium text-sm">
                                      {item.name || `Group ${item.address}`}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Address: {item.address}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      addItemToScene("lighting", item.id, "100")
                                    }
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No lighting items available
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="aircon" className="space-y-2">
                        <div className="max-h-80 overflow-y-auto space-y-2">
                          {projectItems.aircon?.length > 0 ? (
                            projectItems.aircon
                              .filter(
                                (item) =>
                                  !sceneItems.some(
                                    (si) =>
                                      si.item_type === "aircon" &&
                                      si.item_id === item.id
                                  )
                              )
                              .map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 border rounded"
                                >
                                  <div>
                                    <div className="font-medium text-sm">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Address: {item.address} |{" "}
                                      {item.object_type}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      addItemToScene("aircon", item.id)
                                    }
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No aircon items available
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="curtain" className="space-y-2">
                        <div className="max-h-80 overflow-y-auto space-y-2">
                          {projectItems.curtain?.length > 0 ? (
                            projectItems.curtain
                              .filter(
                                (item) =>
                                  !sceneItems.some(
                                    (si) =>
                                      si.item_type === "curtain" &&
                                      si.item_id === item.id
                                  )
                              )
                              .map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-2 border rounded"
                                >
                                  <div>
                                    <div className="font-medium text-sm">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Address: {item.address}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      addItemToScene("curtain", item.id)
                                    }
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No curtain items available
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim() || errors.name}
            >
              {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
