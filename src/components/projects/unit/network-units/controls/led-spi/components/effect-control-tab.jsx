import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LED_EFFECTS, EFFECT_GROUPS, LED_MODES, VALIDATION, effectShowsColorPicker } from "../constants";
import { EffectColorPicker } from "./effect-color-picker";

function ChannelEffectConfig({
  channelIndex,
  effectState,
  selected,
  ledEnabled,
  onUpdateEffect,
  onUpdateColor,
  onSelectedChange,
  onUpdateLedEnabled,
  disabled,
}) {
  // Group effects for the select dropdown
  const groupedEffects = useMemo(() => {
    const groups = {
      [EFFECT_GROUPS.NO_COLOR_CONFIG]: [],
      [EFFECT_GROUPS.COLOR_CONFIG]: [],
      [EFFECT_GROUPS.FIXED_COLOR]: [],
    };

    LED_EFFECTS.forEach((effect) => {
      groups[effect.group].push(effect);
    });

    return groups;
  }, []);

  const handleEffectChange = (value) => {
    onUpdateEffect({ effect: parseInt(value) });
  };

  const handleModeChange = (value) => {
    onUpdateEffect({ mode: parseInt(value) });
  };

  const handleNumberChange = (field, value) => {
    const numValue = Math.max(VALIDATION.SPEED.min, Math.min(VALIDATION.SPEED.max, parseInt(value) || 0));
    onUpdateEffect({ [field]: numValue });
  };

  const showColorPicker = effectShowsColorPicker(effectState.effect);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Checkbox id={`select-effect-channel-${channelIndex}`} checked={selected} onCheckedChange={onSelectedChange} disabled={disabled} />
          <CardTitle className="text-base font-bold">
            <Label htmlFor={`select-effect-channel-${channelIndex}`} className="cursor-pointer">
              Channel {channelIndex + 1}
            </Label>
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Switch id={`led-enable-${channelIndex}`} checked={ledEnabled} onCheckedChange={onUpdateLedEnabled} disabled={disabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-2">
            <Label htmlFor={`effect-mode-${channelIndex}`}>Mode</Label>
            <Select value={String(effectState.mode ?? 0)} onValueChange={handleModeChange} disabled={disabled}>
              <SelectTrigger id={`effect-mode-${channelIndex}`} className="w-full">
                <SelectValue placeholder="Select Mode" />
              </SelectTrigger>
              <SelectContent>
                {LED_MODES.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`effect-select-${channelIndex}`}>Effect</Label>
            <Select value={String(effectState.effect)} onValueChange={handleEffectChange} disabled={disabled}>
              <SelectTrigger id={`effect-select-${channelIndex}`} className="w-full">
                <SelectValue placeholder="Select Effect" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedEffects).map(([group, effects]) => (
                  <SelectGroup key={group}>
                    {/* <SelectLabel className="text-xs text-muted-foreground border-b italic">{EFFECT_GROUP_LABELS[group]}</SelectLabel> */}
                    {effects.map((effect) => (
                      <SelectItem key={effect.value} value={String(effect.value)}>
                        {effect.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`effect-speed-${channelIndex}`}>Speed (0-255)</Label>
            <Input
              id={`effect-speed-${channelIndex}`}
              type="number"
              min={VALIDATION.SPEED.min}
              max={VALIDATION.SPEED.max}
              value={effectState.speed}
              onChange={(e) => handleNumberChange("speed", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`effect-brightness-${channelIndex}`}>Brightness (0-255)</Label>
            <Input
              id={`effect-brightness-${channelIndex}`}
              type="number"
              min={VALIDATION.BRIGHTNESS.min}
              max={VALIDATION.BRIGHTNESS.max}
              value={effectState.brightness}
              onChange={(e) => handleNumberChange("brightness", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Color Picker - only show for effects that need color config */}
        {showColorPicker && <EffectColorPicker color={effectState.color} onColorChange={onUpdateColor} disabled={disabled} />}
      </CardContent>
    </Card>
  );
}

export function EffectControlTab({
  effectStates,
  selectedChannels,
  ledEnabled,
  onUpdateEffect,
  onUpdateColor,
  onSelectedChange,
  onUpdateLedEnabled,
  disabled,
}) {
  return (
    <div className="space-y-4 p-4">
      {effectStates.map((effectState, index) => (
        <ChannelEffectConfig
          key={index}
          channelIndex={index}
          effectState={effectState}
          selected={selectedChannels[index]}
          ledEnabled={ledEnabled[index]}
          onUpdateEffect={(updates) => onUpdateEffect(index, updates)}
          onUpdateColor={(colorUpdates) => onUpdateColor(index, colorUpdates)}
          onSelectedChange={(selected) => onSelectedChange(index, selected)}
          onUpdateLedEnabled={(enabled) => onUpdateLedEnabled(index, enabled)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
