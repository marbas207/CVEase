import { api } from './ipc'
import type { Stage, Severity, Todo } from '../types/cve'

// Helper: complete a todo by matching partial text
async function completeTodo(todos: Todo[], match: string, note: string): Promise<void> {
  const todo = todos.find(t => t.text.toLowerCase().includes(match.toLowerCase()) && !t.completed)
  if (todo) await api.todo.complete(todo.id, { completion_note: note })
}

export async function loadDemoData(): Promise<void> {
  // ── Vendors ──
  const acme = await api.vendor.create({
    name: 'Acme Corp',
    security_contact_name: 'Acme Security Team',
    security_contact_email: 'security@acmecorp.example',
    security_contact_other: 'HackerOne: acme-corp',
    is_cna: true,
    has_bounty_program: true,
    bounty_program_url: 'https://hackerone.com/acme-corp',
    url: 'https://acmecorp.com',
    notes: 'Generally responsive within 48 hours. Prefers PGP-encrypted emails.'
  })

  const globex = await api.vendor.create({
    name: 'Globex Industries',
    security_contact_name: 'Hank Scorpio',
    security_contact_email: 'hank@globex.example',
    is_cna: false,
    url: 'https://globex.com',
    notes: 'Small team, may take a while to respond. No formal bug bounty program.'
  })

  // ── Software / Products ──
  const acmePortal = await api.swimlane.create({
    software_name: 'Acme Customer Portal',
    vendor: acme.name,
    vendor_id: acme.id
  })

  const acmeApi = await api.swimlane.create({
    software_name: 'Acme REST API',
    vendor: acme.name,
    vendor_id: acme.id
  })

  const globexERP = await api.swimlane.create({
    software_name: 'Globex ERP Suite',
    vendor: globex.name,
    vendor_id: globex.id
  })

  // ── CVEs ──

  // 1. Discovery stage: just found, early checklist items done
  const xss = await api.cve.create({
    swimlane_id: acmePortal.id,
    title: 'Stored XSS in user profile bio field',
    severity: 'High' as Severity,
    stage: 'Discovery' as Stage,
    description: '1. Navigate to /settings/profile\n2. In the "Bio" field, enter: <img src=x onerror=alert(document.cookie)>\n3. Save profile\n4. Visit any page where the bio is rendered\n5. JavaScript executes in the context of the viewing user',
    affected_component: '/settings/profile',
    affected_versions: '3.2.0 - 3.4.1',
    date_discovered: '2024-11-28'
  })
  const xssTodos = await api.todo.list(xss.id)
  await completeTodo(xssTodos, 'Reproduce & document', 'Confirmed on Chrome and Firefox. Cookie exfiltration verified.')
  await completeTodo(xssTodos, 'CVSS severity', 'CVSS 3.1 Base: 8.1 (High). Stored XSS with session hijack potential.')
  await completeTodo(xssTodos, 'affected versions', 'Tested 3.2.0, 3.3.0, 3.4.1. All vulnerable. 3.1.x not affected.')

  // 2. Vendor Contacted: disclosure sent, waiting for response
  const sqlInjection = await api.cve.create({
    swimlane_id: acmeApi.id,
    title: 'SQL Injection in /api/v2/users search endpoint',
    severity: 'Critical' as Severity,
    stage: 'Discovery' as Stage,
    description: '1. Send GET request to /api/v2/users?search=test\' OR 1=1--\n2. Response returns all user records\n3. UNION-based extraction confirmed: /api/v2/users?search=test\' UNION SELECT username,password FROM admin--',
    vendor_contact_name: 'Acme Security Team',
    vendor_contact_email: 'security@acmecorp.example',
    affected_component: '/api/v2/users',
    affected_versions: '2.0.0+',
    date_discovered: '2024-11-15',
    date_vendor_notified: '2024-11-18'
  })
  await api.cve.move(sqlInjection.id, 'Vendor Contacted', acmeApi.id, 0)
  const followupDate = new Date()
  followupDate.setDate(followupDate.getDate() + 5)
  await api.cve.update(sqlInjection.id, {
    followup_due_date: followupDate.toISOString().slice(0, 10)
  })
  const sqliTodos = await api.todo.list(sqlInjection.id)
  await completeTodo(sqliTodos, 'Reproduce & document', 'Full SQLi confirmed. UNION-based extraction of admin credentials possible.')
  await completeTodo(sqliTodos, 'CVSS severity', 'CVSS 3.1 Base: 9.8 (Critical). Unauthenticated, full DB access.')
  await completeTodo(sqliTodos, 'affected versions', 'All v2.x endpoints affected. v1.x uses different ORM, not vulnerable.')
  await completeTodo(sqliTodos, 'Draft initial disclosure', 'Drafted email with PoC, impact analysis, and suggested remediation (parameterized queries).')
  await completeTodo(sqliTodos, 'Send disclosure', 'Sent to security@acmecorp.example on Nov 18. PGP encrypted per their preference.')
  await api.followup.create(sqlInjection.id, {
    type: 'Email Sent',
    note: 'Sent initial disclosure with PoC and impact analysis. Included suggested fix (parameterized queries).'
  })

  // 3. Negotiating: vendor responded, working on timeline
  const idor = await api.cve.create({
    swimlane_id: acmePortal.id,
    title: 'IDOR allows accessing other users\' invoices',
    severity: 'High' as Severity,
    stage: 'Discovery' as Stage,
    description: '1. Login as user A\n2. Navigate to /invoices/12345\n3. Change ID to /invoices/12346 (belongs to user B)\n4. Invoice data for user B is returned\n\nNo authorization check on the invoice endpoint.',
    vendor_contact_name: 'Acme Security Team',
    vendor_contact_email: 'security@acmecorp.example',
    affected_component: '/invoices/:id',
    affected_versions: '3.0.0+',
    date_discovered: '2024-10-20',
    date_vendor_notified: '2024-10-25'
  })
  await api.cve.move(idor.id, 'Vendor Contacted', acmePortal.id, 0)
  await api.cve.move(idor.id, 'Negotiating', acmePortal.id, 0)
  const idorTodos = await api.todo.list(idor.id)
  await completeTodo(idorTodos, 'Reproduce & document', 'Confirmed across multiple account pairs. All invoice endpoints affected.')
  await completeTodo(idorTodos, 'CVSS severity', 'CVSS 3.1 Base: 7.5 (High). Any authenticated user can access any invoice.')
  await completeTodo(idorTodos, 'affected versions', 'All v3.x versions. Authorization was removed during v3.0 refactor.')
  await completeTodo(idorTodos, 'Draft initial disclosure', 'Drafted with full PoC showing cross-account access to PII.')
  await completeTodo(idorTodos, 'Send disclosure', 'Sent via HackerOne on Oct 25.')
  await completeTodo(idorTodos, 'Confirm vendor', 'Vendor acknowledged via HackerOne on Oct 28.')
  await completeTodo(idorTodos, 'Agree on disclosure', 'Agreed on 90-day timeline. Vendor targeting Q1 patch release.')
  // Intentionally no followup_due_date set on this one, so it shows in "No Follow-up Set" on the dashboard
  await api.followup.create(idor.id, {
    type: 'Email Sent',
    note: 'Sent initial disclosure with full reproduction steps and impact analysis.'
  })
  await api.followup.create(idor.id, {
    type: 'Email Received',
    note: 'Vendor confirmed the issue. They plan to patch in their next release cycle (Q1). Proposed 90-day disclosure timeline.'
  })
  await api.cve.update(idor.id, { bounty_eligible: 1, bounty_status: 'submitted', bounty_url: 'https://hackerone.com/acme-corp/reports/12345' })
  await api.followup.create(idor.id, {
    type: 'Meeting',
    note: 'Had a call with their engineering lead. They understand the severity and are prioritizing the fix.'
  })

  // 4. CVE Requested: deep into the process
  const authBypass = await api.cve.create({
    swimlane_id: globexERP.id,
    title: 'Authentication bypass via crafted JWT token',
    severity: 'Critical' as Severity,
    stage: 'Discovery' as Stage,
    description: '1. Capture a valid JWT from /auth/login\n2. Modify the "alg" header to "none"\n3. Remove the signature\n4. Send the modified token in Authorization header\n5. Server accepts the token and grants admin access',
    vendor_contact_name: 'Hank Scorpio',
    vendor_contact_email: 'hank@globex.example',
    affected_component: 'Authentication middleware',
    affected_versions: '< 5.0',
    date_discovered: '2024-09-10',
    date_vendor_notified: '2024-09-15',
    date_cve_requested: '2024-10-01'
  })
  await api.cve.move(authBypass.id, 'Vendor Contacted', globexERP.id, 0)
  await api.cve.move(authBypass.id, 'Negotiating', globexERP.id, 0)
  await api.cve.move(authBypass.id, 'CVE Requested', globexERP.id, 0)
  await api.cve.update(authBypass.id, { patch_status: 'patch_available', patch_url: 'https://globex.example/advisory/2024-001' })
  const cveFuDate = new Date()
  cveFuDate.setDate(cveFuDate.getDate() + 10)
  await api.cve.update(authBypass.id, { followup_due_date: cveFuDate.toISOString().slice(0, 10) })
  const authTodos = await api.todo.list(authBypass.id)
  await completeTodo(authTodos, 'Reproduce & document', 'Reproduced with curl. Works on all endpoints. Full admin access achieved.')
  await completeTodo(authTodos, 'CVSS severity', 'CVSS 3.1 Base: 9.8 (Critical). Complete authentication bypass.')
  await completeTodo(authTodos, 'affected versions', 'All versions prior to 5.0. The JWT library upgrade in 5.0 rejects alg:none.')
  await completeTodo(authTodos, 'Draft initial disclosure', 'Drafted with PoC script that generates a valid admin token.')
  await completeTodo(authTodos, 'Send disclosure', 'Sent to hank@globex.example on Sep 15.')
  await completeTodo(authTodos, 'Confirm vendor', 'Hank confirmed on Sep 18. Said he was "horrified but grateful."')
  await completeTodo(authTodos, 'Agree on disclosure', 'Agreed on 90-day timeline. Patch released in v5.0.1 on Oct 20.')
  await completeTodo(authTodos, 'Request CVE', 'Submitted to MITRE on Oct 1. Vendor is not a CNA.')
  await api.followup.create(authBypass.id, {
    type: 'Email Sent',
    note: 'Initial disclosure with PoC and impact assessment.'
  })
  await api.followup.create(authBypass.id, {
    type: 'Email Received',
    note: 'Hank confirmed the issue. Patch being developed for v5.0.1.'
  })
  await api.followup.create(authBypass.id, {
    type: 'Note',
    note: 'Patch released in v5.0.1. Verified the fix works. Waiting on CVE assignment from MITRE.'
  })

  // 5. Published: complete lifecycle, all todos done
  const rce = await api.cve.create({
    swimlane_id: globexERP.id,
    title: 'Remote code execution via file upload',
    severity: 'Critical' as Severity,
    stage: 'Discovery' as Stage,
    cve_id: 'CVE-2024-55123',
    description: '1. Navigate to /admin/import\n2. Upload a .jsp file renamed to .xlsx\n3. Server executes the JSP payload\n4. Full RCE achieved with application service account privileges',
    vendor_contact_name: 'Hank Scorpio',
    vendor_contact_email: 'hank@globex.example',
    affected_component: '/admin/import',
    affected_versions: '4.2.0 - 4.9.x',
    date_discovered: '2024-07-01',
    date_vendor_notified: '2024-07-05',
    date_cve_requested: '2024-08-01',
    date_disclosed: '2024-10-03'
  })
  await api.cve.move(rce.id, 'Vendor Contacted', globexERP.id, 0)
  await api.cve.move(rce.id, 'Negotiating', globexERP.id, 0)
  await api.cve.move(rce.id, 'CVE Requested', globexERP.id, 0)
  await api.cve.move(rce.id, 'Published', globexERP.id, 0)
  await api.cve.update(rce.id, { patch_status: 'patch_available', patch_url: 'https://globex.example/advisory/2024-002', bounty_eligible: 1, bounty_status: 'paid', bounty_amount: '$2,500', bounty_paid_date: '2024-10-15' })
  const rceTodos = await api.todo.list(rce.id)
  await completeTodo(rceTodos, 'Reproduce & document', 'Full RCE confirmed. Wrote exploit script for verification.')
  await completeTodo(rceTodos, 'CVSS severity', 'CVSS 3.1 Base: 9.8 (Critical). Unauthenticated RCE as service account.')
  await completeTodo(rceTodos, 'affected versions', 'Versions 4.2.0 through 4.9.x. Fixed in 5.0.0.')
  await completeTodo(rceTodos, 'Draft initial disclosure', 'Full writeup with timeline, PoC, and vendor coordination notes.')
  await completeTodo(rceTodos, 'Send disclosure', 'Sent to Hank on Jul 5 with PGP encryption.')
  await completeTodo(rceTodos, 'Confirm vendor', 'Hank confirmed Jul 7. Escalated internally as P0.')
  await completeTodo(rceTodos, 'Agree on disclosure', '90-day timeline agreed. Vendor fast-tracked the fix.')
  await completeTodo(rceTodos, 'Request CVE', 'Submitted to MITRE Aug 1. Assigned CVE-2024-55123 on Aug 15.')
  await completeTodo(rceTodos, 'Coordinate and finalize', 'Coordinated advisory with Globex. Published simultaneously.')
  await completeTodo(rceTodos, 'Publish vulnerability', 'Published Oct 3. Advisory live at globex.example/advisory/2024-002.')
  await api.followup.create(rce.id, { type: 'Email Sent', note: 'Initial disclosure with full PoC.' })
  await api.followup.create(rce.id, { type: 'Email Received', note: 'Vendor confirmed. Treating as P0.' })
  await api.followup.create(rce.id, { type: 'Phone Call', note: 'Call with Hank to discuss timeline. Agreed on 90-day window.' })
  await api.followup.create(rce.id, { type: 'Email Received', note: 'Patch released in v5.0.0. Asked us to verify.' })
  await api.followup.create(rce.id, { type: 'Note', note: 'Verified fix. Upload now validates file type server-side.' })
  await api.followup.create(rce.id, { type: 'Note', note: 'CVE-2024-55123 assigned. Published advisory and blog post.' })

  // ── Archived CVEs (Hall of Fame) ──

  // 6. Archived: path traversal (all todos done)
  const pathTraversal = await api.cve.create({
    swimlane_id: acmeApi.id,
    title: 'Path traversal in file download endpoint',
    severity: 'High' as Severity,
    stage: 'Discovery' as Stage,
    cve_id: 'CVE-2024-41002',
    description: '1. Send GET /api/v2/files/download?path=../../etc/passwd\n2. Server returns contents of /etc/passwd\n3. Any file readable by the app service account can be exfiltrated',
    vendor_contact_name: 'Acme Security Team',
    vendor_contact_email: 'security@acmecorp.example',
    affected_component: '/api/v2/files/download',
    affected_versions: '2.1.0 - 2.3.4',
    date_discovered: '2024-03-10',
    date_vendor_notified: '2024-03-15',
    date_cve_requested: '2024-04-20',
    date_disclosed: '2024-06-15'
  })
  await api.cve.move(pathTraversal.id, 'Vendor Contacted', acmeApi.id, 0)
  await api.cve.move(pathTraversal.id, 'Negotiating', acmeApi.id, 0)
  await api.cve.move(pathTraversal.id, 'CVE Requested', acmeApi.id, 0)
  await api.cve.move(pathTraversal.id, 'Published', acmeApi.id, 0)
  await api.cve.update(pathTraversal.id, { patch_status: 'patch_available' })
  const ptTodos = await api.todo.list(pathTraversal.id)
  for (const t of ptTodos) {
    await api.todo.complete(t.id, { completion_note: 'Completed during disclosure process.' })
  }
  await api.cve.archive(pathTraversal.id)

  // 7. Archived: privilege escalation (all todos done)
  const privEsc = await api.cve.create({
    swimlane_id: globexERP.id,
    title: 'Privilege escalation via role parameter tampering',
    severity: 'Critical' as Severity,
    stage: 'Discovery' as Stage,
    cve_id: 'CVE-2024-38901',
    description: '1. Create a regular user account\n2. Intercept the POST /api/users/update request\n3. Add "role": "admin" to the JSON body\n4. Server accepts the change, user is now admin',
    vendor_contact_name: 'Hank Scorpio',
    vendor_contact_email: 'hank@globex.example',
    affected_component: '/api/users/update',
    affected_versions: '3.0 - 4.8',
    date_discovered: '2024-01-05',
    date_vendor_notified: '2024-01-10',
    date_cve_requested: '2024-02-15',
    date_disclosed: '2024-04-10'
  })
  await api.cve.move(privEsc.id, 'Vendor Contacted', globexERP.id, 0)
  await api.cve.move(privEsc.id, 'Negotiating', globexERP.id, 0)
  await api.cve.move(privEsc.id, 'CVE Requested', globexERP.id, 0)
  await api.cve.move(privEsc.id, 'Published', globexERP.id, 0)
  await api.cve.update(privEsc.id, { patch_status: 'patch_available', patch_url: 'https://globex.example/advisory/2024-003' })
  const peTodos = await api.todo.list(privEsc.id)
  for (const t of peTodos) {
    await api.todo.complete(t.id, { completion_note: 'Completed during disclosure process.' })
  }
  await api.cve.archive(privEsc.id)
}
