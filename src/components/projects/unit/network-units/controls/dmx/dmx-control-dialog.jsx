import { useState, useCallback, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Palette } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import log from "electron-log/renderer";

// Initial state for better state management
const initialState = {
  dmxDevices: [],
  showDmxDevices: false,
};

const initialLoadingState = {
  loading: false,
};

// Color display component for a single color (RGBW)
const ColorBox = memo(({ color, sceneIndex }) => (
  <div className="flex flex-col items-center gap-1">
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="w-12 h-12 rounded border border-gray-300"
          style={{
            backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
          }}
          // title={`Color ${sceneIndex + 1}: R:${color.r} G:${color.g} B:${color.b} W:${color.w}`}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-bold">
          <span className="text-red-400">Red:</span> {color.r}, <span className="text-green-400">Green:</span> {color.g},{" "}
          <span className="text-blue-400">Blue:</span> {color.b}, White: {color.w}
        </p>
      </TooltipContent>
    </Tooltip>
    <span className="text-xs text-muted-foreground">
      C{sceneIndex + 1} (W:{color.w})
    </span>
  </div>
));

ColorBox.displayName = "ColorBox";

// Memoized DmxDeviceCard component to prevent unnecessary re-renders
const DmxDeviceCard = memo(({ device }) => (
  <Card className="relative">
    <CardContent>
      <div className="space-y-4">
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <span className="text-lg font-bold">Device {device.deviceIndex + 1}</span>
        </CardTitle>

        {/* Display 16 colors in a grid */}
        <div className="grid grid-cols-8 gap-2">
          {device.colors.map((color, index) => (
            <ColorBox key={`color-${index}`} color={color} sceneIndex={index} />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
));

DmxDeviceCard.displayName = "DmxDeviceCard";

export function DmxControlDialog({ open, onOpenChange, unit }) {
  const [state, setState] = useState(initialState);
  const [loadingState, setLoadingState] = useState(initialLoadingState);

  // Reset state when dialog opens/closes or unit changes
  useEffect(() => {
    if (!open) {
      setState(initialState);
      setLoadingState(initialLoadingState);
    }
  }, [open, unit?.ip_address, unit?.id_can]);

  const handleLoadAllDmxDevices = useCallback(async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingState((prev) => ({ ...prev, loading: true }));
    try {
      const devices = await window.electronAPI.dmxController.getDmxColor(unit.ip_address, unit.id_can);

      if (devices && devices.length > 0) {
        setState((prev) => ({
          ...prev,
          dmxDevices: devices,
          showDmxDevices: true,
        }));
        toast.success(`Loaded ${devices.length} DMX device(s) successfully`);
      } else {
        setState((prev) => ({
          ...prev,
          dmxDevices: [],
          showDmxDevices: true,
        }));
        toast.info("No DMX devices found on this unit");
      }
    } catch (error) {
      log.error("Failed to load DMX devices:", error);
      toast.error(`Failed to load DMX devices: ${error.message}`);
    } finally {
      setLoadingState((prev) => ({ ...prev, loading: false }));
    }
  }, [unit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            DMX Control
          </DialogTitle>
          <DialogDescription>
            Load and view DMX color configurations on unit {unit?.ip_address} (CAN ID: {unit?.id_can}).
          </DialogDescription>
        </DialogHeader>

        {/* DMX Devices Display - Always show ScrollArea */}
        <ScrollArea className="h-[calc(90vh-250px)] w-full p-4">
          {state.showDmxDevices && state.dmxDevices.length > 0 ? (
            <div className="grid gap-3">
              {state.dmxDevices.map((device, index) => (
                <DmxDeviceCard key={`dmx-device-${device.deviceIndex}-${index}`} device={device} />
              ))}
            </div>
          ) : state.showDmxDevices ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No DMX devices found.</p>
              <p className="text-sm">Try loading the DMX device configurations.</p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>Load DMX device information to see available configurations.</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={handleLoadAllDmxDevices} disabled={loadingState.loading} className="flex items-center gap-2">
              {loadingState.loading ? "Loading..." : "Load All DMX Devices"}
            </Button>

            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DmxControlDialog as TriggerDmxControlDialog };
