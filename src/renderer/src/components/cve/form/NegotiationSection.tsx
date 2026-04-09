import { Controller, useFormContext } from 'react-hook-form'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import type { CVEFormValues } from '../../../../../shared/schemas/cve'
import { FieldError } from './FieldError'

/**
 * Negotiating+ section. Patch status & URL, plus the VINCE escalation
 * toggle and case-ID input.
 */
export function NegotiationSection() {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useFormContext<CVEFormValues>()

  const watchedEscalated = watch('escalated_to_vince')

  return (
    <>
      <div>
        <p className="text-sm font-semibold mb-3">Patch Status</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Controller
              control={control}
              name="patch_status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="no_patch">No Patch Available</SelectItem>
                    <SelectItem value="patch_available">Patch Available</SelectItem>
                    <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="patch-url">Patch / Advisory URL</Label>
            <Input id="patch-url" {...register('patch_url')} placeholder="https://..." />
            <FieldError message={errors.patch_url?.message} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-3">Escalation</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setValue('escalated_to_vince', !watchedEscalated)}
            className={`relative w-9 h-5 rounded-full transition-colors ${watchedEscalated ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${watchedEscalated ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <Label className="cursor-pointer" onClick={() => setValue('escalated_to_vince', !watchedEscalated)}>
            Escalated to VINCE (CERT/CC)
          </Label>
        </div>
        {watchedEscalated && (
          <div className="grid gap-1.5 mt-3">
            <Label htmlFor="vince-case">VINCE Case ID</Label>
            <Input id="vince-case" {...register('vince_case_id')} placeholder="VU#298437" className="font-mono" />
          </div>
        )}
      </div>
    </>
  )
}
