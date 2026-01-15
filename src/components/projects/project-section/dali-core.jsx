import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Network, Upload, Trash2, ChevronDown } from "lucide-react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { useDali } from "@/contexts/dali-context";
import { AddressMapping } from "@/components/projects/dali/address-mapping";
import { Group } from "@/components/projects/dali/group";
import { Scene } from "@/components/projects/dali/scene";
import { SelectGatewayDialog } from "@/components/projects/dali/select-gateway-dialog";
import { toast } from "sonner";
import log from "electron-log/renderer";

export function DaliCore() {
  const { selectedProject } = useProjectDetail();
  const { selectedGateway, selectGateway } = useDali();
  const [activeTab, setActiveTab] = useState("address-mapping");
  const [showGatewayDialog, setShowGatewayDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showDeleteAddressDialog, setShowDeleteAddressDialog] = useState(false);
  const [deleteMode, setDeleteMode] = useState("all");
  const [deleteAddressInput, setDeleteAddressInput] = useState("");

  // Helper: Get scanned devices from localStorage
  const getScannedDevices = () => {
    const scannedDevicesKey = `dali-scanned-devices-${selectedProject.id}`;
    return JSON.parse(localStorage.getItem(scannedDevicesKey) || "[]");
  };

  // Helper: Load project DALI data
  const loadProjectData = async () => {
    const dbDevices = await window.electronAPI.dali.getAllDaliDevices(selectedProject.id);
    const scannedDevices = getScannedDevices();
    return { dbDevices, scannedDevices };
  };

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

      // Load project data
      const { dbDevices, scannedDevices } = await loadProjectData();

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

      log.info("Initial:", addressMapping);

      // Apply swap operations for each mapped device
      dbDevices.forEach((device, index) => {
        if (device.mapped_device_index !== null && device.mapped_device_address !== null) {
          // Find current position of this device by its original identity
          const currentPos = deviceTracker.findIndex((id) => id === device.address);
          const targetPos = device.mapped_device_index;

          if (currentPos !== -1 && currentPos !== targetPos) {
            // Swap positions in both arrays to keep tracking
            [addressMapping[currentPos], addressMapping[targetPos]] = [addressMapping[targetPos], addressMapping[currentPos]];
            [deviceTracker[currentPos], deviceTracker[targetPos]] = [deviceTracker[targetPos], deviceTracker[currentPos]];

            log.info(`Swap ${index}: device ${device.address} from pos ${currentPos} to pos ${targetPos}`, addressMapping);
          }
        }
      });

      log.info("Final:", addressMapping);

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
          await window.electronAPI.dali.upsertDaliDevice(selectedProject.id, device.address, {
            mapped_device_index: device.mapped_device_index,
            mapped_device_name: `Device ${newAddress}`,
            mapped_device_type: device.mapped_device_type,
            mapped_device_address: newAddress,
            lighting_group_address: device.lighting_group_address,
            color_feature: device.color_feature,
          });
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

      const scannedDevicesKey = `dali-scanned-devices-${selectedProject.id}`;
      localStorage.setItem(scannedDevicesKey, JSON.stringify(updatedScannedDevices));

      toast.success("Address mapping sent and devices updated successfully!");
      // Reload to reflect changes
      // window.location.reload();
    } catch (error) {
      log.error("Failed to send address mapping:", error);
      toast.error(`Failed to send address mapping: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendMappingRCU = async () => {
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
      toast.info("Preparing RCU mapping...");

      // Load project data
      const { dbDevices, scannedDevices } = await loadProjectData();

      // Get all groups from database
      await window.electronAPI.dali.initializeDaliGroups(selectedProject.id);
      const groupNames = await window.electronAPI.dali.getAllDaliGroupNames(selectedProject.id);

      // Build RCU mapping array (80 bytes)
      const rcuMapping = new Array(80).fill(0);

      // First 64 bytes: lightingGroupAddress for each device (by index)
      // Similar to addressMapping, start with scanned devices' lightingGroupAddress
      scannedDevices.forEach((device) => {
        if (device.index >= 0 && device.index < 64) {
          rcuMapping[device.index] = device.lightingGroupAddress ?? 0;
        }
      });

      // Then apply mapped devices' lighting_group_address from database
      dbDevices.forEach((device) => {
        if (
          device.mapped_device_index !== null &&
          device.mapped_device_index >= 0 &&
          device.mapped_device_index < 64 &&
          device.lighting_group_address !== null
        ) {
          rcuMapping[device.mapped_device_index] = device.lighting_group_address;
        }
      });

      // Last 16 bytes: lightingGroupAddress for each group (0-15)
      for (let i = 0; i < 16; i++) {
        const groupData = groupNames.find((g) => g.group_id === i);
        // Use lighting_group_address if available, otherwise default to 100 + i
        rcuMapping[64 + i] = groupData?.lighting_group_address ?? 100 + i;
      }

      log.info("RCU Mapping (devices 0-63):", rcuMapping.slice(0, 64));
      log.info("RCU Mapping (groups 0-15):", rcuMapping.slice(64, 80));

      // Send RCU mapping to gateway
      await window.electronAPI.daliController.sendMappingRCU({
        unitIp: selectedGateway.ip_address,
        canId: selectedGateway.id_can,
        rcuMapping,
      });

      toast.success("RCU mapping sent successfully!");
    } catch (error) {
      log.error("Failed to send RCU mapping:", error);
      toast.error(`Failed to send RCU mapping: ${error.message}`);
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

      const result = await window.electronAPI.daliController.sendGroupSceneConfig({
        unitIp: selectedGateway.ip_address,
        canId: selectedGateway.id_can,
        projectId: selectedProject.id,
      });

      toast.success(`Group & Scene configuration sent successfully! Configured ${result.deviceCount} device(s) (${result.totalBytes} bytes)`);
    } catch (error) {
      log.error("Failed to send Group & Scene configuration:", error);
      toast.error(`Failed to send Group & Scene configuration: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleResetAllConfig = async () => {
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
      toast.info("Resetting all DALI configuration...");

      await window.electronAPI.daliController.resetAllConfig({
        unitIp: selectedGateway.ip_address,
        canId: selectedGateway.id_can,
      });

      toast.success("All DALI configuration reset successfully!");
    } catch (error) {
      log.error("Failed to reset DALI configuration:", error);
      toast.error(`Failed to reset configuration: ${error.message}`);
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

      const result = await window.electronAPI.dali.clearAllDaliDeviceMappings(selectedProject.id);

      toast.success(`Cleared ${result.cleared} address mapping(s)`);
      // window.location.reload();
    } catch (error) {
      log.error("Failed to clear address mappings:", error);
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

      const result = await window.electronAPI.dali.clearAllDaliGroups(selectedProject.id);

      toast.success(`Cleared ${result.clearedRelationships} group relationship(s) and ${result.clearedMetadata} group(s)`);
      // window.location.reload();
    } catch (error) {
      log.error("Failed to clear groups:", error);
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

      const result = await window.electronAPI.dali.clearAllDaliScenes(selectedProject.id);

      toast.success(`Cleared ${result.clearedDevices} scene device(s) and ${result.clearedMetadata} scene(s)`);
      // window.location.reload();
    } catch (error) {
      log.error("Failed to clear scenes:", error);
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
      log.error("Failed to clear scanned devices:", error);
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
      const result = await window.electronAPI.dali.clearAllDaliConfigurations(selectedProject.id);

      // Clear local storage for scanned devices
      localStorage.removeItem(`dali-scanned-devices-${selectedProject.id}`);

      toast.success(
        `Cleared ${result.mappings.cleared} mappings, ${result.groups.clearedRelationships} group relationships, and ${result.scenes.clearedDevices} scene devices`
      );

      // Optionally refresh the current view
      // window.location.reload();
    } catch (error) {
      log.error("Failed to clear configurations:", error);
      toast.error(`Failed to clear configurations: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const parseAddresses = (input) => {
    const addresses = [];
    const parts = input.split(",").map((p) => p.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        // Range: e.g., "5-10"
        const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 0 && i <= 63) {
              addresses.push(i);
            }
          }
        }
      } else {
        // Single address
        const addr = parseInt(part, 10);
        if (!isNaN(addr) && addr >= 0 && addr <= 63) {
          addresses.push(addr);
        }
      }
    }

    // Remove duplicates
    return [...new Set(addresses)];
  };

  const handleDeleteAddress = async () => {
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
      setShowDeleteAddressDialog(false);

      let addresses = [];

      if (deleteMode === "all") {
        // Delete all: send 0xFF
        addresses = [0xff];
        toast.info("Deleting all addresses...");
      } else {
        // Delete custom: parse input
        if (!deleteAddressInput.trim()) {
          toast.error("Please enter address(es) to delete");
          setSending(false);
          return;
        }

        addresses = parseAddresses(deleteAddressInput);
        if (addresses.length === 0) {
          toast.error("No valid addresses found in input");
          setSending(false);
          return;
        }

        toast.info(`Deleting ${addresses.length} address(es)...`);
      }

      // Send DELETE_ADDRESS command (13) for each address
      // Format: [address_byte, 0x00, 0x00, 0x00]
      for (const address of addresses) {
        await window.electronAPI.daliController.sendDeleteAddress({
          unitIp: selectedGateway.ip_address,
          canId: selectedGateway.id_can,
          address: address,
        });
      }

      toast.success(`Successfully deleted ${deleteMode === "all" ? "all" : addresses.length} address(es)`);

      // Reset form
      setDeleteMode("all");
      setDeleteAddressInput("");
    } catch (error) {
      log.error("Failed to delete address:", error);
      toast.error(`Failed to delete address: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Select a project to view DALI Core features</div>
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
              <DropdownMenuItem onClick={handleClearAddressMapping}>Address Mapping</DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearGroups}>Group</DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearScenes}>Scene</DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearScannedDevices}>Scanned Device</DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearAll}>
                <span className="font-semibold text-red-700">Clear All</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={sending || !selectedGateway} className="shadow">
                <Upload className="h-4 w-4" />
                {sending ? "Sending..." : "Send Configuration"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSendAddressMapping}>Address Mapping</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendMappingRCU}>Mapping RCU</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendGroupAndScene}>Group & Scene</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteAddressDialog(true)}>Delete Address</DropdownMenuItem>
              <DropdownMenuItem onClick={handleResetAllConfig}>Reset</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant={selectedGateway ? "outline" : "default"} onClick={() => setShowGatewayDialog(true)}>
            <Network className="h-4 w-4" />
            {selectedGateway ? "Change Gateway" : "Select Gateway"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
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

      <SelectGatewayDialog open={showGatewayDialog} onOpenChange={setShowGatewayDialog} onSelect={selectGateway} />

      <Dialog open={showDeleteAddressDialog} onOpenChange={setShowDeleteAddressDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>Choose to delete all addresses or specify custom addresses to delete.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={deleteMode} onValueChange={setDeleteMode}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="delete-all" />
                <Label htmlFor="delete-all" className="cursor-pointer">
                  Delete all addresses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="delete-custom" />
                <Label htmlFor="delete-custom" className="cursor-pointer">
                  Delete custom addresses
                </Label>
              </div>
            </RadioGroup>

            {deleteMode === "custom" && (
              <div className="grid gap-2">
                <Label htmlFor="address-input">Enter address(es) to delete</Label>
                <Input
                  id="address-input"
                  placeholder="e.g., 5, 10, 15-20"
                  value={deleteAddressInput}
                  onChange={(e) => setDeleteAddressInput(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Enter single addresses (e.g., 5, 10) or ranges (e.g., 15-20) separated by commas</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteAddressDialog(false);
                setDeleteMode("all");
                setDeleteAddressInput("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteAddress} disabled={sending}>
              {sending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
