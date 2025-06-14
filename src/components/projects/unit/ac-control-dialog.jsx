"use client";

import { memo, useCallback, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Thermometer,
  Power,
  Sun,
  Fan,
  Check,
  RefreshCw,
  Droplet,
  Book,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CircularSlider from "@fseehawer/react-circular-slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ACModes = [
  { value: 1, label: "Cool", icon: <Thermometer className="h-5 w-5" /> },
  { value: 2, label: "Heat", icon: <Sun className="h-5 w-5" /> },
  { value: 3, label: "Fan", icon: <Fan className="h-5 w-5" /> },
  { value: 4, label: "Dry", icon: <Droplet className="h-5 w-5" /> },
  { value: 5, label: "Auto", icon: <RefreshCw className="h-5 w-5" /> },
];

const FanModes = [
  { value: 3, label: "Auto" },
  { value: 0, label: "Low" },
  { value: 1, label: "Med" },
  { value: 2, label: "High" },
];

export const RoomControlDialog = memo(function RoomControlDialog({
  room,
  open,
  onOpenChange,
}) {
  // State management for AC control
  const [loading, setLoading] = useState(false);
  const [acGroup, setAcGroup] = useState(room?.acGroup || 1);
  const [status, setStatus] = useState({
    roomTemp: 25.0,
    thermostatStatus: 0,
    occupancyStatus: 1,
  });

  const [controlSettings, setControlSettings] = useState({
    power: false,
    acMode: 1, // Cool mode
    fanMode: 3, // Auto
    setpoint: 25.0,
    ecoMode: false,
    lastActiveMode: 1,
  });

  // Fetch AC status from device
  const fetchRoomStatus = useCallback(async () => {
    if (!room?.unit?.ip_address || !room?.unit?.id_can) return;

    setLoading(true);
    try {
      const acStatus = await window.electronAPI.rcuController.getACStatus({
        unitIp: room.unit.ip_address,
        canId: room.unit.id_can,
        group: acGroup,
      });

      console.log("AC Status received:", acStatus);

      setStatus({
        roomTemp: acStatus.roomTemp,
        thermostatStatus: acStatus.thermostatStatus,
        occupancyStatus: acStatus.occupancyStatus,
      });

      setControlSettings((prev) => ({
        ...prev,
        power: acStatus.powerMode === 1,
        acMode: acStatus.operateMode,
        fanMode: acStatus.occupiedFanSpeed,
        setpoint: acStatus.settingTemp,
        ecoMode: acStatus.ecoMode === 1,
      }));
    } catch (error) {
      console.error("Failed to fetch AC status:", error);
      toast.error(`Failed to fetch AC status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [room, acGroup]);

  // Update control settings
  const updateControlSettings = useCallback((updates) => {
    setControlSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Apply settings to device
  const handleApplySettings = useCallback(async () => {
    if (!room?.unit?.ip_address || !room?.unit?.id_can) return;

    setLoading(true);
    try {
      const group = acGroup;
      const unitIp = room.unit.ip_address;
      const canId = room.unit.id_can;

      // Set power mode
      await window.electronAPI.rcuController.setPowerMode({
        unitIp,
        canId,
        group,
        power: controlSettings.power,
      });

      if (controlSettings.power) {
        // Set operate mode
        await window.electronAPI.rcuController.setOperateMode({
          unitIp,
          canId,
          group,
          mode: controlSettings.acMode,
        });

        // Set fan mode
        await window.electronAPI.rcuController.setFanMode({
          unitIp,
          canId,
          group,
          fanSpeed: controlSettings.fanMode,
        });

        // Set temperature
        await window.electronAPI.rcuController.setSettingRoomTemp({
          unitIp,
          canId,
          group,
          temperature: controlSettings.setpoint,
        });

        // Set eco mode
        await window.electronAPI.rcuController.setEcoMode({
          unitIp,
          canId,
          group,
          eco: controlSettings.ecoMode,
        });
      }

      toast.success("AC settings applied successfully");

      // Refresh status after applying
      setTimeout(() => {
        fetchRoomStatus();
      }, 1000);
    } catch (error) {
      console.error("Failed to apply AC settings:", error);
      toast.error(`Failed to apply settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [room, controlSettings, fetchRoomStatus, acGroup]);

  const getTemperatureColor = useCallback((temp) => {
    if (temp < 20) return "#3b82f6"; // Blue for cold
    if (temp < 25) return "#10b981"; // Green for comfortable
    if (temp < 30) return "#f59e0b"; // Orange for warm
    return "#ef4444"; // Red for hot
  }, []);

  useEffect(() => {
    setAcGroup(room?.acGroup || 1);
  }, [room]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-[400px] max-h-[90%] overflow-y-auto bg-white dark:bg-accent text-gray-800 border-gray-200 dark:border-gray-700 shadow-xl rounded-xl">
        <DialogTitle className="sr-only">Settings Dialog</DialogTitle>
        <div className="flex flex-col items-center py-4 space-y-8">
          {/* Temperature Control Dial */}
          <div className="relative w-full max-w-[280px] sm:w-64 sm:h-64 flex flex-col items-center justify-center">
            <CircularSlider
              width={
                window.innerWidth < 640
                  ? Math.min(window.innerWidth - 80, 240)
                  : 240
              }
              min={18}
              max={32}
              direction={1}
              knobColor={getTemperatureColor(controlSettings.setpoint)}
              progressColorFrom={getTemperatureColor(controlSettings.setpoint)}
              progressColorTo={getTemperatureColor(controlSettings.setpoint)}
              progressSize={10}
              trackColor="#e5e7eb"
              trackSize={10}
              dataIndex={Math.round((controlSettings.setpoint || 25) * 2) - 36} // Convert temperature to index (18°C = 0, 18.5°C = 1, etc.)
              data={[...Array(29)].map((_, i) => (18 + i * 0.5).toFixed(1))} // Generate array of temperatures from 18 to 32 in 0.5 increments
              onChange={useCallback(
                (value) => {
                  const tempValue =
                    typeof value === "string" ? parseFloat(value) : value;
                  updateControlSettings({ setpoint: tempValue });
                },
                [updateControlSettings]
              )}
              appendToValue="°"
              renderLabelValue={
                <div className="flex flex-col items-center -z-10 mt-1 absolute top-0 left-0 w-full h-full justify-center gap-2">
                  <div
                    className="text-5xl font-light transition-all duration-300 text-center"
                    style={{
                      color: getTemperatureColor(controlSettings.setpoint),
                    }}
                  >
                    <p className="uppercase text-xs font-light mb-2 text-gray-400">
                      Cài đặt nhiệt độ
                    </p>
                    {loading
                      ? "..."
                      : controlSettings.setpoint !== undefined
                      ? controlSettings.setpoint.toFixed(1)
                      : "--"}
                  </div>
                  <div className="text-lg text-gray-500 mt-2 font-medium ">
                    <span className="text-center bg-gray-50 px-3 py-1 rounded-md shadow-inner">
                      {loading
                        ? "..."
                        : status.roomTemp !== undefined
                        ? `${status.roomTemp.toFixed(1)}`
                        : "--"}
                      °
                    </span>
                  </div>
                </div>
              }
            />
          </div>

          {/* Power Switch */}
          <div className="w-full flex items-center justify-between bg-gray-50 dark:bg-card px-6 py-4 rounded-lg shadow-inner">
            <div className="flex items-center gap-2">
              <Power className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Power
              </span>
            </div>
            <Switch
              checked={controlSettings.power}
              onCheckedChange={(checked) => {
                if (checked) {
                  // If turning on, use the last active mode or default to cool
                  const activeMode = controlSettings.lastActiveMode || 1;
                  updateControlSettings({
                    power: true,
                    acMode: activeMode,
                  });
                  console.log("Power ON, setting mode to:", activeMode);
                } else {
                  // If turning off, save the current mode as lastActiveMode
                  const currentMode = controlSettings.acMode;
                  updateControlSettings({
                    power: false,
                    lastActiveMode:
                      currentMode || controlSettings.lastActiveMode,
                  });
                  console.log("Power OFF, saving last mode:", currentMode);
                }
              }}
              thumbClassName="h-6 w-6 data-[state=checked]:translate-x-5"
              className={
                controlSettings.power
                  ? "bg-blue-500 data-[state=checked]:bg-blue-500 h-7 w-12"
                  : "bg-gray-300 data-[state=unchecked]:bg-gray-300 dark:bg-gray-500 dark:data-[state=unchecked]:bg-gray-500 h-7 w-12"
              }
            />
          </div>

          {/* AC Mode Selection */}
          <div className="w-full">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 text-center">
              CHẾ ĐỘ ĐIỀU HÒA
            </div>
            <div
              className={cn(
                "grid grid-cols-5 gap-0.5 border border-blue-200 dark:border-gray-700 bg-card rounded-lg overflow-hidden shadow-sm",
                !controlSettings.power ? "opacity-50 pointer-events-none" : ""
              )}
            >
              {ACModes.map((mode) => (
                <Button
                  key={mode.value}
                  variant="ghost"
                  disabled={!controlSettings.power}
                  className={cn(
                    "flex flex-col items-center justify-center h-16 rounded-none border-0 transition-all duration-200",
                    controlSettings.acMode === mode.value
                      ? "bg-gradient-to-b from-blue-400 to-blue-500 text-white shadow-inner"
                      : "bg-card text-blue-600 hover:bg-blue-50"
                  )}
                  onClick={() => updateControlSettings({ acMode: mode.value })}
                >
                  <div className="mb-1">{mode.icon}</div>
                  <div className="text-xs font-medium">{mode.label}</div>
                </Button>
              ))}
            </div>
          </div>

          {/* Fan Mode Selection */}
          <div className="w-full">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 text-center">
              TỐC ĐỘ QUẠT
            </div>
            <div
              className={cn(
                "grid grid-cols-4 border border-blue-200 dark:border-gray-700 bg-card rounded-lg overflow-hidden shadow-sm",
                !controlSettings.power ? "opacity-50 pointer-events-none" : ""
              )}
            >
              {FanModes.map((mode) => (
                <Button
                  key={mode.value}
                  variant="ghost"
                  disabled={!controlSettings.power}
                  className={cn(
                    "h-12 rounded-none border-0 transition-all duration-200",
                    controlSettings.fanMode === mode.value
                      ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-inner"
                      : "bg-card text-blue-600 hover:bg-blue-50"
                  )}
                  onClick={() => updateControlSettings({ fanMode: mode.value })}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex !justify-between pt-2">
          <div className="flex items-center justify-center gap-2">
            <div className="relative">
              <Book className="text-sm font-medium absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="ac-group"
                type="number"
                min="1"
                max="50"
                value={acGroup}
                onChange={(e) => setAcGroup(parseInt(e.target.value) || 1)}
                className="w-16 text-center font-bold [&::-webkit-inner-spin-button]:appearance-none pl-7"
                placeholder="1"
              />
            </div>
            <Button
              onClick={fetchRoomStatus}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Get State</span>
            </Button>
          </div>
          <Button
            onClick={handleApplySettings}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>{loading ? "Applying..." : "Apply"}</span>
            <span className="sm:hidden">{loading ? "..." : ""}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
