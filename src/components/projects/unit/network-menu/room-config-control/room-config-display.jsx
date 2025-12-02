"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings2,
  LibraryBig,
  Network,
  ChevronsLeftRightEllipsis,
  Share2,
  Timer,
  SlidersVertical,
  Thermometer,
  Fan,
  ThermometerSnowflake,
  ThermometerSun,
  Lightbulb,
} from "lucide-react";

const ROOM_MODE_LABELS = {
  0: "Standalone",
  1: "Link",
  2: "Combine",
};

const CLIENT_MODE_LABELS = {
  0: "None",
  1: "Madrix Server",
  2: "Salto Server",
};

const TCP_MODE_LABELS = {
  0: "None",
  1: "Slave",
  2: "Master",
};

const OCCUPANCY_TYPE_LABELS = {
  0: "None",
  1: "Keycard",
  2: "Keyless",
};

const OCCUPANCY_SCENE_TYPE_LABELS = {
  0: "Welcome",
  1: "Restore",
};

const AIRCON_MODE_LABELS = {
  0: "Off",
  1: "Cool",
  2: "Heat",
  3: "Ventilation",
  4: "Dry",
  5: "Auto",
};

const FAN_SPEED_LABELS = {
  0: "Low",
  1: "Medium",
  2: "High",
  3: "Auto",
  4: "Off",
  5: "Powerful",
};

const ROOM_STATES = [
  "Unrent",
  "Unoccupy",
  "Checkin",
  "Welcome",
  "WelcomeNight",
  "Staff",
  "OutOfService",
];

export function RoomConfigDisplay({ roomConfig }) {
  if (!roomConfig) return null;

  return (
    <div className="space-y-4">
      {/* General Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Room General Settings
          </CardTitle>
          <CardDescription>
            Overview configuration of the room and the room's slaves.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                <Settings2 className="h-4 w-4" />
                Room Mode
              </div>
              <Badge variant="outline" className="font-normal">
                {ROOM_MODE_LABELS[roomConfig.generalConfig.room_mode] ||
                  roomConfig.generalConfig.room_mode}
              </Badge>
            </div>

            {roomConfig.generalConfig.room_mode === 0 && (
              <div>
                <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                  <LibraryBig className="h-4 w-4" />
                  Room Amount
                </div>
                <div className="text-sm">
                  {roomConfig.generalConfig.room_amount}{" "}
                  {roomConfig.generalConfig.room_amount === 1 ? "Room" : "Rooms"}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                <Network className="h-4 w-4" />
                TCP Mode
              </div>
              <Badge variant="outline" className="font-normal">
                {TCP_MODE_LABELS[roomConfig.generalConfig.tcp_mode] ||
                  roomConfig.generalConfig.tcp_mode}
              </Badge>
            </div>

            <div>
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                <ChevronsLeftRightEllipsis className="h-4 w-4" />
                Port
              </div>
              <div className="text-sm">{roomConfig.generalConfig.port}</div>
            </div>

            {roomConfig.generalConfig.tcp_mode === 2 && (
              <div>
                <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                  <LibraryBig className="h-4 w-4" />
                  Slave Amount
                </div>
                <div className="text-sm">
                  {roomConfig.generalConfig.slave_amount}{" "}
                  {roomConfig.generalConfig.slave_amount === 1
                    ? "Slave"
                    : "Slaves"}
                </div>
              </div>
            )}
          </div>

          {roomConfig.generalConfig.tcp_mode === 2 &&
            roomConfig.generalConfig.slaveIPs &&
            roomConfig.generalConfig.slaveIPs.some(
              (ip) => ip && ip !== "0.0.0.0"
            ) && (
              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  Slave IPs
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {roomConfig.generalConfig.slaveIPs.map((ip, index) =>
                    ip && ip !== "0.0.0.0" ? (
                      <div key={index} className="text-sm">
                        <span className="font-medium">Slave {index + 1}:</span>{" "}
                        {ip}
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Client Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Client Settings
          </CardTitle>
          <CardDescription>
            Configuration of third-party client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                <Settings2 className="h-4 w-4" />
                Client Mode
              </div>
              <Badge variant="outline" className="font-normal">
                {CLIENT_MODE_LABELS[roomConfig.generalConfig.client_mode] ||
                  roomConfig.generalConfig.client_mode}
              </Badge>
            </div>

            {(roomConfig.generalConfig.client_mode === 1 ||
              roomConfig.generalConfig.client_mode === 2) && (
              <>
                <div>
                  <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    Client IP
                  </div>
                  <div className="text-sm">
                    {roomConfig.generalConfig.client_ip || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                    <ChevronsLeftRightEllipsis className="h-4 w-4" />
                    Client Port
                  </div>
                  <div className="text-sm">
                    {roomConfig.generalConfig.client_port || "N/A"}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Room Configurations */}
      {roomConfig.rooms && roomConfig.rooms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <LibraryBig className="h-5 w-5" />
            Room Configurations
          </h3>
          {roomConfig.rooms.map((room, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LibraryBig className="h-4 w-4" />
                  Room {room.room_address}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Settings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                      <Settings2 className="h-4 w-4" />
                      Occupancy Type
                    </div>
                    <Badge variant="secondary" className="font-normal">
                      {OCCUPANCY_TYPE_LABELS[room.occupancy_type] ||
                        room.occupancy_type}
                    </Badge>
                  </div>

                  {(room.occupancy_type === 1 || room.occupancy_type === 2) && (
                    <>
                      <div>
                        <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                          <SlidersVertical className="h-4 w-4" />
                          Occupancy Scene Type
                        </div>
                        <Badge variant="outline" className="font-normal">
                          {OCCUPANCY_SCENE_TYPE_LABELS[
                            room.occupancy_scene_type
                          ] || room.occupancy_scene_type}
                        </Badge>
                      </div>

                      <div>
                        <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          Period
                        </div>
                        <div className="text-sm">{room.period}s</div>
                      </div>
                    </>
                  )}

                  {room.occupancy_type === 2 && (
                    <>
                      <div>
                        <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                          <SlidersVertical className="h-4 w-4" />
                          Welcome Night
                        </div>
                        <Badge variant="outline" className="font-normal">
                          {room.enable_welcome_night
                            ? "Welcome Day/Night"
                            : "Welcome"}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                {/* Keyless-specific settings */}
                {room.occupancy_type === 2 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        PIR Init Time
                      </div>
                      <div className="text-sm">{room.pir_init_time}s</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        PIR Verify Time
                      </div>
                      <div className="text-sm">{room.pir_verify_time}s</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        Unrent Period
                      </div>
                      <div className="text-sm">{room.unrent_period}s</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        Standby Time
                      </div>
                      <div className="text-sm">{room.standby_time}s</div>
                    </div>
                  </div>
                )}

                {/* Room States */}
                {room.states && Object.keys(room.states).length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">
                      State Configurations
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aircon configuration and scenes for room states.
                    </p>
                    <Tabs defaultValue={ROOM_STATES[0]} className="w-full">
                      <TabsList className="grid w-full grid-cols-7">
                        {ROOM_STATES.map((stateName) => (
                          <TabsTrigger key={stateName} value={stateName}>
                            {stateName}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {ROOM_STATES.map((stateName) => {
                        const state = room.states[stateName] || {};
                        return (
                          <TabsContent key={stateName} value={stateName}>
                            <Card>
                              <CardContent className="pt-6 space-y-4">
                                {/* Aircon Settings */}
                                <div>
                                  <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                                    <Thermometer className="h-4 w-4" />
                                    {stateName} Aircon Settings
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1">
                                        Status
                                      </div>
                                      <Badge
                                        variant={
                                          state.airconActive
                                            ? "default"
                                            : "secondary"
                                        }
                                      >
                                        {state.airconActive
                                          ? "Active"
                                          : "Inactive"}
                                      </Badge>
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <Settings2 className="h-3 w-3" />
                                        Mode
                                      </div>
                                      <div className="text-sm">
                                        {AIRCON_MODE_LABELS[state.airconMode] ||
                                          state.airconMode}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <Fan className="h-3 w-3" />
                                        Fan Speed
                                      </div>
                                      <div className="text-sm">
                                        {FAN_SPEED_LABELS[state.airconFanSpeed] ||
                                          state.airconFanSpeed}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <ThermometerSnowflake className="h-3 w-3" />
                                        Cool Setpoint
                                      </div>
                                      <div className="text-sm">
                                        {state.airconCoolSetpoint}°C
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                        <ThermometerSun className="h-3 w-3" />
                                        Heat Setpoint
                                      </div>
                                      <div className="text-sm">
                                        {state.airconHeatSetpoint}°C
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Scenes List */}
                                {state.scenesList && state.scenesList.length > 0 && (
                                  <div>
                                    <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                                      <Lightbulb className="h-4 w-4" />
                                      Selected Scenes
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {state.scenesList.map((sceneId, idx) => (
                                        <Badge key={idx} variant="outline">
                                          Scene {sceneId}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {(!state.scenesList ||
                                  state.scenesList.length === 0) &&
                                  !state.airconActive && (
                                    <div className="text-center text-muted-foreground py-4 text-sm">
                                      No configuration for this state
                                    </div>
                                  )}
                              </CardContent>
                            </Card>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
