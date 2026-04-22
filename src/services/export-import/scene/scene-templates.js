import { downloadCsv } from "../csv/file-io.js";

function buildCsv(headers, rows) {
  const out = [headers.map((h) => `"${h}"`).join(",")];
  for (const row of rows) {
    out.push(row.map((cell) => `"${cell || ""}"`).join(","));
  }
  return out.join("\n");
}

export function downloadSceneTemplate1() {
  const headers = ["SCENE NAME", "ITEM NAME", "TYPE", "ADDRESS", "VALUE"];
  const rows = [
    ["Bedroom Scene", "Main Light", "LIGHTING", "1", "100%"],
    ["", "Side Light", "LIGHTING", "2", "75%"],
    ["", "Table Lamp", "LIGHTING", "3", "50%"],
    ["", "Ceiling Light", "LIGHTING", "4", "80%"],
    ["", "Bedside Lamp", "LIGHTING", "5", "30%"],
    ["Kitchen Scene", "Kitchen Light", "LIGHTING", "6", "100%"],
    ["", "Under Cabinet", "LIGHTING", "7", "60%"],
  ];
  downloadCsv(buildCsv(headers, rows), "scene_template_1_vertical.csv");
}

export function downloadSceneTemplate2() {
  const headers = ["ITEM NAME", "TYPE", "ADDRESS", "Living Room Scene", "Bedroom Scene", "Kitchen Scene"];
  const rows = [
    ["Main Light", "LIGHTING", "1", "100%", "50%", "50%"],
    ["Side Light", "LIGHTING", "2", "75%", "50%", "50%"],
    ["Table Lamp", "LIGHTING", "3", "50%", "50%", "50%"],
    ["Ceiling Light", "LIGHTING", "4", "50%", "80%", "50%"],
    ["Bedside Lamp", "LIGHTING", "5", "50%", "30%", "50%"],
    ["Kitchen Light", "LIGHTING", "6", "50%", "50%", "100%"],
    ["Under Cabinet", "LIGHTING", "7", "50%", "50%", "60%"],
  ];
  downloadCsv(buildCsv(headers, rows), "scene_template_2_horizontal.csv");
}

export function downloadBothSceneTemplates() {
  downloadSceneTemplate1();
  setTimeout(downloadSceneTemplate2, 500);
}
