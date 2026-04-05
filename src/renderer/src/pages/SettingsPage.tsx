import { useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { api } from '../lib/ipc'
import { SwimLaneForm } from '../components/swimlane/SwimLaneForm'
import { VendorForm } from '../components/vendor/VendorForm'
import { ChecklistTemplateEditor } from '../components/settings/ChecklistTemplateEditor'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'
import { Plus, Pencil, Trash2, ChevronRight, Globe, Download, Upload, AlertTriangle, Mail, Building2 } from 'lucide-react'
import type { Swimlane, Vendor } from '../types/cve'

function SwimLaneListItem({ lane }: { lane: Swimlane }) {
  const { deleteSwimlane, cves } = useBoardStore()
  const [editOpen, setEditOpen] = useState(false)
  const count = cves.filter(c => c.swimlane_id === lane.id).length

  const handleDelete = async () => {
    if (confirm(`Delete "${lane.software_name}" and all ${count} CVE(s)?`)) {
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
  const { vendors, swimlanes, loadBoard } = useBoardStore()
  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

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

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
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

      <VendorForm open={addVendorOpen} onOpenChange={setAddVendorOpen} />
      <SwimLaneForm open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
