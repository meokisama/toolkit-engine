import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TimePicker } from "@/components/ui/time-picker";
import { Clock, Calendar, Plus, X } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function ScheduleDialog({
  open,
  onOpenChange,
  schedule = null,
  mode = "create",
}) {
  const {
    selectedProject,
    projectItems,
    createItem,
    updateItem,
    setActiveTab,
    loadTabData,
    loadedTabs,
  } = useProjectDetail();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    time: "",
    days: [],
  });
  const [timeDate, setTimeDate] = useState(
    new Date(new Date().setHours(0, 0, 0, 0))
  );
  const [errors, setErrors] = useState({});
  const [scheduleScenes, setScheduleScenes] = useState([]);
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
          parsedDays =
            typeof schedule.days === "string"
              ? JSON.parse(schedule.days)
              : schedule.days || [];
        } catch (e) {
          parsedDays = [];
        }

        setFormData({
          name: schedule.name || "",
          description: schedule.description || "",
          time: schedule.time || "",
          days: parsedDays,
        });
        setTimeDate(timeStringToDate(schedule.time || ""));

        // Load schedule scenes
        loadScheduleScenes(schedule.id);
      } else {
        setFormData({
          name: "",
          description: "",
          time: "",
          days: [],
        });
        setTimeDate(new Date(new Date().setHours(0, 0, 0, 0)));
        setScheduleScenes([]);
        setOriginalScheduleScenes([]);
      }
      setErrors({});

      // Load scene data if not already loaded
      if (selectedProject && !loadedTabs.has("scene")) {
        loadTabData(selectedProject.id, "scene");
      }
    }
  }, [open, mode, schedule, selectedProject, loadedTabs, loadTabData]);

  const loadScheduleScenes = async (scheduleId) => {
    try {
      const scenes = await window.electronAPI.schedule.getScenesWithDetails(
        scheduleId
      );
      setScheduleScenes(scenes);
      setOriginalScheduleScenes([...scenes]);
    } catch (error) {
      console.error("Failed to load schedule scenes:", error);
      setScheduleScenes([]);
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
      days: prev.days.includes(dayKey)
        ? prev.days.filter((d) => d !== dayKey)
        : [...prev.days, dayKey],
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

  const addSceneToSchedule = useCallback(
    (scene) => {
      const isAlreadyAdded = scheduleScenes.some(
        (ss) => ss.scene_id === scene.id
      );
      if (isAlreadyAdded) {
        toast.error("Scene is already added to this schedule");
        return;
      }

      const newScheduleScene = {
        id: mode === "edit" ? `temp_${Date.now()}` : Date.now(),
        scene_id: scene.id,
        scene_name: scene.name,
        scene_address: scene.address,
        scene_description: scene.description,
      };
      setScheduleScenes((prev) => [...prev, newScheduleScene]);
    },
    [scheduleScenes, mode]
  );

  const removeSceneFromSchedule = useCallback((scheduleSceneId) => {
    setScheduleScenes((prev) => prev.filter((ss) => ss.id !== scheduleSceneId));
  }, []);

  const applyScheduleScenesChanges = async (scheduleId) => {
    // Find scenes to remove (in original but not in current)
    const scenesToRemove = originalScheduleScenes.filter(
      (original) =>
        !scheduleScenes.find((current) => current.id === original.id)
    );

    // Find scenes to add (in current but not in original, or have temp IDs)
    const scenesToAdd = scheduleScenes.filter(
      (current) =>
        !originalScheduleScenes.find(
          (original) => original.id === current.id
        ) || current.id.toString().startsWith("temp_")
    );

    // Remove scenes
    for (const scene of scenesToRemove) {
      await window.electronAPI.schedule.removeScene(scene.id);
    }

    // Add new scenes
    for (const scene of scenesToAdd) {
      await window.electronAPI.schedule.addScene(scheduleId, scene.scene_id);
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

        // Add all schedule scenes
        for (const scheduleScene of scheduleScenes) {
          await window.electronAPI.schedule.addScene(
            newSchedule.id,
            scheduleScene.scene_id
          );
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
        days: [],
      });
      setTimeDate(new Date(new Date().setHours(0, 0, 0, 0)));
      setScheduleScenes([]);
      setOriginalScheduleScenes([]);
      toast.success(
        mode === "edit"
          ? "Schedule updated successfully"
          : "Schedule created successfully"
      );
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast.error("Failed to save schedule");
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

  // Available scenes (not already added to schedule)
  const availableScenes = useMemo(() => {
    return (projectItems.scene || []).filter(
      (scene) => !scheduleScenes.some((ss) => ss.scene_id === scene.id)
    );
  }, [projectItems.scene, scheduleScenes]);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Schedule" : "Create New Schedule"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the schedule details and manage scenes."
              : "Create a new schedule with time, days, and scenes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter schedule name"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time *
                  </Label>
                  <div
                    className={
                      errors.time
                        ? "border border-destructive rounded-md p-2"
                        : ""
                    }
                  >
                    <TimePicker
                      date={timeDate}
                      setDate={handleTimeChange}
                      showSeconds={false}
                    />
                  </div>
                  {errors.time && (
                    <p className="text-sm text-destructive">{errors.time}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Days Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Days of Week *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.key}
                        checked={formData.days.includes(day.key)}
                        onCheckedChange={() => handleDayToggle(day.key)}
                      />
                      <Label htmlFor={day.key} className="text-sm font-normal">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.days && (
                  <p className="text-sm text-destructive">{errors.days}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Schedule Scenes Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Schedule Scenes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Schedule Scenes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {scheduleScenes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No scenes added to this schedule.</p>
                      <p className="text-sm">
                        Add scenes from the available list.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scheduleScenes.map((scheduleScene) => (
                        <div
                          key={scheduleScene.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {scheduleScene.scene_name}
                            </p>
                            {scheduleScene.scene_address && (
                              <p className="text-xs text-muted-foreground">
                                Address: {scheduleScene.scene_address}
                              </p>
                            )}
                            {scheduleScene.scene_description && (
                              <p className="text-xs text-muted-foreground">
                                {scheduleScene.scene_description}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeSceneFromSchedule(scheduleScene.id)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Available Scenes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Scenes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {availableScenes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No available scenes.</p>
                      <p className="text-sm">
                        All scenes are already added or no scenes exist.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableScenes.map((scene) => (
                        <div
                          key={scene.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{scene.name}</p>
                            {scene.address && (
                              <p className="text-xs text-muted-foreground">
                                Address: {scene.address}
                              </p>
                            )}
                            {scene.description && (
                              <p className="text-xs text-muted-foreground">
                                {scene.description}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addSceneToSchedule(scene)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "edit"
                ? "Update Schedule"
                : "Create Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
