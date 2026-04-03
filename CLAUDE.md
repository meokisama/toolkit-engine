# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start          # Start Electron dev server (Electron Forge + Vite)
yarn make           # Build installer packages
yarn package        # Package the application without installer
```

No linting or test suite is configured.

## Architecture Overview

**GNT Toolkit Engine** is an Electron desktop application for managing GNT IoT smart building systems (lighting, HVAC, curtains, DALI, KNX, DMX, Zigbee, scenes, schedules).

### Process Architecture

```
Renderer (React/Vite)
    └─ window.electronAPI.[feature].*   (preload IPC bridge)
           └─ src/preload/              (contextBridge exposure)
                  └─ IPC Invoke/Send
                         └─ src/main/  (IPC handlers per feature)
                                └─ DatabaseService (SQLite) + RCU Controller (hardware)
```

- **`src/main.js`** — Electron main process: creates BrowserWindow, initializes DatabaseService, registers all IPC handlers, handles DALI device events
- **`src/preload/`** — Security bridge: exposes namespaced APIs (`window.electronAPI.projects`, `.lighting`, `.aircon`, etc.) via `contextBridge`
- **`src/main/`** — IPC handler files per feature (project.js, lighting.js, aircon.js, etc.)

### State Management

Three-layer state architecture:

1. **`ProjectContext`** (`src/contexts/project-context.jsx`) — manages the project list (create/update/delete/import/export)
2. **`ProjectDetailContext`** (`src/contexts/project-detail-context.jsx`) — bridges UI to Zustand stores; provides `selectProject()`, `setActiveSection()`, `loadTabData()`
3. **Zustand stores** (`src/store/`):
   - `useProjectNavStore` — `selectedProject`, `activeSection`, `activeTab`
   - `useProjectItemsStore` — composed of slices: `createItemsStateSlice`, `createTabLoaderSlice`, `createCrudSlice`, `createAirconSlice`, `createImportExportSlice`

Components consume state via `useProjectDetail()` hook (from ProjectDetailContext), which aggregates both stores.

### Data Flow

**Loading a project tab**: `selectProjectSection(project, section)` → nav store updates → `loadAllTabs(projectId)` runs `Promise.allSettled()` across all feature fetch calls → items store updated

**CRUD operations**: Component → `useProjectDetail.createItem()` → `useProjectItemsStore.createItem()` → `window.electronAPI.[feature].create(data)` → IPC handler → DatabaseService → SQLite

**DALI device events**: Hardware → `rcu.daliEvents.emit(...)` → main process → `mainWindow.webContents.send(...)` → React `useEffect` listener

### Navigation / Sections

The app's main content is routed by `activeSection` in `src/components/projects/project-section/`:

- `"group-config"` — GroupConfig: lighting, aircon, units, rooms, etc. (default)
- `"scenes-schedules"` — ScenesSchedules: scene/schedule/sequence/multi-scene management
- `"smarthome"` — Smarthome section
- `"dali-core"` — DaliCore: DALI gateway selection and device control

### Database

- **`src/services/database.js`** — DatabaseService using `better-sqlite3`; DB file at `~/Documents/Toolkit Engine/projects.db`
- Methods injected via `Object.assign` mixins from `src/services/database/` modules (project.js, lighting.js, aircon.js, dali.js, etc.)
- 5 migration files for schema evolution

### Key Path Alias

`@` resolves to `src/` (configured in `vite.renderer.config.mjs`)

### Build-time Defines

`APP_VERSION`, `ELECTRON_VERSION`, `BUILD_DATE`, `BUILD_TIME` are injected at build time via Vite defines.

### Logging

`electron-log` writes to `~/Documents/Toolkit Engine/Logs/DD-MM-YYYY.log`; `console.*` is overridden to route there.
