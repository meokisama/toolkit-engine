import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { Home } from "lucide-react";

export function Smarthome() {
  const { selectedProject } = useProjectDetail();

  // Don't render if no project is selected
  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Select a project to view smarthome features
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Smarthome
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Smarthome features coming soon...</p>
            <p className="text-sm mt-2">
              This section will contain smart home integration and control features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
