import React from "react";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, DoorClosed, LockOpen, Lock } from "lucide-react";
import { ZigbeeDeviceCardWrapper } from "./zigbee-device-card-wrapper";

export function ZigbeeDoorContactCard({ device, onRemove }) {
  // Door contact typically uses endpoint 1
  // Value 0 = Closed, Value > 0 = Open
  const isOpen = device.endpoint1_value > 0;
  const deviceName = device.device_name || "Door Contact";

  return (
    <ZigbeeDeviceCardWrapper device={device} onRemove={onRemove} icon={isOpen ? DoorOpen : DoorClosed} title={deviceName} showStatus={false}>
      {/* Door Status */}
      <div
        className={`relative p-5 rounded-lg border-2 transition-all duration-300 overflow-hidden ${
          isOpen ? "bg-red-500/10 border-red-500/30 shadow-md" : "bg-green-500/10 border-green-500/30"
        }`}
      >
        {isOpen && <div className="absolute inset-0 bg-linear-to-r from-red-500/5 via-red-500/10 to-red-500/5 animate-pulse" />}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full transition-all duration-300 ${isOpen ? "bg-red-500/20 animate-pulse" : "bg-green-500/20"}`}>
              {isOpen ? <LockOpen className="h-5 w-5 text-red-600" /> : <Lock className="h-5 w-5 text-green-700" />}
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Door Status</p>
              <p className={`font-semibold ${isOpen ? "text-red-600" : "text-green-700"}`}>{isOpen ? "Door Open" : "Door Closed"}</p>
            </div>
          </div>
          <Badge
            variant={isOpen ? "destructive" : "default"}
            className={`font-medium ${isOpen ? "animate-pulse bg-red-600 hover:bg-red-600" : "bg-green-700 hover:bg-green-700"}`}
          >
            {isOpen ? "Unsecured" : "Secured"}
          </Badge>
        </div>
      </div>
    </ZigbeeDeviceCardWrapper>
  );
}
