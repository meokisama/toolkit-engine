import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { toast } from "sonner";
import { useDaliDevices } from "./hooks/useDaliDevices";
import { useEditableName } from "./hooks/useEditableName";
import { DALI_SCENE_COUNT, BRIGHTNESS_MAX } from "./utils/constants";
import { TriggerSceneButton, TriggerDeviceButton } from "./trigger-buttons";
import { DeviceSceneControl } from "./device-scene-control";

export function Scene({ isActive }) {
  const { selectedProject } = useProjectDetail();

  // 16 scenes
  const [scenes, setScenes] = useState(() =>
    Array.from({ length: DALI_SCENE_COUNT }, (_, i) => ({
      id: i,
      name: `Scene ${i}`,
      devices: {}, // deviceAddress -> { active, brightness, colorTemp, r, g, b, w }
    }))
  );

  const [selectedSceneId, setSelectedSceneId] = useState(0);

  // Load devices using custom hook
  const { devices, loading: devicesLoading } = useDaliDevices(selectedProject, isActive);
  const [loading, setLoading] = useState(true);

  // Load scene data from database - reload when tab becomes active
  useEffect(() => {
    if (!selectedProject || !isActive) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load scene names
        const sceneNames = await window.electronAPI.dali.getAllDaliSceneNames(selectedProject.id);

        // Load scene devices
        const sceneDevices = await window.electronAPI.dali.getAllDaliSceneDevices(selectedProject.id);

        setScenes((prev) =>
          prev.map((scene) => {
            const nameData = sceneNames.find((sn) => sn.scene_id === scene.id);
            const devicesForScene = sceneDevices.filter((sd) => sd.scene_id === scene.id);

            const devicesMap = {};
            devicesForScene.forEach((sd) => {
              devicesMap[sd.device_address] = {
                active: Boolean(sd.active),
                brightness: sd.brightness,
                colorTemp: sd.color_temp,
                r: sd.r,
                g: sd.g,
                b: sd.b,
                w: sd.w,
              };
            });

            return {
              ...scene,
              name: nameData ? nameData.name : `Scene ${scene.id}`,
              devices: devicesMap,
            };
          })
        );
      } catch (error) {
        console.error("Failed to load scene data:", error);
        toast.error("Failed to load scene data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedProject, isActive]);

  const handleUpdateSceneName = useCallback(
    async (sceneId, newName) => {
      if (!selectedProject || !newName.trim()) return;

      try {
        await window.electronAPI.dali.updateDaliSceneName(selectedProject.id, sceneId, newName.trim());

        setScenes((prev) => prev.map((scene) => (scene.id === sceneId ? { ...scene, name: newName.trim() } : scene)));

        toast.success("Scene name updated");
      } catch (error) {
        console.error("Failed to update scene name:", error);
        toast.error("Failed to update scene name");
      }
    },
    [selectedProject]
  );

  const selectedScene = useMemo(() => scenes.find((s) => s.id === selectedSceneId), [scenes, selectedSceneId]);

  const handleToggleDevice = useCallback(
    async (deviceAddress) => {
      if (!selectedProject) return;

      setScenes((prevScenes) => {
        const scene = prevScenes.find((s) => s.id === selectedSceneId);
        const deviceData = scene?.devices[deviceAddress];
        const isCurrentlyActive = deviceData?.active || false;
        const brightness = deviceData?.brightness ?? BRIGHTNESS_MAX;
        const colorTemp = deviceData?.colorTemp ?? null;
        const r = deviceData?.r ?? null;
        const g = deviceData?.g ?? null;
        const b = deviceData?.b ?? null;
        const w = deviceData?.w ?? null;

        if (isCurrentlyActive) {
          // Delete from database when unchecking
          window.electronAPI.dali.deleteDaliSceneDevice(selectedProject.id, selectedSceneId, deviceAddress).catch((error) => {
            console.error("Failed to remove device from scene:", error);
            toast.error("Failed to remove device from scene");
          });
        } else {
          // Insert/update when checking
          window.electronAPI.dali
            .upsertDaliSceneDevice(selectedProject.id, selectedSceneId, deviceAddress, true, brightness, colorTemp, r, g, b, w)
            .catch((error) => {
              console.error("Failed to add device to scene:", error);
              toast.error("Failed to add device to scene");
            });
        }

        // Update state optimistically
        return prevScenes.map((scene) => {
          if (scene.id === selectedSceneId) {
            if (isCurrentlyActive) {
              // Remove device from scene
              const { [deviceAddress]: removed, ...remainingDevices } = scene.devices;
              return {
                ...scene,
                devices: remainingDevices,
              };
            } else {
              // Add device to scene
              return {
                ...scene,
                devices: {
                  ...scene.devices,
                  [deviceAddress]: {
                    active: true,
                    brightness,
                    colorTemp,
                    r,
                    g,
                    b,
                    w,
                  },
                },
              };
            }
          }
          return scene;
        });
      });
    },
    [selectedProject, selectedSceneId]
  );

  const handleValuesChange = useCallback(
    async (deviceAddress, values) => {
      if (!selectedProject) return;

      const { brightness, colorTemp, r, g, b, w } = values;

      // Save to database
      window.electronAPI.dali
        .upsertDaliSceneDevice(
          selectedProject.id,
          selectedSceneId,
          deviceAddress,
          true, // Auto-activate when setting values
          brightness,
          colorTemp ?? null,
          r ?? null,
          g ?? null,
          b ?? null,
          w ?? null
        )
        .catch((error) => {
          console.error("Failed to update device values:", error);
          toast.error("Failed to update device values");
        });

      // Update state optimistically
      setScenes((prev) =>
        prev.map((scene) => {
          if (scene.id === selectedSceneId) {
            return {
              ...scene,
              devices: {
                ...scene.devices,
                [deviceAddress]: {
                  active: true,
                  brightness,
                  colorTemp: colorTemp ?? null,
                  r: r ?? null,
                  g: g ?? null,
                  b: b ?? null,
                  w: w ?? null,
                },
              },
            };
          }
          return scene;
        })
      );
    },
    [selectedProject, selectedSceneId]
  );

  return (
    <div className="grid grid-cols-5 gap-4 h-full">
      {/* Left: 16 Scenes */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Scenes (0-15)</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-360px)]">
            <div className="space-y-2 pr-4">
              {scenes.map((scene) => (
                <SceneItem
                  key={scene.id}
                  scene={scene}
                  selected={scene.id === selectedSceneId}
                  onClick={() => setSelectedSceneId(scene.id)}
                  onUpdateName={handleUpdateSceneName}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: 64 Devices for Selected Scene */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>{selectedScene?.name || "Scene"} Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-360px)]">
            <div className="space-y-2 pr-4">
              {devices.map((device) => {
                const deviceData = selectedScene?.devices[device.id];
                const isActive = deviceData?.active || false;
                const values = {
                  brightness: deviceData?.brightness ?? BRIGHTNESS_MAX,
                  colorTemp: deviceData?.colorTemp ?? 2700,
                  r: deviceData?.r ?? 0,
                  g: deviceData?.g ?? 0,
                  b: deviceData?.b ?? 0,
                  w: deviceData?.w ?? 0,
                };

                return (
                  <DeviceSceneItem
                    key={device.id}
                    device={device}
                    active={isActive}
                    values={values}
                    onToggle={handleToggleDevice}
                    onValuesChange={handleValuesChange}
                  />
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

const SceneItem = memo(function SceneItem({ scene, selected, onClick, onUpdateName }) {
  const activeDeviceCount = useMemo(() => Object.values(scene.devices).filter((d) => d.active).length, [scene.devices]);

  const handleSaveName = useCallback(
    (newName) => {
      onUpdateName(scene.id, newName);
    },
    [onUpdateName, scene.id]
  );

  const { isEditing, editName, handlers } = useEditableName(scene.name, handleSaveName);

  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-md p-3 cursor-pointer transition-colors",
        selected ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className={cn("h-4 w-4", selected ? "" : "text-muted-foreground")} />
          <div>
            {isEditing ? (
              <Input
                value={editName}
                onChange={handlers.onChange}
                onBlur={handlers.onBlur}
                onKeyDown={handlers.onKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className={cn("h-7 w-40", selected && "text-primary-foreground")}
              />
            ) : (
              <div className={cn("font-medium", selected ? "hover:opacity-80" : "hover:text-primary")} onClick={handlers.onClick}>
                {scene.name}
              </div>
            )}
            <div className={cn("text-xs", selected ? "opacity-80" : "text-muted-foreground")}>{activeDeviceCount} device(s)</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className={cn("font-mono text-sm", selected ? "" : "text-muted-foreground")}>{scene.id}</div>
          <TriggerSceneButton sceneId={scene.id} disabled={false} />
        </div>
      </div>
    </div>
  );
});

const DeviceSceneItem = memo(function DeviceSceneItem({ device, active, values, onToggle, onValuesChange }) {
  const handleToggle = useCallback(() => {
    onToggle(device.id);
  }, [onToggle, device.id]);

  const handleValuesChange = useCallback(
    (newValues) => {
      onValuesChange(device.id, newValues);
    },
    [onValuesChange, device.id]
  );

  return (
    <div className={cn("border rounded-md p-3 transition-colors", active ? "bg-card border-muted-foreground/80 shadow" : "bg-muted/50")}>
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <Checkbox checked={active} onCheckedChange={handleToggle} />

        {/* Device Info */}
        <div className="flex-1 flex">
          <div className="flex items-center gap-4 w-2/5">
            <span className="font-mono text-sm font-medium text-muted-foreground">{device.address.toString().padStart(2, "0")}</span>
            <span className="font-medium">{device.name || "Unmapped"}</span>
          </div>

          {/* Device Control Inputs - Only show when active */}
          {active && (
            <div className="w-3/5">
              <DeviceSceneControl device={device} values={values} onChange={handleValuesChange} />
            </div>
          )}
        </div>

        {/* Trigger Device Button */}
        <div className="pt-1">
          <TriggerDeviceButton
            address={device.address}
            index={device.index}
            disabled={false}
            deviceType={device.type}
            colorFeature={device.colorFeature}
          />
        </div>
      </div>
    </div>
  );
});
