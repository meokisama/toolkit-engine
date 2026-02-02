import { ChannelConfig } from "./channel-config";

export function HardwareConfigTab({ channels, selectedChannels, onUpdateChannel, onSelectedChange, disabled }) {
  return (
    <div className="space-y-4 p-4">
      {channels.map((channel, index) => (
        <ChannelConfig
          key={index}
          channelIndex={index}
          channel={channel}
          selected={selectedChannels[index]}
          onUpdate={(updates) => onUpdateChannel(index, updates)}
          onSelectedChange={(selected) => onSelectedChange(index, selected)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
