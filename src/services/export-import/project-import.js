// Project import functionality
import { toast } from "sonner";
import { Validators } from "./validators.js";

export class ProjectImporter {
  // Import project from JSON file
  static async importProjectFromFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text);

          // Validate import data structure
          if (!Validators.validateProjectImportData(data)) {
            toast.error("Invalid project file format");
            reject(new Error("Invalid file format"));
            return;
          }

          resolve(data);
        } catch (error) {
          console.error("Import project failed:", error);
          toast.error("Failed to read project file");
          reject(error);
        }
      };

      input.click();
    });
  }
}
