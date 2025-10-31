import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { Home, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AddZigbeeDeviceDialog } from "../zigbee/add-zigbee-device-dialog";
import { ZigbeeSwitchCard } from "../zigbee/zigbee-switch-card";
import { ZigbeeCurtainCard } from "../zigbee/zigbee-curtain-card";
import { ZigbeeMotionSensorCard } from "../zigbee/zigbee-motion-sensor-card";
import { ZigbeeDoorContactCard } from "../zigbee/zigbee-door-contact-card";

export function Smarthome() {
  const { selectedProject } = useProjectDetail();
  const [devices, setDevices] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDeviceDialogOpen, setAddDeviceDialogOpen] = useState(false);

  // Load devices when project changes
  useEffect(() => {
    if (selectedProject) {
      loadDevices();
      loadUnits();
    }
  }, [selectedProject]);

  const loadDevices = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const devicesData = await window.electronAPI.zigbee.getDevices(
        selectedProject.id
      );
      setDevices(devicesData);
    } catch (error) {
      console.error("Failed to load zigbee devices:", error);
      toast.error("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    if (!selectedProject) return;

    try {
      const unitsData = await window.electronAPI.units.getAll(
        selectedProject.id
      );
      setUnits(unitsData);
    } catch (error) {
      console.error("Failed to load units:", error);
    }
  };

  const handleDevicesAdded = () => {
    loadDevices();
    setAddDeviceDialogOpen(false);
  };

  // Helper to get unit info for a device
  const getUnitForDevice = (device) => {
    return units.find((unit) => unit.ip_address === device.unit_ip);
  };

  // Helper to render appropriate card based on device type
  const renderDeviceCard = (device) => {
    const unit = getUnitForDevice(device);

    // Device types: 0-3: Switch, 4-5: Curtain, 7: Motion Sensor, 9: Door Contact
    if (device.device_type >= 0 && device.device_type <= 3) {
      return <ZigbeeSwitchCard key={device.id} device={device} unit={unit} />;
    } else if (device.device_type === 4 || device.device_type === 5) {
      return <ZigbeeCurtainCard key={device.id} device={device} unit={unit} />;
    } else if (device.device_type === 7) {
      return (
        <ZigbeeMotionSensorCard key={device.id} device={device} unit={unit} />
      );
    } else if (device.device_type === 9) {
      return (
        <ZigbeeDoorContactCard key={device.id} device={device} unit={unit} />
      );
    } else {
      // Unknown device type - show basic info card
      return (
        <Card key={device.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Unknown Device (Type: {device.device_type})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div>IEEE: {device.ieee_address}</div>
              <div>Unit: {device.unit_ip}</div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  // Don't render if no project is selected
  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Select a project to view smarthome features
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Zigbee Devices
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDevices}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setAddDeviceDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No Zigbee devices found.</p>
              <p className="text-sm mt-2">
                Click "Add Device" to scan and add Zigbee devices from your
                units.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => renderDeviceCard(device))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddZigbeeDeviceDialog
        open={addDeviceDialogOpen}
        onOpenChange={setAddDeviceDialogOpen}
        onDevicesAdded={handleDevicesAdded}
      />
    </div>
  );
}
