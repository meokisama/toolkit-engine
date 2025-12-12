import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { SceneTable } from "@/components/projects/scenes/scene-table";
import { ScheduleTable } from "@/components/projects/schedules/schedule-table";
import { MultiSceneTable } from "@/components/projects/multi-scenes/multi-scene-table";
import { SequenceTable } from "@/components/projects/sequences/sequence-table";
import { TabLoadingSkeleton } from "@/components/projects/tab-loading-skeleton";
import { SlidersHorizontal, Calendar, Layers, ListOrdered } from "lucide-react";

// Tab config for Scenes & Schedules (4 tabs: scenes, multi-scenes, sequences, schedules)
const scenesSchedulesTabConfig = {
  scene: {
    label: "Scenes",
    icon: SlidersHorizontal,
    description: "Manage lighting and automation scenes",
  },
  multi_scenes: {
    label: "Multi-Scenes",
    icon: Layers,
    description: "Manage multi-scene sequences",
  },
  sequences: {
    label: "Sequences",
    icon: ListOrdered,
    description: "Manage sequence automation",
  },
  schedule: {
    label: "Schedules",
    icon: Calendar,
    description: "Manage automation schedules",
  },
};

export function ScenesSchedules() {
  const { selectedProject, activeTab, setActiveTab, projectItems, loading, tabLoading, loadedTabs } = useProjectDetail();

  // Memoize tab entries to prevent recreating on every render
  const tabEntries = useMemo(() => Object.entries(scenesSchedulesTabConfig), []);

  // Calculate item counts for each tab
  const itemCounts = useMemo(() => {
    const counts = {};
    Object.keys(scenesSchedulesTabConfig).forEach((key) => {
      counts[key] = projectItems[key]?.length || 0;
    });
    return counts;
  }, [projectItems]);

  // Don't render if no project is selected
  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Select a project to view scenes and schedules</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-4">
          {tabEntries.map(([key, config]) => {
            const Icon = config.icon;
            const itemCount = itemCounts[key];
            return (
              <TabsTrigger key={key} value={key} className="flex items-center justify-center gap-3 cursor-pointer">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
                {itemCount > 0 && <span className="bg-amber-200 border border-amber-300 rounded-full px-1.5">{itemCount}</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {tabEntries.map(([key]) => {
          // Check if this tab is currently loading
          const isTabLoading = tabLoading[key] || (!loadedTabs.has(key) && activeTab === key);

          return (
            <TabsContent key={key} value={key} className="flex-1 mt-2">
              {isTabLoading ? (
                <TabLoadingSkeleton />
              ) : (
                <Card className="h-full">
                  <CardContent className="h-full">
                    {key === "scene" && <SceneTable items={projectItems.scene} />}
                    {key === "multi_scenes" && <MultiSceneTable items={projectItems.multi_scenes} />}
                    {key === "sequences" && <SequenceTable items={projectItems.sequences} />}
                    {key === "schedule" && <ScheduleTable items={projectItems.schedule} />}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
