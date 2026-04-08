import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import { runMigrations } from './migrations'

const EXPECTED_VERSION = 15

const EXPECTED_TABLES = [
  'schema_version',
  'swimlanes',
  'cves',
  'followups',
  'attachments',
  'todos',
  'vendors',
  'checklist_template'
]

function tableNames(db: Database.Database): string[] {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[]
  ).map((r) => r.name)
}

function columnNames(db: Database.Database, table: string): string[] {
  return (db.pragma(`table_info(${table})`) as { name: string }[]).map((c) => c.name)
}

describe('database migrations', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('foreign_keys = ON')
  })

  it('runs cleanly on a fresh database and reaches the current version', () => {
    runMigrations(db)

    const row = db.prepare('SELECT MAX(version) as v FROM schema_version').get() as {
      v: number | null
    }
    expect(row.v).toBe(EXPECTED_VERSION)
  })

  it('creates every expected table', () => {
    runMigrations(db)
    const tables = tableNames(db)
    for (const expected of EXPECTED_TABLES) {
      expect(tables, `missing table: ${expected}`).toContain(expected)
    }
  })

  it('is idempotent — running twice does not change the schema version', () => {
    runMigrations(db)
    const before = (
      db.prepare('SELECT MAX(version) as v FROM schema_version').get() as { v: number }
    ).v

    runMigrations(db)
    const after = (
      db.prepare('SELECT MAX(version) as v FROM schema_version').get() as { v: number }
    ).v

    expect(after).toBe(before)
    expect(after).toBe(EXPECTED_VERSION)
  })

  it('includes columns added by later migrations', () => {
    runMigrations(db)

    // v3: archived
    expect(columnNames(db, 'cves')).toContain('archived')
    // v4: todos table + affected_component
    expect(columnNames(db, 'cves')).toContain('affected_component')
    // v5: followup_due_date
    expect(columnNames(db, 'cves')).toContain('followup_due_date')
    // v6: patch_status, vince_case_id
    expect(columnNames(db, 'cves')).toContain('patch_status')
    expect(columnNames(db, 'cves')).toContain('vince_case_id')
    // v7: vendors table + swimlanes.vendor_id
    expect(columnNames(db, 'swimlanes')).toContain('vendor_id')
    // v8: affected_versions
    expect(columnNames(db, 'cves')).toContain('affected_versions')
    // v11: bounty_status
    expect(columnNames(db, 'cves')).toContain('bounty_status')
    expect(columnNames(db, 'vendors')).toContain('has_bounty_program')
    // v12: bounty_in_scope
    expect(columnNames(db, 'swimlanes')).toContain('bounty_in_scope')
    // v14: cvss_vector + cwe_id
    expect(columnNames(db, 'cves')).toContain('cvss_vector')
    expect(columnNames(db, 'cves')).toContain('cwe_id')
    // v15: tags
    expect(columnNames(db, 'cves')).toContain('tags')
  })

  it('rejects the removed "Awaiting Response" stage (migration v9 enforced)', () => {
    runMigrations(db)

    const vendorId = uuidv4()
    db.prepare('INSERT INTO vendors (id, name) VALUES (?, ?)').run(vendorId, 'Acme')
    const swimlaneId = uuidv4()
    db.prepare(
      'INSERT INTO swimlanes (id, software_name, vendor, vendor_id) VALUES (?, ?, ?, ?)'
    ).run(swimlaneId, 'AcmeApp', 'Acme', vendorId)

    expect(() =>
      db
        .prepare(
          'INSERT INTO cves (id, swimlane_id, title, severity, stage) VALUES (?, ?, ?, ?, ?)'
        )
        .run(uuidv4(), swimlaneId, 'Test', 'High', 'Awaiting Response')
    ).toThrow()
  })

  it('supports a realistic insert/query round trip', () => {
    runMigrations(db)

    const vendorId = uuidv4()
    db.prepare('INSERT INTO vendors (id, name, is_cna) VALUES (?, ?, ?)').run(
      vendorId,
      'Acme Corp',
      1
    )

    const swimlaneId = uuidv4()
    db.prepare(
      'INSERT INTO swimlanes (id, software_name, vendor, vendor_id) VALUES (?, ?, ?, ?)'
    ).run(swimlaneId, 'AcmeApp', 'Acme Corp', vendorId)

    const cveId = uuidv4()
    db.prepare(
      `INSERT INTO cves (id, swimlane_id, title, cve_id, severity, stage)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(cveId, swimlaneId, 'RCE in login', 'CVE-2026-0001', 'Critical', 'Discovery')

    const row = db.prepare('SELECT cve_id, severity, stage FROM cves WHERE id = ?').get(cveId)
    expect(row).toEqual({
      cve_id: 'CVE-2026-0001',
      severity: 'Critical',
      stage: 'Discovery'
    })

    // Foreign-key cascade: deleting the swimlane should remove the CVE.
    db.prepare('DELETE FROM swimlanes WHERE id = ?').run(swimlaneId)
    const after = db.prepare('SELECT id FROM cves WHERE id = ?').get(cveId)
    expect(after).toBeUndefined()
  })

  it('seeds the default checklist template', () => {
    runMigrations(db)
    const count = (
      db.prepare('SELECT COUNT(*) as c FROM checklist_template').get() as { c: number }
    ).c
    expect(count).toBeGreaterThan(0)
  })

  describe('v13: UNIQUE(cve_id) partial index', () => {
    function seedSwimlane(d: Database.Database): string {
      const vendorId = uuidv4()
      d.prepare('INSERT INTO vendors (id, name) VALUES (?, ?)').run(vendorId, 'Acme')
      const swimlaneId = uuidv4()
      d.prepare(
        'INSERT INTO swimlanes (id, software_name, vendor, vendor_id) VALUES (?, ?, ?, ?)'
      ).run(swimlaneId, 'AcmeApp', 'Acme', vendorId)
      return swimlaneId
    }

    it('rejects a second CVE with the same non-null cve_id', () => {
      runMigrations(db)
      const lane = seedSwimlane(db)

      db.prepare(
        'INSERT INTO cves (id, swimlane_id, title, cve_id, severity, stage) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(uuidv4(), lane, 'First', 'CVE-2026-0001', 'High', 'Discovery')

      expect(() =>
        db
          .prepare(
            'INSERT INTO cves (id, swimlane_id, title, cve_id, severity, stage) VALUES (?, ?, ?, ?, ?, ?)'
          )
          .run(uuidv4(), lane, 'Second', 'CVE-2026-0001', 'High', 'Discovery')
      ).toThrow(/UNIQUE/i)
    })

    it('still allows multiple rows with NULL cve_id', () => {
      runMigrations(db)
      const lane = seedSwimlane(db)

      db.prepare(
        'INSERT INTO cves (id, swimlane_id, title, cve_id, severity, stage) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(uuidv4(), lane, 'A', null, 'High', 'Discovery')

      // Second null insert must not throw.
      expect(() =>
        db
          .prepare(
            'INSERT INTO cves (id, swimlane_id, title, cve_id, severity, stage) VALUES (?, ?, ?, ?, ?, ?)'
          )
          .run(uuidv4(), lane, 'B', null, 'High', 'Discovery')
      ).not.toThrow()
    })

    it('aborts the upgrade with a useful message if duplicates already exist', () => {
      // Build a fresh DB at v12 and seed it with duplicate CVE IDs, then
      // try to migrate forward — the v13 pre-flight check should catch it.
      const legacy = new Database(':memory:')
      legacy.pragma('foreign_keys = ON')

      // Hand-roll v0..v12 by stamping the version table and creating just
      // the tables we need for the test. We don't need the full schema —
      // only enough to seed duplicate cve_ids.
      legacy.exec(`
        CREATE TABLE schema_version (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')));
        CREATE TABLE swimlanes (id TEXT PRIMARY KEY, software_name TEXT, vendor TEXT);
        CREATE TABLE cves (
          id TEXT PRIMARY KEY,
          swimlane_id TEXT NOT NULL REFERENCES swimlanes(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          cve_id TEXT,
          severity TEXT NOT NULL CHECK(severity IN ('Critical','High','Medium','Low')),
          stage TEXT NOT NULL CHECK(stage IN ('Discovery','Vendor Contacted','Negotiating','CVE Requested','Published')),
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `)
      legacy.prepare('INSERT INTO schema_version (version) VALUES (12)').run()
      legacy.prepare('INSERT INTO swimlanes (id, software_name, vendor) VALUES (?, ?, ?)').run('lane1', 'X', 'Y')
      legacy
        .prepare(
          'INSERT INTO cves (id, swimlane_id, title, cve_id, severity, stage) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run('a', 'lane1', 'A', 'CVE-2026-9999', 'High', 'Discovery')
      legacy
        .prepare(
          'INSERT INTO cves (id, swimlane_id, title, cve_id, severity, stage) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .run('b', 'lane1', 'B', 'CVE-2026-9999', 'High', 'Discovery')

      expect(() => runMigrations(legacy)).toThrow(/CVE-2026-9999/)
    })
  })
})
