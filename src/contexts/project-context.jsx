import { useEffect } from "react";
import { useProjectsStore } from "@/store/use-projects-store";

export function useProjects() {
  return useProjectsStore();
}

// Kept as a thin initializer — triggers loadProjects once on mount
export function ProjectProvider({ children }) {
  useEffect(() => {
    useProjectsStore.getState().loadProjects();
  }, []);

  return children;
}
