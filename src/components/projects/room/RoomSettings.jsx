import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomGeneralSettings } from "./RoomGeneralSettings";
import { RoomConfiguration } from "./RoomConfiguration";
import { useProjectDetail } from "@/contexts/project-detail-context";

export function RoomSettings() {
  const { selectedProject, projectItems, loadTabData, loadedTabs } =
    useProjectDetail();
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

  return (
    <div className="space-y-4 py-4">
      <RoomGeneralSettings config={roomConfig} updateConfig={updateConfig} />
      {/* Room specific configurations */}
      <Card>
        <CardHeader>
          <CardTitle>Room Configurations</CardTitle>
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
    </div>
  );
}
