import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { Home, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AddZigbeeDeviceDialog } from "../zigbee/add-zigbee-device-dialog";

export function Smarthome() {
  const { selectedProject } = useProjectDetail();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDeviceDialogOpen, setAddDeviceDialogOpen] = useState(false);

  // Load devices when project changes
  useEffect(() => {
    if (selectedProject) {
      loadDevices();
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

  const handleDeleteDevice = async (deviceId) => {
    try {
      await window.electronAPI.zigbee.deleteDevice(deviceId);
      toast.success("Device deleted successfully");
      loadDevices();
    } catch (error) {
      console.error("Failed to delete device:", error);
      toast.error("Failed to delete device");
    }
  };

  const handleDevicesAdded = () => {
    loadDevices();
    setAddDeviceDialogOpen(false);
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IEEE Address</TableHead>
                  <TableHead>Unit IP</TableHead>
                  <TableHead>Device Type</TableHead>
                  <TableHead>Endpoints</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>RSSI</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-mono text-sm">
                      {device.ieee_address}
                    </TableCell>
                    <TableCell>{device.unit_ip}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{device.device_type}</Badge>
                    </TableCell>
                    <TableCell>{device.num_endpoints}</TableCell>
                    <TableCell>
                      <Badge
                        variant={device.status === 1 ? "default" : "secondary"}
                      >
                        {device.status === 1 ? "Online" : "Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.rssi} dBm</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDevice(device.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
