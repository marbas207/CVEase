# CVEase

A desktop Kanban board for managing CVE disclosure workflows. Track vulnerabilities from initial discovery through coordinated vendor disclosure and public release.

Built for security researchers who need a persistent, organized way to manage multiple active disclosures across different vendors and products.

## Features

**Kanban Board**
- 5-stage pipeline: Discovery, Vendor Contacted, Negotiating, CVE Requested, Published
- Drag-and-drop cards between stages with transition prompts for required fields
- Swimlanes per software product, grouped under vendors with favicons
- Severity filtering (Critical/High/Medium/Low) and search

**Vendor Management**
- First-class vendor records with security team contacts, CNA status, and notes
- Vendor contact info auto-fills new CVEs
- CNA status auto-completes checklist items
- Favicons pulled from vendor websites

**Per-CVE Tracking**
- Severity, affected component, affected versions, CVE ID
- Vendor contact details (pre-filled from vendor record)
- Reproduction steps / description
- Patch status tracking (No Patch / Patch Available / Won't Fix)
- VINCE (CERT/CC) escalation flag with case ID
- File attachments
- Activity log with typed entries (Email Sent, Email Received, Phone Call, Meeting, Note)

**Disclosure Workflow**
- 12-item default checklist per CVE with stage-trigger actions
- Disclosure deadline with customizable date (defaults to 90 days from vendor notification)
- Follow-up reminders on Vendor Contacted, Negotiating, and CVE Requested stages
- Follow-up action modal: log what you did + set next check-in date
- Stage transition modals collect required fields before moving cards

**Dashboard**
- Pipeline overview with stats and severity breakdown
- Overdue deadlines and approaching deadlines
- Follow-ups due with direct action buttons
- CVEs with no follow-up date set

**Hall of Fame**
- Published CVEs auto-archive to Hall of Fame after 30 days
- Grouped by severity with medal icons
- LinkedIn post generator (copy to clipboard)
- Confetti burst when a CVE reaches Published

**Other**
- Timeline view with collapsible groups (by software or by stage)
- Light/dark theme toggle
- Keyboard shortcuts (Ctrl+/ to view)
- Database backup and restore
- Fully local SQLite storage, no network required

**Getting Started**
- Guided 3-step onboarding: Add Vendor → Add Software → Create Vulnerability
- **"Try with demo data"** option loads realistic sample data across all stages so you can explore the app before committing to your own data
- Demo data includes 2 vendors, 3 products, 7 CVEs (across all stages including archived), activity logs, and follow-up reminders
- A banner lets you clear demo data and start fresh at any time

## Tech Stack

- **Electron** + **electron-vite** (desktop shell)
- **React** + **TypeScript** (renderer)
- **Tailwind CSS** + **shadcn/ui** (styling)
- **better-sqlite3** (local database)
- **@dnd-kit** (drag and drop)
- **Zustand** (state management)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install

```bash
git clone https://github.com/marbas207/CVEase.git
cd CVEase
npm install
```

The `postinstall` script automatically rebuilds `better-sqlite3` for Electron's Node ABI.

### Development

```bash
npm run dev
```

Opens the app in dev mode with hot reload.

### Build

```bash
npm run build
```

Compiles the main, preload, and renderer bundles to `out/`.

### Package

```bash
npm run dist
```

Builds and packages the app for your platform:
- **Windows**: NSIS installer (`dist/CVEase Setup.exe`)
- **macOS**: DMG (`dist/CVEase.dmg`)
- **Linux**: AppImage (`dist/CVEase.AppImage`)

## Project Structure

```
src/
  main/           # Electron main process
    db/           # SQLite database, migrations, queries
    ipc/          # IPC handlers (cve, swimlane, vendor, followup, attachment, todo, db)
  preload/        # contextBridge API exposure
  renderer/src/   # React frontend
    components/   # UI components (board, cve, vendor, layout, ui)
    pages/        # Dashboard, Board, Timeline, Hall of Fame, Settings, About
    store/        # Zustand stores (board, theme)
    lib/          # Utilities, constants, IPC wrappers
    hooks/        # Custom React hooks
    types/        # TypeScript type definitions
```

## Database

SQLite database stored at `{userData}/cveorganizer.db`. WAL mode enabled for performance. Schema managed through versioned migrations (currently v9).

Use **Settings > Database Backup & Restore** to export/import the database file.

## Author

Created by **marba$**

- GitHub: [marbas207](https://github.com/marbas207)
- Buy Me a Coffee: [marbas](https://buymeacoffee.com/marbas)

## License

All rights reserved.
