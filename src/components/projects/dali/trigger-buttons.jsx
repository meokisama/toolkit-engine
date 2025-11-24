import { memo } from "react";
import { Lightbulb, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useTrigger } from "./hooks/useTrigger";

/**
 * Trigger button for DALI devices - shows popover with brightness slider
 */
export const TriggerDeviceButton = memo(function TriggerDeviceButton({
  address,
  disabled
}) {
  const { level, open, setOpen, handleLevelChange, selectedGateway } = useTrigger({
    type: "device",
    id: address,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled || !selectedGateway}
        >
          <Lightbulb className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Brightness</label>
              <span className="text-sm text-muted-foreground">
                {level[0]} / 255
              </span>
            </div>
            <Slider
              value={level}
              onValueChange={handleLevelChange}
              max={255}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

/**
 * Trigger button for DALI groups - shows popover with brightness slider
 */
export const TriggerGroupButton = memo(function TriggerGroupButton({
  groupId,
  disabled
}) {
  const { level, open, setOpen, handleLevelChange, selectedGateway } = useTrigger({
    type: "group",
    id: groupId,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled || !selectedGateway}
          onClick={(e) => e.stopPropagation()}
        >
          <Lightbulb className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Brightness</label>
              <span className="text-sm text-muted-foreground">
                {level[0]} / 255
              </span>
            </div>
            <Slider
              value={level}
              onValueChange={handleLevelChange}
              max={255}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

/**
 * Trigger button for DALI scenes - simple button without slider
 */
export const TriggerSceneButton = memo(function TriggerSceneButton({
  sceneId,
  disabled
}) {
  const { handleTriggerScene, selectedGateway } = useTrigger({
    type: "scene",
    id: sceneId,
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      disabled={disabled || !selectedGateway}
      onClick={handleTriggerScene}
    >
      <Play className="h-4 w-4" />
    </Button>
  );
});
