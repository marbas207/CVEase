import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import type { CVEFormValues } from '../../../../../shared/schemas/cve'
import { FieldError } from './FieldError'

/**
 * Published+ section. Disclosure date is always shown; the bounty outcome
 * sub-block is gated on bounty_eligible === 1.
 */
export function PublishedSection() {
  const {
    register,
    control,
    watch,
    formState: { errors }
  } = useFormContext<CVEFormValues>()

  const watchedBountyEligible = watch('bounty_eligible')
  const watchedBountyStatus = watch('bounty_status')

  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="date-disclosed">Date Publicly Disclosed</Label>
        <Input id="date-disclosed" type="date" {...register('date_disclosed')} />
      </div>

      {watchedBountyEligible === 1 && (
        <div>
          <p className="text-sm font-semibold mb-3">Bounty Outcome</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="bounty_status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bounty-amount">Amount</Label>
              <Input id="bounty-amount" {...register('bounty_amount')} placeholder="$500 USD" />
            </div>
          </div>
          {(watchedBountyStatus === 'paid' || watchedBountyStatus === 'approved') && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="grid gap-1.5">
                <Label htmlFor="bounty-paid-date">Date Paid</Label>
                <Input id="bounty-paid-date" type="date" {...register('bounty_paid_date')} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bounty-url">Report URL</Label>
                <Input id="bounty-url" {...register('bounty_url')} placeholder="https://..." />
                <FieldError message={errors.bounty_url?.message} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
