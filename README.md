<p align="center">
  <img src="build/icon.png" alt="CVEase" width="80" />
</p>

<h1 align="center">CVEase</h1>

<p align="center">
  A desktop Kanban board for managing CVE disclosure workflows.
</p>

---

Coordinated vulnerability disclosure is important work, but when you're juggling multiple active disclosures across different vendors, tracking where each one stands gets overwhelming fast. Which vendors have you contacted? Who hasn't responded? When is the 90-day deadline? Did you request that CVE ID yet?

**CVEase** gives you a single place to manage the entire lifecycle, from initial discovery through public disclosure, without spreadsheets, sticky notes, or memory.

<!-- TODO: Add demo animation/screenshot here -->

## Download

| Platform | Download |
|----------|----------|
| Windows | [CVEase-win-Setup.exe](https://github.com/marbas207/CVEase/releases/latest) |
| macOS (Apple Silicon) | [CVEase-mac-arm64.dmg](https://github.com/marbas207/CVEase/releases/latest) |
| macOS (Intel) | [CVEase-mac-x64.dmg](https://github.com/marbas207/CVEase/releases/latest) |
| Linux | [CVEase-linux.AppImage](https://github.com/marbas207/CVEase/releases/latest) |

## Features

**Kanban Board**
- 5-stage pipeline: Discovery, Vendor Contacted, Negotiating, CVE Requested, Published
- Drag-and-drop cards between stages with transition prompts for required fields
- Swimlanes per software product, grouped under vendors with favicons
- Severity filtering (Critical / High / Medium / Low) and search

**Vendor Management**
- First-class vendor records with security team contacts, CNA status, and notes
- Vendor contact info auto-fills new CVEs
- CNA status auto-completes relevant checklist items
- Favicons pulled from vendor websites and cached locally

**Per-CVE Tracking**
- Severity, affected component, affected versions, CVE ID
- Vendor contact details (pre-filled from vendor record)
- Reproduction steps and description
- Patch status tracking (No Patch / Patch Available / Won't Fix)
- VINCE (CERT/CC) escalation flag with case ID
- File attachments
- Activity log with typed entries (Email Sent, Email Received, Phone Call, Meeting, Note)

**Disclosure Workflow**
- Configurable default checklist per CVE with stage-trigger actions
- Disclosure deadline with customizable date (defaults to 90 days from vendor notification)
- Follow-up reminders on Vendor Contacted, Negotiating, and CVE Requested stages
- Follow-up action modal: log what you did and set the next check-in
- Stage transition modals collect required fields before moving cards

**Dashboard**
- Pipeline overview with stats and severity breakdown
- Overdue disclosure dates and approaching deadlines
- Follow-ups due with direct action buttons
- CVEs with no follow-up date set

**Hall of Fame**
- Published CVEs auto-archive after 30 days
- Grouped by severity with medal icons
- LinkedIn post generator (copy to clipboard)
- Confetti on publish

**Other**
- Timeline view with collapsible groups (by software or by stage)
- Light / dark theme toggle
- Keyboard shortcuts (`Ctrl+/` to view all)
- Database backup and restore
- Fully local SQLite storage, no network required

## Getting Started

On first launch, CVEase walks you through a 3-step setup:

1. **Add a Vendor** with their security team contact details
2. **Add a Software** product under that vendor
3. **Create your first Vulnerability**

Or click **"Try with demo data"** to load realistic sample data across all stages and explore the app. A banner lets you clear the demo data and start fresh whenever you're ready.

## Building from Source

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
git clone https://github.com/marbas207/CVEase.git
cd CVEase
npm install
```

### Development

```bash
npm run dev
```

### Package

```bash
npm run build && npx electron-builder --publish never
```

## Tech Stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [@dnd-kit](https://dndkit.com/)
- [Zustand](https://zustand.docs.pmnd.rs/)

## Author

Created by **marba$**

- GitHub: [marbas207](https://github.com/marbas207)
- Buy Me a Coffee: [marbas](https://buymeacoffee.com/marbas)

## License

All rights reserved.
