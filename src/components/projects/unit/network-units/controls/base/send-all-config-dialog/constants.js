import { Play, Calendar, List, ChevronsUpDown, Network, GitCompare } from "lucide-react";

export const configTypeLabels = {
  scenes: { label: "Scenes", icon: Play },
  schedules: { label: "Schedules", icon: Calendar },
  sequences: { label: "Sequences", icon: List },
  curtain: { label: "Curtain", icon: ChevronsUpDown },
  knx: { label: "KNX", icon: Network },
  multiScenes: { label: "Multi-Scenes", icon: GitCompare },
};

export const defaultConfigTypes = {
  scenes: true,
  schedules: true,
  multiScenes: true,
  sequences: true,
  knx: true,
  curtain: true,
};
