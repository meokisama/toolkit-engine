import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GripVertical, X, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { useDali } from "@/contexts/dali-context";
import { toast } from "sonner";
import { DALI_DEVICE_COUNT } from "./utils/constants";
import { TriggerDeviceButton } from "./trigger-buttons";

export function AddressMapping({ isActive }) {
  const { selectedProject } = useProjectDetail();
  const { selectedGateway } = useDali();

  // Fixed 64 DALI devices (0-63)
  const [fixedDevices, setFixedDevices] = useState(() =>
    Array.from({ length: DALI_DEVICE_COUNT }, (_, i) => ({
      address: i,
      name: null,
      mappedDevice: null,
    }))
  );

  // Scanned devices (from DALI scan/commissioning)
  // Load from localStorage on mount to persist across tab switches
  const [scannedDevices, setScannedDevices] = useState(() => {
    try {
      const stored = localStorage.getItem(
        `dali-scanned-devices-${selectedProject?.id}`
      );
      if (stored) {
        const devices = JSON.parse(stored);
        // Restore with default currentLevel
        return devices
          .map((d) => ({
            index: d.index,
            address: d.address,
            name: d.name,
            type: d.type,
            lightingGroupAddress: d.lightingGroupAddress,
            colorFeature: d.colorFeature,
            currentLevel: 0, // Default level when restored from localStorage
          }))
          .sort((a, b) => a.index - b.index);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [activeId, setActiveId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [sortBy, setSortBy] = useState("index"); // "address" or "index"
  const [deviceCountDialog, setDeviceCountDialog] = useState({
    open: false,
    oldCount: 0,
    newCount: 0,
  });
  const [addressConflictDialog, setAddressConflictDialog] = useState({
    open: false,
    conflictAddresses: [],
  });
  const [fixingConflicts, setFixingConflicts] = useState(false);

  // Persist scanned devices to localStorage whenever they change
  useEffect(() => {
    if (selectedProject) {
      const dataToStore = scannedDevices.map((d) => ({
        index: d.index,
        address: d.address,
        name: d.name,
        type: d.type,
        lightingGroupAddress: d.lightingGroupAddress,
        colorFeature: d.colorFeature,
      }));
      localStorage.setItem(
        `dali-scanned-devices-${selectedProject.id}`,
        JSON.stringify(dataToStore)
      );
    }
  }, [scannedDevices, selectedProject]);

  // Listen for device count changed events during commissioning
  useEffect(() => {
    const unsubscribe = window.electronAPI.daliController.onDeviceCountChanged(
      ({ oldDeviceCount, newDeviceCount }) => {
        setDeviceCountDialog({
          open: true,
          oldCount: oldDeviceCount,
          newCount: newDeviceCount,
        });
      }
    );

    return () => unsubscribe();
  }, []);

  // Listen for address conflict events during commissioning/scan
  useEffect(() => {
    const unsubscribe = window.electronAPI.daliController.onAddressConflict(
      ({ conflictAddresses }) => {
        setAddressConflictDialog({
          open: true,
          conflictAddresses,
        });
      }
    );

    return () => unsubscribe();
  }, []);

  // Load devices from database - reload when tab becomes active
  useEffect(() => {
    if (!selectedProject || !isActive) return;

    const loadDevices = async () => {
      try {
        const dbDevices = await window.electronAPI.dali.getAllDaliDevices(
          selectedProject.id
        );

        // Update fixed devices with database data
        setFixedDevices((prev) =>
          prev.map((device) => {
            const dbDevice = dbDevices.find(
              (d) => d.address === device.address
            );
            if (dbDevice && dbDevice.mapped_device_name) {
              return {
                ...device,
                name: dbDevice.name,
                mappedDevice: {
                  index: dbDevice.mapped_device_index,
                  address: dbDevice.mapped_device_address,
                  name: dbDevice.mapped_device_name,
                  type: dbDevice.mapped_device_type,
                  lightingGroupAddress: dbDevice.lighting_group_address,
                  colorFeature: dbDevice.color_feature,
                },
              };
            }
            return { ...device, name: dbDevice?.name || null };
          })
        );

        // Remove already mapped devices from scanned list based on index
        setScannedDevices((prev) =>
          prev.filter(
            (scanned) =>
              !dbDevices.some(
                (db) =>
                  db.mapped_device_index !== null &&
                  db.mapped_device_index === scanned.index
              )
          )
        );
      } catch (error) {
        console.error("Failed to load DALI devices:", error);
        toast.error("Failed to load DALI devices");
      }
    };

    loadDevices();
  }, [selectedProject, isActive]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || !selectedProject) return;

      // Check if dropped on a fixed device slot
      if (over.id.toString().startsWith("fixed-")) {
        const address = parseInt(over.id.toString().replace("fixed-", ""));

        setScannedDevices((prevScanned) => {
          // active.id is now the device index
          const scannedDevice = prevScanned.find((d) => d.index === active.id);

          if (scannedDevice) {
            // Save to database with device index, address, RCU group and color feature
            window.electronAPI.dali
              .upsertDaliDevice(selectedProject.id, address, {
                mapped_device_name: scannedDevice.name,
                mapped_device_type: scannedDevice.type,
                mapped_device_index: scannedDevice.index,
                mapped_device_address: scannedDevice.address,
                lighting_group_address: scannedDevice.lightingGroupAddress,
                color_feature: scannedDevice.colorFeature,
              })
              .then(() => {
                toast.success("Device mapped successfully");
              })
              .catch((error) => {
                console.error("Failed to map device:", error);
                toast.error("Failed to map device");
              });

            // Map the scanned device to the fixed address optimistically
            setFixedDevices((prev) =>
              prev.map((device) =>
                device.address === address
                  ? { ...device, mappedDevice: scannedDevice }
                  : device
              )
            );

            // Remove from scanned devices (by index)
            return prevScanned.filter((d) => d.index !== active.id);
          }

          return prevScanned;
        });
      }
    },
    [selectedProject]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleUnmap = useCallback(
    async (address) => {
      if (!selectedProject) return;

      setFixedDevices((prevFixed) => {
        const device = prevFixed.find((d) => d.address === address);

        if (device?.mappedDevice) {
          // Clear mapping in database
          window.electronAPI.dali
            .clearDaliDeviceMapping(selectedProject.id, address)
            .then(() => {
              toast.success("Device unmapped successfully");
            })
            .catch((error) => {
              console.error("Failed to unmap device:", error);
              toast.error("Failed to unmap device");
            });

          // Add back to scanned devices (check duplicate by index)
          setScannedDevices((prev) => {
            // Check if device already exists by index
            const exists = prev.some(
              (d) => d.index === device.mappedDevice.index
            );
            if (exists) {
              return prev; // Don't add duplicate
            }

            // Create new device with default currentLevel = 0
            const newDevice = {
              index: device.mappedDevice.index,
              address: device.mappedDevice.address,
              name: device.mappedDevice.name,
              type: device.mappedDevice.type,
              lightingGroupAddress: device.mappedDevice.lightingGroupAddress,
              colorFeature: device.mappedDevice.colorFeature,
              currentLevel: 0,
            };

            // Add and sort by index
            return [...prev, newDevice].sort((a, b) => a.index - b.index);
          });

          // Clear mapping optimistically
          return prevFixed.map((d) =>
            d.address === address ? { ...d, mappedDevice: null } : d
          );
        }

        return prevFixed;
      });
    },
    [selectedProject]
  );

  const activeDevice = useMemo(
    () => scannedDevices.find((d) => d.index === activeId),
    [scannedDevices, activeId]
  );

  const sortedScannedDevices = useMemo(() => {
    return [...scannedDevices].sort((a, b) => {
      if (sortBy === "address") {
        return a.address - b.address;
      } else {
        return a.index - b.index;
      }
    });
  }, [scannedDevices, sortBy]);

  const handleCommissioning = useCallback(
    async (extend) => {
      if (!selectedGateway) {
        toast.error("Please select a gateway first");
        return;
      }

      try {
        setScanning(true);
        const commissioningType = extend ? "Extend" : "Reset";
        toast.info(`Starting ${commissioningType} Commissioning...`);

        // If Reset Commissioning, clear all configurations first
        if (!extend && selectedProject) {
          toast.info("Clearing all DALI configurations...");
          await window.electronAPI.dali.clearAllDaliConfigurations(
            selectedProject.id
          );
          // Clear local storage for scanned devices
          localStorage.removeItem(`dali-scanned-devices-${selectedProject.id}`);
          toast.success("All configurations cleared");
        }

        const result = await window.electronAPI.daliController.commissioning({
          unitIp: selectedGateway.ip_address,
          canId: selectedGateway.id_can,
          extend,
        });

        if (result.success) {
          toast.success(
            `${commissioningType} Commissioning completed! Found ${result.devices.length} device(s)`
          );

          // Update scanned devices with index, address, current level, RCU group and color feature
          const newDevices = result.devices
            .map((device) => ({
              index: device.index, // Use index from backend (0-based)
              address: device.address,
              currentLevel: device.currentLevel,
              lightingGroupAddress: device.lightingGroupAddress,
              colorFeature: device.colorFeature,
              name: `Device ${device.address}`,
              type: device.deviceType,
            }))
            .sort((a, b) => a.index - b.index); // Sort by index

          setScannedDevices(newDevices);
        } else {
          toast.warning(
            `${commissioningType} Commissioning completed but no success packet received`
          );
        }
      } catch (error) {
        console.error("Commissioning failed:", error);
        toast.error(`Commissioning failed: ${error.message}`);
      } finally {
        setScanning(false);
      }
    },
    [selectedGateway, selectedProject]
  );

  const handleScan = useCallback(async () => {
    if (!selectedGateway) {
      toast.error("Please select a gateway first");
      return;
    }

    try {
      setScanning(true);
      toast.info("Starting DALI scan...");

      const result = await window.electronAPI.daliController.scan({
        unitIp: selectedGateway.ip_address,
        canId: selectedGateway.id_can,
      });

      if (result.success) {
        toast.success(
          `Scan completed! Found ${result.devices.length} device(s)`
        );

        // Update scanned devices with index, address, current level, RCU group and color feature
        const newDevices = result.devices
          .map((device) => ({
            index: device.index, // Use index from backend (0-based)
            address: device.address,
            currentLevel: device.currentLevel,
            lightingGroupAddress: device.lightingGroupAddress,
            colorFeature: device.colorFeature,
            name: `Device ${device.address}`,
            type: device.deviceType,
          }))
          .sort((a, b) => a.index - b.index); // Sort by index

        setScannedDevices(newDevices);
      } else {
        toast.warning("Scan completed but no success packet received");
      }
    } catch (error) {
      console.error("Scan failed:", error);
      toast.error(`Scan failed: ${error.message}`);
    } finally {
      setScanning(false);
    }
  }, [selectedGateway]);

  const handleFixConflicts = useCallback(async () => {
    if (!selectedGateway) {
      toast.error("Please select a gateway first");
      return;
    }

    if (addressConflictDialog.conflictAddresses.length === 0) {
      toast.error("No conflict addresses to fix");
      return;
    }

    try {
      setFixingConflicts(true);
      toast.info(
        `Fixing ${addressConflictDialog.conflictAddresses.length} conflict address(es)...`
      );

      const result =
        await window.electronAPI.daliController.conflictAddressCommissioning({
          unitIp: selectedGateway.ip_address,
          canId: selectedGateway.id_can,
          conflictAddresses: addressConflictDialog.conflictAddresses,
        });

      if (result.success) {
        toast.success(
          `Successfully fixed ${result.successCount}/${result.totalAddresses} conflict address(es)`
        );
        // Close the dialog
        setAddressConflictDialog({ open: false, conflictAddresses: [] });
      } else {
        toast.warning(
          `Fixed ${result.successCount}/${result.totalAddresses} conflict address(es). Some addresses failed.`
        );
      }
    } catch (error) {
      console.error("Fix conflicts failed:", error);
      toast.error(`Fix conflicts failed: ${error.message}`);
    } finally {
      setFixingConflicts(false);
    }
  }, [selectedGateway, addressConflictDialog.conflictAddresses]);

  const handleBroadcastOn = useCallback(async () => {
    if (!selectedGateway) {
      toast.error("Please select a gateway first");
      return;
    }

    try {
      toast.info("Broadcasting ON to all DALI devices...");
      await window.electronAPI.daliController.broadcastOn({
        unitIp: selectedGateway.ip_address,
        canId: selectedGateway.id_can,
      });
      toast.success("Broadcast ON sent successfully");
    } catch (error) {
      console.error("Broadcast ON failed:", error);
      toast.error(`Broadcast ON failed: ${error.message}`);
    }
  }, [selectedGateway]);

  const handleBroadcastOff = useCallback(async () => {
    if (!selectedGateway) {
      toast.error("Please select a gateway first");
      return;
    }

    try {
      toast.info("Broadcasting OFF to all DALI devices...");
      await window.electronAPI.daliController.broadcastOff({
        unitIp: selectedGateway.ip_address,
        canId: selectedGateway.id_can,
      });
      toast.success("Broadcast OFF sent successfully");
    } catch (error) {
      console.error("Broadcast OFF failed:", error);
      toast.error(`Broadcast OFF failed: ${error.message}`);
    }
  }, [selectedGateway]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Left: Fixed 64 DALI Devices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>DALI Addresses (0-63)</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleBroadcastOn}
                  disabled={!selectedGateway}
                >
                  Broadcast ON
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBroadcastOff}
                  disabled={!selectedGateway}
                >
                  Broadcast OFF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-360px)]">
              <div className="space-y-2 pr-4">
                {fixedDevices.map((device) => (
                  <FixedDeviceSlot
                    key={device.address}
                    device={device}
                    onUnmap={handleUnmap}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Scanned Devices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Scanned Devices ({scannedDevices.length})</CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Sort: {sortBy === "address" ? "Address" : "Index"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("address")}>
                      Sort by Address
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("index")}>
                      Sort by Index
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={scanning || !selectedGateway}
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          Commissioning
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleCommissioning(false)}
                    >
                      Reset Commissioning
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCommissioning(true)}>
                      Extend Commissioning
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  onClick={handleScan}
                  disabled={scanning || !selectedGateway}
                >
                  {scanning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Scan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-360px)]">
              <div className="space-y-2 pr-4">
                {sortedScannedDevices.map((device) => (
                  <ScannedDeviceItem key={device.index} device={device} />
                ))}
                {sortedScannedDevices.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No scanned devices available
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <DragOverlay>
        {activeDevice ? (
          <div className="bg-primary text-primary-foreground p-3 rounded-md shadow-lg flex items-center gap-2">
            <GripVertical className="h-4 w-4" />
            <div>
              <div className="font-medium">{activeDevice.name}</div>
              <div className="text-xs opacity-80">{activeDevice.type}</div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <AlertDialog
        open={deviceCountDialog.open}
        onOpenChange={(open) =>
          setDeviceCountDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Device Count Changed</AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-2">
              The number of DALI devices has changed during commissioning.
              <span>
                - Old device count:{" "}
                <span className="font-bold text-rose-900">
                  {deviceCountDialog.oldCount}
                </span>
              </span>
              <span>
                - New device count:{" "}
                <span className="font-bold text-rose-900">
                  {deviceCountDialog.newCount}
                </span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={addressConflictDialog.open}
        onOpenChange={(open) =>
          setAddressConflictDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Address Conflict Detected</AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-2">
              The following DALI device addresses have conflicts and were
              excluded from the scan results:
              <div className="mt-2 p-3 bg-rose-50 rounded-md border border-rose-200">
                <div className="font-semibold text-rose-900 mb-2">
                  Conflicting Addresses:
                </div>
                <div className="flex flex-wrap gap-2">
                  {addressConflictDialog.conflictAddresses.map((address) => (
                    <span
                      key={address}
                      className="px-2 py-1 bg-rose-900 text-white rounded text-sm font-mono"
                    >
                      {address}
                    </span>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={fixingConflicts}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleFixConflicts();
              }}
              disabled={fixingConflicts}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {fixingConflicts ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                "Fix Conflicts"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}

const FixedDeviceSlot = memo(function FixedDeviceSlot({ device, onUnmap }) {
  const { selectedProject } = useProjectDetail();
  const { setNodeRef, isOver } = useDroppable({
    id: `fixed-${device.address}`,
  });

  const [lightingAddress, setLightingAddress] = useState(
    device.mappedDevice?.lightingGroupAddress ?? ""
  );

  useEffect(() => {
    setLightingAddress(device.mappedDevice?.lightingGroupAddress ?? "");
  }, [device.mappedDevice?.lightingGroupAddress]);

  const handleUnmap = useCallback(() => {
    onUnmap(device.address);
  }, [onUnmap, device.address]);

  const handleLightingAddressChange = useCallback((e) => {
    setLightingAddress(e.target.value);
  }, []);

  const handleLightingAddressBlur = useCallback(async () => {
    if (!selectedProject || !device.mappedDevice) return;

    try {
      await window.electronAPI.dali.updateDaliDeviceLightingAddress(
        selectedProject.id,
        device.address,
        lightingAddress === "" ? null : parseInt(lightingAddress)
      );
      toast.success("Device RCU address updated");
    } catch (error) {
      console.error("Failed to update device lighting address:", error);
      toast.error("Failed to update device RCU address");
    }
  }, [selectedProject, device.address, device.mappedDevice, lightingAddress]);

  const handleLightingAddressKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  }, []);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border rounded-md p-3 transition-colors",
        device.mappedDevice
          ? "bg-secondary border-primary"
          : "bg-muted/50 border-dashed",
        isOver && "border-primary border-2 bg-accent"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-mono text-sm font-medium w-12">
            {device.address.toString().padStart(2, "0")}
          </div>
          {device.mappedDevice ? (
            <div className="flex-1">
              <div className="font-medium">{device.mappedDevice.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>Index:{device.mappedDevice.index}</span>
                <span>|</span>
                <span>Address:{device.mappedDevice.address}</span>
                <span>|</span>
                <span className="flex items-center gap-1">
                  RCU Group:
                  <Input
                    type="number"
                    value={lightingAddress}
                    onChange={handleLightingAddressChange}
                    onBlur={handleLightingAddressBlur}
                    onKeyDown={handleLightingAddressKeyDown}
                    placeholder="N/A"
                    className="h-6 w-13 text-xs text-center inline-block [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </span>
                <span>|</span>
                <span>
                  Color:
                  {device.mappedDevice.colorFeature !== undefined
                    ? device.mappedDevice.colorFeature
                    : "N/A"}
                </span>
                <span>|</span>
                <span>Type:{device.mappedDevice.type}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Drop device here to map
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <TriggerDeviceButton
            address={device.address}
            index={device.mappedDevice?.index}
            disabled={false}
            deviceType={device.mappedDevice?.type}
            colorFeature={device.mappedDevice?.colorFeature}
          />
          {device.mappedDevice && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleUnmap}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

const ScannedDeviceItem = memo(function ScannedDeviceItem({ device }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: device.index,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-card border rounded-md p-3 transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-2 flex-1 cursor-move"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {device.name || `Device ${device.address}`}
            </div>
            {device.currentLevel !== undefined && (
              <div className="text-xs font-mono text-muted-foreground">
                Index:{device.index} | Address:{device.address} | RCU Group:
                {device.lightingGroupAddress !== undefined
                  ? device.lightingGroupAddress
                  : "N/A"}{" "}
                | Color:
                {device.colorFeature !== undefined
                  ? device.colorFeature
                  : "N/A"}{" "}
                | Type:{device.type}
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <TriggerDeviceButton
            address={device.address}
            index={device.index}
            disabled={false}
            deviceType={device.type}
            colorFeature={device.colorFeature}
          />
        </div>
      </div>
    </div>
  );
});
