import React, { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectDetail } from "@/contexts/project-detail-context";
import { ProjectItemsTable } from "./lighting/lighting-table";
import { UnitTable } from "./unit/unit-table";
import { AirconCards } from "./aircon/aircon-cards";
import { CurtainTable } from "./curtain/curtain-table";
import { KnxTable } from "./knx/knx-table";
import {
  TabLoadingSkeleton,
  AirconCardsSkeleton,
} from "@/components/projects/tab-loading-skeleton";
import { Lightbulb, Wind, Cpu, Blinds, Network } from "lucide-react";

// Tab config for Group Config (5 tabs: lighting, aircon, curtain, knx, unit)
const groupConfigTabConfig = {
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
  unit: {
    label: "Unit",
    icon: Cpu,
    description: "Manage control units and devices",
  },
};

export function GroupConfig() {
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
  const tabEntries = useMemo(() => Object.entries(groupConfigTabConfig), []);

  // Calculate item counts for each tab
  const itemCounts = useMemo(() => {
    const counts = {};
    Object.keys(groupConfigTabConfig).forEach((key) => {
      if (key === "aircon") {
        counts[key] = airconCards?.length || 0;
      } else {
        counts[key] = projectItems[key]?.length || 0;
      }
    });
    return counts;
  }, [projectItems, airconCards]);

  // Don't render if no project is selected
  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Select a project to view group configuration
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-5">
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
              ) : (
                <Card className="h-full">
                  <CardContent className="p-6 h-full">
                    {key === "lighting" && (
                      <ProjectItemsTable
                        items={projectItems.lighting}
                        category="lighting"
                      />
                    )}
                    {key === "aircon" && <AirconCards cards={airconCards} />}
                    {key === "curtain" && (
                      <CurtainTable
                        items={projectItems.curtain}
                        category="curtain"
                      />
                    )}
                    {key === "knx" && (
                      <KnxTable items={projectItems.knx} category="knx" />
                    )}
                    {key === "unit" && (
                      <UnitTable items={projectItems.unit} category="unit" />
                    )}
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
