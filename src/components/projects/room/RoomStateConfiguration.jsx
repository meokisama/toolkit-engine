import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, CircleCheck } from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

export function RoomStateConfiguration({
  state,
  config,
  updateConfig,
  availableScenes = [],
}) {
  const {
    airconActive = false,
    airconMode = 0,
    airconFanSpeed = 0,
    airconCoolSetpoint = 24,
    airconHeatSetpoint = 20,
    scenesList = [],
  } = config;

  const handleUpdate = (field, value) => {
    updateConfig(state, field, value);
  };

  const handleSceneToggle = (sceneId, checked) => {
    const newScenesList = checked
      ? [...scenesList, sceneId]
      : scenesList.filter((id) => id !== sceneId);
    handleUpdate("scenesList", newScenesList);
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Aircon Active */}
        <div className="flex items-center gap-4">
          <Label htmlFor={`${state}-aircon-active`} className="cursor-pointer">
            {state} Aircon Active
          </Label>
          <Checkbox
            id={`${state}-aircon-active`}
            checked={airconActive}
            onCheckedChange={(checked) => handleUpdate("airconActive", checked)}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* Aircon Mode */}
          <div className="space-y-2">
            <Label htmlFor={`${state}-aircon-mode`}>Aircon Mode</Label>
            <Select
              value={airconMode.toString()}
              onValueChange={(value) =>
                handleUpdate("airconMode", parseInt(value))
              }
            >
              <SelectTrigger id={`${state}-aircon-mode`} className="w-full">
                <SelectValue placeholder="Select aircon mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Off</SelectItem>
                <SelectItem value="1">Cool</SelectItem>
                <SelectItem value="2">Heat</SelectItem>
                <SelectItem value="3">Ventilation</SelectItem>
                <SelectItem value="4">Dry</SelectItem>
                <SelectItem value="5">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aircon Fan Speed */}
          <div className="space-y-2">
            <Label htmlFor={`${state}-fan-speed`}>Aircon Fan Speed</Label>
            <Select
              value={airconFanSpeed.toString()}
              onValueChange={(value) =>
                handleUpdate("airconFanSpeed", parseInt(value))
              }
            >
              <SelectTrigger id={`${state}-fan-speed`} className="w-full">
                <SelectValue placeholder="Select fan speed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Low</SelectItem>
                <SelectItem value="1">Medium</SelectItem>
                <SelectItem value="2">High</SelectItem>
                <SelectItem value="3">Auto</SelectItem>
                <SelectItem value="4">Off</SelectItem>
                <SelectItem value="5">Powerful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aircon Cool Setpoint */}
          <div className="space-y-2">
            <Label htmlFor={`${state}-cool-setpoint`}>
              Cool Setpoint (16-36°C)
            </Label>
            <Input
              id={`${state}-cool-setpoint`}
              type="number"
              min="16"
              max="36"
              value={airconCoolSetpoint}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 16;
                const clamped = Math.max(16, Math.min(36, value));
                handleUpdate("airconCoolSetpoint", clamped);
              }}
            />
          </div>

          {/* Aircon Heat Setpoint */}
          <div className="space-y-2">
            <Label htmlFor={`${state}-heat-setpoint`}>
              Heat Setpoint (10-28°C)
            </Label>
            <Input
              id={`${state}-heat-setpoint`}
              type="number"
              min="10"
              max="28"
              value={airconHeatSetpoint}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 10;
                const clamped = Math.max(10, Math.min(28, value));
                handleUpdate("airconHeatSetpoint", clamped);
              }}
            />
          </div>
        </div>
        {/* Scenes List */}
        <div className="space-y-2">
          <Label>Select Scenes</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Select the scenes you want to run in this state
          </p>
          <ScrollArea className="h-48 rounded-md">
            {availableScenes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No scenes available.</p>
                <p className="text-sm">
                  Create scenes first to add them to room states.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 p-1">
                {availableScenes.map((scene) => (
                  <CheckboxPrimitive.Root
                    key={scene.id}
                    checked={scenesList.includes(scene.id)}
                    onCheckedChange={(checked) =>
                      handleSceneToggle(scene.id, checked)
                    }
                    className="relative ring-[1px] ring-border rounded-lg px-3 py-2 text-start text-muted-foreground data-[state=checked]:ring-2 data-[state=checked]:ring-primary data-[state=checked]:text-primary flex flex-row items-center gap-2 cursor-pointer"
                  >
                    <Lightbulb className="h-5 w-5 shrink-0" />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <span className="font-medium tracking-tight text-sm block truncate">
                        {scene.name}
                      </span>
                      {scene.address && (
                        <p className="text-xs text-muted-foreground">
                          Address: {scene.address}
                        </p>
                      )}
                    </div>

                    <CheckboxPrimitive.Indicator className="absolute top-1 right-1">
                      <CircleCheck className="fill-primary text-primary-foreground h-4 w-4" />
                    </CheckboxPrimitive.Indicator>
                  </CheckboxPrimitive.Root>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
