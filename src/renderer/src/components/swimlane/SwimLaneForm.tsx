import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useBoardStore } from '../../store/boardStore'
import type { Swimlane } from '../../types/cve'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  swimlane?: Swimlane
}

export function SwimLaneForm({ open, onOpenChange, swimlane }: Props) {
  const { vendors, addSwimlane, updateSwimlane } = useBoardStore()
  const isEdit = !!swimlane

  const [softwareName, setSoftwareName] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [url, setUrl] = useState('')
  const [bountyInScope, setBountyInScope] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedVendor = vendors.find(v => v.id === vendorId)

  useEffect(() => {
    if (open) {
      setSoftwareName(swimlane?.software_name ?? '')
      setVendorId(swimlane?.vendor_id ?? '')
      setUrl(swimlane?.url ?? '')
      setBountyInScope(swimlane?.bounty_in_scope === 1)
    }
  }, [open, swimlane])

  const handleSave = async () => {
    if (!softwareName.trim() || !vendorId) return
    const vendor = vendors.find(v => v.id === vendorId)
    if (!vendor) return
    setSaving(true)
    try {
      if (isEdit && swimlane) {
        await updateSwimlane(swimlane.id, {
          software_name: softwareName.trim(),
          vendor: vendor.name,
          vendor_id: vendorId,
          url: url.trim() || undefined,
          vendor_is_cna: vendor.is_cna === 1,
          bounty_in_scope: bountyInScope
        })
      } else {
        await addSwimlane({
          software_name: softwareName.trim(),
          vendor: vendor.name,
          vendor_id: vendorId,
          url: url.trim() || undefined,
          vendor_is_cna: vendor.is_cna === 1,
          bounty_in_scope: bountyInScope
        })
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Software' : 'Add Software'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Vendor *</Label>
            {vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No vendors yet. Add one from Settings first.</p>
            ) : (
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                      {v.is_cna === 1 && <span className="ml-1.5 text-[10px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">CNA</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sw-name">Software / Product Name *</Label>
            <Input
              id="sw-name"
              value={softwareName}
              onChange={e => setSoftwareName(e.target.value)}
              placeholder="e.g. Apache HTTP Server"
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sw-url">Product URL</Label>
            <Input
              id="sw-url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          {selectedVendor?.has_bounty_program === 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBountyInScope(!bountyInScope)}
                className={`relative w-9 h-5 rounded-full transition-colors ${bountyInScope ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${bountyInScope ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <div>
                <Label className="cursor-pointer" onClick={() => setBountyInScope(!bountyInScope)}>
                  In scope for bug bounty
                </Label>
                <p className="text-[11px] text-muted-foreground">This product is eligible for {selectedVendor.name}'s bounty program</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !softwareName.trim() || !vendorId}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
