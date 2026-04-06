<p align="center">
  <img src="build/icon.png" alt="CVEase" width="80" />
</p>

<h1 align="center">CVEase</h1>

<p align="center">
  A desktop Kanban board for managing vulnerability disclosures and bug bounties.
</p>

---

Coordinated vulnerability disclosure is important work, but when you're juggling multiple active disclosures across different vendors, tracking where each one stands gets overwhelming fast. Which vendors have you contacted? Who hasn't responded? When is the disclosure deadline? Is there a bounty? Did you request that CVE ID yet?

**CVEase** gives you a single place to manage the entire lifecycle, from initial discovery through public disclosure, whether you're tracking CVEs, bug bounties, or both.

<!-- TODO: Add demo animation/screenshot here -->

## Download

| Platform | Download |
|----------|----------|
| Windows | [CVEase-win-Setup.exe](https://github.com/marbas207/CVEase/releases/latest) |
| macOS (Apple Silicon) | [CVEase-mac-arm64.dmg](https://github.com/marbas207/CVEase/releases/latest) * |
| macOS (Intel) | [CVEase-mac-x64.dmg](https://github.com/marbas207/CVEase/releases/latest) * |
| Linux | [CVEase-linux.AppImage](https://github.com/marbas207/CVEase/releases/latest) |

**\* macOS users:** The app is not yet notarized. After installing, run this in Terminal to remove the quarantine flag:
```bash
xattr -cr /Applications/CVEase.app
```
Or right-click the app > Open > click "Open" in the dialog.

## Features

**Kanban Board**
- 5-stage pipeline: Discovery, Vendor Contacted, Negotiating, CVE Requested, Published
- Drag-and-drop cards between stages with transition prompts for required fields
- Swimlanes per software product, grouped under vendors with favicons
- Severity filtering (Critical / High / Medium / Low) and search
- Stage-aware forms that only show fields relevant to the current stage

**Vendor Management**
- First-class vendor records with security team contacts, CNA status, and notes
- Bug bounty program tracking with per-product scope flags
- Vendor contact info auto-fills new vulnerabilities
- CNA status and bounty scope auto-complete relevant checklist items
- Favicons pulled from vendor websites and cached locally

**Vulnerability Tracking**
- Severity, affected component, affected versions
- CVE eligibility flag (supports bounty-only findings that don't need a CVE)
- Vendor contact details (pre-filled from vendor record)
- Reproduction steps and description
- Patch status tracking (No Patch / Patch Available / Won't Fix)
- VINCE (CERT/CC) escalation flag with case ID
- File attachments
- Activity log with typed entries (Email Sent, Email Received, Phone Call, Meeting, Note)

**Bug Bounty Support**
- Vendor-level bounty program tracking with program URL
- Per-product bounty scope (in-scope / out-of-scope)
- Per-vulnerability bounty status (Submitted / Approved / Paid / Rejected)
- Bounty amount, payout date, and report URL tracking
- Dashboard shows total bounties earned with dollar value
- Hall of Fame displays bounty amounts on archived findings
- LinkedIn post includes bounty mention when paid
- Non-CVE-eligible vulnerabilities skip the CVE Requested stage automatically

**Disclosure Workflow**
- Configurable default checklist per vulnerability with stage-trigger actions
- Disclosure deadline with customizable date (defaults to 90 days from vendor notification)
- Follow-up reminders on Vendor Contacted, Negotiating, and CVE Requested stages
- Follow-up action modal: log what you did and set the next check-in
- Stage transition modals collect required fields before moving cards
- CVE Requested stage blocked for non-CVE-eligible findings

**Dashboard**
- Pipeline overview with stats and severity breakdown
- Bounties earned count with total dollar value
- Overdue disclosure dates and approaching deadlines
- Follow-ups due with direct action buttons
- Vulnerabilities with no follow-up date set

**Hall of Fame**
- Published vulnerabilities auto-archive after 30 days
- Grouped by severity with medal icons
- Shows bounty amounts for paid findings
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

Or click **"Try with demo data"** to load realistic sample data across all stages and explore the app. The demo includes 3 vendors, 5 products, and 9 vulnerabilities covering CVE disclosures, bug bounties, and bounty-only findings. A banner lets you clear the demo data and start fresh whenever you're ready.

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
