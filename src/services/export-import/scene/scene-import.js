// Scene CSV import. Supports two templates:
//   Template 1: vertical — one item per row; scene name only on the first row
//                of each scene group.
//   Template 2: horizontal — one row per item, one column per scene. Cell value
//                at (item, scene) is the value that item takes in that scene.
//
// Scenes that exceed MAX_ITEMS_PER_SCENE are auto-split into "(Part 2)", etc.

import { detectDelimiter, parseCSVLine, splitCSVLines } from "../csv/parser.js";
import {
  parseItemTypeFromCSV,
  parseItemValueFromCSV,
  getCommandFromType,
  getObjectTypeFromType,
} from "./scene-enums.js";

const MAX_ITEMS_PER_SCENE = 60;
const EXPECTED_HEADERS = ["SCENE NAME", "ITEM NAME", "TYPE", "ADDRESS", "VALUE"];

function buildSceneItem(itemName, itemType, address, value) {
  return {
    itemName: itemName || `Group ${address}`,
    itemType: parseItemTypeFromCSV(itemType),
    address,
    value: parseItemValueFromCSV(itemType, value),
    command: getCommandFromType(itemType),
    objectType: getObjectTypeFromType(itemType),
  };
}

function renameSceneParts(scenes) {
  const groups = {};
  for (const scene of scenes) {
    const original = scene.originalName || scene.name;
    (groups[original] ||= []).push(scene);
  }

  for (const [original, parts] of Object.entries(groups)) {
    if (parts.length > 1) {
      parts.forEach((scene, i) => {
        scene.name = `${original} (Part ${i + 1})`;
        scene.description = `Imported scene: ${scene.name}`;
      });
    } else {
      parts[0].name = original;
      parts[0].description = `Imported scene: ${original}`;
    }
    parts.forEach((s) => {
      delete s.originalName;
      delete s.partNumber;
    });
  }
}

function parseTemplate1(csvContent) {
  const lines = splitCSVLines(csvContent);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.replace(/"/g, "").trim());
  if (!EXPECTED_HEADERS.every((h) => headers.some((actual) => actual.toUpperCase() === h))) {
    throw new Error(`Invalid CSV headers for scenes. Expected: ${EXPECTED_HEADERS.join(", ")}`);
  }

  const scenes = [];
  let currentScene = null;
  let isFirstDataRow = true;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length !== headers.length) continue;

    const row = {};
    headers.forEach((h, idx) => {
      row[h.toUpperCase().replace(/\s+/g, "_")] = values[idx] || "";
    });

    const sceneName = row.SCENE_NAME?.trim();
    const itemName = row.ITEM_NAME?.trim();
    const itemType = row.TYPE?.trim();
    const address = row.ADDRESS?.trim();
    const value = row.VALUE?.trim();

    if (isFirstDataRow) {
      isFirstDataRow = false;
      if (!sceneName && itemType && address) {
        currentScene = {
          name: "Scene 1",
          originalName: "Scene 1",
          description: "Imported scene: Scene 1",
          items: [],
          partNumber: 1,
        };
        scenes.push(currentScene);
      }
    }

    if (sceneName) {
      currentScene = {
        name: sceneName,
        originalName: sceneName,
        description: `Imported scene: ${sceneName}`,
        items: [],
        partNumber: 1,
      };
      scenes.push(currentScene);
    }

    if (currentScene && itemType && address) {
      if (currentScene.items.length >= MAX_ITEMS_PER_SCENE) {
        const nextPart = currentScene.partNumber + 1;
        const nextName = `${currentScene.originalName} (Part ${nextPart})`;
        currentScene = {
          name: nextName,
          originalName: currentScene.originalName,
          description: `Imported scene: ${nextName}`,
          items: [],
          partNumber: nextPart,
        };
        scenes.push(currentScene);
      }
      currentScene.items.push(buildSceneItem(itemName, itemType, address, value));
    }
  }

  renameSceneParts(scenes);
  return scenes;
}

function parseTemplate2(csvContent) {
  const lines = splitCSVLines(csvContent);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.replace(/"/g, "").trim());
  if (headers.length < 4) {
    throw new Error("Invalid template format. Expected at least 4 columns: ITEM NAME, TYPE, ADDRESS, Scene1, ...");
  }

  const itemNameCol = headers.findIndex((h) => h.toUpperCase().includes("ITEM"));
  const typeCol = headers.findIndex((h) => h.toUpperCase().includes("TYPE"));
  const addressCol = headers.findIndex((h) => h.toUpperCase().includes("ADDRESS"));
  if (itemNameCol === -1 || typeCol === -1 || addressCol === -1) {
    throw new Error("Invalid template format. Required columns: ITEM NAME, TYPE, ADDRESS");
  }

  const sceneColumns = headers.slice(Math.max(3, addressCol + 1));
  if (sceneColumns.length === 0) {
    throw new Error("No scene columns found in template format");
  }

  const sceneGroups = {};
  for (const name of sceneColumns) {
    if (name.trim()) sceneGroups[name.trim()] = [];
  }

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length < headers.length) continue;

    const itemName = values[itemNameCol]?.trim();
    const itemType = values[typeCol]?.trim();
    const address = values[addressCol]?.trim();
    if (!itemType || !address) continue;

    sceneColumns.forEach((sceneName, sceneIndex) => {
      const valueIndex = Math.max(3, addressCol + 1) + sceneIndex;
      const itemValue = values[valueIndex]?.trim();
      const key = sceneName.trim();
      if (!sceneGroups[key]) return;

      let target = sceneGroups[key].find((s) => s.items.length < MAX_ITEMS_PER_SCENE);
      if (!target) {
        const nextPart = sceneGroups[key].length + 1;
        const nextName = nextPart === 1 ? key : `${key} (Part ${nextPart})`;
        target = {
          name: nextName,
          originalName: key,
          description: `Imported scene: ${nextName}`,
          items: [],
          partNumber: nextPart,
        };
        sceneGroups[key].push(target);
      }
      target.items.push(buildSceneItem(itemName, itemType, address, itemValue));
    });
  }

  const scenes = [];
  for (const name of sceneColumns) {
    const group = sceneGroups[name.trim()];
    if (group) scenes.push(...group);
  }
  const nonEmpty = scenes.filter((s) => s.items.length > 0);
  renameSceneParts(nonEmpty);
  return nonEmpty;
}

export function detectAndParseScenesCSV(csvContent) {
  const lines = splitCSVLines(csvContent);
  if (lines.length < 2) return [];
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.replace(/"/g, "").trim());
  const isTemplate2 =
    headers.length >= 4 &&
    headers[0].toUpperCase().includes("ITEM") &&
    headers[1].toUpperCase().includes("TYPE") &&
    headers[2].toUpperCase().includes("ADDRESS");
  return isTemplate2 ? parseTemplate2(csvContent) : parseTemplate1(csvContent);
}

export function parseScenesCSV(csvContent, sceneImportType = null) {
  if (sceneImportType === "template1") return parseTemplate1(csvContent);
  if (sceneImportType === "template2") return parseTemplate2(csvContent);
  return detectAndParseScenesCSV(csvContent);
}

// Exposed for the rare case where a caller parses scenes itself and wants the
// part-rename behavior applied.
export { renameSceneParts };
