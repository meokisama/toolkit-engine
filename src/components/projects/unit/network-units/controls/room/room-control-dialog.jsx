import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Settings, ActivitySquare } from "lucide-react";
import { RoomConfigDisplay } from "./room-config-display";
import { RoomStatusControl } from "./room-status-control";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export function RoomControlDialog({ open, onOpenChange, unit }) {
  const [activeTab, setActiveTab] = useState("configuration");
  const [loading, setLoading] = useState(false);
  const [roomConfig, setRoomConfig] = useState(null);

  // Room status states
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [sending, setSending] = useState(false);
  const [roomStatus, setRoomStatus] = useState(null);

  const handleReadConfig = async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoading(true);
    try {
      const config = await window.electronAPI.roomController.getRoomConfiguration(unit.ip_address, unit.id_can);

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

  const handleReadStatus = async () => {
    if (!unit) {
      toast.error("No unit selected");
      return;
    }

    setLoadingStatus(true);
    try {
      const status = await window.electronAPI.roomController.getRoomStatus(unit.ip_address, unit.id_can);

      setRoomStatus(status);
      toast.success("Room status read successfully");
    } catch (error) {
      console.error("Failed to read room status:", error);
      toast.error(`Failed to read room status: ${error.message}`);
      setRoomStatus(null);
    } finally {
      setLoadingStatus(false);
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
      await window.electronAPI.roomController.setRoomStatus(unit.ip_address, unit.id_can, roomStatus.aircon_mode, roomStatus.rooms);

      toast.success("Room status sent successfully");
    } catch (error) {
      console.error("Failed to send room status:", error);
      toast.error(`Failed to send room status: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDialogOpenChange = (newOpen) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setRoomConfig(null);
      setRoomStatus(null);
      setActiveTab("configuration");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Room Configuration & Status Control
          </DialogTitle>
          <DialogDescription>Manage room configuration and status for network unit {unit && `${unit.type} (${unit.ip_address})`}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          <TabsContent value="configuration">
            {roomConfig && (
              <ScrollArea className="h-[calc(90vh-280px)] p-4">
                <RoomConfigDisplay roomConfig={roomConfig} />
              </ScrollArea>
            )}

            {!roomConfig && !loading && (
              <div className="text-center text-muted-foreground py-8">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click "Read Configuration" to load room settings from the unit</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="status">
            <ScrollArea className="h-[calc(90vh-280px)] p-4">
              <RoomStatusControl roomStatus={roomStatus} setRoomStatus={setRoomStatus} />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              {activeTab === "configuration" && (
                <Button variant="outline" onClick={handleReadConfig} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {loading ? "Reading..." : "Read Configuration"}
                </Button>
              )}

              {activeTab === "status" && (
                <>
                  <Button variant="outline" onClick={handleReadStatus} disabled={loadingStatus || sending}>
                    {loadingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {loadingStatus ? "Reading..." : "Read Status"}
                  </Button>

                  <Button variant="outline" onClick={handleSendStatus} disabled={!roomStatus || loadingStatus || sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {sending ? "Sending..." : "Send Status"}
                  </Button>
                </>
              )}
            </div>

            <Button onClick={() => handleDialogOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
