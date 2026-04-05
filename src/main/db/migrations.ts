import Database from 'better-sqlite3'

const CURRENT_VERSION = 12

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS schema_version (
  version     INTEGER PRIMARY KEY,
  applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS swimlanes (
  id               TEXT PRIMARY KEY,
  software_name    TEXT NOT NULL,
  vendor           TEXT NOT NULL,
  version_affected TEXT,
  url              TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  collapsed        INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cves (
  id                   TEXT PRIMARY KEY,
  swimlane_id          TEXT NOT NULL REFERENCES swimlanes(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  cve_id               TEXT,
  severity             TEXT NOT NULL CHECK(severity IN ('Critical','High','Medium','Low')),
  stage                TEXT NOT NULL CHECK(stage IN (
    'Discovery','Vendor Contacted','Awaiting Response',
    'Negotiating','CVE Requested','Published'
  )),
  description          TEXT,
  vendor_contact_name  TEXT,
  vendor_contact_email TEXT,
  vendor_contact_other TEXT,
  date_discovered      TEXT,
  date_vendor_notified TEXT,
  disclosure_deadline  TEXT,
  date_cve_requested   TEXT,
  date_disclosed       TEXT,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cves_swimlane  ON cves(swimlane_id);
CREATE INDEX IF NOT EXISTS idx_cves_stage     ON cves(stage);
CREATE INDEX IF NOT EXISTS idx_cves_deadline  ON cves(disclosure_deadline);

CREATE TABLE IF NOT EXISTS followups (
  id          TEXT PRIMARY KEY,
  cve_id      TEXT NOT NULL REFERENCES cves(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'Note',
  note        TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_followups_cve ON followups(cve_id);

CREATE TABLE IF NOT EXISTS attachments (
  id          TEXT PRIMARY KEY,
  cve_id      TEXT NOT NULL REFERENCES cves(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  filepath    TEXT NOT NULL,
  mime_type   TEXT,
  size_bytes  INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attachments_cve ON attachments(cve_id);
`

// Migration v2:
// - Rename 'Disclosed' stage -> 'Published' in existing cves rows
// - Add 'type' column to followups
// SQLite doesn't support ALTER COLUMN or DROP CONSTRAINT, so we recreate the cves table.
const MIGRATION_V2 = `
-- Recreate cves table with updated CHECK constraint (Disclosed -> Published)
CREATE TABLE cves_new (
  id                   TEXT PRIMARY KEY,
  swimlane_id          TEXT NOT NULL REFERENCES swimlanes(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  cve_id               TEXT,
  severity             TEXT NOT NULL CHECK(severity IN ('Critical','High','Medium','Low')),
  stage                TEXT NOT NULL CHECK(stage IN (
    'Discovery','Vendor Contacted','Awaiting Response',
    'Negotiating','CVE Requested','Published'
  )),
  description          TEXT,
  vendor_contact_name  TEXT,
  vendor_contact_email TEXT,
  vendor_contact_other TEXT,
  date_discovered      TEXT,
  date_vendor_notified TEXT,
  disclosure_deadline  TEXT,
  date_cve_requested   TEXT,
  date_disclosed       TEXT,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO cves_new SELECT
  id, swimlane_id, title, cve_id, severity,
  CASE stage WHEN 'Disclosed' THEN 'Published' ELSE stage END,
  description, vendor_contact_name, vendor_contact_email, vendor_contact_other,
  date_discovered, date_vendor_notified, disclosure_deadline,
  date_cve_requested, date_disclosed, sort_order, created_at, updated_at
FROM cves;

DROP TABLE cves;
ALTER TABLE cves_new RENAME TO cves;

CREATE INDEX IF NOT EXISTS idx_cves_swimlane  ON cves(swimlane_id);
CREATE INDEX IF NOT EXISTS idx_cves_stage     ON cves(stage);
CREATE INDEX IF NOT EXISTS idx_cves_deadline  ON cves(disclosure_deadline);
`

// Migration v3: add archived fields to cves
function runMigrationV3(db: Database.Database): void {
  addColumn(db, 'cves', 'archived', 'INTEGER NOT NULL DEFAULT 0')
  addColumn(db, 'cves', 'archived_at', 'TEXT')
  db.exec('CREATE INDEX IF NOT EXISTS idx_cves_archived ON cves(archived);')
}

// Migration v4: add affected_component to cves, add todos table
function runMigrationV4(db: Database.Database): void {
  addColumn(db, 'cves', 'affected_component', 'TEXT')
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id              TEXT PRIMARY KEY,
      cve_id          TEXT NOT NULL REFERENCES cves(id) ON DELETE CASCADE,
      text            TEXT NOT NULL,
      completed       INTEGER NOT NULL DEFAULT 0,
      completed_at    TEXT,
      completion_note TEXT,
      trigger_stage   TEXT,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_todos_cve ON todos(cve_id);
  `)
}

// Migration v5: add followup_due_date to cves
function runMigrationV5(db: Database.Database): void {
  addColumn(db, 'cves', 'followup_due_date', 'TEXT')
}

// Migration v6: CNA tracking, VINCE escalation, patch status
function runMigrationV6(db: Database.Database): void {
  addColumn(db, 'swimlanes', 'vendor_is_cna', 'INTEGER NOT NULL DEFAULT 0')
  addColumn(db, 'cves', 'escalated_to_vince', 'INTEGER NOT NULL DEFAULT 0')
  addColumn(db, 'cves', 'vince_case_id', 'TEXT')
  addColumn(db, 'cves', 'patch_status', "TEXT NOT NULL DEFAULT 'unknown'")
  addColumn(db, 'cves', 'patch_url', 'TEXT')
}

import { v4 as uuidv4 } from 'uuid'

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const cols = db.pragma(`table_info(${table})`) as { name: string }[]
  return cols.some(c => c.name === column)
}

function addColumn(db: Database.Database, table: string, column: string, def: string): void {
  if (!hasColumn(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def};`)
  }
}

function runMigrationV7(db: Database.Database): void {
  // Create vendors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id                     TEXT PRIMARY KEY,
      name                   TEXT NOT NULL,
      security_contact_name  TEXT,
      security_contact_email TEXT,
      security_contact_other TEXT,
      is_cna                 INTEGER NOT NULL DEFAULT 0,
      url                    TEXT,
      notes                  TEXT,
      created_at             TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
  `)
  addColumn(db, 'swimlanes', 'vendor_id', 'TEXT')

  // Migrate existing unique vendors from swimlanes
  const rows = db.prepare('SELECT DISTINCT vendor, vendor_is_cna FROM swimlanes').all() as { vendor: string; vendor_is_cna: number }[]
  const insertVendor = db.prepare('INSERT INTO vendors (id, name, is_cna) VALUES (?, ?, ?)')
  const updateLane = db.prepare('UPDATE swimlanes SET vendor_id = ? WHERE vendor = ?')

  for (const row of rows) {
    const vendorId = uuidv4()
    insertVendor.run(vendorId, row.vendor, row.vendor_is_cna)
    updateLane.run(vendorId, row.vendor)
  }
}

export function runMigrations(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_version (
    version    INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  const row = db.prepare('SELECT MAX(version) as v FROM schema_version').get() as { v: number | null }
  const currentVersion = row.v ?? 0

  if (currentVersion < 1) {
    db.exec(SCHEMA_V1)
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(1)
  }

  if (currentVersion < 2) {
    // Only recreate table if the old CHECK constraint exists (upgrade path)
    // On fresh DBs, v1 already has the correct schema
    const needsV2 = (() => {
      try {
        db.prepare("INSERT INTO cves (id, swimlane_id, title, severity, stage, sort_order) VALUES ('__test__','__test__','__test__','High','Disclosed',0)").run()
        db.prepare("DELETE FROM cves WHERE id = '__test__'").run()
        return true // old schema accepts 'Disclosed'
      } catch {
        return false // new schema rejects it, already correct
      }
    })()
    if (needsV2) {
      db.exec(MIGRATION_V2)
    }
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(2)
  }

  if (currentVersion < 3) {
    runMigrationV3(db)
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(3)
  }

  if (currentVersion < 4) {
    runMigrationV4(db)
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(4)
  }

  if (currentVersion < 5) {
    runMigrationV5(db)
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(5)
  }

  if (currentVersion < 6) {
    runMigrationV6(db)
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(6)
  }

  if (currentVersion < 7) {
    runMigrationV7(db)
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(7)
  }

  if (currentVersion < 8) {
    addColumn(db, 'cves', 'affected_versions', 'TEXT')
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(8)
  }

  if (currentVersion < 9) {
    // Remove 'Awaiting Response' stage — merge into 'Vendor Contacted'
    // Must recreate table to update CHECK constraint
    db.exec(`
      CREATE TABLE cves_v9 (
        id                   TEXT PRIMARY KEY,
        swimlane_id          TEXT NOT NULL REFERENCES swimlanes(id) ON DELETE CASCADE,
        title                TEXT NOT NULL,
        cve_id               TEXT,
        severity             TEXT NOT NULL CHECK(severity IN ('Critical','High','Medium','Low')),
        stage                TEXT NOT NULL CHECK(stage IN (
          'Discovery','Vendor Contacted','Negotiating','CVE Requested','Published'
        )),
        description          TEXT,
        vendor_contact_name  TEXT,
        vendor_contact_email TEXT,
        vendor_contact_other TEXT,
        date_discovered      TEXT,
        date_vendor_notified TEXT,
        disclosure_deadline  TEXT,
        date_cve_requested   TEXT,
        date_disclosed       TEXT,
        affected_component   TEXT,
        affected_versions    TEXT,
        followup_due_date    TEXT,
        escalated_to_vince   INTEGER NOT NULL DEFAULT 0,
        vince_case_id        TEXT,
        patch_status         TEXT NOT NULL DEFAULT 'unknown',
        patch_url            TEXT,
        archived             INTEGER NOT NULL DEFAULT 0,
        archived_at          TEXT,
        sort_order           INTEGER NOT NULL DEFAULT 0,
        created_at           TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO cves_v9 SELECT
        id, swimlane_id, title, cve_id, severity,
        CASE stage WHEN 'Awaiting Response' THEN 'Vendor Contacted' ELSE stage END,
        description, vendor_contact_name, vendor_contact_email, vendor_contact_other,
        date_discovered, date_vendor_notified, disclosure_deadline,
        date_cve_requested, date_disclosed, affected_component, affected_versions,
        followup_due_date, escalated_to_vince, vince_case_id, patch_status, patch_url,
        archived, archived_at, sort_order, created_at, updated_at
      FROM cves;

      DROP TABLE cves;
      ALTER TABLE cves_v9 RENAME TO cves;

      CREATE INDEX IF NOT EXISTS idx_cves_swimlane  ON cves(swimlane_id);
      CREATE INDEX IF NOT EXISTS idx_cves_stage     ON cves(stage);
      CREATE INDEX IF NOT EXISTS idx_cves_deadline  ON cves(disclosure_deadline);
      CREATE INDEX IF NOT EXISTS idx_cves_archived  ON cves(archived);
    `)
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(9)
  }

  if (currentVersion < 10) {
    // Checklist template table
    db.exec(`
      CREATE TABLE IF NOT EXISTS checklist_template (
        id            TEXT PRIMARY KEY,
        text          TEXT NOT NULL,
        trigger_stage TEXT,
        sort_order    INTEGER NOT NULL DEFAULT 0
      );
    `)

    // Seed with defaults if empty
    const count = (db.prepare('SELECT COUNT(*) as c FROM checklist_template').get() as { c: number }).c
    if (count === 0) {
      const defaults = [
        { text: 'Reproduce & document the vulnerability', trigger_stage: null },
        { text: 'Determine CVSS severity rating', trigger_stage: null },
        { text: 'Identify all affected versions', trigger_stage: null },
        { text: 'Find vendor security contact (security.txt, HackerOne, email)', trigger_stage: null },
        { text: 'Determine if vendor is a CNA', trigger_stage: null },
        { text: 'Draft initial disclosure email', trigger_stage: null },
        { text: 'Send disclosure to vendor', trigger_stage: 'Vendor Contacted' },
        { text: 'Confirm vendor acknowledgement', trigger_stage: null },
        { text: 'Agree on disclosure timeline', trigger_stage: null },
        { text: 'Request CVE ID (via vendor CNA or MITRE)', trigger_stage: 'CVE Requested' },
        { text: 'Coordinate and finalize public release', trigger_stage: null },
        { text: 'Publish vulnerability', trigger_stage: 'Published' },
      ]
      const stmt = db.prepare('INSERT INTO checklist_template (id, text, trigger_stage, sort_order) VALUES (?, ?, ?, ?)')
      defaults.forEach((d, i) => stmt.run(uuidv4(), d.text, d.trigger_stage, i))
    }

    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(10)
  }

  if (currentVersion < 11) {
    // Vendor-level bounty fields
    addColumn(db, 'vendors', 'has_bounty_program', 'INTEGER NOT NULL DEFAULT 0')
    addColumn(db, 'vendors', 'bounty_program_url', 'TEXT')
    // CVE-level bounty + eligibility fields
    addColumn(db, 'cves', 'cve_eligible', 'INTEGER DEFAULT 1')
    addColumn(db, 'cves', 'bounty_eligible', 'INTEGER')
    addColumn(db, 'cves', 'bounty_status', "TEXT NOT NULL DEFAULT 'none'")
    addColumn(db, 'cves', 'bounty_amount', 'TEXT')
    addColumn(db, 'cves', 'bounty_paid_date', 'TEXT')
    addColumn(db, 'cves', 'bounty_url', 'TEXT')
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(11)
  }

  if (currentVersion < 12) {
    addColumn(db, 'swimlanes', 'bounty_in_scope', 'INTEGER NOT NULL DEFAULT 0')
    db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(12)
  }
}
