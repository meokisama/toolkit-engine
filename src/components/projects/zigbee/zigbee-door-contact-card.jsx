import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, DoorClosed } from "lucide-react";

export function ZigbeeDoorContactCard({ device, unit }) {
  // Door contact typically uses endpoint 1
  // Value 0 = Closed, Value > 0 = Open
  const isOpen = device.endpoint1_value > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isOpen ? (
              <DoorOpen className="h-4 w-4" />
            ) : (
              <DoorClosed className="h-4 w-4" />
            )}
            Door Contact
          </CardTitle>
          <Badge variant={device.status === 1 ? "default" : "secondary"}>
            {device.status === 1 ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Info */}
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">IEEE Address:</span>
            <span className="font-mono text-xs">{device.ieee_address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unit:</span>
            <span>{unit?.type || "Unknown"} ({device.unit_ip})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RSSI:</span>
            <span>{device.rssi} dBm</span>
          </div>
        </div>

        {/* Door Status */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="font-medium">Door Status</span>
            <Badge
              variant={isOpen ? "destructive" : "default"}
              className={isOpen ? "animate-pulse" : ""}
            >
              {isOpen ? "Opened" : "Closed"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
