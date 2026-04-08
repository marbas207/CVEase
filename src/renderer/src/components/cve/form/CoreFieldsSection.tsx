import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { STAGES, SEVERITIES } from '../../../lib/constants'
import type { CVEFormValues } from '../../../../../shared/schemas/cve'
import { FieldError } from './FieldError'

/**
 * Always-visible core fields: title, severity (and stage in edit mode),
 * affected component/versions, description, date discovered, CVE eligible.
 */
export function CoreFieldsSection({ isEdit }: { isEdit: boolean }) {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useFormContext<CVEFormValues>()

  const watchedCveEligible = watch('cve_eligible')

  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="cve-title">Title / Short Description *</Label>
        <Input
          id="cve-title"
          {...register('title')}
          placeholder="e.g. Remote Code Execution via unsanitized path"
          autoFocus
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label>Severity *</Label>
          <Controller
            control={control}
            name="severity"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.severity?.message} />
        </div>
        {isEdit && (
          <div className="grid gap-1.5">
            <Label>Stage</Label>
            <Controller
              control={control}
              name="stage"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="cve-component">Affected Component / Location</Label>
          <Input id="cve-component" {...register('affected_component')} placeholder="e.g. Login page, /api/v1/admin" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cve-versions">Affected Versions</Label>
          <Input id="cve-versions" {...register('affected_versions')} placeholder="e.g. 2.0-2.4, < 3.1.2, all" className="font-mono" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="cve-desc">Reproduction Steps / Description</Label>
        <Textarea
          id="cve-desc"
          {...register('description')}
          placeholder="Detailed steps to reproduce the vulnerability, impact analysis..."
          className="min-h-[100px] font-mono text-xs"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="date-discovered">Date Discovered</Label>
          <Input id="date-discovered" type="date" {...register('date_discovered')} />
        </div>
        <div className="grid gap-1.5">
          <Label>CVE Eligible</Label>
          <Select
            value={String(watchedCveEligible)}
            onValueChange={(v) => setValue('cve_eligible', v === 'null' ? null : Number(v))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yes</SelectItem>
              <SelectItem value="0">No (bounty only)</SelectItem>
              <SelectItem value="null">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}
