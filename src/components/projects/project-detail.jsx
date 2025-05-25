import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ProjectItemsTable } from "./project-items-table";
import { UnitTable } from "./unit-table";
import { TabContentSkeleton } from "@/components/projects/tab-content-skeleton";
import { Lightbulb, Wind, Cpu, Blinds, Palette } from "lucide-react";

// Memoize tab config outside component to prevent recreating on every render
const tabConfig = {
  lighting: {
    label: "Lighting",
    icon: Lightbulb,
    description: "Manage lighting devices and controls",
  },
  aircon: {
    label: "Aircon",
    icon: Wind,
    description: "Manage air conditioning systems",
  },
  unit: {
    label: "Unit",
    icon: Cpu,
    description: "Manage control units and devices",
  },
  curtain: {
    label: "Curtain",
    icon: Blinds,
    description: "Manage curtain and blind controls",
  },
  scene: {
    label: "Scene",
    icon: Palette,
    description: "Manage lighting and automation scenes",
  },
};

export function ProjectDetail() {
  const { selectedProject, activeTab, setActiveTab, projectItems, loading } =
    useProjectDetail();

  // Memoize tab entries to prevent recreating on every render
  const tabEntries = useMemo(() => Object.entries(tabConfig), []);

  if (!selectedProject) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">٩(๑`^´๑)۶</h3>
            <p>Select a project from sidebar to view its details.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show skeleton when project is selected but data is still loading
  if (loading && selectedProject) {
    return <TabContentSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabEntries.map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {tabEntries.map(([key]) => (
          <TabsContent key={key} value={key} className="flex-1 mt-2">
            {key === "unit" ? (
              <UnitTable />
            ) : (
              <Card className="h-full">
                <CardContent className="h-full">
                  <ProjectItemsTable
                    category={key}
                    items={projectItems[key] || []}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
