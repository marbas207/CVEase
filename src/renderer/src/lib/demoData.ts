import { api } from './ipc'
import type { Stage, Severity } from '../types/cve'

export async function loadDemoData(): Promise<void> {
  // ── Vendors ──
  const acme = await api.vendor.create({
    name: 'Acme Corp',
    security_contact_name: 'Acme Security Team',
    security_contact_email: 'security@acmecorp.example',
    security_contact_other: 'HackerOne: acme-corp',
    is_cna: true,
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

  // 1. Discovery stage — just found
  await api.cve.create({
    swimlane_id: acmePortal.id,
    title: 'Stored XSS in user profile bio field',
    severity: 'High' as Severity,
    stage: 'Discovery' as Stage,
    description: '1. Navigate to /settings/profile\n2. In the "Bio" field, enter: <img src=x onerror=alert(document.cookie)>\n3. Save profile\n4. Visit any page where the bio is rendered\n5. JavaScript executes in the context of the viewing user',
    affected_component: '/settings/profile',
    affected_versions: '3.2.0 - 3.4.1',
    date_discovered: '2024-11-28'
  })

  // 2. Vendor Contacted — waiting for response
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
  // Move to Vendor Contacted
  await api.cve.move(sqlInjection.id, 'Vendor Contacted', acmeApi.id, 0)
  // Set follow-up reminder
  const followupDate = new Date()
  followupDate.setDate(followupDate.getDate() + 5)
  await api.cve.update(sqlInjection.id, {
    followup_due_date: followupDate.toISOString().slice(0, 10)
  })

  // 3. Negotiating — vendor responded
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
  await api.followup.create(idor.id, {
    type: 'Email Sent',
    note: 'Sent initial disclosure with full reproduction steps and impact analysis.'
  })
  await api.followup.create(idor.id, {
    type: 'Email Received',
    note: 'Vendor confirmed the issue. They plan to patch in their next release cycle (Q1). Proposed 90-day disclosure timeline.'
  })

  // 4. CVE Requested
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

  // 5. Published — recent, still on board (will trigger archive banner since >30 days)
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
  await api.cve.update(rce.id, { patch_status: 'patch_available', patch_url: 'https://globex.example/advisory/2024-002' })

  // ── Archived CVEs (Hall of Fame) ──

  // 6. Archived — path traversal (Acme)
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
  await api.cve.archive(pathTraversal.id)

  // 7. Archived — privilege escalation (Globex)
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
  await api.cve.archive(privEsc.id)
}
