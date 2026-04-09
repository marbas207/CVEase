import { Notification, BrowserWindow } from 'electron'
import log from 'electron-log/main'
import { getDb } from './db/database'

/**
 * Background scheduler that fires native OS notifications when a CVE's
 * `followup_due_date` is today or earlier. Runs once at startup and then
 * hourly while the app is open.
 *
 * Why this exists: the dashboard already surfaces follow-ups visually, but
 * only when the user opens the app. The whole point of a follow-up date is
 * "remind me later" — without an OS-level push, we're a pull system, which
 * defeats the purpose of the feature.
 *
 * De-duplication: we keep an in-memory set of CVE ids we've already notified
 * for in this process. The set resets on app restart, which is intentional —
 * a user who restarts the app should see today's reminders again.
 */

const notifiedThisSession = new Set<string>()
const CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
let timer: NodeJS.Timeout | null = null

interface DueRow {
  id: string
  title: string
  cve_id: string | null
  followup_due_date: string
}

function listDueFollowups(): DueRow[] {
  const today = new Date().toISOString().slice(0, 10)
  // Active stages where a follow-up is meaningful — matches the renderer's
  // followupStages set in DashboardPage.tsx.
  return getDb()
    .prepare(
      `SELECT id, title, cve_id, followup_due_date
       FROM cves
       WHERE archived = 0
         AND stage IN ('Vendor Contacted', 'Negotiating', 'CVE Requested')
         AND followup_due_date IS NOT NULL
         AND followup_due_date <= ?`
    )
    .all(today) as DueRow[]
}

function fireNotification(row: DueRow, mainWindow: BrowserWindow | null): void {
  if (!Notification.isSupported()) return
  const label = row.cve_id ? `${row.cve_id} — ${row.title}` : row.title
  const today = new Date().toISOString().slice(0, 10)
  const overdue = row.followup_due_date < today
  const body = overdue
    ? `Follow-up was due ${row.followup_due_date}. Click to open.`
    : `Follow-up is due today. Click to open.`

  const n = new Notification({
    title: overdue ? 'CVEase: Follow-up overdue' : 'CVEase: Follow-up due today',
    body: label.length > 120 ? label.slice(0, 117) + '...' : label,
    subtitle: body, // macOS only — harmless on other platforms
    silent: false
  })

  n.on('click', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('notification:openCVE', row.id)
  })

  n.show()
}

function checkOnce(getMainWindow: () => BrowserWindow | null): void {
  try {
    const due = listDueFollowups()
    const fresh = due.filter((r) => !notifiedThisSession.has(r.id))
    if (fresh.length === 0) return
    log.info(`[notifications] firing ${fresh.length} follow-up reminder(s)`)
    const mainWindow = getMainWindow()
    for (const row of fresh) {
      notifiedThisSession.add(row.id)
      fireNotification(row, mainWindow)
    }
  } catch (err) {
    log.error('[notifications] check failed:', err)
  }
}

/**
 * Start the follow-up notification scheduler. Safe to call multiple times —
 * subsequent calls are no-ops while a timer is already running.
 *
 * `getMainWindow` is a getter (not a direct reference) so the scheduler
 * always sees the *current* main window even if it gets recreated after a
 * macOS dock-click reactivation.
 */
export function startFollowupNotifier(getMainWindow: () => BrowserWindow | null): void {
  if (timer) return
  // Initial check delayed slightly so the renderer has a chance to mount
  // its IPC listener before any notification click could fire.
  setTimeout(() => checkOnce(getMainWindow), 5000)
  timer = setInterval(() => checkOnce(getMainWindow), CHECK_INTERVAL_MS)
}

export function stopFollowupNotifier(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
