import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { useBoardStore } from '../../../store/boardStore'
import type { CVEFormValues } from '../../../../../shared/schemas/cve'
import { FieldError } from './FieldError'

/**
 * Top-of-form vendor → product picker. Only used in create mode when the
 * caller didn't pre-set a swimlane. The vendor dropdown is local UI state
 * (it just filters the swimlane dropdown), but the chosen swimlane goes
 * straight into the form's `swimlane_id` field.
 */
export function VendorProductPicker() {
  const { control, setValue, formState: { errors } } = useFormContext<CVEFormValues>()
  const { vendors, swimlanes } = useBoardStore()
  const [selectedVendorId, setSelectedVendorId] = useState('')

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-1.5">
        <Label>Vendor *</Label>
        <Select
          value={selectedVendorId}
          onValueChange={(v) => {
            setSelectedVendorId(v)
            setValue('swimlane_id', '', { shouldValidate: false })
          }}
        >
          <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
          <SelectContent>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
                {v.is_cna === 1 && <span className="ml-1 text-[10px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">CNA</span>}
                {v.has_bounty_program === 1 && <span className="ml-1 text-[10px] font-bold text-green-500 bg-green-500/10 rounded px-1 py-0.5">Bounty</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>Software / Product *</Label>
        <Controller
          control={control}
          name="swimlane_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={!selectedVendorId}>
              <SelectTrigger>
                <SelectValue placeholder={selectedVendorId ? 'Select product...' : 'Select vendor first'} />
              </SelectTrigger>
              <SelectContent>
                {swimlanes
                  .filter((lane) => lane.vendor_id === selectedVendorId)
                  .map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      {lane.software_name}
                      {lane.bounty_in_scope === 1 && <span className="ml-1 text-[10px] font-bold text-green-500 bg-green-500/10 rounded px-1 py-0.5">Bounty</span>}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.swimlane_id?.message} />
      </div>
    </div>
  )
}
