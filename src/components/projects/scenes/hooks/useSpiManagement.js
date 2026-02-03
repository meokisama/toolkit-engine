import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { OBJECT_TYPES } from "@/constants";
import { LED_EFFECTS } from "@/components/projects/unit/network-units/controls/led-spi/constants";

// Fixed SPI channels - no database table needed
const SPI_CHANNELS = [
  { address: 1, name: "SPI Channel 1" },
  { address: 2, name: "SPI Channel 2" },
];

// Map effect index to object type
const getObjectTypeForEffect = (effectIndex) => {
  const objectTypeKey = `LED_SPI_EFFECT${effectIndex + 1}`;
  return OBJECT_TYPES[objectTypeKey]?.obj_name || OBJECT_TYPES.LED_SPI_EFFECT1.obj_name;
};

export function useSpiManagement({ sceneItems, setSceneItems, mode }) {
  // Get available SPI channels that are not yet in the scene
  const filteredSpiChannels = useMemo(() => {
    return SPI_CHANNELS.filter((channel) => {
      return !sceneItems.some((item) => item.item_type === "spi" && item.item_address === channel.address);
    });
  }, [sceneItems]);

  // Add SPI channel to scene with default values
  const handleAddSpiChannel = useCallback(
    (channel) => {
      if (sceneItems.length >= 60) {
        toast.error("Maximum 60 items allowed per scene");
        return;
      }

      // Default: brightness 255, first effect (index 0)
      const defaultEffectIndex = 0;
      const defaultEffect = LED_EFFECTS[defaultEffectIndex];

      const newSceneItem = {
        id: mode === "edit" ? `temp_${Date.now()}` : Date.now(),
        item_type: "spi",
        item_id: null, // SPI doesn't have database ID
        item_value: "255", // Default brightness
        command: defaultEffectIndex.toString(), // Store effect index in command field
        object_type: getObjectTypeForEffect(defaultEffectIndex),
        item_name: channel.name,
        item_address: channel.address,
        item_description: defaultEffect.label,
        label: defaultEffect.label,
      };

      setSceneItems((prev) => [...prev, newSceneItem]);
    },
    [sceneItems.length, mode, setSceneItems],
  );

  // Update SPI effect for a scene item
  const updateSpiEffect = useCallback(
    (sceneItemId, effectIndex) => {
      const effect = LED_EFFECTS[effectIndex];
      if (!effect) return;

      setSceneItems((prev) =>
        prev.map((item) => {
          if (item.id === sceneItemId) {
            return {
              ...item,
              command: effectIndex.toString(),
              object_type: getObjectTypeForEffect(effectIndex),
              item_description: effect.label,
              label: effect.label,
            };
          }
          return item;
        }),
      );
    },
    [setSceneItems],
  );

  return {
    // Data
    spiChannels: SPI_CHANNELS,
    filteredSpiChannels,
    ledEffects: LED_EFFECTS,

    // Handlers
    handleAddSpiChannel,
    updateSpiEffect,
  };
}
