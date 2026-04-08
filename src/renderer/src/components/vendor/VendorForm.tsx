import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { VendorFormValues, VENDOR_FORM_DEFAULTS } from '../../../../shared/schemas/vendor'
import { FieldError } from '../cve/form/FieldError'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor
}

function initialValues(vendor: Vendor | undefined): VendorFormValues {
  if (!vendor) return VENDOR_FORM_DEFAULTS
  return {
    name: vendor.name,
    security_contact_name: vendor.security_contact_name ?? '',
    security_contact_email: vendor.security_contact_email ?? '',
    security_contact_other: vendor.security_contact_other ?? '',
    is_cna: vendor.is_cna === 1,
    has_bounty_program: vendor.has_bounty_program === 1,
    bounty_program_url: vendor.bounty_program_url ?? '',
    url: vendor.url ?? '',
    notes: vendor.notes ?? ''
  }
}

export function VendorForm({ open, onOpenChange, vendor }: Props) {
  const { addVendor, updateVendor } = useBoardStore()
  const isEdit = !!vendor

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(VendorFormValues),
    defaultValues: initialValues(vendor),
    mode: 'onBlur'
  })
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = form

  const watchedIsCna = watch('is_cna')
  const watchedHasBounty = watch('has_bounty_program')

  useEffect(() => {
    if (open) reset(initialValues(vendor))
  }, [open, vendor, reset])

  const onSubmit: SubmitHandler<VendorFormValues> = async (values) => {
    if (isEdit && vendor) {
      await updateVendor(vendor.id, {
        name: values.name.trim(),
        security_contact_name: values.security_contact_name.trim() || null,
        security_contact_email: values.security_contact_email.trim() || null,
        security_contact_other: values.security_contact_other.trim() || null,
        is_cna: values.is_cna,
        has_bounty_program: values.has_bounty_program,
        bounty_program_url: values.bounty_program_url.trim() || null,
        url: values.url.trim() || null,
        notes: values.notes.trim() || null
      })
    } else {
      await addVendor({
        name: values.name.trim(),
        security_contact_name: values.security_contact_name.trim() || undefined,
        security_contact_email: values.security_contact_email.trim() || undefined,
        security_contact_other: values.security_contact_other.trim() || undefined,
        is_cna: values.is_cna,
        has_bounty_program: values.has_bounty_program,
        bounty_program_url: values.bounty_program_url.trim() || undefined,
        url: values.url.trim() || undefined,
        notes: values.notes.trim() || undefined
      })
    }
    onOpenChange(false)
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

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="v-name">Vendor / Organization Name *</Label>
            <Input id="v-name" {...register('name')} placeholder="e.g. Apache Software Foundation" autoFocus />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Security Contact</p>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="v-contact-name">Contact Name / Team</Label>
                <Input id="v-contact-name" {...register('security_contact_name')} placeholder="e.g. Security Response Team" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="v-contact-email">Email</Label>
                <Input id="v-contact-email" type="email" {...register('security_contact_email')} placeholder="security@vendor.com" />
                <FieldError message={errors.security_contact_email?.message} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setValue('is_cna', !watchedIsCna)}
              className={`relative w-9 h-5 rounded-full transition-colors ${watchedIsCna ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${watchedIsCna ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <Label className="cursor-pointer" onClick={() => setValue('is_cna', !watchedIsCna)}>
                Vendor is a CNA
              </Label>
              <p className="text-[11px] text-muted-foreground">CVE Numbering Authority, can assign CVE IDs directly</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setValue('has_bounty_program', !watchedHasBounty)}
              className={`relative w-9 h-5 rounded-full transition-colors ${watchedHasBounty ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${watchedHasBounty ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <div>
              <Label className="cursor-pointer" onClick={() => setValue('has_bounty_program', !watchedHasBounty)}>
                Bug Bounty Program
              </Label>
              <p className="text-[11px] text-muted-foreground">Vendor offers a bug bounty or vulnerability rewards program</p>
            </div>
          </div>
          {watchedHasBounty && (
            <div className="grid gap-1.5">
              <Label htmlFor="v-bounty-url">Bounty Program URL</Label>
              <Input id="v-bounty-url" {...register('bounty_program_url')} placeholder="https://hackerone.com/vendor" />
              <FieldError message={errors.bounty_program_url?.message} />
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="v-url">Vendor Website</Label>
            <Input id="v-url" {...register('url')} placeholder="https://vendor.com" />
            <FieldError message={errors.url?.message} />
            <p className="text-[11px] text-muted-foreground">Used to display the vendor&apos;s favicon on the Kanban board</p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="v-notes">Notes</Label>
            <Textarea
              id="v-notes"
              {...register('notes')}
              placeholder="Response time expectations, preferred disclosure process, previous interactions..."
              className="min-h-[80px] text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
