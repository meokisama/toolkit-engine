import React from "react";
import { Badge } from "@/components/ui/badge";
import { PersonStanding, Activity } from "lucide-react";
import { ZigbeeDeviceCardWrapper } from "./zigbee-device-card-wrapper";

export function ZigbeeMotionSensorCard({ device, onRemove }) {
  // Motion sensor typically uses endpoint 1
  const motionDetected = device.endpoint1_value > 0;
  const deviceName = device.device_name || "Motion Sensor";

  return (
    <ZigbeeDeviceCardWrapper
      device={device}
      onRemove={onRemove}
      icon={PersonStanding}
      title={deviceName}
      showStatus={false}
    >
      {/* Motion Status */}
      <div className={`relative p-5 rounded-lg border-2 transition-all duration-300 overflow-hidden ${
        motionDetected
          ? "bg-red-500/10 border-red-500/30 shadow-md"
          : "bg-muted/30 border-border"
      }`}>
        {motionDetected && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5 animate-pulse" />
        )}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full transition-all duration-300 ${
              motionDetected
                ? "bg-red-500/20 animate-pulse"
                : "bg-muted"
            }`}>
              {motionDetected ? (
                <Activity className="h-5 w-5 text-red-600" />
              ) : (
                <PersonStanding className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Motion Status</p>
              <p className={`font-semibold ${
                motionDetected ? "text-red-600" : "text-muted-foreground"
              }`}>
                {motionDetected ? "Motion Detected" : "No Motion"}
              </p>
            </div>
          </div>
          <Badge
            variant={motionDetected ? "destructive" : "secondary"}
            className={`font-medium ${motionDetected ? "animate-pulse" : ""}`}
          >
            {motionDetected ? "Active" : "Idle"}
          </Badge>
        </div>
      </div>
    </ZigbeeDeviceCardWrapper>
  );
}
