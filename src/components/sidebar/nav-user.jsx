import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpdateDialog } from "./update-dialog";

export function SidebarOptInForm() {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const version = __APP_VERSION__ || "Unknown";
  const buildDate = __BUILD_DATE__ || new Date().toISOString().slice(0, 10);
  const electron = __ELECTRON_VERSION__ || new Date().toISOString().slice(0, 10);

  return (
    <>
      <Card className="gap-2 py-4 shadow-none">
        <CardContent className="px-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Version</span>
            <Badge className="cursor-pointer" onClick={() => setUpdateDialogOpen(true)}>
              v{version}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Built on</span>
            <span className="text-xs text-foreground">
              <Badge variant="outline">{buildDate.replace(/-/g, ".")}</Badge>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">With Electron</span>
            <span className="text-xs text-foreground">
              <Badge variant="outline">{electron}</Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      <UpdateDialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen} />
    </>
  );
}
