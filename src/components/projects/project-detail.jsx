import React from "react";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { GroupConfig } from "./group-config";
import { ScenesSchedules } from "./automation";
import { Smarthome } from "./smarthome";

export function ProjectDetail() {
  const { selectedProject, activeSection } = useProjectDetail();

  if (!selectedProject) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">٩(๑`^´๑)۶</h3>
            <p>Select a project from sidebar to view its details.</p>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate component based on active section
  if (activeSection === "scenes-schedules") {
    return <ScenesSchedules />;
  }

  if (activeSection === "smarthome") {
    return <Smarthome />;
  }

  // Default to group config
  return <GroupConfig />;
}
