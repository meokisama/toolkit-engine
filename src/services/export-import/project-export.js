// Project export functionality
import { toast } from "sonner";

export class ProjectExporter {
  // Export project to JSON
  static async exportProject(project, projectItems) {
    try {
      const exportData = {
        project: {
          name: project.name,
          description: project.description,
        },
        items: projectItems,
        exportedAt: new Date().toISOString(),
        version: "1.0"
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create download link with event listeners
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;

      // Add event listener to show success message after download starts
      link.addEventListener('click', () => {
        // Small delay to ensure download dialog appears first
        setTimeout(() => {
          toast.success(`Project "${project.name}" export started`);
        }, 100);
      });

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Export project failed:', error);
      toast.error('Failed to export project');
      return false;
    }
  }
}
