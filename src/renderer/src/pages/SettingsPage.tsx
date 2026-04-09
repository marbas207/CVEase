import { useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { api } from '../lib/ipc'
import { SwimLaneForm } from '../components/swimlane/SwimLaneForm'
import { VendorForm } from '../components/vendor/VendorForm'
import { ChecklistTemplateEditor } from '../components/settings/ChecklistTemplateEditor'
import { PurgeConfirmDialog } from '../components/settings/PurgeConfirmDialog'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'
import { Plus, Pencil, Trash2, ChevronRight, Globe, Download, Upload, AlertTriangle, AlertOctagon, Mail, Building2, Eraser, Flame } from 'lucide-react'
import type { Swimlane, Vendor } from '../types/cve'

function SwimLaneListItem({ lane }: { lane: Swimlane }) {
  const { deleteSwimlane, cves } = useBoardStore()
  const [editOpen, setEditOpen] = useState(false)
  const count = cves.filter(c => c.swimlane_id === lane.id).length

  const handleDelete = async () => {
    if (confirm(`Delete "${lane.software_name}" and all ${count} vulnerabilit${count === 1 ? 'y' : 'ies'}?`)) {
      await deleteSwimlane(lane.id)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 py-3 group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{lane.software_name}</p>
            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{count} vuln{count !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-xs text-muted-foreground">{lane.vendor}</p>
          {lane.url && (
            <a href={lane.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3" />{lane.url}
            </a>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
      </div>
      <SwimLaneForm open={editOpen} onOpenChange={setEditOpen} swimlane={lane} />
    </>
  )
}

function VendorListItem({ vendor }: { vendor: Vendor }) {
  const { deleteVendor, swimlanes } = useBoardStore()
  const [editOpen, setEditOpen] = useState(false)
  const productCount = swimlanes.filter(s => s.vendor_id === vendor.id).length

  const handleDelete = async () => {
    if (productCount > 0) {
      alert(`Cannot delete "${vendor.name}" because it has ${productCount} software product(s). Remove them first.`)
      return
    }
    if (confirm(`Delete vendor "${vendor.name}"?`)) {
      await deleteVendor(vendor.id)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 py-3 group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{vendor.name}</p>
            {vendor.is_cna === 1 && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">CNA</span>
            )}
            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {productCount} product{productCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {vendor.security_contact_name && <span>{vendor.security_contact_name}</span>}
            {vendor.security_contact_email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {vendor.security_contact_email}
              </span>
            )}
            {vendor.security_contact_other && <span>{vendor.security_contact_other}</span>}
          </div>
          {vendor.url && (
            <a href={vendor.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
              <Globe className="w-3 h-3" />{vendor.url}
            </a>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <VendorForm open={editOpen} onOpenChange={setEditOpen} vendor={vendor} />
    </>
  )
}

export function SettingsPage() {
  const { vendors, swimlanes, cves, loadBoard } = useBoardStore()
  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [purgeCVEsOpen, setPurgeCVEsOpen] = useState(false)
  const [purgeAllOpen, setPurgeAllOpen] = useState(false)
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null)

  const handleBackup = async () => {
    setBackupStatus(null)
    try {
      const path = await api.db.backup()
      if (path) setBackupStatus(`Backed up to ${path}`)
    } catch (e) {
      setBackupStatus(`Backup failed: ${e}`)
    }
  }

  const handleRestore = async () => {
    if (!confirm('Restore will replace ALL current data with the backup file. This cannot be undone. Continue?')) return
    setRestoring(true)
    setBackupStatus(null)
    try {
      const path = await api.db.restore()
      if (path) {
        await loadBoard()
        setBackupStatus(`Restored from ${path}`)
      }
    } catch (e) {
      setBackupStatus(`Restore failed: ${e}`)
    } finally {
      setRestoring(false)
    }
  }

  const handlePurgeCVEs = async () => {
    setPurgeStatus(null)
    const safetyBackup = await api.db.purgeCVEData()
    await loadBoard()
    setPurgeStatus(`Vulnerability data purged. Safety backup saved to ${safetyBackup}`)
  }

  const handlePurgeAll = async () => {
    setPurgeStatus(null)
    const safetyBackup = await api.db.purgeAll()
    await loadBoard()
    setPurgeStatus(`Everything purged. Safety backup saved to ${safetyBackup}`)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-1">Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage vendors, software entries, and app preferences.</p>

      {/* Vendors */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Vendors
            </h3>
            <p className="text-xs text-muted-foreground">Security team contacts, CNA status, and coordination details. This info pre-fills new vulnerabilities.</p>
          </div>
          <Button size="sm" onClick={() => setAddVendorOpen(true)} className="gap-1">
            <Plus className="w-3.5 h-3.5" />
            Add Vendor
          </Button>
        </div>

        <Separator className="mb-3" />

        {vendors.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No vendors yet. Add one to get started.</p>
        )}

        <div className="divide-y divide-border">
          {vendors.map(v => <VendorListItem key={v.id} vendor={v} />)}
        </div>
      </div>

      {/* Software / Products */}
      <div className="bg-card border border-border rounded-lg p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Software / Products</h3>
            <p className="text-xs text-muted-foreground">Each entry becomes a swimlane on the Kanban board, grouped under its vendor.</p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1" disabled={vendors.length === 0}>
            <Plus className="w-3.5 h-3.5" />
            Add Software
          </Button>
        </div>

        <Separator className="mb-3" />

        {swimlanes.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            {vendors.length === 0 ? 'Add a vendor first, then add software products.' : 'No software entries yet.'}
          </p>
        )}

        <div className="divide-y divide-border">
          {swimlanes.map(lane => <SwimLaneListItem key={lane.id} lane={lane} />)}
        </div>
      </div>

      {/* Checklist Template */}
      <div className="mt-6">
        <ChecklistTemplateEditor />
      </div>

      {/* Backup & Restore */}
      <div className="bg-card border border-border rounded-lg p-4 mt-6">
        <h3 className="text-sm font-semibold mb-1">Database Backup & Restore</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Export your entire database to a file, or restore from a previous backup.
        </p>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleBackup} className="gap-2">
            <Download className="w-3.5 h-3.5" />
            Export Backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestore}
            disabled={restoring}
            className="gap-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
          >
            <Upload className="w-3.5 h-3.5" />
            {restoring ? 'Restoring...' : 'Import & Restore'}
          </Button>
        </div>

        {backupStatus && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            {backupStatus.includes('failed') ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            ) : null}
            {backupStatus}
          </p>
        )}

        <div className="mt-3 p-2.5 bg-muted/40 rounded text-xs text-muted-foreground flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-500/70" />
          <span>Restoring a backup replaces <strong>all</strong> current data including vulnerabilities, swimlanes, attachments metadata, and activity logs.</span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/30 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2 text-destructive">
          <AlertOctagon className="w-4 h-4" />
          Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Permanent deletions. Each action takes a timestamped safety backup first, recoverable via Import &amp; Restore above.
        </p>

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 p-3 rounded-md border border-border bg-muted/20">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Eraser className="w-3.5 h-3.5 text-destructive" />
                Reset Vulnerability Data
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Deletes all vulnerabilities, follow-ups, todos, and attachments. Keeps vendors, software, and your checklist template.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPurgeCVEsOpen(true)}
              disabled={cves.length === 0}
              className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              Reset
            </Button>
          </div>

          <div className="flex items-start justify-between gap-3 p-3 rounded-md border border-border bg-muted/20">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-destructive" />
                Reset Everything
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Deletes vulnerabilities, swimlanes, AND vendors. Only the checklist template and database schema survive. Use this for a true fresh start.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPurgeAllOpen(true)}
              disabled={cves.length === 0 && swimlanes.length === 0 && vendors.length === 0}
              className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              Reset
            </Button>
          </div>
        </div>

        {purgeStatus && (
          <p className="text-xs text-muted-foreground mt-3 break-all">{purgeStatus}</p>
        )}
      </div>

      <PurgeConfirmDialog
        open={purgeCVEsOpen}
        onOpenChange={setPurgeCVEsOpen}
        title="Reset Vulnerability Data"
        description={`This will permanently delete ${cves.length} vulnerabilit${cves.length === 1 ? 'y' : 'ies'} along with every follow-up, todo, and attachment.\n\nVendors, software entries, and your checklist template will be preserved.\n\nA timestamped safety backup will be written to your userData folder before anything is deleted.`}
        confirmKeyword="PURGE"
        confirmLabel="Delete Vulnerability Data"
        onConfirm={handlePurgeCVEs}
      />

      <PurgeConfirmDialog
        open={purgeAllOpen}
        onOpenChange={setPurgeAllOpen}
        title="Reset Everything"
        description={`This will permanently delete ALL ${cves.length} vulnerabilit${cves.length === 1 ? 'y' : 'ies'}, ${swimlanes.length} software entr${swimlanes.length === 1 ? 'y' : 'ies'}, and ${vendors.length} vendor${vendors.length === 1 ? '' : 's'}.\n\nYour checklist template will be preserved.\n\nA timestamped safety backup will be written to your userData folder before anything is deleted.`}
        confirmKeyword="PURGE EVERYTHING"
        confirmLabel="Delete Everything"
        onConfirm={handlePurgeAll}
      />

      <VendorForm open={addVendorOpen} onOpenChange={setAddVendorOpen} />
      <SwimLaneForm open={addOpen} onOpenChange={setAddOpen} />
      </div>
    </div>
  )
}
