import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, LibraryBig, Network } from "lucide-react";
import { Input } from "@/components/ui/input";

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

const ROOM_STATES = ["Unrent", "Unoccupy", "Checkin", "Welcome", "WelcomeNight", "Staff", "OutOfService"];

export function RoomConfigDisplay({ roomConfig }) {
  if (!roomConfig) return null;

  return (
    <div className="space-y-4 p-1">
      {/* General Configuration */}
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">Room Mode</div>
              <Input readOnly value={ROOM_MODE_LABELS[roomConfig.generalConfig.room_mode] || roomConfig.generalConfig.room_mode} />
            </div>

            {roomConfig.generalConfig.room_mode === 0 && (
              <div>
                <div className="text-sm font-semibold mb-1 flex items-center gap-1">Room Amount</div>
                <Input readOnly value={`${roomConfig.generalConfig.room_amount} ${roomConfig.generalConfig.room_amount === 1 ? "Room" : "Rooms"}`} />
              </div>
            )}

            <div>
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">TCP Mode</div>
              <Input readOnly value={TCP_MODE_LABELS[roomConfig.generalConfig.tcp_mode] || roomConfig.generalConfig.tcp_mode} />
            </div>

            <div>
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">Port</div>
              <Input readOnly value={roomConfig.generalConfig.port} />
            </div>

            {roomConfig.generalConfig.tcp_mode === 2 && (
              <div>
                <div className="text-sm font-semibold mb-1 flex items-center gap-1">Slave Amount</div>
                <Input
                  readOnly
                  value={`${roomConfig.generalConfig.slave_amount} ${roomConfig.generalConfig.slave_amount === 1 ? "Slave" : "Slaves"}`}
                />
              </div>
            )}
          </div>

          {roomConfig.generalConfig.tcp_mode === 2 &&
            roomConfig.generalConfig.slaveIPs &&
            roomConfig.generalConfig.slaveIPs.some((ip) => ip && ip !== "0.0.0.0") && (
              <div>
                <div className="text-sm font-semibold mb-2 flex items-center gap-1">Slave IPs</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {roomConfig.generalConfig.slaveIPs.map((ip, index) =>
                    ip && ip !== "0.0.0.0" ? (
                      <div key={index} className="text-sm">
                        <span className="font-medium">Slave {index + 1}:</span> {ip}
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-semibold mb-1 flex items-center gap-1">Client Mode</div>
              <Input readOnly value={CLIENT_MODE_LABELS[roomConfig.generalConfig.client_mode] || roomConfig.generalConfig.client_mode} />
            </div>

            {(roomConfig.generalConfig.client_mode === 1 || roomConfig.generalConfig.client_mode === 2) && (
              <>
                <div>
                  <div className="text-sm font-semibold mb-1 flex items-center gap-1">Client IP</div>
                  <Input readOnly value={roomConfig.generalConfig.client_ip || "N/A"} />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1 flex items-center gap-1">Client Port</div>
                  <Input readOnly value={roomConfig.generalConfig.client_port || "N/A"} />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KNX Address */}
      <Card>
        <CardContent className="gap-4 flex">
          <div className="text-sm font-semibold mb-1 flex items-center gap-1">KNX Address</div>
          <Input className="font-mono w-fit" readOnly value={roomConfig.generalConfig.knx_address || "-/-/-"} />
        </CardContent>
      </Card>

      {/* Room Configurations */}
      {roomConfig.rooms && roomConfig.rooms.length > 0 && (
        <div className="space-y-3">
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
                    <div className="text-sm font-semibold mb-1 flex items-center gap-1">Occupancy Type</div>
                    <Input readOnly value={OCCUPANCY_TYPE_LABELS[room.occupancy_type] || room.occupancy_type} />
                  </div>

                  {(room.occupancy_type === 1 || room.occupancy_type === 2) && (
                    <>
                      <div>
                        <div className="text-sm font-semibold mb-1 flex items-center gap-1">Occupancy Scene Type</div>
                        <Input readOnly value={OCCUPANCY_SCENE_TYPE_LABELS[room.occupancy_scene_type] || room.occupancy_scene_type} />
                      </div>

                      <div>
                        <div className="text-sm font-semibold mb-1 flex items-center gap-1">Period (s)</div>
                        <Input readOnly value={room.period} />
                      </div>
                    </>
                  )}

                  {room.occupancy_type === 2 && (
                    <>
                      <div>
                        <div className="text-sm font-semibold mb-1 flex items-center gap-1">Welcome Night</div>
                        <Input readOnly value={room.enable_welcome_night ? "Welcome Day/Night" : "Welcome"} />
                      </div>
                    </>
                  )}
                </div>

                {/* Keyless-specific settings */}
                {room.occupancy_type === 2 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">PIR Init Time (s)</div>
                      <Input readOnly value={room.pir_init_time} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">PIR Verify Time (s)</div>
                      <Input readOnly value={room.pir_verify_time} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">Unrent Period (s)</div>
                      <Input readOnly value={room.unrent_period} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">Standby Time (s)</div>
                      <Input readOnly value={room.standby_time} />
                    </div>
                  </div>
                )}

                {/* Room States */}
                {room.states && Object.keys(room.states).length > 0 && (
                  <div className="space-y-2">
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
                              <CardContent className="space-y-4">
                                {/* Aircon Settings */}
                                <div>
                                  <div className="text-sm font-semibold mb-4 flex items-center gap-3">
                                    <span>1. {stateName} Aircon Settings</span>
                                    <Badge variant={state.airconActive ? "default" : "secondary"}>{state.airconActive ? "Active" : "Inactive"}</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">Mode</div>
                                      <Input readOnly value={AIRCON_MODE_LABELS[state.airconMode] || state.airconMode} />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">Fan Speed</div>
                                      <Input readOnly value={FAN_SPEED_LABELS[state.airconFanSpeed] || state.airconFanSpeed} />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">Cool Setpoint (°C)</div>
                                      <Input readOnly value={state.airconCoolSetpoint} />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold mb-1 flex items-center gap-1">Heat Setpoint (°C)</div>
                                      <Input readOnly value={state.airconHeatSetpoint} />
                                    </div>
                                  </div>
                                </div>

                                {/* Scenes List */}
                                <div>
                                  <div className="text-sm font-semibold mb-2 flex items-center gap-1">2. Selected Scenes</div>
                                  {state.scenesList && state.scenesList.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {state.scenesList.map((sceneId, idx) => (
                                        <Badge key={idx} variant="outline">
                                          Scene {sceneId}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
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
