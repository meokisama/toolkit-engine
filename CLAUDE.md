# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start          # Run app in development mode (Electron + Vite)
yarn make           # Build distributable packages
yarn package        # Package the app without creating installers
yarn publish        # Publish release to GitHub
yarn release:patch  # Bump patch version, tag, and push
yarn release:minor  # Bump minor version, tag, and push
yarn release:major  # Bump major version, tag, and push
```

There are no automated tests or linting configured.

## Architecture

**GNT Toolkit Engine** is an Electron desktop app for smart building automation. It uses React 19 + Vite for the renderer and Node.js for the main process, with IPC bridging the two.

### Process Model

```
Renderer (React)  ──IPC──►  Main Process (Node.js)
                                ├── IPC Handlers (src/main/index.js registers all)
                                ├── Services (src/services/)
                                │   ├── DatabaseService — better-sqlite3, local SQLite DB
                                │   ├── RCU Controller — physical device communication
                                │   └── UDP / Network interfaces
                                └── Protocol Modules (src/main/*.js)
                                    DALI, KNX, DMX, ZigBee, RS485, Aircon, Curtain...
```

- `main.js` — Electron entry point, window creation
- `src/preload.js` — exposes `window.electronAPI` to renderer
- `src/main/index.js` — calls `registerAllHandlers()` which wires all IPC channels
- Each `src/main/<domain>.js` file registers IPC handlers for one protocol/domain

### Renderer Structure

- `src/app.jsx` — root component; wraps everything in theme + context providers
- `src/contexts/` — React Context for cross-component state:
  - `project-context.jsx` — project list and active project
  - `project-detail-context.jsx` — active tab, device data within a project (largest context, 17KB)
  - `dali-context.jsx` — DALI-specific state
- `src/components/ui/` — thin wrappers around Radix UI primitives (35 components)
- `src/components/projects/` — domain UI grouped by protocol: `dali/`, `knx/`, `dmx/`, `zigbee/`, `aircon/`, `curtain/`, `lighting/`, `scenes/`, `schedules/`, `sequences/`, `room/`, `unit/`, `multi-scenes/`
- `src/constants/` — protocol constants and enums (aircon, curtain, knx, zigbee, rs485, etc.)
- `src/utils/` — pure utility functions (ip, time-picker, io-config, rs485)

### Database Layer

`src/services/database/` contains one module per domain (project, room, unit, scene, schedule, dali, knx, dmx, zigbee). All use `better-sqlite3` (synchronous). Schema migrations live in `src/services/database/migration/`.

### Path Alias

`@/` maps to `./src/` — use `import X from '@/components/...'` etc.

### Build Variables (injected by Vite)

`__APP_VERSION__`, `__ELECTRON_VERSION__`, `__BUILD_DATE__`, `__BUILD_TIME__`
