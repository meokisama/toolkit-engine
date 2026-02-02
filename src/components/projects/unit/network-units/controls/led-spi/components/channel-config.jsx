import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { IC_TYPES, COLOR_TYPES, DIRECTION_TYPES, VALIDATION } from "../constants";

export function ChannelConfig({ channelIndex, channel, selected, onUpdate, onSelectedChange, disabled }) {
  const handleNumberChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    onUpdate({ [field]: numValue });
  };

  const handleSelectChange = (field, value) => {
    onUpdate({ [field]: parseInt(value) });
  };

  const handleCheckboxChange = (checked) => {
    onUpdate({ custom: checked });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Checkbox id={`select-channel-${channelIndex}`} checked={selected} onCheckedChange={onSelectedChange} disabled={disabled} />
          <CardTitle className="text-base font-bold">
            <Label htmlFor={`select-channel-${channelIndex}`} className="cursor-pointer">
              Channel {channelIndex + 1}
            </Label>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 grid grid-cols-4 gap-2">
          {/* Pixel Amount */}
          <div className="space-y-2">
            <Label htmlFor={`pixel-amount-${channelIndex}`}>Pixel Amount</Label>
            <Input
              id={`pixel-amount-${channelIndex}`}
              type="number"
              min={VALIDATION.PIXEL_AMOUNT.min}
              max={VALIDATION.PIXEL_AMOUNT.max}
              value={channel.pixelAmount}
              onChange={(e) => handleNumberChange("pixelAmount", e.target.value)}
              disabled={disabled}
              className="w-full"
            />
          </div>

          {/* IC Type */}
          <div className="space-y-2">
            <Label htmlFor={`ic-type-${channelIndex}`}>IC Type</Label>
            <Select value={String(channel.icType)} onValueChange={(value) => handleSelectChange("icType", value)} disabled={disabled}>
              <SelectTrigger id={`ic-type-${channelIndex}`} className="w-full">
                <SelectValue placeholder="Select IC Type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(IC_TYPES).map((type) => (
                  <SelectItem key={type.value} value={String(type.value)}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Type */}
          <div className="space-y-2">
            <Label htmlFor={`color-type-${channelIndex}`}>Color Type</Label>
            <Select value={String(channel.colorType)} onValueChange={(value) => handleSelectChange("colorType", value)} disabled={disabled}>
              <SelectTrigger id={`color-type-${channelIndex}`} className="w-full">
                <SelectValue placeholder="Select Color Type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(COLOR_TYPES).map((type) => (
                  <SelectItem key={type.value} value={String(type.value)}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Direction */}
          <div className="space-y-2">
            <Label htmlFor={`direction-${channelIndex}`}>Direction</Label>
            <Select value={String(channel.direction)} onValueChange={(value) => handleSelectChange("direction", value)} disabled={disabled}>
              <SelectTrigger id={`direction-${channelIndex}`} className="w-full">
                <SelectValue placeholder="Select Direction" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DIRECTION_TYPES).map((type) => (
                  <SelectItem key={type.value} value={String(type.value)}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Checkbox */}
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox id={`custom-${channelIndex}`} checked={channel.custom} onCheckedChange={handleCheckboxChange} disabled={disabled} />
          <Label htmlFor={`custom-${channelIndex}`} className="cursor-pointer flex items-center gap-1">
            Custom Timing
          </Label>
        </div>

        {/* Custom Timing Inputs - only show when custom is checked */}
        {channel.custom && (
          <div className="space-y-4 grid grid-cols-4 gap-2">
            <div className="space-y-2">
              <Label htmlFor={`bit0-high-time-${channelIndex}`}>Bit 0 High Time</Label>
              <Input
                id={`bit0-high-time-${channelIndex}`}
                type="number"
                min={VALIDATION.BIT_TIME.min}
                max={VALIDATION.BIT_TIME.max}
                value={channel.bit0HighTime}
                onChange={(e) => handleNumberChange("bit0HighTime", e.target.value)}
                disabled={disabled}
                placeholder="0-3180"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`bit1-high-time-${channelIndex}`}>Bit 1 High Time</Label>
              <Input
                id={`bit1-high-time-${channelIndex}`}
                type="number"
                min={VALIDATION.BIT_TIME.min}
                max={VALIDATION.BIT_TIME.max}
                value={channel.bit1HighTime}
                onChange={(e) => handleNumberChange("bit1HighTime", e.target.value)}
                disabled={disabled}
                placeholder="0-3180"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`overall-bit-time-${channelIndex}`}>Overall Bit Time</Label>
              <Input
                id={`overall-bit-time-${channelIndex}`}
                type="number"
                min={VALIDATION.BIT_TIME.min}
                max={VALIDATION.BIT_TIME.max}
                value={channel.overallBitTime}
                onChange={(e) => handleNumberChange("overallBitTime", e.target.value)}
                disabled={disabled}
                placeholder="0-3180"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`reset-cycle-${channelIndex}`}>Reset Cycle</Label>
              <Input
                id={`reset-cycle-${channelIndex}`}
                type="number"
                min={VALIDATION.RESET_CYCLE.min}
                max={VALIDATION.RESET_CYCLE.max}
                value={channel.resetCycle}
                onChange={(e) => handleNumberChange("resetCycle", e.target.value)}
                disabled={disabled}
                placeholder="0-65536"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
