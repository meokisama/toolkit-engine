import { useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Sparkles, Download, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import log from "electron-log/renderer";
import { useLedSpiState } from "./hooks/use-led-spi-state";
import { HardwareConfigTab } from "./components/hardware-config-tab";
import { EffectControlTab } from "./components/effect-control-tab";

export function LedSpiControlDialog({ open, onOpenChange, unit }) {
  const {
    activeTab,
    setActiveTab,
    loading,
    setLoading,
    sending,
    setSending,
    selectedChannels,
    updateSelectedChannel,
    ledEnabled,
    updateLedEnabled,
    channels,
    updateChannel,
    effectStates,
    updateEffect,
    updateEffectColor,
    resetState,
    setFromConfig,
  } = useLedSpiState();

  // Read configuration for selected channels
  const handleReadConfig = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    const selectedIndices = selectedChannels.map((selected, index) => (selected ? index : -1)).filter((i) => i !== -1);
    if (selectedIndices.length === 0) {
      toast.error("Please select at least one channel");
      return;
    }

    setLoading(true);
    try {
      const results = [];

      // Read config for each selected channel
      for (const channelIndex of selectedIndices) {
        const channelNumber = channelIndex + 1; // API uses 1-based channel
        const config = await window.electronAPI.ledSpiController.getLedConfig(unit.ip_address, unit.id_can, channelNumber);

        if (config) {
          results.push({ channelIndex, config });
        }
      }

      if (results.length > 0) {
        // Update state with received configs
        setFromConfig(results);
        const channelNames = selectedIndices.map((i) => `Channel ${i + 1}`).join(", ");
        toast.success(`Configuration read for ${channelNames}`);
      } else {
        toast.info("No LED SPI configuration found");
      }
    } catch (error) {
      log.error("Failed to read LED SPI configuration:", error);
      toast.error(`Failed to read configuration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [unit, selectedChannels, setLoading, setFromConfig]);

  // Send configuration based on active tab
  const handleSendConfig = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    const selectedIndices = selectedChannels.map((selected, index) => (selected ? index : -1)).filter((i) => i !== -1);
    if (selectedIndices.length === 0) {
      toast.error("Please select at least one channel");
      return;
    }

    setSending(true);
    try {
      const successChannels = [];
      const failedChannels = [];

      for (const channelIndex of selectedIndices) {
        const channelNumber = channelIndex + 1; // API uses 1-based channel

        try {
          if (activeTab === "hardware") {
            // Send hardware configuration
            const config = channels[channelIndex];
            await window.electronAPI.ledSpiController.setHardwareConfig(unit.ip_address, unit.id_can, channelNumber, {
              pixelAmount: config.pixelAmount,
              custom: config.custom,
              icType: config.icType,
              colorType: config.colorType,
              direction: config.direction,
              bit0HighTime: config.bit0HighTime,
              bit1HighTime: config.bit1HighTime,
              overallBitTime: config.overallBitTime,
              resetCycle: config.resetCycle,
            });
          } else {
            // Send effect control
            const effect = effectStates[channelIndex];
            await window.electronAPI.ledSpiController.setEffectControl(unit.ip_address, unit.id_can, channelNumber, {
              effect: effect.effect,
              speed: effect.speed,
              brightness: effect.brightness,
              color: {
                r: effect.color.r,
                g: effect.color.g,
                b: effect.color.b,
                w: effect.color.w,
              },
            });
            await window.electronAPI.ledSpiController.changeLedMode(unit.ip_address, unit.id_can, channelNumber, effect.mode ?? 0);
          }
          successChannels.push(channelNumber);
        } catch (error) {
          log.error(`Failed to send config for channel ${channelNumber}:`, error);
          failedChannels.push(channelNumber);
        }
      }

      if (successChannels.length > 0) {
        const configType = activeTab === "hardware" ? "Hardware" : "Effect";
        toast.success(`${configType} configuration sent for Channel ${successChannels.join(", ")}`);
      }

      if (failedChannels.length > 0) {
        toast.error(`Failed to send for Channel ${failedChannels.join(", ")}`);
      }
    } catch (error) {
      log.error("Failed to send LED SPI configuration:", error);
      toast.error(`Failed to send configuration: ${error.message}`);
    } finally {
      setSending(false);
    }
  }, [unit, activeTab, selectedChannels, channels, effectStates, setSending]);

  // Handle LED trigger (Switch on/off)
  const handleLedTrigger = useCallback(
    async (channelIndex, enabled) => {
      if (!unit) {
        toast.error("No unit selected");
        return;
      }

      const channelNumber = channelIndex + 1;

      try {
        // Send effect config before turning ON
        if (enabled) {
          const effect = effectStates[channelIndex];
          await window.electronAPI.ledSpiController.setEffectControl(unit.ip_address, unit.id_can, channelNumber, {
            effect: effect.effect,
            speed: effect.speed,
            brightness: effect.brightness,
            color: {
              r: effect.color.r,
              g: effect.color.g,
              b: effect.color.b,
              w: effect.color.w,
            },
          });
        }

        await window.electronAPI.ledSpiController.triggerLed(unit.ip_address, unit.id_can, channelNumber, enabled);
        updateLedEnabled(channelIndex, enabled);
        toast.success(`Channel ${channelNumber} LED ${enabled ? "ON" : "OFF"}`);
      } catch (error) {
        log.error(`Failed to trigger LED for channel ${channelNumber}:`, error);
        toast.error(`Failed to trigger LED: ${error.message}`);
      }
    },
    [unit, effectStates, updateLedEnabled],
  );

  const handleDialogOpenChange = useCallback(
    (newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) {
        resetState();
      }
    },
    [onOpenChange, resetState],
  );

  const isDisabled = loading || sending;
  const hasSelectedChannels = selectedChannels.some((selected) => selected);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            LED SPI Control
          </DialogTitle>
          <DialogDescription>
            Configure LED SPI settings for unit {unit?.type} ({unit?.ip_address})
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hardware" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Hardware Configuration
            </TabsTrigger>
            <TabsTrigger value="effect" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Effect Control
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-280px)]">
            <TabsContent value="hardware" className="mt-0">
              <HardwareConfigTab
                channels={channels}
                selectedChannels={selectedChannels}
                onUpdateChannel={updateChannel}
                onSelectedChange={updateSelectedChannel}
                disabled={isDisabled}
              />
            </TabsContent>

            <TabsContent value="effect" className="mt-0">
              <EffectControlTab
                effectStates={effectStates}
                selectedChannels={selectedChannels}
                ledEnabled={ledEnabled}
                onUpdateEffect={updateEffect}
                onUpdateColor={updateEffectColor}
                onSelectedChange={updateSelectedChannel}
                onUpdateLedEnabled={handleLedTrigger}
                disabled={isDisabled}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleReadConfig} disabled={isDisabled || !hasSelectedChannels}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {loading ? "Reading..." : "Read Configuration"}
            </Button>

            <Button onClick={handleSendConfig} disabled={isDisabled || !hasSelectedChannels}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {sending ? "Sending..." : "Send Configuration"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
