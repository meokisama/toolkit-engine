import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RoomGeneralSettings } from "./room-general-settings";
import { RoomConfiguration } from "./room-configuration";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { toast } from "sonner";
import { Save, Send, Loader2 } from "lucide-react";
import { NetworkUnitSelector, useNetworkUnitSelector } from "@/components/shared/network-unit-selector";

export function RoomSettings() {
  const { selectedProject, projectItems, loadTabData, loadedTabs } = useProjectDetail();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { selectedUnitIds, handleSelectionChange, clearSelection } = useNetworkUnitSelector();
  const networkUnitSelectorRef = useRef(null);

  // Source unit selection state
  const [selectedSourceUnit, setSelectedSourceUnit] = useState(null); // null = Default

  // Room configuration state
  const [roomConfig, setRoomConfig] = useState({
    roomMode: 0, // 0: Standalone, 1: Link, 2: Combine
    clientMode: 0, // 0: None, 1: Madrix Server, 2: Salto Server
    roomAmount: 1, // 1-5 rooms (only for Standalone mode)
    tcpMode: 0, // 0: None, 1: Slave, 2: Master
    slaveAmount: 1, // 1-4 slaves (only for Master mode)
    port: 5000,
    slaveIPs: ["", "", "", ""], // IP addresses for slaves
    clientIP: "",
    clientPort: 8080,
    knxAddress: null, // KNX address
  });

  // Individual room configurations
  const [roomConfigurations, setRoomConfigurations] = useState(
    Array(5)
      .fill(null)
      .map((_, index) => ({
        roomAddress: index + 1,
        occupancyType: 0,
        occupancySceneType: 0,
        enableWelcomeNight: 0,
        pirInitTime: 0,
        pirVerifyTime: 0,
        unrentPeriod: 0,
        standbyTime: 15,
        period: 0,
        states: {},
      }))
  );

  const updateConfig = (field, value) => {
    setRoomConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateRoomConfig = (roomIndex, field, value) => {
    setRoomConfigurations((prev) => {
      const updated = [...prev];
      updated[roomIndex] = {
        ...updated[roomIndex],
        [field]: value,
      };
      return updated;
    });
  };

  // Load room data from database based on selected source unit
  useEffect(() => {
    const loadRoomData = async () => {
      if (!selectedProject) return;

      setIsLoading(true);
      try {
        // Load general config for selected source unit
        const generalConfig = await window.electronAPI.room.getGeneralConfig(selectedProject.id, selectedSourceUnit);

        if (generalConfig) {
          // Load existing general config
          setRoomConfig({
            roomMode: generalConfig.room_mode,
            clientMode: generalConfig.client_mode,
            roomAmount: generalConfig.room_amount,
            tcpMode: generalConfig.tcp_mode,
            slaveAmount: generalConfig.slave_amount,
            port: generalConfig.port,
            slaveIPs: generalConfig.slaveIPs || ["", "", "", ""],
            clientIP: generalConfig.client_ip || "",
            clientPort: generalConfig.client_port,
            knxAddress: generalConfig.knx_address || null,
          });

          // Load room configs for this general config
          if (generalConfig.id) {
            const allRoomConfigs = await window.electronAPI.room.getAllRoomConfigs(generalConfig.id);

            // Reset room configurations to default
            const defaultConfigs = Array(5)
              .fill(null)
              .map((_, index) => ({
                roomAddress: index + 1,
                occupancyType: 0,
                occupancySceneType: 0,
                enableWelcomeNight: 0,
                pirInitTime: 0,
                pirVerifyTime: 0,
                unrentPeriod: 0,
                standbyTime: 15,
                period: 0,
                states: {},
              }));

            // Apply loaded configs
            if (allRoomConfigs && allRoomConfigs.length > 0) {
              const updated = [...defaultConfigs];
              allRoomConfigs.forEach((config) => {
                const index = config.room_address - 1;
                if (index >= 0 && index < 5) {
                  updated[index] = {
                    roomAddress: config.room_address,
                    occupancyType: config.occupancy_type,
                    occupancySceneType: config.occupancy_scene_type,
                    enableWelcomeNight: config.enable_welcome_night || 0,
                    pirInitTime: config.pir_init_time,
                    pirVerifyTime: config.pir_verify_time,
                    unrentPeriod: config.unrent_period,
                    standbyTime: config.standby_time,
                    period: config.period,
                    states: config.states || {},
                  };
                }
              });
              setRoomConfigurations(updated);
            } else {
              setRoomConfigurations(defaultConfigs);
            }
          } else {
            // No room configs found, use defaults
            setRoomConfigurations(
              Array(5)
                .fill(null)
                .map((_, index) => ({
                  roomAddress: index + 1,
                  occupancyType: 0,
                  occupancySceneType: 0,
                  enableWelcomeNight: 0,
                  pirInitTime: 0,
                  pirVerifyTime: 0,
                  unrentPeriod: 0,
                  standbyTime: 15,
                  period: 0,
                  states: {},
                }))
            );
          }
        } else {
          // No general config found, use all defaults
          setRoomConfig({
            roomMode: 0,
            clientMode: 0,
            roomAmount: 1,
            tcpMode: 0,
            slaveAmount: 1,
            port: 5000,
            slaveIPs: ["", "", "", ""],
            clientIP: "",
            clientPort: 8080,
            knxAddress: null,
          });

          setRoomConfigurations(
            Array(5)
              .fill(null)
              .map((_, index) => ({
                roomAddress: index + 1,
                occupancyType: 0,
                occupancySceneType: 0,
                enableWelcomeNight: 0,
                pirInitTime: 0,
                pirVerifyTime: 0,
                unrentPeriod: 0,
                standbyTime: 15,
                period: 0,
                states: {},
              }))
          );
        }
      } catch (error) {
        console.error("Error loading room data:", error);
        toast.error("Failed to load room configurations");
      } finally {
        setIsLoading(false);
      }
    };

    loadRoomData();
  }, [selectedProject, selectedSourceUnit]);

  // Save room configurations
  const handleSave = async () => {
    if (!selectedProject) return;

    setIsSaving(true);
    try {
      // Save general config with source_unit
      await window.electronAPI.room.setGeneralConfig(
        selectedProject.id,
        {
          roomMode: roomConfig.roomMode,
          roomAmount: roomConfig.roomAmount,
          tcpMode: roomConfig.tcpMode,
          port: roomConfig.port,
          slaveAmount: roomConfig.slaveAmount,
          slaveIPs: roomConfig.slaveIPs,
          clientMode: roomConfig.clientMode,
          clientIP: roomConfig.clientIP,
          clientPort: roomConfig.clientPort,
          knxAddress: roomConfig.knxAddress,
        },
        selectedSourceUnit
      );

      // Save room configs based on effective room amount
      const effectiveRoomAmount = roomConfig.roomMode === 0 ? roomConfig.roomAmount : 1;
      for (let i = 0; i < effectiveRoomAmount; i++) {
        const config = roomConfigurations[i];
        await window.electronAPI.room.setRoomConfig(selectedProject.id, selectedSourceUnit, config.roomAddress, {
          occupancyType: config.occupancyType,
          occupancySceneType: config.occupancySceneType,
          enableWelcomeNight: config.enableWelcomeNight,
          period: config.period,
          pirInitTime: config.pirInitTime,
          pirVerifyTime: config.pirVerifyTime,
          unrentPeriod: config.unrentPeriod,
          standbyTime: config.standbyTime,
          states: config.states,
        });
      }

      toast.success(`Room configurations saved successfully${selectedSourceUnit ? " for selected unit" : " (Default)"}`);
    } catch (error) {
      console.error("Error saving room data:", error);
      toast.error("Failed to save room configurations");
    } finally {
      setIsSaving(false);
    }
  };

  // Send room configuration to network units
  const handleSendConfiguration = async () => {
    if (selectedUnitIds.length === 0) {
      toast.error("Please select at least one network unit");
      return;
    }

    if (!selectedProject) return;

    const selectedUnits = networkUnitSelectorRef.current?.getSelectedUnits() || [];

    setIsSending(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Prepare general config for sending
      const generalConfig = {
        room_amount: roomConfig.roomAmount,
        room_mode: roomConfig.roomMode,
        client_mode: roomConfig.clientMode,
        tcp_mode: roomConfig.tcpMode,
        slave_amount: roomConfig.slaveAmount,
        port: roomConfig.port,
        slaveIPs: roomConfig.slaveIPs,
        client_ip: roomConfig.clientIP,
        client_port: roomConfig.clientPort,
        knx_address: roomConfig.knxAddress,
      };

      // Prepare room configs for sending
      const effectiveRoomAmount = roomConfig.roomMode === 0 ? roomConfig.roomAmount : 1;
      const roomConfigsToSend = [];

      for (let i = 0; i < effectiveRoomAmount; i++) {
        const config = roomConfigurations[i];
        roomConfigsToSend.push({
          room_address: config.roomAddress,
          occupancy_type: config.occupancyType,
          occupancy_scene_type: config.occupancySceneType,
          enable_welcome_night: config.enableWelcomeNight,
          pir_init_time: config.pirInitTime,
          pir_verify_time: config.pirVerifyTime,
          unrent_period: config.unrentPeriod,
          standby_time: config.standbyTime,
          period: config.period,
          states: config.states,
        });
      }

      // Send configuration to each selected unit
      for (const unit of selectedUnits) {
        try {
          await window.electronAPI.roomController.setRoomConfiguration(unit.ip_address, unit.id_can, generalConfig, roomConfigsToSend);

          successCount++;
          toast.success(`Configuration sent successfully to ${unit.type || "Unknown Unit"} (${unit.ip_address})`);
        } catch (error) {
          errorCount++;
          console.error(`Failed to send configuration to unit ${unit.ip_address}:`, error);
          toast.error(`Failed to send configuration to ${unit.type || "Unknown Unit"} (${unit.ip_address}): ${error.message}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Configuration sent successfully to ${successCount} unit(s)`);
      }

      if (errorCount === 0) {
        setIsSendDialogOpen(false);
        clearSelection();
      }
    } catch (error) {
      console.error("Error sending room configuration:", error);
      toast.error("Failed to send room configuration");
    } finally {
      setIsSending(false);
    }
  };

  // Determine effective room amount based on room mode
  const effectiveRoomAmount = roomConfig.roomMode === 0 ? roomConfig.roomAmount : 1;

  // Load scenes data if not already loaded
  useEffect(() => {
    if (selectedProject && !loadedTabs.has("scene")) {
      loadTabData(selectedProject.id, "scene");
    }
  }, [selectedProject, loadedTabs, loadTabData]);

  // Load unit data if not already loaded
  useEffect(() => {
    if (selectedProject && !loadedTabs.has("unit")) {
      loadTabData(selectedProject.id, "unit");
    }
  }, [selectedProject, loadedTabs, loadTabData]);

  // Get available scenes
  const availableScenes = projectItems.scene || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading room configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <RoomGeneralSettings config={roomConfig} updateConfig={updateConfig} />
      {/* Room specific configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800 font-extrabold">Room Configurations</CardTitle>
          <CardDescription>Room's detail settings and aircons & scenes configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          {effectiveRoomAmount === 1 ? (
            <RoomConfiguration roomIndex={0} config={roomConfigurations[0]} updateConfig={updateRoomConfig} availableScenes={availableScenes} />
          ) : (
            <Tabs defaultValue="0" className="w-full">
              <TabsList className={`grid w-full grid-cols-${effectiveRoomAmount}`}>
                {Array.from({ length: effectiveRoomAmount }).map((_, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    Room {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Array.from({ length: effectiveRoomAmount }).map((_, index) => (
                <TabsContent key={index} value={index.toString()} className="mt-4">
                  <RoomConfiguration
                    roomIndex={index}
                    config={roomConfigurations[index]}
                    updateConfig={updateRoomConfig}
                    availableScenes={availableScenes}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Source Unit Selector and Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        {/* Source Unit Selector */}
        <div className="flex items-center gap-2">
          <Label htmlFor="source-unit-selector" className="text-sm font-medium whitespace-nowrap">
            Unit
          </Label>
          <Select
            value={selectedSourceUnit?.toString() || "default"}
            onValueChange={(value) => {
              if (value === "default") {
                setSelectedSourceUnit(null);
              } else {
                setSelectedSourceUnit(parseInt(value));
              }
            }}
          >
            <SelectTrigger id="source-unit-selector" className="w-60">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {(projectItems.unit || []).map((unit) => (
                <SelectItem key={unit.id} value={unit.id.toString()}>
                  {unit.type || "Unknown"} - {unit.ip_address || unit.serial_no || "N/A"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={() => setIsSendDialogOpen(true)} disabled={isSaving || isSending} variant="outline">
            <Send className="size-4" />
            Send Configuration
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isSending}>
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save Configurations"}
          </Button>
        </div>
      </div>

      {/* Send Configuration Dialog */}
      <Dialog
        open={isSendDialogOpen}
        onOpenChange={(open) => {
          if (!isSending) {
            setIsSendDialogOpen(open);
            if (!open) {
              clearSelection();
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Room Configuration to Network Units
            </DialogTitle>
            <DialogDescription>Send the current room configuration to selected network units.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <NetworkUnitSelector
              selectedUnitIds={selectedUnitIds}
              onSelectionChange={handleSelectionChange}
              disabled={isSending}
              ref={networkUnitSelectorRef}
              height="h-60"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSendConfiguration} disabled={isSending || selectedUnitIds.length === 0}>
              {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
              {selectedUnitIds.length === 0
                ? "Send Configuration"
                : `Send to ${selectedUnitIds.length} Unit${selectedUnitIds.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
