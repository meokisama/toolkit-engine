import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Network, Upload, Trash2, ChevronDown } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { useDali } from "@/contexts/dali-context";
import { AddressMapping } from "@/components/projects/dali/address-mapping";
import { Group } from "@/components/projects/dali/group";
import { Scene } from "@/components/projects/dali/scene";
import { SelectGatewayDialog } from "@/components/projects/dali/select-gateway-dialog";
import { toast } from "sonner";

export function DaliCore() {
  const { selectedProject } = useProjectDetail();
  const { selectedGateway, selectGateway } = useDali();
  const [activeTab, setActiveTab] = useState("address-mapping");
  const [showGatewayDialog, setShowGatewayDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSendAddressMapping = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    if (!selectedGateway) {
      toast.error("Please select a gateway first");
      return;
    }

    try {
      setSending(true);
      toast.info("Preparing address mapping...");

      // Get all devices from database
      const dbDevices = await window.electronAPI.dali.getAllDevices(
        selectedProject.id
      );

      // Get scanned devices from localStorage (unmapped devices)
      const scannedDevicesKey = `dali-scanned-devices-${selectedProject.id}`;
      const scannedDevices = JSON.parse(
        localStorage.getItem(scannedDevicesKey) || []
      );

      // Build initial addressMapping from scanned devices (keep their positions)
      const addressMapping = new Array(64);
      const deviceTracker = new Array(64); // Track original device identity at each position
      const usedAddresses = new Set();

      scannedDevices.forEach((device) => {
        if (device.index >= 0 && device.index < 64) {
          addressMapping[device.index] = device.address;
          deviceTracker[device.index] = device.address; // Use original address as device ID
          usedAddresses.add(device.address);
        }
      });

      // Fill remaining positions with unused addresses in order
      let nextAddress = 0;
      for (let i = 0; i < 64; i++) {
        if (addressMapping[i] === undefined) {
          while (usedAddresses.has(nextAddress)) {
            nextAddress++;
          }
          addressMapping[i] = nextAddress;
          deviceTracker[i] = nextAddress; // Track this filler device too
          usedAddresses.add(nextAddress);
          nextAddress++;
        }
      }

      console.log("Initial:", addressMapping);

      // Apply swap operations for each mapped device
      dbDevices.forEach((device, index) => {
        if (
          device.mapped_device_index !== null &&
          device.mapped_device_address !== null
        ) {
          // Find current position of this device by its original identity
          const currentPos = deviceTracker.findIndex(
            (id) => id === device.address
          );
          const targetPos = device.mapped_device_index;

          if (currentPos !== -1 && currentPos !== targetPos) {
            // Swap positions in both arrays to keep tracking
            [addressMapping[currentPos], addressMapping[targetPos]] = [
              addressMapping[targetPos],
              addressMapping[currentPos],
            ];
            [deviceTracker[currentPos], deviceTracker[targetPos]] = [
              deviceTracker[targetPos],
              deviceTracker[currentPos],
            ];

            console.log(
              `Swap ${index}: device ${device.address} from pos ${currentPos} to pos ${targetPos}`,
              addressMapping
            );
          }
        }
      });

      console.log("Final:", addressMapping);

      // Send address mapping to gateway
      await window.electronAPI.daliController.sendAddressMapping({
        unitIp: selectedGateway.ip_address,
        canId: selectedGateway.id_can,
        addressMapping,
      });

      // Reflect new address
      toast.info("Updating device addresses...");

      // Update mapped devices in database based on index
      for (let index = 0; index < addressMapping.length; index++) {
        const newAddress = addressMapping[index];
        const device = dbDevices.find((d) => d.mapped_device_index === index);

        if (device) {
          await window.electronAPI.dali.upsertDevice(
            selectedProject.id,
            device.address,
            {
              mapped_device_index: device.mapped_device_index,
              mapped_device_name: `Device ${newAddress}`,
              mapped_device_type: device.mapped_device_type,
              mapped_device_address: newAddress,
            }
          );
        }
      }

      // Update scanned devices in localStorage based on index
      const updatedScannedDevices = scannedDevices.map((scannedDevice) => {
        const newAddress = addressMapping[scannedDevice.index];
        if (newAddress !== undefined) {
          return {
            ...scannedDevice,
            address: newAddress,
            name: `Device ${newAddress}`,
          };
        }
        return scannedDevice;
      });

      localStorage.setItem(
        scannedDevicesKey,
        JSON.stringify(updatedScannedDevices)
      );

      toast.success("Address mapping sent and devices updated successfully!");
      // Reload to reflect changes
      // window.location.reload();
    } catch (error) {
      console.error("Failed to send address mapping:", error);
      toast.error(`Failed to send address mapping: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendGroupAndScene = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    if (!selectedGateway) {
      toast.error("Please select a gateway first");
      return;
    }

    try {
      setSending(true);
      toast.info("Sending Group & Scene configuration...");

      const result =
        await window.electronAPI.daliController.sendGroupSceneConfig({
          unitIp: selectedGateway.ip_address,
          canId: selectedGateway.id_can,
          projectId: selectedProject.id,
        });

      toast.success(
        `Group & Scene configuration sent successfully! Configured ${result.deviceCount} device(s) (${result.totalBytes} bytes)`
      );
    } catch (error) {
      console.error("Failed to send Group & Scene configuration:", error);
      toast.error(
        `Failed to send Group & Scene configuration: ${error.message}`
      );
    } finally {
      setSending(false);
    }
  };

  const handleClearAddressMapping = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    try {
      setClearing(true);
      toast.info("Clearing address mappings...");

      const result = await window.electronAPI.dali.clearAllDeviceMappings(
        selectedProject.id
      );

      toast.success(`Cleared ${result.cleared} address mapping(s)`);
      // window.location.reload();
    } catch (error) {
      console.error("Failed to clear address mappings:", error);
      toast.error(`Failed to clear address mappings: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleClearGroups = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    try {
      setClearing(true);
      toast.info("Clearing groups...");

      const result = await window.electronAPI.dali.clearAllGroups(
        selectedProject.id
      );

      toast.success(
        `Cleared ${result.clearedRelationships} group relationship(s) and ${result.clearedMetadata} group(s)`
      );
      // window.location.reload();
    } catch (error) {
      console.error("Failed to clear groups:", error);
      toast.error(`Failed to clear groups: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleClearScenes = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    try {
      setClearing(true);
      toast.info("Clearing scenes...");

      const result = await window.electronAPI.dali.clearAllScenes(
        selectedProject.id
      );

      toast.success(
        `Cleared ${result.clearedDevices} scene device(s) and ${result.clearedMetadata} scene(s)`
      );
      // window.location.reload();
    } catch (error) {
      console.error("Failed to clear scenes:", error);
      toast.error(`Failed to clear scenes: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleClearScannedDevices = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    try {
      setClearing(true);
      toast.info("Clearing scanned devices...");

      // Clear local storage for scanned devices
      localStorage.removeItem(`dali-scanned-devices-${selectedProject.id}`);

      toast.success("Cleared scanned devices from local storage");
      // window.location.reload();
    } catch (error) {
      console.error("Failed to clear scanned devices:", error);
      toast.error(`Failed to clear scanned devices: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleClearAll = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    try {
      setClearing(true);
      toast.info("Clearing all DALI configurations...");

      // Clear all configurations (mapping, groups, scenes)
      const result = await window.electronAPI.dali.clearAllConfigurations(
        selectedProject.id
      );

      // Clear local storage for scanned devices
      localStorage.removeItem(`dali-scanned-devices-${selectedProject.id}`);

      toast.success(
        `Cleared ${result.mappings.cleared} mappings, ${result.groups.clearedRelationships} group relationships, and ${result.scenes.clearedDevices} scene devices`
      );

      // Optionally refresh the current view
      // window.location.reload();
    } catch (error) {
      console.error("Failed to clear configurations:", error);
      toast.error(`Failed to clear configurations: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Select a project to view DALI Core features
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">DALI</h2>
          {selectedGateway && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              | Gateway: {selectedGateway.ip_address} ({selectedGateway.id_can})
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={clearing || !selectedProject}
                className="border-red-600 text-red-600 hover:text-red-600 hover:bg-red-50 shadow shadow-red-100"
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? "Clearing..." : "Clear"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleClearAddressMapping}>
                Address Mapping
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearGroups}>
                Group
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearScenes}>
                Scene
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearScannedDevices}>
                Scanned Device
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearAll}>
                <span className="font-semibold text-red-700">Clear All</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={sending || !selectedGateway}
                className="shadow"
              >
                <Upload className="h-4 w-4" />
                {sending ? "Sending..." : "Send Configuration"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSendAddressMapping}>
                Address Mapping
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendGroupAndScene}>
                Group & Scene
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={selectedGateway ? "outline" : "default"}
            onClick={() => setShowGatewayDialog(true)}
          >
            <Network className="h-4 w-4" />
            {selectedGateway ? "Change Gateway" : "Select Gateway"}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="address-mapping">Address Mapping</TabsTrigger>
          <TabsTrigger value="group">Group</TabsTrigger>
          <TabsTrigger value="scene">Scene</TabsTrigger>
        </TabsList>

        <TabsContent value="address-mapping" className="flex-1">
          <AddressMapping isActive={activeTab === "address-mapping"} />
        </TabsContent>

        <TabsContent value="group" className="flex-1">
          <Group isActive={activeTab === "group"} />
        </TabsContent>

        <TabsContent value="scene" className="flex-1">
          <Scene isActive={activeTab === "scene"} />
        </TabsContent>
      </Tabs>

      <SelectGatewayDialog
        open={showGatewayDialog}
        onOpenChange={setShowGatewayDialog}
        onSelect={selectGateway}
      />
    </div>
  );
}
