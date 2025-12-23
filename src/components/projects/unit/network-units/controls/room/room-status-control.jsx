import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Thermometer } from "lucide-react";

export function RoomStatusControl({ roomStatus, setRoomStatus }) {
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
    <div className="space-y-4 p-1">
      {roomStatus && (
        <div className="space-y-4">
          {/* Aircon Mode */}
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="aircon-mode" className="text-base font-semibold">
                  <Thermometer className="h-5 w-5" />
                  Aircon Mode
                </Label>
                <Select value={(roomStatus.aircon_mode ?? 0).toString()} onValueChange={handleAirconModeChange}>
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
          <div className="gap-3 grid grid-cols-2 lg:grid-cols-3">
            {roomStatus.rooms.map((room, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Room {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`rent-status-${index}`} className="flex items-center gap-1">
                        Rent Status
                      </Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={(room.rent_status ?? 0).toString()}
                          onValueChange={(value) => handleRoomStatusChange(index, "rent_status", value)}
                        >
                          <SelectTrigger id={`rent-status-${index}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Unrent</SelectItem>
                            <SelectItem value="1">Rent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`guest-status-${index}`} className="flex items-center gap-1">
                        Guest Status
                      </Label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={(room.guest_status ?? 0).toString()}
                          onValueChange={(value) => handleRoomStatusChange(index, "guest_status", value)}
                        >
                          <SelectTrigger id={`guest-status-${index}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Normal</SelectItem>
                            <SelectItem value="1">VIP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!roomStatus && (
        <div className="text-center text-muted-foreground py-8">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Click "Read Status" to load room status from the unit</p>
        </div>
      )}
    </div>
  );
}
