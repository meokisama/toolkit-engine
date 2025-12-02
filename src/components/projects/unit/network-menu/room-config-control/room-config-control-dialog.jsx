"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Settings, ActivitySquare } from "lucide-react";
import { RoomConfigDisplay } from "./room-config-display";
import { RoomStatusControl } from "./room-status-control";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RoomConfigControlDialog({ open, onOpenChange, unit }) {
  const [loading, setLoading] = useState(false);
  const [roomConfig, setRoomConfig] = useState(null);

  const handleReadConfig = async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoading(true);
    try {
      const config =
        await window.electronAPI.rcuController.getRoomConfiguration(
          unit.ip_address,
          unit.id_can
        );

      setRoomConfig(config);
      toast.success("Room configuration read successfully");
    } catch (error) {
      console.error("Failed to read room configuration:", error);
      toast.error(`Failed to read room configuration: ${error.message}`);
      setRoomConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpenChange = (newOpen) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setRoomConfig(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[80vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Room Configuration & Status Control
          </DialogTitle>
          <DialogDescription>
            Manage room configuration and status for network unit{" "}
            {unit && `${unit.type} (${unit.ip_address})`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configuration" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configuration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <ActivitySquare className="h-4 w-4" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleReadConfig} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {loading ? "Reading..." : "Read Configuration"}
                </Button>
              </div>

              {roomConfig && (
                <ScrollArea className="h-[calc(90vh-250px)] rounded-md border p-4">
                  <RoomConfigDisplay roomConfig={roomConfig} />
                </ScrollArea>
              )}

              {!roomConfig && !loading && (
                <div className="text-center text-muted-foreground py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    Click "Read Configuration" to load room settings from the
                    unit
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="status" className="mt-4">
            <ScrollArea className="h-[calc(90vh-250px)] rounded-md border p-4">
              <RoomStatusControl unit={unit} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
