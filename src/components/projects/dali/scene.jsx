import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Lightbulb, Sun, Percent } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { toast } from "sonner";
import { useDaliDevices } from "./hooks/useDaliDevices";
import { useEditableName } from "./hooks/useEditableName";
import { DALI_SCENE_COUNT, BRIGHTNESS_MAX } from "./utils/constants";
import { parseBrightnessInput, brightnessToPercent } from "./utils/brightness";
import { TriggerSceneButton, TriggerDeviceButton } from "./trigger-buttons";

export function Scene({ isActive }) {
  const { selectedProject } = useProjectDetail();

  // 16 scenes
  const [scenes, setScenes] = useState(() =>
    Array.from({ length: DALI_SCENE_COUNT }, (_, i) => ({
      id: i,
      name: `Scene ${i}`,
      devices: {}, // deviceAddress -> { active, brightness }
    }))
  );

  const [selectedSceneId, setSelectedSceneId] = useState(0);

  // Load devices using custom hook
  const { devices, loading: devicesLoading } = useDaliDevices(
    selectedProject,
    isActive
  );
  const [loading, setLoading] = useState(true);

  // Load scene data from database - reload when tab becomes active
  useEffect(() => {
    if (!selectedProject || !isActive) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load scene names
        const sceneNames = await window.electronAPI.dali.getAllSceneNames(
          selectedProject.id
        );

        // Load scene devices
        const sceneDevices = await window.electronAPI.dali.getAllSceneDevices(
          selectedProject.id
        );

        setScenes((prev) =>
          prev.map((scene) => {
            const nameData = sceneNames.find((sn) => sn.scene_id === scene.id);
            const devicesForScene = sceneDevices.filter(
              (sd) => sd.scene_id === scene.id
            );

            const devicesMap = {};
            devicesForScene.forEach((sd) => {
              devicesMap[sd.device_address] = {
                active: Boolean(sd.active),
                brightness: sd.brightness,
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
        await window.electronAPI.dali.updateSceneName(
          selectedProject.id,
          sceneId,
          newName.trim()
        );

        setScenes((prev) =>
          prev.map((scene) =>
            scene.id === sceneId ? { ...scene, name: newName.trim() } : scene
          )
        );

        toast.success("Scene name updated");
      } catch (error) {
        console.error("Failed to update scene name:", error);
        toast.error("Failed to update scene name");
      }
    },
    [selectedProject]
  );

  const selectedScene = useMemo(
    () => scenes.find((s) => s.id === selectedSceneId),
    [scenes, selectedSceneId]
  );

  const handleToggleDevice = useCallback(
    async (deviceAddress) => {
      if (!selectedProject) return;

      setScenes((prevScenes) => {
        const scene = prevScenes.find((s) => s.id === selectedSceneId);
        const deviceData = scene?.devices[deviceAddress];
        const isCurrentlyActive = deviceData?.active || false;
        const brightness = deviceData?.brightness ?? BRIGHTNESS_MAX;

        if (isCurrentlyActive) {
          // Delete from database when unchecking
          window.electronAPI.dali
            .deleteSceneDevice(selectedProject.id, selectedSceneId, deviceAddress)
            .catch((error) => {
              console.error("Failed to remove device from scene:", error);
              toast.error("Failed to remove device from scene");
            });
        } else {
          // Insert/update when checking
          window.electronAPI.dali
            .upsertSceneDevice(
              selectedProject.id,
              selectedSceneId,
              deviceAddress,
              true,
              brightness
            )
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

  const handleBrightnessChange = useCallback(
    async (deviceAddress, value, type) => {
      if (!selectedProject) return;

      const brightness = parseBrightnessInput(value, type);

      // Save to database
      window.electronAPI.dali
        .upsertSceneDevice(
          selectedProject.id,
          selectedSceneId,
          deviceAddress,
          true, // Auto-activate when setting brightness
          brightness
        )
        .catch((error) => {
          console.error("Failed to update brightness:", error);
          toast.error("Failed to update brightness");
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
                  ...(scene.devices[deviceAddress] || {}),
                  brightness,
                  active: true,
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
                const brightness = deviceData?.brightness ?? BRIGHTNESS_MAX;
                const brightnessPercent = brightnessToPercent(brightness);

                return (
                  <DeviceSceneItem
                    key={device.id}
                    device={device}
                    active={isActive}
                    brightness={brightness}
                    brightnessPercent={brightnessPercent}
                    onToggle={handleToggleDevice}
                    onBrightnessChange={handleBrightnessChange}
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

const SceneItem = memo(function SceneItem({
  scene,
  selected,
  onClick,
  onUpdateName,
}) {
  const activeDeviceCount = useMemo(
    () => Object.values(scene.devices).filter((d) => d.active).length,
    [scene.devices]
  );

  const handleSaveName = useCallback(
    (newName) => {
      onUpdateName(scene.id, newName);
    },
    [onUpdateName, scene.id]
  );

  const { isEditing, editName, handlers } = useEditableName(
    scene.name,
    handleSaveName
  );

  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-md p-3 cursor-pointer transition-colors",
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card hover:bg-accent"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb
            className={cn("h-4 w-4", selected ? "" : "text-muted-foreground")}
          />
          <div>
            {isEditing ? (
              <Input
                value={editName}
                onChange={handlers.onChange}
                onBlur={handlers.onBlur}
                onKeyDown={handlers.onKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className={cn(
                  "h-7 w-40",
                  selected && "text-primary-foreground"
                )}
              />
            ) : (
              <div
                className={cn(
                  "font-medium",
                  selected ? "hover:opacity-80" : "hover:text-primary"
                )}
                onClick={handlers.onClick}
              >
                {scene.name}
              </div>
            )}
            <div
              className={cn(
                "text-xs",
                selected ? "opacity-80" : "text-muted-foreground"
              )}
            >
              {activeDeviceCount} device(s)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div
            className={cn(
              "font-mono text-sm",
              selected ? "" : "text-muted-foreground"
            )}
          >
            {scene.id}
          </div>
          <TriggerSceneButton sceneId={scene.id} disabled={false} />
        </div>
      </div>
    </div>
  );
});

const DeviceSceneItem = memo(function DeviceSceneItem({
  device,
  active,
  brightness,
  brightnessPercent,
  onToggle,
  onBrightnessChange,
}) {
  const handleToggle = useCallback(() => {
    onToggle(device.id);
  }, [onToggle, device.id]);

  const handleBrightnessChange255 = useCallback(
    (e) => {
      onBrightnessChange(device.id, e.target.value, "0-255");
    },
    [onBrightnessChange, device.id]
  );

  const handleBrightnessChange100 = useCallback(
    (e) => {
      onBrightnessChange(device.id, e.target.value, "0-100");
    },
    [onBrightnessChange, device.id]
  );

  return (
    <div
      className={cn(
        "border rounded-md p-3 transition-colors",
        active ? "bg-card border-muted-foreground/80 shadow" : "bg-muted/50"
        // device.name ? "" : "opacity-60"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <Checkbox checked={active} onCheckedChange={handleToggle} />

        {/* Device Info */}
        <div className="flex-1 flex">
          <div className="flex items-center gap-4 w-2/5">
            <span className="font-mono text-sm font-medium text-muted-foreground">
              {device.address.toString().padStart(2, "0")}
            </span>
            <span className="font-medium">{device.name || "Unmapped"}</span>
          </div>

          {/* Brightness Inputs - Only show when active */}
          {active && (
            <div className="grid grid-cols-2 gap-3 w-3/5">
              <div className="relative">
                <Sun className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id={`brightness-255-${device.id}`}
                  type="number"
                  min="0"
                  max="255"
                  value={brightness}
                  onChange={handleBrightnessChange255}
                  className="h-10 pl-8 font-bold"
                />
              </div>
              <div className="relative">
                <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id={`brightness-100-${device.id}`}
                  type="number"
                  min="0"
                  max="100"
                  value={brightnessPercent}
                  onChange={handleBrightnessChange100}
                  className="h-10 pl-8 font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Trigger Device Button */}
        <div className="pt-1">
          <TriggerDeviceButton address={device.address} disabled={false} />
        </div>
      </div>
    </div>
  );
});
