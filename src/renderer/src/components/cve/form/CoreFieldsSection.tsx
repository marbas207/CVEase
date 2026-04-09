import { Controller, useFormContext } from 'react-hook-form'
import { ExternalLink } from 'lucide-react'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { STAGES, SEVERITIES } from '../../../lib/constants'
import type { CVEFormValues } from '../../../../../shared/schemas/cve'
import { FieldError } from './FieldError'
import { TagInput } from './TagInput'

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
  const watchedCweId = watch('cwe_id')

  // If the field already has a CWE-N pattern, link straight to that CWE's
  // MITRE page so the user can verify or look up what the number means.
  // Otherwise fall back to the searchable index.
  const cweMatch = watchedCweId?.trim().match(/^CWE-(\d+)$/i)
  const cweHref = cweMatch
    ? `https://cwe.mitre.org/data/definitions/${cweMatch[1]}.html`
    : 'https://cwe.mitre.org/data/index.html'

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

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="cve-cvss">CVSS Vector</Label>
            {/* Electron's setWindowOpenHandler in main/index.ts intercepts
                target="_blank" anchors and routes them through shell.openExternal,
                so this opens the user's default browser, not an in-app webview. */}
            <a
              href="https://www.first.org/cvss/calculator/4-0"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              title="Open the official FIRST CVSS 4.0 calculator in your browser"
            >
              Open calculator
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <Input
            id="cve-cvss"
            {...register('cvss_vector')}
            placeholder="CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N"
            className="font-mono text-xs"
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="cve-cwe">CWE</Label>
            <a
              href={cweHref}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              title={
                cweMatch
                  ? `Open ${watchedCweId} on the MITRE CWE list`
                  : 'Browse the MITRE CWE list'
              }
            >
              {cweMatch ? `Open ${watchedCweId}` : 'Browse list'}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <Input id="cve-cwe" {...register('cwe_id')} placeholder="CWE-79" className="font-mono" />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Tags</Label>
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagInput
              value={field.value}
              onChange={field.onChange}
              placeholder="Add tags like supply-chain, embargoed, 0day…"
            />
          )}
        />
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

      <div className="grid gap-1.5">
        <Label htmlFor="cve-references">References</Label>
        <Textarea
          id="cve-references"
          {...register('references_list')}
          placeholder={'One URL per line — PoC, vendor advisory, NVD, blog post, MITRE entry...'}
          className="min-h-[80px] font-mono text-xs"
        />
        <p className="text-[10px] text-muted-foreground">
          One URL per line. Rendered as a clickable list on the detail panel.
        </p>
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
