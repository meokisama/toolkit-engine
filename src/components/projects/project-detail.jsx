import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ProjectItemsTable } from "./lighting/lighting-table";
import { UnitTable } from "./unit/unit-table";
import { AirconCards } from "./aircon/aircon-cards";
import { CurtainTable } from "./curtain/curtain-table";
import { KnxTable } from "./knx/knx-table";
import { SceneTable } from "./scenes/scene-table";
import { TabContentSkeleton } from "@/components/projects/tabs-skeleton";
import {
  TabLoadingSkeleton,
  AirconCardsSkeleton,
} from "@/components/projects/tab-loading-skeleton";
import {
  Lightbulb,
  Wind,
  Cpu,
  Blinds,
  Network,
  SlidersHorizontal,
} from "lucide-react";

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
  curtain: {
    label: "Curtain",
    icon: Blinds,
    description: "Manage curtain and blind controls",
  },
  knx: {
    label: "KNX",
    icon: Network,
    description: "Manage KNX devices and controls",
  },
  scene: {
    label: "Scene",
    icon: SlidersHorizontal,
    description: "Manage lighting and automation scenes",
  },
  unit: {
    label: "Unit",
    icon: Cpu,
    description: "Manage control units and devices",
  },
};

export function ProjectDetail() {
  const {
    selectedProject,
    activeTab,
    setActiveTab,
    projectItems,
    airconCards,
    loading,
    tabLoading,
    loadedTabs,
  } = useProjectDetail();

  // Memoize tab entries to prevent recreating on every render
  const tabEntries = useMemo(() => Object.entries(tabConfig), []);

  // Calculate item counts for each tab
  const itemCounts = useMemo(() => {
    const counts = {};
    Object.keys(tabConfig).forEach((key) => {
      if (key === "aircon") {
        counts[key] = airconCards?.length || 0;
      } else {
        counts[key] = projectItems[key]?.length || 0;
      }
    });
    return counts;
  }, [projectItems, airconCards]);

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
        <TabsList className="grid w-full grid-cols-6">
          {tabEntries.map(([key, config]) => {
            const Icon = config.icon;
            const itemCount = itemCounts[key];
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center justify-center gap-3 cursor-pointer"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
                {itemCount > 0 && (
                  <span className="bg-amber-200 border border-amber-300 rounded-full px-1.5">
                    {itemCount}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        {tabEntries.map(([key]) => {
          // Check if this tab is currently loading
          const isTabLoading =
            tabLoading[key] || (!loadedTabs.has(key) && activeTab === key);

          return (
            <TabsContent key={key} value={key} className="flex-1 mt-2">
              {isTabLoading ? (
                key === "aircon" ? (
                  <AirconCardsSkeleton />
                ) : (
                  <TabLoadingSkeleton />
                )
              ) : key === "unit" ? (
                <UnitTable />
              ) : key === "aircon" ? (
                <AirconCards cards={airconCards || []} loading={false} />
              ) : key === "curtain" ? (
                <Card className="h-full">
                  <CardContent className="h-full">
                    <CurtainTable
                      items={projectItems[key] || []}
                      loading={false}
                    />
                  </CardContent>
                </Card>
              ) : key === "knx" ? (
                <Card className="h-full">
                  <CardContent className="h-full">
                    <KnxTable items={projectItems[key] || []} loading={false} />
                  </CardContent>
                </Card>
              ) : key === "scene" ? (
                <Card className="h-full">
                  <CardContent className="h-full">
                    <SceneTable
                      items={projectItems[key] || []}
                      loading={false}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full">
                  <CardContent className="h-full">
                    <ProjectItemsTable
                      category={key}
                      items={projectItems[key] || []}
                      loading={false}
                    />
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
