import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Wifi, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { NetworkUnitSelector, useNetworkUnitSelector } from "@/components/shared/network-unit-selector";

export function AddZigbeeDeviceDialog({ open, onOpenChange, onDevicesAdded }) {
  const { selectedProject } = useProjectDetail();
  const { selectedUnitIds, handleSelectionChange, clearSelection } = useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const [scannedDevices, setScannedDevices] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      clearSelection();
      setScannedDevices([]);
      setShowResults(false);
      setProgress(0);
      setCurrentOperation("");
    }
  }, [open, clearSelection]);

  const handleScanDevices = async () => {
    if (selectedUnitIds.length === 0) {
      toast.error("Please select at least one unit");
      return;
    }

    // Get selected units from NetworkUnitSelector
    const selectedUnits = networkUnitSelectorRef.current?.getSelectedUnits() || [];

    if (selectedUnits.length === 0) {
      toast.error("Please select at least one unit");
      return;
    }

    setLoading(true);
    setProgress(0);
    setScannedDevices([]);
    setShowResults(false);

    try {
      const allDevices = [];
      const totalUnits = selectedUnits.length;

      for (let i = 0; i < selectedUnits.length; i++) {
        const unit = selectedUnits[i];
        setCurrentOperation(`Scanning unit ${unit.type || "Unit"} (${unit.ip_address})...`);

        try {
          // Get Zigbee devices from the unit
          const response = await window.electronAPI.zigbeeController.getZigbeeDevices({
            unitIp: unit.ip_address,
            canId: unit.id_can,
          });

          if (response.success && response.devices) {
            // Save devices to database
            for (const device of response.devices) {
              const deviceData = {
                unit_ip: unit.ip_address,
                unit_can_id: unit.id_can,
                ...device,
              };

              try {
                const savedDevice = await window.electronAPI.zigbee.createDevice(selectedProject.id, deviceData);
                allDevices.push({
                  ...savedDevice,
                  unitName: unit.type || "Unit",
                  success: true,
                });
              } catch (error) {
                console.error("Failed to save device:", error);
                allDevices.push({
                  ...deviceData,
                  unitName: unit.type || "Unit",
                  success: false,
                  error: error.message,
                });
              }
            }

            toast.success(`Found ${response.devices.length} device(s) on ${unit.type || "Unit"} (${unit.ip_address})`);
          } else {
            toast.info(`No devices found on ${unit.type || "Unit"} (${unit.ip_address})`);
          }
        } catch (error) {
          console.error(`Failed to scan unit ${unit.ip_address}:`, error);
          toast.error(`Failed to scan ${unit.type || "Unit"} (${unit.ip_address})`);
        }

        setProgress(((i + 1) / totalUnits) * 100);
      }

      setScannedDevices(allDevices);
      setShowResults(true);
      setCurrentOperation("Scan completed");

      if (allDevices.length > 0) {
        toast.success(`Successfully added ${allDevices.filter((d) => d.success).length} device(s)`);
        if (onDevicesAdded) {
          onDevicesAdded();
        }
      }
    } catch (error) {
      console.error("Failed to scan devices:", error);
      toast.error(`Failed to scan devices: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Add Zigbee Devices
          </DialogTitle>
          <DialogDescription>Select units to scan for Zigbee devices and add them to your project.</DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* Network Units Selection */}
            <NetworkUnitSelector
              selectedUnitIds={selectedUnitIds}
              onSelectionChange={handleSelectionChange}
              disabled={loading}
              ref={networkUnitSelectorRef}
            />

            {/* Progress */}
            {loading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{currentOperation}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleScanDevices} disabled={loading || selectedUnitIds.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Scan Devices
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Scanned Devices</CardTitle>
              </CardHeader>
              <CardContent>
                {scannedDevices.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No devices found on selected units.</div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {scannedDevices.map((device, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {device.success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            <div>
                              <div className="font-medium text-sm font-mono">{device.ieee_address}</div>
                              <div className="text-xs text-muted-foreground">
                                {device.unitName} ({device.unit_ip}) - Type: {device.device_type} - Endpoints: {device.num_endpoints}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={device.success ? "default" : "destructive"}>{device.success ? "Added" : "Failed"}</Badge>
                            {device.error && <div className="text-xs text-muted-foreground mt-1">{device.error}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
