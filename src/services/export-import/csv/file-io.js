// Browser file I/O helpers for CSV. Isolated so engine/schemas stay testable
// without touching the DOM.

export function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function pickCsvFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    input.click();
  });
}

export function sanitizeFilename(name) {
  return String(name || "export").replace(/[^a-z0-9]/gi, "_").toLowerCase();
}
