import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RoomGeneralSettings } from "./RoomGeneralSettings";
import { RoomConfiguration } from "./RoomConfiguration";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export function RoomSettings() {
  const { selectedProject, projectItems, loadTabData, loadedTabs } =
    useProjectDetail();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
  });

  // Individual room configurations
  const [roomConfigurations, setRoomConfigurations] = useState(
    Array(5)
      .fill(null)
      .map((_, index) => ({
        roomAddress: index + 1,
        occupancyType: 0,
        occupancySceneType: 0,
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

  // Load room data from database
  useEffect(() => {
    const loadRoomData = async () => {
      if (!selectedProject) return;

      setIsLoading(true);
      try {
        // Load general config
        const generalConfig =
          await window.electronAPI.room.getGeneralConfig(selectedProject.id);
        if (generalConfig) {
          setRoomConfig({
            roomMode: generalConfig.room_mode,
            clientMode: generalConfig.client_mode,
            roomAmount: generalConfig.room_amount,
            tcpMode: generalConfig.tcp_mode,
            slaveAmount: generalConfig.slave_amount,
            port: generalConfig.port,
            slaveIPs: generalConfig.slave_ips
              ? generalConfig.slave_ips.split(",")
              : ["", "", "", ""],
            clientIP: generalConfig.client_ip || "",
            clientPort: generalConfig.client_port,
          });
        }

        // Load all room configs
        const allRoomConfigs =
          await window.electronAPI.room.getAllRoomConfigs(selectedProject.id);
        if (allRoomConfigs && allRoomConfigs.length > 0) {
          setRoomConfigurations((prev) => {
            const updated = [...prev];
            allRoomConfigs.forEach((config) => {
              const index = config.room_address - 1;
              if (index >= 0 && index < 5) {
                updated[index] = {
                  roomAddress: config.room_address,
                  occupancyType: config.occupancy_type,
                  occupancySceneType: config.occupancy_scene_type,
                  pirInitTime: config.pir_init_time,
                  pirVerifyTime: config.pir_verify_time,
                  unrentPeriod: config.unrent_period,
                  standbyTime: config.standby_time,
                  period: config.period,
                  states: config.states || {},
                };
              }
            });
            return updated;
          });
        }
      } catch (error) {
        console.error("Error loading room data:", error);
        toast({
          title: "Error",
          description: "Failed to load room configurations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRoomData();
  }, [selectedProject, toast]);

  // Save room configurations
  const handleSave = async () => {
    if (!selectedProject) return;

    setIsSaving(true);
    try {
      // Save general config
      await window.electronAPI.room.setGeneralConfig(selectedProject.id, {
        roomMode: roomConfig.roomMode,
        roomAmount: roomConfig.roomAmount,
        tcpMode: roomConfig.tcpMode,
        port: roomConfig.port,
        slaveAmount: roomConfig.slaveAmount,
        slaveIPs: roomConfig.slaveIPs,
        clientMode: roomConfig.clientMode,
        clientIP: roomConfig.clientIP,
        clientPort: roomConfig.clientPort,
      });

      // Save room configs based on effective room amount
      const effectiveRoomAmount =
        roomConfig.roomMode === 0 ? roomConfig.roomAmount : 1;
      for (let i = 0; i < effectiveRoomAmount; i++) {
        const config = roomConfigurations[i];
        await window.electronAPI.room.setRoomConfig(
          selectedProject.id,
          config.roomAddress,
          {
            occupancyType: config.occupancyType,
            occupancySceneType: config.occupancySceneType,
            period: config.period,
            pirInitTime: config.pirInitTime,
            pirVerifyTime: config.pirVerifyTime,
            unrentPeriod: config.unrentPeriod,
            standbyTime: config.standbyTime,
            states: config.states,
          }
        );
      }

      toast({
        title: "Success",
        description: "Room configurations saved successfully",
      });
    } catch (error) {
      console.error("Error saving room data:", error);
      toast({
        title: "Error",
        description: "Failed to save room configurations",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Determine effective room amount based on room mode
  const effectiveRoomAmount =
    roomConfig.roomMode === 0 ? roomConfig.roomAmount : 1;

  // Load scenes data if not already loaded
  useEffect(() => {
    if (selectedProject && !loadedTabs.has("scene")) {
      loadTabData(selectedProject.id, "scene");
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
      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="size-4 mr-2" />
          {isSaving ? "Saving..." : "Save Configurations"}
        </Button>
      </div>

      <RoomGeneralSettings config={roomConfig} updateConfig={updateConfig} />
      {/* Room specific configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800 font-extrabold">
            Room Configurations
          </CardTitle>
          <CardDescription>
            Room's detail settings and aircons & scenes configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {effectiveRoomAmount === 1 ? (
            <RoomConfiguration
              roomIndex={0}
              config={roomConfigurations[0]}
              updateConfig={updateRoomConfig}
              availableScenes={availableScenes}
            />
          ) : (
            <Tabs defaultValue="0" className="w-full">
              <TabsList
                className={`grid w-full grid-cols-${effectiveRoomAmount}`}
              >
                {Array.from({ length: effectiveRoomAmount }).map((_, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    Room {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Array.from({ length: effectiveRoomAmount }).map((_, index) => (
                <TabsContent
                  key={index}
                  value={index.toString()}
                  className="mt-4"
                >
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

      {/* Save Button at bottom */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="size-4 mr-2" />
          {isSaving ? "Saving..." : "Save Configurations"}
        </Button>
      </div>
    </div>
  );
}
