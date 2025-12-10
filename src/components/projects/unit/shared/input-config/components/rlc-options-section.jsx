import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/custom/time-picker";
import { RAMP_OPTIONS, LED_DISPLAY_MODES } from "@/constants";
import { Settings } from "lucide-react";

export const RlcOptionsSection = ({
  rlcOptions,
  rlcOptionsConfig,
  delayOffTime,
  onRlcOptionChange,
  onDelayOffTimeChange,
}) => {
  // Count enabled options for display
  const enabledOptionsCount =
    Object.values(rlcOptionsConfig).filter(Boolean).length;

  return (
    <div className="flex flex-col justify-end">
      <Popover modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm">RLC Options</span>
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[600px] overflow-y-auto"
          align="start"
          side="bottom"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">RLC Configuration Options</h4>
              <span className="text-xs text-muted-foreground">
                Configure lighting control parameters
              </span>
            </div>

            <div className="grid gap-4">
              {/* Ramp */}
              <Card>
                <CardContent className="space-y-2">
                  <Label
                    className={`text-sm font-medium flex items-center gap-2 ${
                      !rlcOptionsConfig.rampEnabled
                        ? "text-muted-foreground"
                        : ""
                    }`}
                  >
                    1. Ramp Time
                  </Label>
                  <Select
                    value={rlcOptions.ramp.toString()}
                    onValueChange={(value) =>
                      onRlcOptionChange("ramp", parseInt(value))
                    }
                    disabled={!rlcOptionsConfig.rampEnabled}
                  >
                    <SelectTrigger
                      className={
                        !rlcOptionsConfig.rampEnabled
                          ? "opacity-50 w-full"
                          : "w-full"
                      }
                    >
                      <SelectValue placeholder="Select ramp time..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RAMP_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* LED Display and Options */}
              <Card>
                <CardContent className="flex flex-col gap-4">
                  {/* LED Display Mode */}
                  <div className="space-y-2">
                    <Label
                      className={`text-sm font-medium ${
                        !rlcOptionsConfig.ledDisplayEnabled
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      2. LED Display
                    </Label>
                    <Select
                      value={rlcOptions.ledDisplay.toString()}
                      onValueChange={(value) =>
                        onRlcOptionChange("ledDisplay", parseInt(value))
                      }
                      disabled={!rlcOptionsConfig.ledDisplayEnabled}
                    >
                      <SelectTrigger
                        className={
                          !rlcOptionsConfig.ledDisplayEnabled
                            ? "opacity-50 w-full"
                            : "w-full"
                        }
                      >
                        <SelectValue placeholder="Select LED display mode..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LED_DISPLAY_MODES.map((mode) => (
                          <SelectItem
                            key={mode.value}
                            value={mode.value.toString()}
                          >
                            {mode.label} - {mode.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* LED Options */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="nightlight"
                        checked={rlcOptions.nightlight}
                        onCheckedChange={(checked) =>
                          onRlcOptionChange("nightlight", checked)
                        }
                        disabled={!rlcOptionsConfig.nightlightEnabled}
                      />
                      <Label
                        htmlFor="nightlight"
                        className={`text-sm ${
                          !rlcOptionsConfig.nightlightEnabled
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        NightLight
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="backlight"
                        checked={rlcOptions.backlight}
                        onCheckedChange={(checked) =>
                          onRlcOptionChange("backlight", checked)
                        }
                        disabled={!rlcOptionsConfig.backlightEnabled}
                      />
                      <Label
                        htmlFor="backlight"
                        className={`text-sm ${
                          !rlcOptionsConfig.backlightEnabled
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        BackLight
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-mode"
                        checked={rlcOptions.autoMode}
                        onCheckedChange={(checked) =>
                          onRlcOptionChange("autoMode", checked)
                        }
                        disabled={!rlcOptionsConfig.autoModeEnabled}
                      />
                      <Label
                        htmlFor="auto-mode"
                        className={`text-sm ${
                          !rlcOptionsConfig.autoModeEnabled
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        Auto Mode
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                {/* Preset */}
                <Card>
                  <CardContent className="space-y-2">
                    <Label
                      className={`text-sm font-medium flex items-center gap-2 ${
                        !rlcOptionsConfig.presetEnabled
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      3. Preset
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="255"
                        value={rlcOptions.preset}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const clampedValue = Math.max(
                            0,
                            Math.min(255, value)
                          );
                          onRlcOptionChange("preset", clampedValue);
                        }}
                        placeholder="0-255"
                        className="text-center w-1/2"
                        disabled={!rlcOptionsConfig.presetEnabled}
                      />
                      <div className="relative w-1/2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={Math.round((rlcOptions.preset * 100) / 255)}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const clampedValue = Math.max(
                              0,
                              Math.min(100, value)
                            );
                            const rawValue = Math.round(
                              (clampedValue * 255) / 100
                            );
                            onRlcOptionChange("preset", rawValue);
                          }}
                          placeholder="0-100"
                          className="text-center pl-8"
                          disabled={!rlcOptionsConfig.presetEnabled}
                        />
                        <Label className="text-sm absolute left-2 top-1/2 transform -translate-y-1/2">
                          %
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delay Off Section */}
                <Card>
                  <CardContent className="space-y-2">
                    <Label
                      className={`text-sm font-medium flex items-center gap-2 ${
                        !rlcOptionsConfig.delayOffEnabled
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      4. Delay Off
                    </Label>
                    <div
                      className={
                        !rlcOptionsConfig.delayOffEnabled
                          ? "opacity-50 pointer-events-none"
                          : ""
                      }
                    >
                      <TimePicker
                        date={delayOffTime}
                        setDate={onDelayOffTimeChange}
                        showSeconds={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
