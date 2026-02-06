import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TitleBar } from "@/components/custom/title-bar";
import { ProjectProvider } from "@/contexts/project-context";
import { ProjectDetailProvider, useProjectDetail } from "@/contexts/project-detail-context";
import { DaliProvider } from "@/contexts/dali-context";
import { ProjectDetail } from "@/components/projects/project-section/project-detail";

// Breadcrumb component that uses the project context
function BreadcrumbNav() {
  const { selectedProject, activeSection } = useProjectDetail();

  const getSectionDisplayName = (section) => {
    switch (section) {
      case "group-config":
        return "Group Configuration";
      case "scenes-schedules":
        return "Scenes & Schedules";
      case "smarthome":
        return "Smarthome";
      case "dali-core":
        return "DALI Interface";
      default:
        return "Group Configuration";
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="#">Toolkit Engine</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          {selectedProject ? <BreadcrumbLink href="#">Project</BreadcrumbLink> : <BreadcrumbPage>Projects</BreadcrumbPage>}
        </BreadcrumbItem>
        {selectedProject && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{selectedProject.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getSectionDisplayName(activeSection)}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ProjectProvider>
        <ProjectDetailProvider>
          <DaliProvider>
            <SidebarProvider>
              <AppSidebar />
              <TitleBar />
              <div className="h-8 left-0 right-36 draggable-region absolute top-0"></div>
              <SidebarInset className="mt-8!">
                <header className="flex h-16 shrink-0 items-center gap-2">
                  <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <BreadcrumbNav />
                  </div>
                </header>
                <ProjectDetail />
              </SidebarInset>
              <Toaster richColors position="bottom-center" />
            </SidebarProvider>
          </DaliProvider>
        </ProjectDetailProvider>
      </ProjectProvider>
    </ThemeProvider>
  );
}
