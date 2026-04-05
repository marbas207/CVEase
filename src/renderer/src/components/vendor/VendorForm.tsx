import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { useBoardStore } from '../../store/boardStore'
import type { Vendor } from '../../types/cve'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor
}

export function VendorForm({ open, onOpenChange, vendor }: Props) {
  const { addVendor, updateVendor } = useBoardStore()
  const isEdit = !!vendor

  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactOther, setContactOther] = useState('')
  const [isCna, setIsCna] = useState(false)
  const [hasBountyProgram, setHasBountyProgram] = useState(false)
  const [bountyProgramUrl, setBountyProgramUrl] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(vendor?.name ?? '')
      setContactName(vendor?.security_contact_name ?? '')
      setContactEmail(vendor?.security_contact_email ?? '')
      setContactOther(vendor?.security_contact_other ?? '')
      setIsCna(vendor?.is_cna === 1)
      setHasBountyProgram(vendor?.has_bounty_program === 1)
      setBountyProgramUrl(vendor?.bounty_program_url ?? '')
      setUrl(vendor?.url ?? '')
      setNotes(vendor?.notes ?? '')
    }
  }, [open, vendor])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (isEdit && vendor) {
        await updateVendor(vendor.id, {
          name: name.trim(),
          security_contact_name: contactName.trim() || null,
          security_contact_email: contactEmail.trim() || null,
          security_contact_other: contactOther.trim() || null,
          is_cna: isCna,
          has_bounty_program: hasBountyProgram,
          bounty_program_url: bountyProgramUrl.trim() || null,
          url: url.trim() || null,
          notes: notes.trim() || null
        })
      } else {
        await addVendor({
          name: name.trim(),
          security_contact_name: contactName.trim() || undefined,
          security_contact_email: contactEmail.trim() || undefined,
          security_contact_other: contactOther.trim() || undefined,
          is_cna: isCna,
          has_bounty_program: hasBountyProgram,
          bounty_program_url: bountyProgramUrl.trim() || undefined,
          url: url.trim() || undefined,
          notes: notes.trim() || undefined
        })
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update vendor details. Changes apply to future CVEs; existing CVEs keep their current contact info.'
              : 'Set up a vendor with their security team details. This info will be pre-filled when creating new CVEs.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="v-name">Vendor / Organization Name *</Label>
            <Input
              id="v-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Apache Software Foundation"
              autoFocus
            />
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Security Contact</p>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="v-contact-name">Contact Name / Team</Label>
                <Input
                  id="v-contact-name"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="e.g. Security Response Team"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="v-contact-email">Email</Label>
                <Input
                  id="v-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="security@vendor.com"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="v-contact-other">Other (HackerOne / Bugcrowd / Phone)</Label>
                <Input
                  id="v-contact-other"
                  value={contactOther}
                  onChange={e => setContactOther(e.target.value)}
                  placeholder="HackerOne: vendor-name"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCna(!isCna)}
              className={`relative w-9 h-5 rounded-full transition-colors ${isCna ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${isCna ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <Label className="cursor-pointer" onClick={() => setIsCna(!isCna)}>
                Vendor is a CNA
              </Label>
              <p className="text-[11px] text-muted-foreground">CVE Numbering Authority, can assign CVE IDs directly</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHasBountyProgram(!hasBountyProgram)}
              className={`relative w-9 h-5 rounded-full transition-colors ${hasBountyProgram ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${hasBountyProgram ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <Label className="cursor-pointer" onClick={() => setHasBountyProgram(!hasBountyProgram)}>
                Bug Bounty Program
              </Label>
              <p className="text-[11px] text-muted-foreground">Vendor offers a bug bounty or vulnerability rewards program</p>
            </div>
          </div>
          {hasBountyProgram && (
            <div className="grid gap-1.5">
              <Label htmlFor="v-bounty-url">Bounty Program URL</Label>
              <Input
                id="v-bounty-url"
                value={bountyProgramUrl}
                onChange={e => setBountyProgramUrl(e.target.value)}
                placeholder="https://hackerone.com/vendor"
              />
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="v-url">Vendor Website</Label>
            <Input
              id="v-url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://vendor.com"
            />
            <p className="text-[11px] text-muted-foreground">Used to display the vendor's favicon on the Kanban board</p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="v-notes">Notes</Label>
            <Textarea
              id="v-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Response time expectations, preferred disclosure process, previous interactions..."
              className="min-h-[80px] text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
