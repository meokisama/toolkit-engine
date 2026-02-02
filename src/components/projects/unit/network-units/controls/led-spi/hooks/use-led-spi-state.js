import { useState, useCallback } from "react";
import { DEFAULT_CHANNEL_STATE, DEFAULT_EFFECT_STATE } from "../constants";

export function useLedSpiState() {
  const [activeTab, setActiveTab] = useState("hardware");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Selected channels for read/send
  const [selectedChannels, setSelectedChannels] = useState([true, true]);

  // LED on/off state per channel
  const [ledEnabled, setLedEnabled] = useState([false, false]);

  // Hardware configuration - 2 channels
  const [channels, setChannels] = useState([{ ...DEFAULT_CHANNEL_STATE }, { ...DEFAULT_CHANNEL_STATE }]);

  // Effect configuration - 2 channels
  const [effectStates, setEffectStates] = useState([{ ...DEFAULT_EFFECT_STATE }, { ...DEFAULT_EFFECT_STATE }]);

  // Update a specific channel
  const updateChannel = useCallback((channelIndex, updates) => {
    setChannels((prev) => {
      const newChannels = [...prev];
      newChannels[channelIndex] = {
        ...newChannels[channelIndex],
        ...updates,
      };
      return newChannels;
    });
  }, []);

  // Update effect state for a specific channel
  const updateEffect = useCallback((channelIndex, updates) => {
    setEffectStates((prev) => {
      const newEffects = [...prev];
      newEffects[channelIndex] = {
        ...newEffects[channelIndex],
        ...updates,
      };
      return newEffects;
    });
  }, []);

  // Update effect color for a specific channel
  const updateEffectColor = useCallback((channelIndex, colorUpdates) => {
    setEffectStates((prev) => {
      const newEffects = [...prev];
      newEffects[channelIndex] = {
        ...newEffects[channelIndex],
        color: {
          ...newEffects[channelIndex].color,
          ...colorUpdates,
        },
      };
      return newEffects;
    });
  }, []);

  // Update LED enabled state for a specific channel
  const updateLedEnabled = useCallback((channelIndex, enabled) => {
    setLedEnabled((prev) => {
      const newEnabled = [...prev];
      newEnabled[channelIndex] = enabled;
      return newEnabled;
    });
  }, []);

  // Update selected channel state
  const updateSelectedChannel = useCallback((channelIndex, selected) => {
    setSelectedChannels((prev) => {
      const newSelected = [...prev];
      newSelected[channelIndex] = selected;
      return newSelected;
    });
  }, []);

  // Reset all state to defaults
  const resetState = useCallback(() => {
    setActiveTab("hardware");
    setLoading(false);
    setSending(false);
    setSelectedChannels([true, true]);
    setLedEnabled([false, false]);
    setChannels([{ ...DEFAULT_CHANNEL_STATE }, { ...DEFAULT_CHANNEL_STATE }]);
    setEffectStates([{ ...DEFAULT_EFFECT_STATE }, { ...DEFAULT_EFFECT_STATE }]);
  }, []);

  // Set state from loaded config
  // Input format: array of { channelIndex, config } where config has { hardware, effect }
  const setFromConfig = useCallback((results) => {
    if (!Array.isArray(results)) return;

    setChannels((prev) => {
      const newChannels = [...prev];
      results.forEach(({ channelIndex, config }) => {
        if (channelIndex >= 0 && channelIndex < newChannels.length && config.hardware) {
          newChannels[channelIndex] = {
            pixelAmount: config.hardware.pixelAmount ?? DEFAULT_CHANNEL_STATE.pixelAmount,
            icType: config.hardware.icType ?? DEFAULT_CHANNEL_STATE.icType,
            colorType: config.hardware.colorType ?? DEFAULT_CHANNEL_STATE.colorType,
            direction: config.hardware.direction ?? DEFAULT_CHANNEL_STATE.direction,
            custom: config.hardware.custom ?? DEFAULT_CHANNEL_STATE.custom,
            bit0HighTime: config.hardware.bit0HighTime ?? DEFAULT_CHANNEL_STATE.bit0HighTime,
            bit1HighTime: config.hardware.bit1HighTime ?? DEFAULT_CHANNEL_STATE.bit1HighTime,
            overallBitTime: config.hardware.overallBitTime ?? DEFAULT_CHANNEL_STATE.overallBitTime,
            resetCycle: config.hardware.resetCycle ?? DEFAULT_CHANNEL_STATE.resetCycle,
          };
        }
      });
      return newChannels;
    });

    setEffectStates((prev) => {
      const newEffects = [...prev];
      results.forEach(({ channelIndex, config }) => {
        if (channelIndex >= 0 && channelIndex < newEffects.length && config.effect) {
          newEffects[channelIndex] = {
            effect: config.effect.effect ?? DEFAULT_EFFECT_STATE.effect,
            speed: config.effect.speed ?? DEFAULT_EFFECT_STATE.speed,
            brightness: config.effect.brightness ?? DEFAULT_EFFECT_STATE.brightness,
            color: {
              r: config.effect.color?.r ?? DEFAULT_EFFECT_STATE.color.r,
              g: config.effect.color?.g ?? DEFAULT_EFFECT_STATE.color.g,
              b: config.effect.color?.b ?? DEFAULT_EFFECT_STATE.color.b,
              w: config.effect.color?.w ?? DEFAULT_EFFECT_STATE.color.w,
            },
          };
        }
      });
      return newEffects;
    });
  }, []);

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Loading states
    loading,
    setLoading,
    sending,
    setSending,

    // Selected channels for read/send
    selectedChannels,
    updateSelectedChannel,

    // LED on/off state per channel
    ledEnabled,
    updateLedEnabled,

    // Channel state
    channels,
    setChannels,
    updateChannel,

    // Effect state
    effectStates,
    setEffectStates,
    updateEffect,
    updateEffectColor,

    // Helpers
    resetState,
    setFromConfig,
  };
}
