"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Loader2,
  Upload,
  Building2,
  Thermometer,
  Hotel,
  Star,
} from "lucide-react";
import { toast } from "sonner";

const RENT_STATUS_LABELS = {
  0: "Unrent",
  1: "Rent",
};

const GUEST_STATUS_LABELS = {
  0: "Normal",
  1: "VIP",
};

export function RoomStatusControl({ unit }) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [roomStatus, setRoomStatus] = useState(null);

  const handleReadStatus = async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoading(true);
    try {
      const status = await window.electronAPI.roomController.getRoomStatus(
        unit.ip_address,
        unit.id_can
      );

      setRoomStatus(status);
      toast.success("Room status read successfully");
    } catch (error) {
      console.error("Failed to read room status:", error);
      toast.error(`Failed to read room status: ${error.message}`);
      setRoomStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendStatus = async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    if (!roomStatus) {
      toast.error("No room status to send");
      return;
    }

    setSending(true);
    try {
      await window.electronAPI.roomController.setRoomStatus(
        unit.ip_address,
        unit.id_can,
        roomStatus.aircon_mode,
        roomStatus.rooms
      );

      toast.success("Room status sent successfully");
    } catch (error) {
      console.error("Failed to send room status:", error);
      toast.error(`Failed to send room status: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleAirconModeChange = (value) => {
    setRoomStatus({
      ...roomStatus,
      aircon_mode: parseInt(value),
    });
  };

  const handleRoomStatusChange = (roomIndex, field, value) => {
    const updatedRooms = [...roomStatus.rooms];
    updatedRooms[roomIndex] = {
      ...updatedRooms[roomIndex],
      [field]: parseInt(value),
    };
    setRoomStatus({
      ...roomStatus,
      rooms: updatedRooms,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={handleReadStatus} disabled={loading || sending}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {loading ? "Reading..." : "Read Status"}
        </Button>

        <Button
          onClick={handleSendStatus}
          disabled={!roomStatus || loading || sending}
          variant="default"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {sending ? "Sending..." : "Send Status"}
        </Button>
      </div>

      {roomStatus && (
        <div className="space-y-4">
          {/* Aircon Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                General Aircon Mode
              </CardTitle>
              <CardDescription>
                Global air conditioning mode setting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="aircon-mode">Aircon Mode</Label>
                <Select
                  value={(roomStatus.aircon_mode ?? 0).toString()}
                  onValueChange={handleAirconModeChange}
                >
                  <SelectTrigger id="aircon-mode" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Cool</SelectItem>
                    <SelectItem value="1">Heat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Room Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Room Status
              </CardTitle>
              <CardDescription>
                Rent and guest status for each room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roomStatus.rooms.map((room, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Room {index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor={`rent-status-${index}`}
                            className="flex items-center gap-1"
                          >
                            <Hotel className="h-4 w-4" />
                            Rent Status
                          </Label>
                          <div className="flex items-center gap-2">
                            <Select
                              value={(room.rent_status ?? 0).toString()}
                              onValueChange={(value) =>
                                handleRoomStatusChange(
                                  index,
                                  "rent_status",
                                  value
                                )
                              }
                            >
                              <SelectTrigger
                                id={`rent-status-${index}`}
                                className="w-full"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Unrent</SelectItem>
                                <SelectItem value="1">Rent</SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge
                              variant={
                                room.rent_status === 1 ? "default" : "secondary"
                              }
                            >
                              {RENT_STATUS_LABELS[room.rent_status ?? 0]}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor={`guest-status-${index}`}
                            className="flex items-center gap-1"
                          >
                            <Star className="h-4 w-4" />
                            Guest Status
                          </Label>
                          <div className="flex items-center gap-2">
                            <Select
                              value={(room.guest_status ?? 0).toString()}
                              onValueChange={(value) =>
                                handleRoomStatusChange(
                                  index,
                                  "guest_status",
                                  value
                                )
                              }
                            >
                              <SelectTrigger
                                id={`guest-status-${index}`}
                                className="w-full"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Normal</SelectItem>
                                <SelectItem value="1">VIP</SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge
                              variant={
                                room.guest_status === 1 ? "default" : "outline"
                              }
                            >
                              {GUEST_STATUS_LABELS[room.guest_status ?? 0]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!roomStatus && !loading && (
        <div className="text-center text-muted-foreground py-8">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Click "Read Status" to load room status from the unit</p>
        </div>
      )}
    </div>
  );
}
