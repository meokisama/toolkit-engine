// Scene CSV export. Scene is not schema-driven: each scene becomes multiple
// rows (one per scene item) with the scene name on the first row only.

import { formatItemTypeForExport, formatItemValueForExport } from "./scene-enums.js";

export async function convertScenesToCSV(scenes) {
  const rows = ["SCENE NAME,ITEM NAME,TYPE,ADDRESS,VALUE"];

  for (const scene of scenes) {
    try {
      const sceneItems = (await window.electronAPI?.scene?.getItemsWithDetails(scene.id)) || [];

      if (sceneItems.length === 0) {
        rows.push(`"${scene.name || ""}","","","",""`);
        continue;
      }

      sceneItems.forEach((item, idx) => {
        const sceneName = idx === 0 ? scene.name || "" : "";
        const itemName = item.item_name || "";
        const type = formatItemTypeForExport(item.item_type, item.object_type, item.command);
        const address = item.item_address || "";
        const value = formatItemValueForExport(item.item_type, item.item_value, item.command, item.object_type);
        rows.push(`"${sceneName}","${itemName}","${type}","${address}","${value}"`);
      });
    } catch (error) {
      console.error(`Failed to get items for scene ${scene.id}:`, error);
      rows.push(`"${scene.name || ""}","","","",""`);
    }
  }

  return rows.join("\n");
}
