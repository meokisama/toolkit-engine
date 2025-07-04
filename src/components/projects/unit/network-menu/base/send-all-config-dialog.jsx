"use client";

import React, { useState, useCallback, useRef } from "react";
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
  List,
} from "lucide-react";
import { toast } from "sonner";
import { useProjectDetail } from "@/contexts/project-detail-context";
import {
  NetworkUnitSelector,
  useNetworkUnitSelector,
} from "@/components/shared/network-unit-selector";

export function SendAllConfigDialog({
  open,
  onOpenChange,
  units = [],
  selectedUnits = [],
}) {
  const { selectedProject } = useProjectDetail();
  const { selectedUnitIds, handleSelectionChange, clearSelection } =
    useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);
  const [configTypes, setConfigTypes] = useState({
    scenes: true,
    schedules: true,
    multiScenes: true,
    sequences: true,
    knx: true,
    curtain: true,
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      clearSelection();
      setResults([]);
      setShowResults(false);
      setProgress(0);
      setCurrentOperation("");
    }
  }, [open, clearSelection]);

  // Handle config type toggle
  const handleConfigTypeToggle = useCallback((type, checked) => {
    setConfigTypes((prev) => ({
      ...prev,
      [type]: checked,
    }));
  }, []);

  const getProjectConfigurations = async () => {
    try {
      if (!selectedProject) {
        throw new Error("No project selected");
      }

      const configs = {};

      if (configTypes.scenes) {
        const scenes = await window.electronAPI.scene.getAll(
          selectedProject.id
        );
        // Add calculated index to scenes (same as manual send)
        configs.scenes = scenes.map((scene, index) => ({
          ...scene,
          calculatedIndex: index,
        }));
      }
      if (configTypes.schedules) {
        const schedules = await window.electronAPI.schedule.getAll(
          selectedProject.id
        );
        // Add calculated index to schedules
        configs.schedules = schedules.map((schedule, index) => ({
          ...schedule,
          calculatedIndex: index,
        }));
      }
      if (configTypes.multiScenes) {
        const multiScenes = await window.electronAPI.multiScenes.getAll(
          selectedProject.id
        );
        // Add calculated index to multi-scenes
        configs.multiScenes = multiScenes.map((multiScene, index) => ({
          ...multiScene,
          calculatedIndex: index,
        }));
      }
      if (configTypes.sequences) {
        const sequences = await window.electronAPI.sequences.getAll(
          selectedProject.id
        );
        // Add calculated index to sequences
        configs.sequences = sequences.map((sequence, index) => ({
          ...sequence,
          calculatedIndex: index,
        }));
      }
      if (configTypes.knx) {
        configs.knx = await window.electronAPI.knx.getAll(selectedProject.id);
      }
      if (configTypes.curtain) {
        const curtains = await window.electronAPI.curtain.getAll(
          selectedProject.id
        );
        // Add calculated index to curtains
        configs.curtain = curtains.map((curtain, index) => ({
          ...curtain,
          calculatedIndex: index,
        }));
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
            // Get scene items with details for each scene
            let sceneItems = [];
            try {
              sceneItems = await window.electronAPI.scene.getItemsWithDetails(
                scene.id
              );
            } catch (error) {
              console.error(
                `Failed to load items for scene ${scene.id}:`,
                error
              );
              // Skip scenes without items
              continue;
            }

            // Prepare scene items data for sending (same as manual send)
            const sceneItemsData = sceneItems.map((item) => ({
              object_value: item.object_value || 0,
              item_address: item.item_address || "0",
              item_value: item.item_value || "0",
            }));

            console.log("Sending scene to unit (Send All Config):", {
              unitIp: unit.ip_address,
              canId: unit.id_can,
              sceneIndex: scene.calculatedIndex ?? 0,
              sceneName: scene.name,
              sceneAddress: scene.address,
              sceneItems: sceneItemsData,
            });

            await window.electronAPI.rcuController.setupScene(
              unit.ip_address,
              unit.id_can,
              {
                sceneIndex: scene.calculatedIndex ?? 0,
                sceneName: scene.name,
                sceneAddress: scene.address,
                sceneItems: sceneItemsData,
              }
            );
          }
          break;

        case "schedules":
          for (const schedule of configData) {
            // Get schedule data with scenes for each schedule (same as manual send)
            let scheduleData = null;
            try {
              scheduleData = await window.electronAPI.schedule.getForSending(
                schedule.id
              );
            } catch (error) {
              console.error(
                `Failed to load data for schedule ${schedule.id}:`,
                error
              );
              // Skip schedules without data
              continue;
            }

            console.log("Sending schedule to unit (Send All Config):", {
              unitIp: unit.ip_address,
              canId: unit.id_can,
              scheduleIndex: schedule.calculatedIndex ?? 0,
              enabled: scheduleData.enabled,
              weekDays: scheduleData.parsedDays,
              hour: scheduleData.hour,
              minute: scheduleData.minute,
              sceneAddresses: scheduleData.sceneAddresses,
            });

            await window.electronAPI.schedule.send({
              unitIp: unit.ip_address,
              canId: unit.id_can,
              scheduleIndex: schedule.calculatedIndex ?? 0,
              enabled: scheduleData.enabled,
              weekDays: scheduleData.parsedDays,
              hour: scheduleData.hour,
              minute: scheduleData.minute,
              sceneAddresses: scheduleData.sceneAddresses,
            });
          }
          break;

        case "multiScenes":
          for (const multiScene of configData) {
            // Get multi-scene scenes for each multi-scene (same as manual send)
            let multiSceneScenes = [];
            try {
              multiSceneScenes = await window.electronAPI.multiScenes.getScenes(
                multiScene.id
              );
            } catch (error) {
              console.error(
                `Failed to load scenes for multi-scene ${multiScene.id}:`,
                error
              );
              // Skip multi-scenes without scenes
              continue;
            }

            // Extract scene addresses (same as manual send)
            const sceneAddresses = multiSceneScenes.map((s) => s.scene_address);

            console.log("Sending multi-scene to unit (Send All Config):", {
              unitIp: unit.ip_address,
              canId: unit.id_can,
              multiSceneIndex: multiScene.calculatedIndex ?? 0,
              multiSceneName: multiScene.name,
              multiSceneAddress: multiScene.address,
              multiSceneType: multiScene.type,
              sceneAddresses: sceneAddresses,
            });

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

        case "sequences":
          for (const sequence of configData) {
            // Get sequence multi-scenes for each sequence (same as manual send)
            let sequenceMultiScenes = [];
            try {
              sequenceMultiScenes = await window.electronAPI.sequences.getMultiScenes(
                sequence.id
              );
            } catch (error) {
              console.error(
                `Failed to load multi-scenes for sequence ${sequence.id}:`,
                error
              );
              // Skip sequences without multi-scenes
              continue;
            }

            // Extract multi-scene addresses (same as manual send)
            const multiSceneAddresses = sequenceMultiScenes.map((s) => s.multi_scene_address);

            console.log("Sending sequence to unit (Send All Config):", {
              unitIp: unit.ip_address,
              canId: unit.id_can,
              sequenceIndex: sequence.calculatedIndex ?? 0,
              sequenceName: sequence.name,
              sequenceAddress: sequence.address,
              multiSceneAddresses: multiSceneAddresses,
            });

            await window.electronAPI.rcuController.setupSequence(
              unit.ip_address,
              unit.id_can,
              {
                sequenceIndex: sequence.calculatedIndex ?? 0,
                sequenceAddress: sequence.address,
                multiSceneAddresses,
              }
            );
          }
          break;

        case "knx":
          // Get lighting items once for all KNX configs (optimization)
          const lightingItems = await window.electronAPI.lighting.getAll(
            selectedProject.id
          );

          for (const knx of configData) {
            // Get RCU group from lighting items
            const rcuGroup = lightingItems.find(
              (item) => item.id === knx.rcu_group_id
            );

            if (rcuGroup) {
              console.log("Sending KNX config to unit (Send All Config):", {
                unitIp: unit.ip_address,
                canId: unit.id_can,
                address: knx.address,
                type: knx.type,
                factor: knx.factor || 1,
                feedback: knx.feedback || 0,
                rcuGroup: rcuGroup.address,
                knxSwitchGroup: knx.knx_switch_group || "",
                knxDimmingGroup: knx.knx_dimming_group || "",
                knxValueGroup: knx.knx_value_group || "",
              });

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
          // Get lighting items once for all curtain configs (optimization)
          const curtainLightingItems = await window.electronAPI.lighting.getAll(
            selectedProject.id
          );

          for (const curtain of configData) {
            // Get lighting groups for curtain
            const openGroup = curtainLightingItems.find(
              (item) => item.id === curtain.open_group_id
            );
            const closeGroup = curtainLightingItems.find(
              (item) => item.id === curtain.close_group_id
            );
            const stopGroup = curtainLightingItems.find(
              (item) => item.id === curtain.stop_group_id
            );

            if (openGroup && closeGroup) {
              // Use curtain_value directly from database (more reliable than lookup)
              const curtainTypeValue = curtain.curtain_value || 0;

              console.log("Sending curtain config to unit (Send All Config):", {
                unitIp: unit.ip_address,
                canId: unit.id_can,
                index: curtain.calculatedIndex ?? 0,
                address: parseInt(curtain.address),
                curtainType: curtainTypeValue,
                pausePeriod: curtain.pause_period || 0,
                transitionPeriod: curtain.transition_period || 0,
                openGroup: parseInt(openGroup.address),
                closeGroup: parseInt(closeGroup.address),
                stopGroup: stopGroup ? parseInt(stopGroup.address) : 0,
              });

              await window.electronAPI.rcuController.setCurtainConfig(
                unit.ip_address,
                unit.id_can,
                {
                  index: curtain.calculatedIndex ?? 0,
                  address: parseInt(curtain.address),
                  curtainType: curtainTypeValue,
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
    if (selectedUnitIds.length === 0) {
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

    // Get selected units from NetworkUnitSelector
    const selectedUnits =
      networkUnitSelectorRef.current?.getSelectedUnits() || [];

    if (selectedUnits.length === 0) {
      toast.error("Please select at least one unit");
      return;
    }

    setLoading(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);

    try {
      setCurrentOperation("Loading project configurations...");
      const configs = await getProjectConfigurations();

      const totalOperations = selectedUnits.length * selectedConfigTypes.length;
      let completedOperations = 0;
      const operationResults = [];

      for (const unit of selectedUnits) {
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
          `All configurations sent successfully to ${selectedUnits.length} unit(s)`
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
    sequences: { label: "Sequences", icon: List },
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
              <CardContent className="grid grid-cols-6">
                {Object.entries(configTypeLabels).map(
                  ([type, { label, icon: Icon }]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={configTypes[type]}
                        onCheckedChange={(checked) =>
                          handleConfigTypeToggle(type, checked)
                        }
                      />
                      <label
                        htmlFor={type}
                        className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {/* <Icon className="h-4 w-4" /> */}
                        {label}
                      </label>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Network Units */}
            <NetworkUnitSelector
              selectedUnitIds={selectedUnitIds}
              onSelectionChange={handleSelectionChange}
              disabled={loading}
              ref={networkUnitSelectorRef}
            />

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
                disabled={loading || selectedUnitIds.length === 0}
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
