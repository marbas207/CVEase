import { useFormContext } from 'react-hook-form'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { calcDeadline } from '../../../lib/utils'
import type { CVEFormValues } from '../../../../../shared/schemas/cve'
import { FieldError } from './FieldError'

/**
 * Vendor Contacted+ section. Contact info, vendor-notified date, the
 * auto-90-day disclosure deadline, and bounty eligibility selector.
 */
export function VendorContactSection() {
  const {
    register,
    setValue,
    watch,
    formState: { errors }
  } = useFormContext<CVEFormValues>()

  const watchedNotified = watch('date_vendor_notified')
  const watchedDeadline = watch('disclosure_deadline')
  const watchedBountyEligible = watch('bounty_eligible')

  const autoDeadline = calcDeadline(watchedNotified)
  const effectiveDeadline = watchedDeadline || autoDeadline || ''

  return (
    <>
      <div>
        <p className="text-sm font-semibold mb-3">Vendor Contact</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="contact-name">Name</Label>
            <Input id="contact-name" {...register('vendor_contact_name')} placeholder="Security Team" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              {...register('vendor_contact_email')}
              placeholder="security@vendor.com"
            />
            <FieldError message={errors.vendor_contact_email?.message} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="date-notified">Date Vendor Notified</Label>
          <Input id="date-notified" type="date" {...register('date_vendor_notified')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="date-deadline">Disclosure Deadline</Label>
          <Input
            id="date-deadline"
            type="date"
            value={effectiveDeadline}
            onChange={(e) => setValue('disclosure_deadline', e.target.value)}
          />
          {!watchedDeadline && autoDeadline && (
            <p className="text-[11px] text-muted-foreground">Auto-set to 90 days from notification</p>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Bounty Eligible</Label>
        <Select
          value={String(watchedBountyEligible)}
          onValueChange={(v) => setValue('bounty_eligible', v === 'null' ? null : Number(v))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Unknown</SelectItem>
            <SelectItem value="1">Yes</SelectItem>
            <SelectItem value="0">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
