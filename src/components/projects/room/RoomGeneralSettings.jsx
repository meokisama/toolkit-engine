import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2, LibraryBig, Network, ChevronsLeftRightEllipsis, Share2, Layers } from "lucide-react";
import { KNXAddressInput } from "@/components/custom/knx-input";

export function RoomGeneralSettings({ config, updateConfig }) {
  const { roomMode, clientMode, roomAmount, tcpMode, slaveAmount, port, slaveIPs, clientIP, clientPort, knxAddress } = config;

  // Room mode determines if room amount is shown
  const showRoomAmount = roomMode === 0; // Only for Standalone

  // TCP mode determines if slave fields are shown
  const showSlaveFields = tcpMode === 2; // Only for Master

  // Client mode determines if client fields are shown
  const showClientFields = clientMode === 1 || clientMode === 2; // Madrix or Salto

  const handleSlaveIPChange = (index, value) => {
    const newSlaveIPs = [...slaveIPs];
    newSlaveIPs[index] = value;
    updateConfig("slaveIPs", newSlaveIPs);
  };

  return (
    <div className="space-y-4">
      <Card className="">
        <CardHeader>
          <CardTitle className="text-gray-800 font-extrabold">Room General Settings</CardTitle>
          <CardDescription>Overview configuration of the room and the room's slaves.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-4 gap-2">
            {/* Room Mode */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="room-mode" className="text-right gap-1">
                <Settings2 className="size-4" />
                Room Mode
              </Label>
              <Select value={roomMode.toString()} onValueChange={(value) => updateConfig("roomMode", parseInt(value))}>
                <SelectTrigger id="room-mode" className="w-full">
                  <SelectValue placeholder="Select room mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Standalone</SelectItem>
                  <SelectItem value="1">Link</SelectItem>
                  <SelectItem value="2">Combine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Room Amount - Only show for Standalone mode */}
            {showRoomAmount && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="room-amount" className="text-right gap-1">
                  <LibraryBig className="size-4" />
                  Room Amount
                </Label>
                <Select value={roomAmount.toString()} onValueChange={(value) => updateConfig("roomAmount", parseInt(value))}>
                  <SelectTrigger id="room-amount" className="w-full">
                    <SelectValue placeholder="Select room amount" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "Room" : "Rooms"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* TCP Mode */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tcp-mode" className="text-right gap-1">
                <Network className="size-4" />
                TCP Mode
              </Label>
              <Select value={tcpMode.toString()} onValueChange={(value) => updateConfig("tcpMode", parseInt(value))}>
                <SelectTrigger id="tcp-mode" className="w-full">
                  <SelectValue placeholder="Select TCP mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="1">Slave</SelectItem>
                  <SelectItem value="2">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Port */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="port" className="text-right gap-1">
                  <ChevronsLeftRightEllipsis className="size-4" />
                  Port
                </Label>
                <Input
                  id="port"
                  type="number"
                  value={port}
                  onChange={(e) => updateConfig("port", parseInt(e.target.value) || 0)}
                  placeholder="5000"
                  className="w-full"
                />
              </div>
              {/* Slave Amount - Only show for Master mode */}
              {showSlaveFields && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="slave-amount" className="text-right gap-1">
                    <LibraryBig className="size-4" />
                    Slave Amount
                  </Label>
                  <Select value={slaveAmount.toString()} onValueChange={(value) => updateConfig("slaveAmount", parseInt(value))}>
                    <SelectTrigger id="slave-amount" className="w-full">
                      <SelectValue placeholder="Select slave amount" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "Slave" : "Slaves"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Slave IPs - Only show for Master mode */}
          {showSlaveFields && (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: slaveAmount }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Label htmlFor={`slave-ip-${index}`} className="text-right">
                    <Share2 className="size-4" />
                    Slave {index + 1} IP
                  </Label>
                  <Input
                    id={`slave-ip-${index}`}
                    value={slaveIPs[index] || ""}
                    onChange={(e) => handleSlaveIPChange(index, e.target.value)}
                    placeholder="192.168.1.100"
                    className="col-span-3"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex gap-4">
          {/* KNX Address */}
          <Label htmlFor="knx-address" className="text-right gap-1">
            <Layers className="size-4" />
            KNX Address
          </Label>
          <KNXAddressInput
            id="knx-address"
            value={knxAddress || ""}
            onChange={(value) => updateConfig("knxAddress", value || null)}
            placeholder="0/0/0"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800 font-extrabold">Client Settings</CardTitle>
          <CardDescription>Configuration of third-party client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {/* Client Mode */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="client-mode" className="text-right gap-1">
                <Settings2 className="size-4" />
                Client Mode
              </Label>
              <Select value={clientMode.toString()} onValueChange={(value) => updateConfig("clientMode", parseInt(value))}>
                <SelectTrigger id="client-mode" className="w-full">
                  <SelectValue placeholder="Select client mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="1">Madrix Server</SelectItem>
                  <SelectItem value="2">Salto Server</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client IP and Port - Only show when Client Mode is Madrix or Salto */}
            {showClientFields && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="client-ip" className="text-right gap-1">
                    <Share2 className="size-4" />
                    Client IP
                  </Label>
                  <Input
                    id="client-ip"
                    value={clientIP}
                    onChange={(e) => updateConfig("clientIP", e.target.value)}
                    placeholder="192.168.1.100"
                    className="col-span-3"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="client-port" className="text-right gap-1">
                    <ChevronsLeftRightEllipsis className="size-4" />
                    Client Port
                  </Label>
                  <Input
                    id="client-port"
                    type="number"
                    value={clientPort}
                    onChange={(e) => updateConfig("clientPort", parseInt(e.target.value) || 0)}
                    placeholder="8080"
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
