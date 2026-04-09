import { useEffect } from 'react'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { SwimlaneFormValues, SWIMLANE_FORM_DEFAULTS } from '../../../../shared/schemas/swimlane'
import { FieldError } from '../cve/form/FieldError'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  swimlane?: Swimlane
}

function initialValues(swimlane: Swimlane | undefined): SwimlaneFormValues {
  if (!swimlane) return SWIMLANE_FORM_DEFAULTS
  return {
    software_name: swimlane.software_name,
    vendor_id: swimlane.vendor_id ?? '',
    url: swimlane.url ?? '',
    bounty_in_scope: swimlane.bounty_in_scope === 1
  }
}

export function SwimLaneForm({ open, onOpenChange, swimlane }: Props) {
  const { vendors, addSwimlane, updateSwimlane } = useBoardStore()
  const isEdit = !!swimlane

  const form = useForm<SwimlaneFormValues>({
    resolver: zodResolver(SwimlaneFormValues),
    defaultValues: initialValues(swimlane),
    mode: 'onBlur'
  })
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = form

  const watchedVendorId = watch('vendor_id')
  const watchedBountyInScope = watch('bounty_in_scope')
  const selectedVendor = vendors.find((v) => v.id === watchedVendorId)

  useEffect(() => {
    if (open) reset(initialValues(swimlane))
  }, [open, swimlane, reset])

  const onSubmit: SubmitHandler<SwimlaneFormValues> = async (values) => {
    if (!values.vendor_id) {
      form.setError('vendor_id', { message: 'Pick a vendor' })
      return
    }
    const vendor = vendors.find((v) => v.id === values.vendor_id)
    if (!vendor) {
      form.setError('vendor_id', { message: 'Vendor not found' })
      return
    }

    if (isEdit && swimlane) {
      await updateSwimlane(swimlane.id, {
        software_name: values.software_name.trim(),
        vendor: vendor.name,
        vendor_id: values.vendor_id,
        url: values.url.trim() || undefined,
        vendor_is_cna: vendor.is_cna === 1,
        bounty_in_scope: values.bounty_in_scope
      })
    } else {
      await addSwimlane({
        software_name: values.software_name.trim(),
        vendor: vendor.name,
        vendor_id: values.vendor_id,
        url: values.url.trim() || undefined,
        vendor_is_cna: vendor.is_cna === 1,
        bounty_in_scope: values.bounty_in_scope
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Software' : 'Add Software'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Vendor *</Label>
            {vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No vendors yet. Add one from Settings first.</p>
            ) : (
              <Controller
                control={control}
                name="vendor_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                          {v.is_cna === 1 && <span className="ml-1.5 text-[10px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">CNA</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            <FieldError message={errors.vendor_id?.message} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="sw-name">Software / Product Name *</Label>
            <Input id="sw-name" {...register('software_name')} placeholder="e.g. Apache HTTP Server" autoFocus />
            <FieldError message={errors.software_name?.message} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="sw-url">Product URL</Label>
            <Input id="sw-url" {...register('url')} placeholder="https://..." />
            <FieldError message={errors.url?.message} />
          </div>

          {selectedVendor?.has_bounty_program === 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setValue('bounty_in_scope', !watchedBountyInScope)}
                className={`relative w-9 h-5 rounded-full transition-colors ${watchedBountyInScope ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${watchedBountyInScope ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <div>
                <Label className="cursor-pointer" onClick={() => setValue('bounty_in_scope', !watchedBountyInScope)}>
                  In scope for bug bounty
                </Label>
                <p className="text-[11px] text-muted-foreground">This product is eligible for {selectedVendor.name}&apos;s bounty program</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
