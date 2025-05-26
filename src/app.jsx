import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ProjectProvider } from "@/contexts/project-context";
import {
  ProjectDetailProvider,
  useProjectDetail,
} from "@/contexts/project-detail-context";
import { ProjectDetail } from "@/components/projects/project-detail";

// Breadcrumb component that uses the project context
function BreadcrumbNav() {
  const { selectedProject } = useProjectDetail();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="#">Toolkit Engine</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          {selectedProject ? (
            <BreadcrumbLink href="#">Project</BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Projects</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {selectedProject && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{selectedProject.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <ProjectDetailProvider>
        <SidebarProvider>
          <AppSidebar />
          <div className="h-8 w-full draggable-region absolute top-0"></div>
          <SidebarInset className="!mt-8">
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <BreadcrumbNav />
              </div>
            </header>
            <ProjectDetail />
          </SidebarInset>
          <Toaster richColors />
        </SidebarProvider>
      </ProjectDetailProvider>
    </ProjectProvider>
  );
}
