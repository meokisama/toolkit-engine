import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimePicker } from "@/components/custom/time-picker";
import { CircleCheck, Lightbulb } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { toast } from "sonner";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

// Helper constant for all day keys
const ALL_DAYS = DAYS_OF_WEEK.map((day) => day.key);

export function ScheduleDialog({ open, onOpenChange, schedule = null, mode = "create" }) {
  const { selectedProject, projectItems, createItem, updateItem, setActiveTab, loadTabData, loadedTabs } = useProjectDetail();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    time: "",
    days: ALL_DAYS,
    enabled: true,
    source_unit: null,
  });
  const [timeDate, setTimeDate] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const [errors, setErrors] = useState({});
  const [selectedSceneIds, setSelectedSceneIds] = useState([]);
  const [originalScheduleScenes, setOriginalScheduleScenes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper functions for time conversion
  const timeStringToDate = (timeString) => {
    if (!timeString) return new Date(new Date().setHours(0, 0, 0, 0));
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  const dateToTimeString = (date) => {
    if (!date) return "";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Reset form when dialog opens/closes or mode changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && schedule) {
        let parsedDays = [];
        try {
          parsedDays = typeof schedule.days === "string" ? JSON.parse(schedule.days) : schedule.days || [];
        } catch (e) {
          parsedDays = [];
        }

        setFormData({
          name: schedule.name || "",
          description: schedule.description || "",
          time: schedule.time || "",
          days: parsedDays,
          enabled: schedule.enabled !== undefined ? Boolean(schedule.enabled) : true,
          source_unit: schedule.source_unit || null,
        });
        setTimeDate(timeStringToDate(schedule.time || ""));

        // Load schedule scenes
        loadScheduleScenes(schedule.id);
      } else {
        setFormData({
          name: "",
          description: "",
          time: "",
          days: ALL_DAYS,
          enabled: true,
          source_unit: null,
        });
        setTimeDate(new Date(new Date().setHours(0, 0, 0, 0)));
        setSelectedSceneIds([]);
        setOriginalScheduleScenes([]);
      }
      setErrors({});

      // Load scene data if not already loaded
      if (selectedProject && !loadedTabs.has("scene")) {
        loadTabData(selectedProject.id, "scene");
      }
      // Load unit data if not already loaded
      if (selectedProject && !loadedTabs.has("unit")) {
        loadTabData(selectedProject.id, "unit");
      }
    }
  }, [open, mode, schedule, selectedProject, loadedTabs, loadTabData]);

  const loadScheduleScenes = async (scheduleId) => {
    try {
      const scenes = await window.electronAPI.schedule.getScenesWithDetails(scheduleId);
      setSelectedSceneIds(scenes.map((scene) => scene.scene_id));
      setOriginalScheduleScenes([...scenes]);
    } catch (error) {
      console.error("Failed to load schedule scenes:", error);
      setSelectedSceneIds([]);
      setOriginalScheduleScenes([]);
    }
  };

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    },
    [errors]
  );

  const handleDayToggle = useCallback((dayKey) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(dayKey) ? prev.days.filter((d) => d !== dayKey) : [...prev.days, dayKey],
    }));
  }, []);

  const handleTimeChange = useCallback(
    (newDate) => {
      setTimeDate(newDate);
      const timeString = dateToTimeString(newDate);
      setFormData((prev) => ({
        ...prev,
        time: timeString,
      }));
      // Clear time error when user changes time
      if (errors.time) {
        setErrors((prev) => ({
          ...prev,
          time: "",
        }));
      }
    },
    [errors.time, dateToTimeString]
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.time.trim()) {
      newErrors.time = "Time is required";
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.time)) {
      newErrors.time = "Time must be in HH:MM format";
    }

    if (formData.days.length === 0) {
      newErrors.days = "At least one day must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSceneToggle = useCallback((sceneId, checked) => {
    setSelectedSceneIds((prev) => {
      if (checked) {
        return [...prev, sceneId];
      } else {
        return prev.filter((id) => id !== sceneId);
      }
    });
  }, []);

  const applyScheduleScenesChanges = async (scheduleId) => {
    // Get original scene IDs
    const originalSceneIds = originalScheduleScenes.map((scene) => scene.scene_id);

    // Find scenes to remove (in original but not in current selection)
    const scenesToRemove = originalScheduleScenes.filter((original) => !selectedSceneIds.includes(original.scene_id));

    // Find scenes to add (in current selection but not in original)
    const scenesToAdd = selectedSceneIds.filter((sceneId) => !originalSceneIds.includes(sceneId));

    // Remove scenes
    for (const scene of scenesToRemove) {
      await window.electronAPI.schedule.removeScene(scene.id);
    }

    // Add new scenes
    for (const sceneId of scenesToAdd) {
      await window.electronAPI.schedule.addScene(scheduleId, sceneId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === "edit" && schedule) {
        // Update schedule basic info
        await updateItem("schedule", schedule.id, formData);

        // Apply schedule scenes changes
        await applyScheduleScenesChanges(schedule.id);
      } else {
        // Create new schedule
        const newSchedule = await createItem("schedule", formData);

        // Add all selected scenes
        for (const sceneId of selectedSceneIds) {
          await window.electronAPI.schedule.addScene(newSchedule.id, sceneId);
        }

        // Switch to schedule tab to show the newly created schedule
        setActiveTab("schedule");
      }
      onOpenChange(false);

      // Reset form data after successful creation
      setFormData({
        name: "",
        description: "",
        time: "",
        days: ALL_DAYS,
        enabled: true,
        source_unit: null,
      });
      setTimeDate(new Date(new Date().setHours(0, 0, 0, 0)));
      setSelectedSceneIds([]);
      setOriginalScheduleScenes([]);
      toast.success(mode === "edit" ? "Schedule updated successfully" : "Schedule created successfully");
    } catch (error) {
      console.error("Failed to save schedule:", error);
      if (error.message && error.message.includes("Maximum 32 schedules allowed")) {
        toast.error("Maximum 32 schedules allowed per project");
      } else {
        const errorMessage = error.message || "Failed to save schedule";
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpenChange = useCallback(
    (open) => {
      if (!open && !loading) {
        onOpenChange(false);
      }
    },
    [onOpenChange, loading]
  );

  // Get all available scenes
  const allScenes = projectItems.scene || [];

  // Get unit items for source unit selection
  const unitItems = projectItems.unit || [];
  const unitOptions = unitItems.map((unit) => ({
    value: unit.id,
    label: `${unit.type || "Unknown"}-${unit.ip_address || unit.serial_no || "N/A"}`,
  }));

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Schedule" : "Create New Schedule"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update the schedule details and manage scenes." : "Create a new schedule with time, days, and scenes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-5 gap-8">
            <div className="col-span-2 flex flex-col gap-4 justify-center">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter schedule name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_unit">Source Unit</Label>
                <Select
                  value={formData.source_unit?.toString() || "none"}
                  onValueChange={(value) => handleInputChange("source_unit", value === "none" ? null : parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default</SelectItem>
                    {unitOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 -mt-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter description (optional)"
                  className="h-10"
                />
              </div>
            </div>

            {/* Days Selection */}
            <div className="flex flex-col w-full justify-between gap-4 col-span-3">
              <div className="flex gap-4">
                <Card className="w-1/3">
                  <CardContent className="space-y-4 flex flex-col justify-center items-center">
                    <Label htmlFor="enabled" className="flex items-center gap-2">
                      Enable
                    </Label>
                    <Switch
                      id="enabled"
                      checked={formData.enabled}
                      onCheckedChange={(checked) => handleInputChange("enabled", checked)}
                      className="h-7 w-12"
                      thumbClassName="h-6 w-6 data-[state=checked]:translate-x-5"
                    />
                  </CardContent>
                </Card>
                <Card className="w-2/3">
                  <CardContent className="space-y-4 flex flex-col justify-center items-center">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      Trigger Time
                    </Label>
                    <div className={errors.time ? "border border-destructive rounded-md p-2" : ""}>
                      <TimePicker date={timeDate} setDate={handleTimeChange} showSeconds={false} />
                    </div>
                    {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent>
                  <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-2 gap-x-4">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.key} className="flex items-center space-x-2">
                        <Checkbox id={day.key} checked={formData.days.includes(day.key)} onCheckedChange={() => handleDayToggle(day.key)} />
                        <Label htmlFor={day.key} className="text-sm font-normal">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.days && <p className="text-sm text-destructive">{errors.days}</p>}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Scene Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Select Scenes</CardTitle>
              <p className="text-sm text-muted-foreground">Select the scenes you want to include in this schedule.</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
                {allScenes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No scenes available.</p>
                    <p className="text-sm">Create scenes first to add them to schedules.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-2">
                    {allScenes.map((scene) => (
                      <CheckboxPrimitive.Root
                        key={scene.id}
                        checked={selectedSceneIds.includes(scene.id)}
                        onCheckedChange={(checked) => handleSceneToggle(scene.id, checked)}
                        className="relative ring-[1px] ring-border rounded-lg px-4 py-3 text-start text-muted-foreground data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:text-primary flex flex-row items-center gap-3 cursor-pointer"
                      >
                        <Lightbulb className="h-6 w-6" />
                        <div className="space-y-1">
                          <span className="font-medium tracking-tight text-sm">{scene.name}</span>
                          {scene.address && <p className="text-xs text-muted-foreground">Address: {scene.address}</p>}
                          {scene.description && <p className="text-xs text-muted-foreground line-clamp-2">{scene.description}</p>}
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "edit" ? "Update Schedule" : "Create Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
