"use client";

import { memo, useCallback, useState, useEffect, useRef } from "react";
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
  { value: 0, label: "Cool", icon: <Thermometer className="h-5 w-5" /> },
  { value: 1, label: "Heat", icon: <Sun className="h-5 w-5" /> },
  { value: 2, label: "Ventilation", icon: <Fan className="h-5 w-5" /> },
  { value: 3, label: "Dry", icon: <Droplet className="h-5 w-5" /> },
];

const FanModes = [
  { value: 0, label: "Low" },
  { value: 1, label: "Med" },
  { value: 2, label: "High" },
  { value: 3, label: "Auto" },
  { value: 4, label: "Off" },
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
    acMode: 0, // Cool mode (updated to match new protocol)
    fanMode: 3, // Auto
    setpoint: 25.0,
    ecoMode: false,
    lastActiveMode: 0, // Cool mode (updated to match new protocol)
  });

  // Loading states for individual controls
  const [loadingStates, setLoadingStates] = useState({
    power: false,
    acMode: false,
    fanMode: false,
    temperature: false,
  });

  // Debounce timer for temperature changes
  const temperatureTimeoutRef = useRef(null);

  // Auto refresh interval
  const autoRefreshIntervalRef = useRef(null);

  // Fetch AC status from device (with loading indicator)
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
        roomTemp: acStatus.roomTemperature, // Updated field name
        thermostatStatus: acStatus.status, // Updated field name
        occupancyStatus: 1, // Default value since not in new protocol
      });

      const newSettings = {
        power: acStatus.power, // Already boolean in new protocol
        acMode: acStatus.mode, // Updated field name
        fanMode: acStatus.fanSpeed, // Updated field name
        setpoint: acStatus.temperature, // Updated field name
        ecoMode: false, // Default value since not in new protocol
        lastActiveMode: acStatus.mode || 0,
      };

      setControlSettings((prev) => ({
        ...prev,
        ...newSettings,
      }));
    } catch (error) {
      console.error("Failed to fetch AC status:", error);
      toast.error(`Failed to fetch AC status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [room, acGroup]);

  // Auto refresh AC status (without loading indicator)
  const autoRefreshStatus = useCallback(async () => {
    if (!room?.unit?.ip_address || !room?.unit?.id_can) return;

    try {
      const acStatus = await window.electronAPI.rcuController.getACStatus({
        unitIp: room.unit.ip_address,
        canId: room.unit.id_can,
        group: acGroup,
      });

      console.log("Auto refresh - AC Status received:", acStatus);

      setStatus({
        roomTemp: acStatus.roomTemperature,
        thermostatStatus: acStatus.status,
        occupancyStatus: 1,
      });

      const newSettings = {
        power: acStatus.power,
        acMode: acStatus.mode,
        fanMode: acStatus.fanSpeed,
        setpoint: acStatus.temperature,
        ecoMode: false,
        lastActiveMode: acStatus.mode || 0,
      };

      setControlSettings((prev) => ({
        ...prev,
        ...newSettings,
      }));
    } catch (error) {
      console.error("Auto refresh failed:", error);
      // Don't show toast for auto refresh errors to avoid spam
    }
  }, [room, acGroup]);

  // Send power mode command immediately
  const sendPowerMode = useCallback(
    async (power) => {
      if (!room?.unit?.ip_address || !room?.unit?.id_can) return;

      setLoadingStates((prev) => ({ ...prev, power: true }));
      try {
        await window.electronAPI.rcuController.setPowerMode({
          unitIp: room.unit.ip_address,
          canId: room.unit.id_can,
          group: acGroup,
          power,
        });
        console.log("Power mode set:", power);
        toast.success(`Đã ${power ? "bật" : "tắt"} điều hòa`);
      } catch (error) {
        console.error("Failed to set power mode:", error);
        toast.error(
          `Lỗi khi ${power ? "bật" : "tắt"} điều hòa: ${error.message}`
        );
        // Revert the change on error
        setControlSettings((prev) => ({ ...prev, power: !power }));
      } finally {
        setLoadingStates((prev) => ({ ...prev, power: false }));
      }
    },
    [room, acGroup]
  );

  // Send AC mode command immediately
  const sendACMode = useCallback(
    async (acMode) => {
      if (!room?.unit?.ip_address || !room?.unit?.id_can) return;

      setLoadingStates((prev) => ({ ...prev, acMode: true }));
      try {
        await window.electronAPI.rcuController.setOperateMode({
          unitIp: room.unit.ip_address,
          canId: room.unit.id_can,
          group: acGroup,
          mode: acMode,
        });
        console.log("AC mode set:", acMode);
        const modeNames = ["Cool", "Heat", "Ventilation", "Dry"];
        toast.success(`Đã chuyển sang chế độ ${modeNames[acMode] || acMode}`);
      } catch (error) {
        console.error("Failed to set AC mode:", error);
        toast.error(`Lỗi khi đổi chế độ điều hòa: ${error.message}`);
        // Revert the change on error
        setControlSettings((prev) => ({
          ...prev,
          acMode: prev.lastActiveMode || 0,
        }));
      } finally {
        setLoadingStates((prev) => ({ ...prev, acMode: false }));
      }
    },
    [room, acGroup]
  );

  // Send fan mode command immediately
  const sendFanMode = useCallback(
    async (fanMode) => {
      if (!room?.unit?.ip_address || !room?.unit?.id_can) return;

      setLoadingStates((prev) => ({ ...prev, fanMode: true }));
      try {
        await window.electronAPI.rcuController.setFanMode({
          unitIp: room.unit.ip_address,
          canId: room.unit.id_can,
          group: acGroup,
          fanSpeed: fanMode,
        });
        console.log("Fan mode set:", fanMode);
        const fanNames = ["Low", "Med", "High", "Auto", "Off"];
        toast.success(
          `Đã chuyển tốc độ quạt sang ${fanNames[fanMode] || fanMode}`
        );
      } catch (error) {
        console.error("Failed to set fan mode:", error);
        toast.error(`Lỗi khi đổi tốc độ quạt: ${error.message}`);
        // Revert the change on error
        setControlSettings((prev) => ({ ...prev, fanMode: 3 })); // Default to Auto
      } finally {
        setLoadingStates((prev) => ({ ...prev, fanMode: false }));
      }
    },
    [room, acGroup]
  );

  // Send temperature command with debounce
  const sendTemperature = useCallback(
    async (temperature) => {
      if (!room?.unit?.ip_address || !room?.unit?.id_can) return;

      setLoadingStates((prev) => ({ ...prev, temperature: true }));
      try {
        await window.electronAPI.rcuController.setSettingRoomTemp({
          unitIp: room.unit.ip_address,
          canId: room.unit.id_can,
          group: acGroup,
          temperature,
        });
        console.log("Temperature set:", temperature);
        toast.success(`Đã đặt nhiệt độ ${temperature}°C`);
      } catch (error) {
        console.error("Failed to set temperature:", error);
        toast.error(`Lỗi khi đặt nhiệt độ: ${error.message}`);
      } finally {
        setLoadingStates((prev) => ({ ...prev, temperature: false }));
      }
    },
    [room, acGroup]
  );

  // Update control settings with immediate command sending
  const updateControlSettings = useCallback(
    (updates) => {
      setControlSettings((prev) => {
        const newSettings = { ...prev, ...updates };

        // Send commands immediately based on what changed
        if (updates.hasOwnProperty("power")) {
          sendPowerMode(updates.power);
          if (updates.power) {
            // If turning on, use the last active mode or default to cool (0)
            const activeMode =
              updates.lastActiveMode || prev.lastActiveMode || 0;
            newSettings.acMode = activeMode;
            if (activeMode !== prev.acMode) {
              setTimeout(() => sendACMode(activeMode), 500); // Small delay after power on
            }
          } else {
            // If turning off, save the current mode as lastActiveMode
            newSettings.lastActiveMode =
              prev.acMode !== undefined ? prev.acMode : prev.lastActiveMode;
          }
        }

        if (updates.hasOwnProperty("acMode") && prev.power) {
          sendACMode(updates.acMode);
          // Save as last active mode
          newSettings.lastActiveMode = updates.acMode;
        }

        if (updates.hasOwnProperty("fanMode") && prev.power) {
          sendFanMode(updates.fanMode);
        }

        if (updates.hasOwnProperty("setpoint") && prev.power) {
          // Clear existing timeout
          if (temperatureTimeoutRef.current) {
            clearTimeout(temperatureTimeoutRef.current);
          }
          // Set new timeout for debounced temperature sending
          temperatureTimeoutRef.current = setTimeout(() => {
            sendTemperature(updates.setpoint);
          }, 500); // 500ms debounce
        }

        return newSettings;
      });
    },
    [sendPowerMode, sendACMode, sendFanMode, sendTemperature]
  );

  const getTemperatureColor = useCallback((temp) => {
    if (temp < 20) return "#3b82f6"; // Blue for cold
    if (temp < 25) return "#10b981"; // Green for comfortable
    if (temp < 30) return "#f59e0b"; // Orange for warm
    return "#ef4444"; // Red for hot
  }, []);

  useEffect(() => {
    setAcGroup(room?.acGroup || 1);
  }, [room]);

  // Auto refresh when dialog is open
  useEffect(() => {
    if (open && room?.unit?.ip_address && room?.unit?.id_can) {
      // Initial fetch when dialog opens
      autoRefreshStatus();

      // Setup auto refresh interval
      autoRefreshIntervalRef.current = setInterval(() => {
        autoRefreshStatus();
      }, 1000); // Refresh every 1 second

      console.log("Auto refresh started for AC control");
    }

    // Cleanup when dialog closes or dependencies change
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
        console.log("Auto refresh stopped for AC control");
      }
    };
  }, [open, room?.unit?.ip_address, room?.unit?.id_can, autoRefreshStatus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (temperatureTimeoutRef.current) {
        clearTimeout(temperatureTimeoutRef.current);
      }
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

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
                    <p className="uppercase text-xs font-light mb-2 text-gray-400 flex items-center justify-center gap-2">
                      Cài đặt nhiệt độ
                      {loadingStates.temperature && (
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                      )}
                    </p>
                    {loading || loadingStates.temperature
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
              {loadingStates.power && (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              )}
            </div>
            <Switch
              checked={controlSettings.power}
              disabled={loadingStates.power}
              onCheckedChange={(checked) => {
                updateControlSettings({ power: checked });
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
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 text-center flex items-center justify-center gap-2">
              CHẾ ĐỘ ĐIỀU HÒA
              {loadingStates.acMode && (
                <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
              )}
            </div>
            <div
              className={cn(
                "grid grid-cols-4 gap-0.5 border border-blue-200 dark:border-gray-700 bg-card rounded-lg overflow-hidden shadow-sm",
                !controlSettings.power || loadingStates.acMode
                  ? "opacity-50 pointer-events-none"
                  : ""
              )}
            >
              {ACModes.map((mode) => (
                <Button
                  key={mode.value}
                  variant="ghost"
                  disabled={!controlSettings.power || loadingStates.acMode}
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
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1 text-center flex items-center justify-center gap-2">
              TỐC ĐỘ QUẠT
              {loadingStates.fanMode && (
                <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
              )}
            </div>
            <div
              className={cn(
                "grid grid-cols-5 border border-blue-200 dark:border-gray-700 bg-card rounded-lg overflow-hidden shadow-sm",
                !controlSettings.power || loadingStates.fanMode
                  ? "opacity-50 pointer-events-none"
                  : ""
              )}
            >
              {FanModes.map((mode) => (
                <Button
                  key={mode.value}
                  variant="ghost"
                  disabled={!controlSettings.power || loadingStates.fanMode}
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

        <DialogFooter className="flex !justify-center pt-2">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
