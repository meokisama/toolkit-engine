import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radio, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { NetworkUnitSelector, useNetworkUnitSelector } from "@/components/shared/network-unit-selector";
import { CONSTANTS } from "@/constants";
import log from "electron-log/renderer";

const EXPLORE_TIMEOUT_MS = 200000; // 200 seconds
const DEVICE_TYPE_LABELS = CONSTANTS.ZIGBEE.DEVICE_TYPE.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export function ExploreZigbeeDeviceDialog({ open, onOpenChange, onDevicesAdded }) {
  const { selectedProject } = useProjectDetail();
  const { selectedUnitIds, handleSelectionChange, clearSelection } = useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);
  const [exploring, setExploring] = useState(false);
  const [completed, setCompleted] = useState(false); // Track if exploration completed
  const [timeRemaining, setTimeRemaining] = useState(EXPLORE_TIMEOUT_MS / 1000);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [currentUnit, setCurrentUnit] = useState(null);
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const cleanupFunctionRef = useRef(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      clearSelection();
      setDiscoveredDevices([]);
      setTimeRemaining(EXPLORE_TIMEOUT_MS / 1000);
      setCurrentUnit(null);
      setCompleted(false); // Reset completed state
    }
  }, [open, clearSelection]);

  // Cleanup on dialog close or unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (cleanupFunctionRef.current) {
        cleanupFunctionRef.current();
        cleanupFunctionRef.current = null;
      }
    };
  }, []);

  const handleStopExploring = async () => {
    await window.electronAPI.zigbeeController.closeZigbeeNetwork({
      unitIp: currentUnit.ip_address,
      canId: currentUnit.id_can,
    });
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (cleanupFunctionRef.current) {
      cleanupFunctionRef.current();
      cleanupFunctionRef.current = null;
    }
    setExploring(false);
  };

  const handleStartExploring = async () => {
    // If completed, use the current unit to continue exploring
    let unit = currentUnit;

    if (!completed) {
      // First time exploring - need to select a unit
      if (selectedUnitIds.length === 0) {
        toast.error("Please select a unit");
        return;
      }

      // Get selected units from NetworkUnitSelector
      const selectedUnits = networkUnitSelectorRef.current?.getSelectedUnits() || [];

      if (selectedUnits.length === 0) {
        toast.error("Please select a unit");
        return;
      }

      // Only allow selecting one unit for exploration
      if (selectedUnits.length > 1) {
        toast.error("Please select only one unit for device exploration");
        return;
      }

      unit = selectedUnits[0];
      setCurrentUnit(unit);
    }

    // Reset states for new exploration
    setExploring(true);
    setCompleted(false);
    setTimeRemaining(EXPLORE_TIMEOUT_MS / 1000);
    startTimeRef.current = Date.now();

    // Start countdown timer
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.floor((EXPLORE_TIMEOUT_MS - elapsed) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }, 1000);

    toast.info("Zigbee network opened for pairing. Press the pairing button on your Zigbee device.");

    try {
      // Start exploring - this will open the network and listen for devices
      const response = await window.electronAPI.zigbeeController.exploreZigbeeNetwork({
        unitIp: unit.ip_address,
        canId: unit.id_can,
        timeoutMs: EXPLORE_TIMEOUT_MS,
      });

      // Store cleanup function if provided
      if (response.cleanup) {
        cleanupFunctionRef.current = response.cleanup;
      }

      // Process discovered devices
      if (response.devices && response.devices.length > 0) {
        // Stop timer and animation immediately when device is found
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setExploring(false);
        setCompleted(true);

        const savedDevices = [];

        for (const device of response.devices) {
          const deviceData = {
            unit_ip: unit.ip_address,
            unit_can_id: unit.id_can,
            ...device,
          };

          try {
            const savedDevice = await window.electronAPI.zigbee.createDevice(selectedProject.id, deviceData);
            savedDevices.push({
              ...savedDevice,
              success: true,
            });

            // Update discovered devices list
            setDiscoveredDevices((prev) => [
              ...prev,
              {
                ...savedDevice,
                success: true,
              },
            ]);

            toast.success(`New device added: ${device.ieee_address}`);
          } catch (error) {
            log.error("Failed to save device:", error);
            savedDevices.push({
              ...deviceData,
              success: false,
              error: error.message,
            });

            setDiscoveredDevices((prev) => [
              ...prev,
              {
                ...deviceData,
                success: false,
                error: error.message,
              },
            ]);
          }
        }

        if (savedDevices.length > 0 && onDevicesAdded) {
          onDevicesAdded();
        }

        toast.success("Device exploration completed");
      } else {
        // No device found - timeout reached
        setCompleted(true);
        toast.info("No devices found");
      }
    } catch (error) {
      log.error("Failed to explore Zigbee network:", error);
      toast.error(`Failed to explore network: ${error.message}`);
    } finally {
      handleStopExploring();
    }
  };

  const handleClose = () => {
    if (exploring) {
      handleStopExploring();
      toast.info("Device exploration stopped");
    }
    onOpenChange(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Explore Zigbee Devices
          </DialogTitle>
          <DialogDescription>Open the Zigbee network for pairing. Press the pairing button on your device to add it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Network Unit Selection */}
          {!exploring && !currentUnit && (
            <NetworkUnitSelector
              selectedUnitIds={selectedUnitIds}
              onSelectionChange={handleSelectionChange}
              disabled={exploring}
              ref={networkUnitSelectorRef}
              multiSelect={false}
            />
          )}

          {/* Show selected unit info after first exploration */}
          {!exploring && currentUnit && (
            <Card>
              <CardContent>
                <div className="text-sm">
                  <span className="text-muted-foreground">Selected Unit: </span>
                  <span className="font-medium">
                    {currentUnit.type || "Unit"} ({currentUnit.ip_address})
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exploring Status */}
          {exploring && currentUnit && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="font-medium">
                        Listening for new devices on {currentUnit.type || "Unit"} ({currentUnit.ip_address})
                      </span>
                    </div>
                    <Badge variant="outline" className="text-lg font-mono">
                      {formatTime(timeRemaining)}
                    </Badge>
                  </div>
                  <div className="flex justify-center items-center py-12">
                    <div className="relative">
                      <div className="w-32 h-32 border-4 border-purple-500/30 rounded-full"></div>
                      <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
                      <div
                        className="absolute inset-2 w-28 h-28 border-4 border-transparent border-t-pink-500 rounded-full animate-spin"
                        style={{
                          animationDirection: "reverse",
                          animationDuration: "1.5s",
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Radio className="w-12 h-12 text-purple-400 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Press the pairing button on your Zigbee device. The network will remain open for {formatTime(timeRemaining)}.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discovered Devices */}
          {discoveredDevices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Discovered Devices</span>
                  <Badge variant="secondary">{discoveredDevices.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {discoveredDevices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {device.success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                        <div>
                          <div className="font-medium text-sm font-mono">{device.ieee_address}</div>
                          <div className="text-xs text-muted-foreground">
                            {DEVICE_TYPE_LABELS[device.device_type] || `Type ${device.device_type}`} - {device.num_endpoints} endpoint(s)
                          </div>
                          {device.error && <div className="text-xs text-red-500 mt-1">Error: {device.error}</div>}
                        </div>
                      </div>
                      <Badge variant={device.success ? "default" : "destructive"}>{device.success ? "Added" : "Failed"}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {exploring ? "Stop & Close" : "Close"}
            </Button>
            {!exploring && (
              <Button onClick={handleStartExploring} disabled={exploring || (!completed && !currentUnit && selectedUnitIds.length === 0)}>
                <Radio className="h-4 w-4" />
                {completed ? "Scan Again" : "Start Exploring"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
