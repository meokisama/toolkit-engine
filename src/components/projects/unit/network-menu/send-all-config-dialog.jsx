"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Settings,
  Play,
  Calendar,
  GitCompare,
  Network,
  ChevronsUpDown,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export function SendAllConfigDialog({
  open,
  onOpenChange,
  units = [],
  selectedUnits = [],
}) {
  const [selectedTargetUnits, setSelectedTargetUnits] = useState([]);
  const [configTypes, setConfigTypes] = useState({
    scenes: true,
    schedules: true,
    multiScenes: true,
    knx: true,
    curtain: true,
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Initialize selected units when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTargetUnits(selectedUnits.length > 0 ? selectedUnits : []);
      setResults([]);
      setShowResults(false);
      setProgress(0);
      setCurrentOperation("");
    }
  }, [open, selectedUnits]);

  const handleUnitSelection = useCallback((unit, checked) => {
    setSelectedTargetUnits((prev) => {
      if (checked) {
        return [...prev, unit];
      } else {
        return prev.filter((u) => u.ip_address !== unit.ip_address);
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedTargetUnits(units);
  }, [units]);

  const handleSelectNone = useCallback(() => {
    setSelectedTargetUnits([]);
  }, []);

  const handleConfigTypeChange = useCallback((type, checked) => {
    setConfigTypes((prev) => ({
      ...prev,
      [type]: checked,
    }));
  }, []);

  const getProjectConfigurations = async () => {
    try {
      const projectId = localStorage.getItem("currentProjectId");
      if (!projectId) {
        throw new Error("No project selected");
      }

      const configs = {};

      if (configTypes.scenes) {
        configs.scenes = await window.electronAPI.scenes.getAll(projectId);
      }
      if (configTypes.schedules) {
        configs.schedules = await window.electronAPI.schedules.getAll(
          projectId
        );
      }
      if (configTypes.multiScenes) {
        configs.multiScenes = await window.electronAPI.multiScenes.getAll(
          projectId
        );
      }
      if (configTypes.knx) {
        configs.knx = await window.electronAPI.knx.getAll(projectId);
      }
      if (configTypes.curtain) {
        configs.curtain = await window.electronAPI.curtain.getAll(projectId);
      }

      return configs;
    } catch (error) {
      console.error("Failed to get project configurations:", error);
      throw error;
    }
  };

  const sendConfigToUnit = async (unit, configType, configData) => {
    try {
      switch (configType) {
        case "scenes":
          for (const scene of configData) {
            await window.electronAPI.rcuController.setupScene(
              unit.ip_address,
              unit.id_can,
              {
                sceneIndex: scene.calculatedIndex ?? 0,
                sceneName: scene.name,
                sceneAddress: scene.address,
                sceneItems: scene.items || [],
              }
            );
          }
          break;

        case "schedules":
          for (const schedule of configData) {
            const sceneAddresses = schedule.scenes?.map((s) => s.address) || [];
            await window.electronAPI.schedule.send({
              unitIp: unit.ip_address,
              canId: unit.id_can,
              scheduleIndex: schedule.calculatedIndex ?? 0,
              enabled: schedule.enabled ?? true,
              weekDays: schedule.week_days || [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
              ],
              hour: schedule.hour || 0,
              minute: schedule.minute || 0,
              sceneAddresses,
            });
          }
          break;

        case "multiScenes":
          for (const multiScene of configData) {
            const sceneAddresses =
              multiScene.scenes?.map((s) => s.address) || [];
            await window.electronAPI.rcuController.setupMultiScene(
              unit.ip_address,
              unit.id_can,
              {
                multiSceneIndex: multiScene.calculatedIndex ?? 0,
                multiSceneName: multiScene.name,
                multiSceneAddress: multiScene.address,
                multiSceneType: multiScene.type,
                sceneAddresses,
              }
            );
          }
          break;

        case "knx":
          for (const knx of configData) {
            // Get RCU group from lighting items
            const lightingItems = await window.electronAPI.lighting.getAll(
              localStorage.getItem("currentProjectId")
            );
            const rcuGroup = lightingItems.find(
              (item) => item.id === knx.rcu_group_id
            );

            if (rcuGroup) {
              await window.electronAPI.rcuController.setKnxConfig(
                unit.ip_address,
                unit.id_can,
                {
                  address: knx.address,
                  type: knx.type,
                  factor: knx.factor || 1,
                  feedback: knx.feedback || 0,
                  rcuGroup: rcuGroup.address,
                  knxSwitchGroup: knx.knx_switch_group || "",
                  knxDimmingGroup: knx.knx_dimming_group || "",
                  knxValueGroup: knx.knx_value_group || "",
                }
              );
            }
          }
          break;

        case "curtain":
          for (const curtain of configData) {
            // Get lighting groups for curtain
            const lightingItems = await window.electronAPI.lighting.getAll(
              localStorage.getItem("currentProjectId")
            );
            const openGroup = lightingItems.find(
              (item) => item.id === curtain.open_group_id
            );
            const closeGroup = lightingItems.find(
              (item) => item.id === curtain.close_group_id
            );
            const stopGroup = lightingItems.find(
              (item) => item.id === curtain.stop_group_id
            );

            if (openGroup && closeGroup) {
              await window.electronAPI.rcuController.setCurtainConfig(
                unit.ip_address,
                unit.id_can,
                {
                  index: curtain.calculatedIndex ?? 0,
                  address: parseInt(curtain.address),
                  curtainType: curtain.curtain_type_value || 1,
                  pausePeriod: curtain.pause_period || 0,
                  transitionPeriod: curtain.transition_period || 0,
                  openGroup: parseInt(openGroup.address),
                  closeGroup: parseInt(closeGroup.address),
                  stopGroup: stopGroup ? parseInt(stopGroup.address) : 0,
                }
              );
            }
          }
          break;

        default:
          throw new Error(`Unknown config type: ${configType}`);
      }

      return { success: true };
    } catch (error) {
      console.error(
        `Failed to send ${configType} to unit ${unit.ip_address}:`,
        error
      );
      return { success: false, error: error.message };
    }
  };

  const handleSendConfigurations = async () => {
    if (selectedTargetUnits.length === 0) {
      toast.error("Please select at least one unit");
      return;
    }

    const selectedConfigTypes = Object.entries(configTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type);

    if (selectedConfigTypes.length === 0) {
      toast.error("Please select at least one configuration type");
      return;
    }

    setLoading(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);

    try {
      setCurrentOperation("Loading project configurations...");
      const configs = await getProjectConfigurations();

      const totalOperations =
        selectedTargetUnits.length * selectedConfigTypes.length;
      let completedOperations = 0;
      const operationResults = [];

      for (const unit of selectedTargetUnits) {
        for (const configType of selectedConfigTypes) {
          const configData = configs[configType] || [];

          if (configData.length > 0) {
            setCurrentOperation(
              `Sending ${configType} to ${unit.type || "Unit"} (${
                unit.ip_address
              })...`
            );

            const result = await sendConfigToUnit(unit, configType, configData);

            operationResults.push({
              unit: `${unit.type || "Unit"} (${unit.ip_address})`,
              configType,
              success: result.success,
              message: result.success ? "Sent successfully" : result.error,
              count: configData.length,
            });
          } else {
            operationResults.push({
              unit: `${unit.type || "Unit"} (${unit.ip_address})`,
              configType,
              success: true,
              message: "No items to send",
              count: 0,
            });
          }

          completedOperations++;
          setProgress((completedOperations / totalOperations) * 100);
        }
      }

      setResults(operationResults);
      setShowResults(true);
      setCurrentOperation("Completed");

      const successCount = operationResults.filter((r) => r.success).length;
      const totalCount = operationResults.length;

      if (successCount === totalCount) {
        toast.success(
          `All configurations sent successfully to ${selectedTargetUnits.length} unit(s)`
        );
      } else {
        toast.warning(
          `${successCount}/${totalCount} operations completed successfully`
        );
      }
    } catch (error) {
      console.error("Failed to send configurations:", error);
      toast.error(`Failed to send configurations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const configTypeLabels = {
    scenes: { label: "Scenes", icon: Play },
    schedules: { label: "Schedules", icon: Calendar },
    multiScenes: { label: "Multi-Scenes", icon: GitCompare },
    knx: { label: "KNX", icon: Network },
    curtain: { label: "Curtain", icon: ChevronsUpDown },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send All Configurations
          </DialogTitle>
          <DialogDescription>
            Send all project configurations to selected network units.
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* Configuration Types Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configuration Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(configTypeLabels).map(
                  ([type, { label, icon: Icon }]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={configTypes[type]}
                        onCheckedChange={(checked) =>
                          handleConfigTypeChange(type, checked)
                        }
                      />
                      <label
                        htmlFor={type}
                        className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </label>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Target Units Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Target Units ({selectedTargetUnits.length}/{units.length})
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={loading}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectNone}
                      disabled={loading}
                    >
                      Select None
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {units.map((unit) => (
                      <div
                        key={unit.ip_address}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={unit.ip_address}
                          checked={selectedTargetUnits.some(
                            (u) => u.ip_address === unit.ip_address
                          )}
                          onCheckedChange={(checked) =>
                            handleUnitSelection(unit, checked)
                          }
                          disabled={loading}
                        />
                        <label
                          htmlFor={unit.ip_address}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {unit.type || "Unknown Unit"} ({unit.ip_address}) -
                          CAN ID: {unit.id_can}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Progress */}
            {loading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{currentOperation}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendConfigurations}
                disabled={loading || selectedTargetUnits.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Configurations
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Operation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium text-sm">
                              {result.unit}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {configTypeLabels[result.configType]?.label} (
                              {result.count} items)
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={result.success ? "default" : "destructive"}
                          >
                            {result.success ? "Success" : "Failed"}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
