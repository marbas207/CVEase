import { useFormContext } from 'react-hook-form'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { CVEFormValues } from '../../../../../shared/schemas/cve'
import { FieldError } from './FieldError'

/**
 * CVE Requested+ section. Hidden when the CVE is flagged not-eligible.
 */
export function CveRequestedSection() {
  const { register, formState: { errors } } = useFormContext<CVEFormValues>()
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="cve-id">CVE ID</Label>
        <Input id="cve-id" {...register('cve_id')} placeholder="CVE-2024-XXXXX" className="font-mono" />
        <FieldError message={errors.cve_id?.message} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="date-cve-req">Date CVE Requested</Label>
        <Input id="date-cve-req" type="date" {...register('date_cve_requested')} />
      </div>
    </div>
  )
}
