# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GNT Toolkit Engine is a professional smart building automation and control system built with Electron, React, and Vite. It provides comprehensive IoT device integration for lighting, HVAC, curtains, and KNX protocol systems.

## Development Commands

- `npm start` - Start development server (electron-forge start)
- `npm run package` - Package the application 
- `npm run make` - Build distributables for current platform
- `npm run publish` - Publish to configured channels
- `npm run release` - Bump version and push tags
- `npm run lint` - Currently not configured ("No linting configured")

## Architecture Overview

### Electron Multi-Process Architecture
- **Main Process** (`src/main.js`): Window management, IPC communication, hardware integration via UDP, database operations
- **Renderer Process** (`src/app.jsx`): React UI with context-based state management, sidebar navigation, responsive design
- **Services Layer**: Database (SQLite), RCU Controller, UDP Service, Export/Import functionality

### Key Technologies
- **Framework**: Electron (v36.3.1) with React (v19.1.0)
- **Build**: Vite with separate configs for main, preload, and renderer processes
- **Styling**: Tailwind CSS v4 with custom design system
- **Database**: SQLite via better-sqlite3
- **UI Components**: Radix UI with shadcn/ui implementation
- **Data Management**: TanStack Table for complex data displays

## Code Structure

### Component Organization
- `src/components/projects/` - Domain-specific components organized by building automation system:
  - `aircon/` - HVAC system management
  - `curtain/` - Motorized curtain/blind control
  - `lighting/` - Lighting system configuration
  - `scenes/` - Automation scene programming
  - `schedules/` - Time-based scheduling
  - `sequences/` - Sequential automation logic
  - `unit/` - Hardware unit configuration
  - `knx/` - KNX protocol integration
- `src/components/ui/` - Base UI components (shadcn/ui)
- `src/contexts/` - React context providers for global state
- `src/services/` - Backend services and hardware communication
- `src/utils/` - Helper functions and utilities
- `src/hooks/` - Custom React hooks

### Path Aliases
- `@/` points to `src/` directory (configured in jsconfig.json)

## Hardware Integration

The system integrates with 20+ different IoT controller types via UDP communication. Key hardware constants are defined in `src/utils/constants.js` including:
- Unit types and specifications
- Communication protocols
- Hardware capabilities and limitations

## Database Architecture

Uses SQLite for project persistence with tables for:
- Project configuration and metadata
- Hardware unit assignments
- Scene and schedule definitions
- System settings and preferences

## Development Notes

### Build Configuration
- Multiple Vite configs for different Electron processes
- Electron Forge handles packaging and distribution
- Multi-platform support (Windows, macOS, Linux)

### State Management
- Context-based state management for projects and project details
- Sidebar navigation with breadcrumb system
- Responsive design considerations

### UI Patterns
- Consistent design system with Tailwind CSS
- shadcn/ui components for professional appearance
- Modal dialogs and form patterns throughout
- Data tables with sorting, filtering, and pagination

## Testing

No specific test framework is currently configured. When adding tests, first check if the project adopts a testing framework or ask for guidance on the preferred testing approach.