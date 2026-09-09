## **0\. Application**

A hosted-in-Louisiana, FERPA/GLBA/WCAG-compliant web platform that runs the federal FAFSA verification process end-to-end for the client college: ingest ISIRs, generate per-student task lists per current FAFSA Simplification rules, collect documents and signatures, let financial aid staff review/approve/escalate cases, push corrections and verification outcomes back to Banner and the FAFSA Partner Portal, and produce audit-ready records for Title IV program review.

**Proposal pitch:**

A modern, accessibility-first verification platform built specifically for Louisiana community colleges — native Banner integration, automated V1/V4/V5 task generation aligned with current ED rules, real-time operational dashboards, and operated exclusively by NASFAA-credentialed Interon employees.

**Competitive frame against the incumbent vendor:**

| the incumbent vendor | Our platform |
| ----- | ----- |
| National generic UX | LA-specific; surfaces GO Grant / TOPS / Pell impact per case |
| Closed nonprofit ops | Direct W2 team, named NASFAA-credentialed processors |
| Per-cycle pricing | Bundled w/ Interon services contract |
| Limited Banner write-back depth | Native RRRAREQ tracking \+ ROAINST/RHACOMM writes |
| Generic identity flows | NIST IAL2 via Persona/Stripe Identity \+ in-house video review |
| Limited audit drill-down | Per-action immutable audit log, exportable for program review |

---

## **1\. Domain primer — read once, internalize**

**Do not skip.** Every miss here \= real time later.

### **1.1 What verification is**

The FAFSA Processing System (FPS, formerly CPS) selects a subset of FAFSAs for verification. Schools cannot disburse Title IV aid until verification completes. The school is on the hook for compliance — we are an operations layer the school answers for.

### **1.2 The three live tracking groups (2025-26 & 2026-27)**

| Group | Verifies | Notes |
| ----- | ----- | ----- |
| **V1**Standard | AGI, income from work, U.S. tax paid, untaxed IRA/pension portions, IRA deductions, tax-exempt interest, education credits, foreign income, family size | If FA-DDX populated income from IRS → tax items skip. Family size still verifies. |
| **V4**Custom Identity | Identity only | SEP **no longer required** (effective 2025-26 per APP-25-16 / GEN-24-10 update). |
| **V5**Aggregate | V1 \+ identity | Combined flow. |

V2, V3, V6 are reserved by ED — never generate cases for them.

### **1.3 FA-DDX is the \#1 logic gotcha**

The FUTURE Act Direct Data Exchange pulls IRS tax data into the FAFSA when contributors consent. **If the ISIR shows FA-DDX populated income fields, those fields are already verified — schools must NOT request additional tax documents.** Rules engine MUST check FA-DDX flags per contributor (student, student spouse, parent, parent spouse) before generating V1 tasks. Build this as the first rule.

### **1.4 Identity verification — pick one per case**

1. **In-person:** unexpired government photo ID, staff signs attestation  
2. **Video call:** institutional staff sees student \+ ID held to camera, screen recording retained  
3. **NIST IAL2 third party:** Persona / ID.me / Stripe Identity / Plaid Identity returns verified  
4. **Incarcerated:** facility official attestation

The Statement of Educational Purpose is **gone** for 2025-26 and forward. Do not collect it. Do not include it in templates.

### **1.5 V4/V5 outcome reporting — mandatory**

Schools must report V4/V5 outcomes to the FAFSA Partner Portal (FPP) starting 2025-26. Codes:

| Code | Meaning |
| ----- | ----- |
| 1 | Verified in person, no issues |
| 2 | Verified remotely, no issues |
| 3 | Attempted, identity issues found |
| 5 | No show |
| 4, 6 | Reserved |

Platform must (a) store the outcome on the case and (b) produce an FPP-compatible batch file for the aid office to upload (or eventually push via API when ED exposes one).

### **1.6 ISIR pipeline — where data comes from**

studentaid.gov FAFSA submit  
   │  
   ▼  
FAFSA Processing System (FPS)    ← selects \~15-20% for verification, sets V1/V4/V5 flag  
   │  
   ▼  
School SAIG mailbox (TG number)  ← Student Aid Internet Gateway, fixed-width ISIR files  
   │  
   ▼  
EDconnect (TDClient)             ← desktop client, pulls daily  
   │  
   ▼  
Banner dataload                  ← RCBTPxx → RCRAPP1-4, RNANAxx, RNARSxx  
   │  
   ▼  
\[OUR PLATFORM\]                   ← reads from Banner via SFTP/CSV or direct DB,  
                                   creates verification cases, runs rules engine  
   │  
   ▼  
Corrections \+ verification outcomes back to Banner \+ FPP

**MVP scope:** we read ISIRs that Banner has already ingested. SAIG/EDconnect-direct integration is Phase 3\.

### **1.7 Louisiana state aid coupling (matters operationally)**

| Program | Driver | Verification dependency |
| ----- | ----- | ----- |
| **TOPS** | Merit (LOSFA) | Indirect — paid via LOSFA Master Roster |
| **GO Grant** | Need-based, **requires Pell** | **Direct — stuck verification \= stuck Pell \= stuck GO Grant** |
| **MJ Foster Promise** | Workforce credentials, age 20+ | Indirect \+ separate app |
| **Chafee ETV** | Foster youth | Indirect |

**Dashboard implication:** sort the admin queue by "GO Grant–eligible \+ stuck verification" as the highest priority bucket. This is a direct LA-specific differentiator vs. the incumbent vendor's generic UX.

### **1.8 Banner financial aid tables (Example College System schema: `FAISMGR`, Oracle)**

| Object | Purpose |
| ----- | ----- |
| `RCBTPxx` / `RCPTPxx` / `RCPCTxx` | Temp ISIR dataload tables (Pt 1\) |
| `RCRAPP1-4` | Current ISIR applicant records (Pt 3\) |
| `RNANAxx` (RNANA25, RNANA26) | Need analysis fields, per aid year |
| `RNARSxx` | Need analysis results (SAI — replaces EFC) |
| `RRRAREQ` | **Applicant requirements / verification status — write target** |
| `RHACOMM` | Comment log — write target |
| `ROAINST` | Institution FA options per aid year |
| `RNRTRAN` | Need analysis transactions |
| `RCPMTCH` | Common matching algorithm process |

Read pattern via SFTP CSV export from Banner (nightly). Write pattern via batch SFTP drop that Example College System Banner job ingests. Direct Oracle access is possible but politically harder — start with file-based integration.

### **1.9 Title IV verification deadline**

Federal deadline for 2025-26: **September 19, 2026**, or 120 days after last day of enrollment, whichever is earlier. 2026-27 expected mid-September 2027\. Surface deadline countdown on every case.

---

## **2\. Personas & roles**

| Role | Scope | Auth |
| ----- | ----- | ----- |
| **Student** | Own case only | Email/phone \+ MFA |
| **Parent / contributor** | Linked-only sections of dependent student case | Email/phone \+ MFA, invite link |
| **Verification Processor** | Assigned queue \+ read-all | SSO (SAML) \+ MFA |
| **Senior Reviewer / QA** | All cases, approval rights | SSO \+ MFA |
| **Aid Office Admin** | Full institutional view, config, reporting | SSO \+ MFA |
| **Compliance Auditor** | Read-only across everything, audit log | SSO \+ MFA |
| **System / Service** | API \+ integrations | OAuth client creds |
| **Interon Ops Lead** | Cross-institutional, ops metrics | SSO \+ MFA |

RBAC enforced at the API layer with row-level security. Every cross-role action writes an audit row.

---

## **3\. Data model (Postgres)**

Names use snake\_case. All tables include: `id (uuid)`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` (soft delete). All PII columns encrypted at rest via column-level KMS or pgsodium.

### **3.1 Core entities**

institutions  
  \- opeid, ipeds\_id, name, banner\_school\_code, fpp\_school\_code, address, ...  
  \- timezone (default America/Chicago for LA)

aid\_years  
  \- code (e.g., "2526", "2627"), starts\_on, ends\_on, federal\_deadline,  
    isir\_layout\_version, is\_active

students  
  \- institution\_id, banner\_pidm, student\_id (external), ssn\_encrypted,  
    first\_name, middle\_name, last\_name, dob\_encrypted,  
    email, phone, preferred\_language, address, ...  
  \- dependency\_status, is\_incarcerated, citizenship\_status

contributors                  \-- post FAFSA Simplification: student, student spouse, parent, parent spouse  
  \- student\_id, role (enum: student | student\_spouse | parent\_1 | parent\_2 | parent\_spouse)  
  \- first\_name, last\_name, ssn\_encrypted, dob\_encrypted,  
    email, phone, fa\_ddx\_consent, fa\_ddx\_received,  
    fafsa\_signed\_at

isirs                          \-- raw \+ parsed FAFSA submission per transaction  
  \- student\_id, aid\_year\_id, transaction\_number, drn, ssn\_match\_flag,  
    sai (int, replaces EFC), pell\_eligible, max\_pell\_indicator, min\_pell\_indicator,  
    verification\_tracking\_flag (Y/N), verification\_tracking\_group (V1|V4|V5|null),  
    is\_current, raw\_payload (jsonb), parsed\_fields (jsonb),  
    received\_at, source (banner\_sftp | saig | manual)

verification\_cases  
  \- student\_id, aid\_year\_id, current\_isir\_id,  
    tracking\_group (V1|V4|V5),  
    status (enum, see §3.2),  
    assigned\_processor\_id, priority\_score (computed),  
    selection\_source (federal | school\_selected),  
    federal\_deadline, institutional\_deadline,  
    go\_grant\_flagged (bool), pell\_eligible (bool),  
    opened\_at, completed\_at, sla\_breach\_at

tasks                          \-- atomic actions student/parent/staff must do  
  \- case\_id, contributor\_id (nullable),  
    task\_type (enum, see §4.3),  
    title, description, status (pending | submitted | in\_review | accepted | rejected | waived),  
    due\_at, completed\_at, waiver\_reason, waiver\_approved\_by

documents  
  \- case\_id, task\_id (nullable), contributor\_id,  
    document\_type, original\_filename, storage\_key (S3),  
    mime\_type, size\_bytes, sha256,  
    virus\_scan\_status, ocr\_status, ocr\_payload (jsonb),  
    uploaded\_by, uploaded\_at, retention\_until

signatures  
  \- case\_id, contributor\_id, document\_id (nullable),  
    signature\_type (e\_sign\_typed | e\_sign\_drawn | docusign | wet\_signature\_scan),  
    signature\_blob (encrypted), ip\_address, user\_agent,  
    signed\_at, intent\_acknowledged (bool), audit\_token

identity\_verifications         \-- V4/V5  
  \- case\_id, contributor\_id,  
    method (in\_person | video\_call | nist\_ial2\_third\_party | facility\_official),  
    provider (nullable: persona | id\_me | stripe\_identity | plaid | custom),  
    provider\_reference, status, outcome\_code (1|2|3|5),  
    verified\_by\_user\_id, verified\_at,  
    recording\_storage\_key (for video), id\_document\_id

case\_notes  
  \- case\_id, author\_user\_id, body, is\_internal (bool), pinned

communications                 \-- every email/SMS/portal message  
  \- case\_id, contributor\_id, channel (email|sms|portal|voice),  
    direction (outbound|inbound), template\_id, subject, body,  
    provider (sendgrid|twilio|...), provider\_id, status, sent\_at, delivered\_at

isir\_corrections               \-- staged FAFSA corrections to push back  
  \- case\_id, isir\_id, field\_code, old\_value, new\_value,  
    reason, status (draft|approved|submitted|accepted|rejected),  
    approved\_by, submitted\_at

fpp\_outcome\_reports            \-- V4/V5 outcomes to push to FAFSA Partner Portal  
  \- case\_id, outcome\_code, reported\_at, batch\_id

users                          \-- staff  
  \- institution\_id, email, full\_name, role, nasfaa\_credentialed,  
    nasfaa\_credential\_type, sso\_subject, mfa\_enrolled, ...

audit\_log                      \-- IMMUTABLE, append-only  
  \- actor\_user\_id, actor\_role, entity\_type, entity\_id, action,  
    before (jsonb), after (jsonb), ip\_address, user\_agent, occurred\_at

### **3.2 Case status machine**

draft → awaiting\_documents → in\_review → corrections\_pending → completed  
                ↘ exception\_review ↗  
                ↘ on\_hold ↗  
                ↘ withdrawn (terminal)

State transitions are explicit, gated by role \+ RLS. Every transition writes an `audit_log` row.

### **3.3 Multi-tenancy**

Institution-scoped from the start, even though the bid is one college. The `institution_id` is on every row except global lookups. RLS policies enforce it at the DB level. Adding a second Example College System college later \= config only.

---

## **4\. Verification rules engine**

Pure functions, fully testable, run as a single deterministic pass over the parsed ISIR \+ contributor records.

### **4.1 Inputs**

* Current ISIR (parsed)  
* Contributor records (FA-DDX consent \+ receipt flags)  
* Aid year config (template versions, optional school-added items)  
* Institutional policy flags (e.g., "always V4 first-time Pell" school-select rule)

### **4.2 Output**

A list of `tasks` with: type, owner (which contributor), required documents, due date, waiver eligibility.

### **4.3 Task type catalog**

**V1 / V5 (data verification):**

* `student_tax_return_transcript` — only if FA-DDX did NOT populate student/spouse income  
* `parent_tax_return_transcript` — only if FA-DDX did NOT populate parent income  
* `student_non_filer_statement` — if student did not file  
* `parent_non_filer_statement` — if parent did not file  
* `student_w2_collection` — non-filer with income from work  
* `parent_w2_collection` — non-filer with income from work  
* `family_size_verification_worksheet` — always for V1/V5  
* `foreign_income_documentation` — conditional on FAFSA flag  
* `iras_pensions_documentation` — conditional on amount \> 0  
* `education_credits_documentation` — conditional

**V4 / V5 (identity):**

* `identity_verification` — one method chosen per case

**Common:**

* `signature_student` — student e-signs verification packet  
* `signature_parent` — dependent students only  
* `corrections_review` — staff task if ISIR data conflicts with documents

### **4.4 Rule order (this is the execution sequence)**

python  
def generate\_tasks(isir, contributors, aid\_year, policy):  
    tasks \= \[\]

    if isir.tracking\_group in ("V1", "V5"):  
        \# FA-DDX short-circuit per contributor  
        for c in contributors:  
            if c.fa\_ddx\_received:  
                continue  \# income/tax items verified by FUTURE Act exchange  
            if c.is\_tax\_filer:  
                tasks.append(tax\_transcript\_task(c))  
            else:  
                tasks.append(non\_filer\_task(c))  
                if c.income\_from\_work \> 0:  
                    tasks.append(w2\_task(c))

        tasks.append(family\_size\_worksheet\_task())

        if isir.foreign\_income \> 0: tasks.append(foreign\_income\_task())  
        if isir.untaxed\_iras\_pensions \> 0: tasks.append(iras\_pensions\_task())  
        if isir.education\_credits \> 0: tasks.append(education\_credits\_task())

    if isir.tracking\_group in ("V4", "V5"):  
        tasks.append(identity\_verification\_task())  \# method chosen later

    \# signatures always last  
    tasks.append(signature\_student\_task())  
    if isir.is\_dependent:  
        tasks.append(signature\_parent\_task())

    return apply\_policy\_overlays(tasks, policy)

Re-runs of the engine on a new ISIR transaction reconcile against open tasks (don't duplicate, don't lose history).

### **4.5 Acceptance rules**

A document satisfies a task when:

* Type matches the expected document\_type for that task  
* (Optionally) OCR confirms key fields (SSN match, name match, tax year match)  
* Staff member with reviewer+ role marks `accepted`

If OCR flags a mismatch the document goes to `in_review` not auto-accepted. Staff override is always allowed but logs the reason.

### **4.6 Auto-complete check**

Case completes when: every task is `accepted` or `waived` AND no `isir_corrections` are in flight AND (if V4/V5) `identity_verification.status = verified`.

On complete: trigger Banner write-back (RRRAREQ, RHACOMM) \+ FPP outcome row (V4/V5 only) \+ notification to student.

---

## **5\. Integration architecture**

### **5.1 Banner SIS (Example College System Oracle)**

**Read path (nightly):**

* Example College System Banner job exports CSV of current ISIRs for institution to SFTP drop  
* Our SFTP listener (AWS Transfer Family) → S3 landing bucket → Inngest job parses \+ upserts `isirs` \+ opens/updates `verification_cases`

**Write path (nightly \+ ad-hoc):**

* We write a CSV to a separate SFTP drop with:  
  * Verification status updates → maps to `RRRAREQ` rows  
  * Comments → maps to `RHACOMM`  
  * Approved corrections → maps to ISIR correction transactions  
* Example College System Banner job ingests and applies

**Field mapping doc:** see `BANNER_FIELD_MAP.md` (separate file — engineer 2's first task is to enumerate every Banner field we read/write).

### **5.2 SAIG / FPP (federal)**

**Phase 1:** out of scope, school continues using EDconnect manually. **Phase 3:** evaluate direct SAIG enrollment under our TG number or shared TG with school. FPP outcome reporting via batch upload of CSV we produce.

### **5.3 LOSFA**

**Phase 2:** import TOPS Master Roster (CSV/Excel from LOSFA) → enrich student records → drive priority scoring on cases (GO Grant–eligible bumps priority). **Future:** API integration with LOSFA Student Hub if/when they expose one (not currently public).

### **5.4 Identity provider (NIST IAL2)**

Pick one for MVP — recommended ranking:

1. **Persona** — best higher-ed fit, flexible, decent pricing, IAL2 capable  
2. **Stripe Identity** — simplest integration, reasonable pricing, IAL2 capable  
3. **ID.me** — strongest brand for gov/edu, more expensive, heavier integration  
4. **Plaid Identity Verification** — newest, OK

Build the integration behind a `VerificationProvider` interface so we can swap.

### **5.5 Communications**

* **Email:** Resend (preferred for DX) or SendGrid (for higher-ed volumes); SPF/DKIM/DMARC for the institution's domain  
* **SMS:** Twilio Programmable Messaging; A2P 10DLC registration required  
* **Voice (Phase 2):** Twilio Voice for call center; recording to S3 with retention

### **5.6 Document handling**

* Upload → S3 (institution-scoped prefix, SSE-KMS)  
* Antivirus scan: AWS GuardDuty Malware Protection for S3 or a Lambda+ClamAV worker  
* OCR: AWS Textract (Forms \+ Tables) for tax transcripts, W-2s, IDs  
* Retention: 3 years post aid year end (Title IV record retention) — lifecycle policy to Glacier then delete

### **5.7 E-signature**

For MVP: in-app typed/drawn signature with audit token (IP, UA, timestamp, intent acknowledgment checkbox text captured). Phase 2: DocuSign integration if school requires.

### **5.8 SSO for staff**

SAML 2.0 — Example College System uses Example SSO (Banner-fed SSO). Need IdP metadata from Example College System IT. Cognito or Auth0 as our SP. MFA enforced.

---

## **6\. UI surface**

### **6.1 Student portal (public-facing, mobile-first)**

* `/find-school` — the incumbent vendor-style school finder (we're white-labeled, but pattern stays)  
* `/auth/start` — email/phone capture, SSN last-4 \+ DOB challenge to match ISIR  
* `/auth/verify` — OTP code, then MFA enrollment (TOTP)  
* `/dashboard` — case header (status, deadline countdown, % complete), task list, "Next step" CTA  
* `/tasks/[id]` — task detail: instructions, required docs, upload zone, "I'm done" button  
* `/upload` — generic upload with type selector \+ progress  
* `/identity` — IAL2 flow (embedded Persona/Stripe Identity iframe) or video call scheduler  
* `/sign` — signature capture, intent statement  
* `/messages` — inbound from staff \+ reply  
* `/account` — language, notification prefs, login methods  
* `/help` — FAQ, contact info for school's aid office (NOT for Interon — students don't see us)

**Accessibility:** WCAG 2.1 AA from day one. Keyboard nav, focus rings, ARIA labels, contrast 4.5:1, screen reader tested with NVDA \+ VoiceOver, axe-core in CI.

**Languages:** English \+ Spanish at launch. French (LA-specific) Phase 2\. Use i18next \+ JSON locale files, translation keys for every string.

### **6.2 Parent / contributor portal**

Same shell as student, scoped to their linked sections. Invite link from student's case → create account → see only their contributor tasks.

### **6.3 Admin portal (staff-facing, desktop-first but responsive)**

* `/admin` — dashboard:  
  * KPIs: open cases, pending review, breached SLA, completed today  
  * Charts: 30-day completion trend, group mix (V1/V4/V5), aging buckets  
  * GO Grant priority queue (LA-specific)  
* `/admin/cases` — paginated table with filters: status, group, processor, aid year, deadline, GO Grant flag, search  
* `/admin/cases/[id]` — full case view:  
  * Header: student info, ISIR transactions list, contributor list  
  * Tasks tab: all tasks \+ status, override controls  
  * Documents tab: all uploads \+ OCR results, accept/reject, request resubmit  
  * Identity tab: V4/V5 method \+ outcome code entry  
  * Corrections tab: staged ISIR corrections, approve to send  
  * Notes tab: internal \+ student-facing  
  * Communications tab: all sent/received  
  * Audit tab: immutable history  
  * Sidebar actions: reassign, escalate, place on hold, mark exception, complete  
* `/admin/queues` — operational queues by team/processor  
* `/admin/reports` — standard \+ custom (see §8)  
* `/admin/settings` — aid year templates, school-selected rules, communication templates, holiday calendar (no work over Example College System closures)  
* `/admin/users` — user/role/credential management (NASFAA cred tracking)  
* `/admin/audit` — full audit log search

### **6.4 Compliance / auditor view**

Read-only mirror of admin with audit log as the front door. Export to CSV.

### **6.5 Design system**

Next.js \+ Tailwind \+ shadcn/ui as the base. Tokenize for white-label (institutional palette, logo, fonts). Vaibhav already has a design pattern from Aero/Odesa — reuse the token approach.

---

## **7\. API surface (REST \+ a few server actions)**

All endpoints prefixed `/api/v1`. JSON. JWT bearer (Cognito/Supabase Auth). All write endpoints rate-limited per role.

### **7.1 Public (student/parent)**

POST   /auth/start                  begin auth, captures email/phone  
POST   /auth/verify                 verify OTP, returns session  
POST   /auth/mfa/enroll             enroll TOTP  
POST   /auth/mfa/verify             complete MFA

GET    /me                          current user  
GET    /cases/mine                  cases for current contributor/student  
GET    /cases/:id                   one case (scoped)  
GET    /cases/:id/tasks  
POST   /cases/:id/tasks/:taskId/documents     upload (multipart)  
POST   /cases/:id/tasks/:taskId/submit  
POST   /cases/:id/signatures  
POST   /cases/:id/identity/start    returns provider session token for IAL2  
POST   /cases/:id/identity/callback provider webhook normalized

GET    /messages  
POST   /messages

### **7.2 Staff**

GET    /admin/cases                  filter \+ paginate  
GET    /admin/cases/:id              full hydrated view  
PATCH  /admin/cases/:id              status, assignee, priority  
POST   /admin/cases/:id/tasks        add task (school-selected)  
PATCH  /admin/cases/:id/tasks/:tid   accept/reject/waive  
POST   /admin/cases/:id/notes  
POST   /admin/cases/:id/communications  
POST   /admin/cases/:id/corrections  
PATCH  /admin/cases/:id/corrections/:cid/approve  
POST   /admin/cases/:id/identity/outcome   set FPP code (1|2|3|5)  
POST   /admin/cases/:id/complete  
POST   /admin/cases/:id/hold  
POST   /admin/cases/:id/escalate

GET    /admin/queues  
GET    /admin/reports/:type  
GET    /admin/audit?...

GET    /admin/users  
POST   /admin/users  
PATCH  /admin/users/:id

### **7.3 Integration (service-to-service)**

POST   /integrations/banner/isir-batch       SFTP ingest webhook  
GET    /integrations/banner/writeback        export pending writes  
POST   /integrations/fpp/batch               build FPP batch file  
POST   /integrations/identity/:provider/webhook  
POST   /integrations/email/webhook  
POST   /integrations/sms/webhook

### **7.4 Internal (jobs / Inngest)**

Function names, not HTTP:

* `isir.parse-and-upsert`  
* `case.recompute-tasks`  
* `case.check-sla`  
* `comms.send-reminder`  
* `document.virus-scan`  
* `document.ocr`  
* `banner.export-writeback`  
* `fpp.generate-batch`  
* `audit.daily-rollup`

---

## **8\. Reporting**

**Standard reports (everyone needs these):**

* Daily processing summary  
* Open verification queue (by group, aging buckets)  
* Average turnaround time (overall \+ by processor)  
* Staff productivity (cases/day, accept rate, rework rate)  
* Students missing documents (with last-contact age)  
* Students nearing deadline (federal \+ institutional)  
* Rejected documents log  
* Verification holds by reason  
* FPP V4/V5 outcomes for the period  
* ISIR correction history  
* Audit log access report (who saw what PII)  
* Communications log  
* Exception report (escalations, fraud flags, IRS mismatches, dep. overrides)

**LA-specific reports:**

* GO Grant–eligible stuck verifications  
* TOPS recipients with verification gaps  
* Pell-eligible Louisiana residents nearing deadline

**Custom report builder (Phase 2):** Filter builder UI → query AST → safe SQL via parameterized templates. Export CSV / PDF / Excel. Scheduled delivery to email.

**Tech:** materialized views for the heavy aggregates (refreshed every 15 min via Inngest cron). Real-time dashboards use lighter queries. PDF via `@react-pdf/renderer` or Puppeteer; Excel via `exceljs`.

---

## **9\. Security & compliance baseline**

### **9.1 Regulatory map**

| Regulation | Applies because | Controls |
| ----- | ----- | ----- |
| **FERPA** | Student education records | RBAC, audit log, data minimization, parent access only with eligible-student permission |
| **GLBA Safeguards Rule**(effective June 2023, in SAIG agreement) | Title IV financial data | Designated Qualified Individual, risk assessment, MFA, encryption at rest \+ in transit, training, IR plan, vendor oversight, annual report |
| **FISMA (Moderate flavor)** | Handling federal data | NIST 800-53 Moderate-aligned controls; full FedRAMP not required for school-side systems but the controls map is useful |
| **NIST 800-171 / CUI** | FA-DDX brings IRS FTI \= CUI | Encryption at rest, MFA, audit, incident response, physical security of hosting |
| **WCAG 2.1 AA** | ADA Title II for public institutions (DOJ 2024 final rule) | Accessibility from day one, axe-core in CI, manual screen reader testing |
| **State law** | LA Database Security Breach Notification Law (RS 51:3071) | Breach notification within 60 days |
| **TECH LOCK** (RFP preference) | Third-party security audit certification | Optional, post-launch |

### **9.2 Concrete controls**

* **Hosting:** AWS commercial, us-east-2 (Ohio) primary \+ us-east-1 DR. Stay region-locked to U.S.  
* **Network:** VPC with private subnets, no public DB, WAF on ALB, AWS Shield Standard, Security Groups locked down, no SSH (SSM Session Manager only)  
* **Auth:** Cognito (or Supabase Auth) with MFA required for all staff; students MFA-eligible, not forced  
* **Encryption:** TLS 1.2+ in transit (1.3 preferred); SSE-KMS for S3; pgsodium for sensitive columns (SSN, DOB) on top of RDS encryption at rest  
* **Secrets:** AWS Secrets Manager, rotated; no env vars with secrets in CI  
* **Logging:** CloudWatch \+ structured JSON logs; CloudTrail full org; immutable audit log in DB (no UPDATE/DELETE grants on the table)  
* **Backups:** RDS automated daily \+ PITR (7-day window); cross-region snapshot copy weekly  
* **DR:** RPO \< 15 min, RTO \< 2 hours; quarterly DR drill  
* **IR:** Documented incident response plan, on-call rotation, sev defs, breach notification template aligned with LA RS 51:3071 (60-day window)  
* **Vuln mgmt:** Snyk or Dependabot in CI; quarterly external pentest; annual SOC 2 prep  
* **Access reviews:** Quarterly, scripted from IdP audit  
* **Training:** Annual security \+ FERPA training, tracked per user  
* **Data retention:** 3 years post aid year end (Title IV record retention rule), enforced by S3 lifecycle \+ DB soft-delete sweep

### **9.3 Audit log specifics**

Append-only. Trigger on every state change. Columns: actor, role, entity, action, before/after JSON diff, IP, UA, timestamp. PII access is its own action type (`pii.viewed`). Compliance dashboard reads this directly.

---

## **10\. Tech stack (locked unless someone has a hard reason)**

| Layer | Choice | Why |
| ----- | ----- | ----- |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui | Team velocity, accessibility-friendly, matches Vaibhav's existing patterns |
| State | TanStack Query, Zustand for client UI state | Standard |
| Forms | React Hook Form \+ Zod | Validation parity with API |
| Backend | Next.js server actions \+ route handlers, **OR**separate Node service if scale forces it | Start monolithic, split later |
| Workflow engine | Inngest | Already in team stack, durable, retries, observability free |
| DB | Postgres on AWS RDS (Multi-AZ) | Compliance story easier than Supabase managed for FERPA/GLBA; we keep Supabase Auth or move to Cognito |
| Auth | Cognito \+ SAML for staff SSO; OTP/MFA for students | Production-grade, FedRAMP-authorized service |
| Object storage | S3 with SSE-KMS | Standard |
| SFTP ingress/egress | AWS Transfer Family | Managed SFTP, integrates with S3 |
| Email | Resend (or SendGrid) | Resend \= DX; SendGrid \= higher ed defaults |
| SMS | Twilio \+ 10DLC | Standard |
| OCR | AWS Textract | Best for tax docs |
| Identity (IAL2) | Persona (primary), Stripe Identity (fallback) | Behind interface |
| AV scanning | GuardDuty Malware Protection for S3 | Lower ops than ClamAV-on-Lambda |
| Observability | Datadog or CloudWatch \+ Sentry | Pick one stack early |
| IaC | Terraform | Standard |
| CI/CD | GitHub Actions | Standard |
| Container | Docker → ECS Fargate | Faster than k8s for this scope |

Note: Supabase is tempting for speed, but for a Title IV / FERPA / FTI-handling system in an RFP context, AWS commercial with named services tells a cleaner compliance story to the reviewers. If pace is critical, Supabase Auth \+ Supabase Postgres on AWS infra is acceptable for Phase 1; migrate auth to Cognito by Phase 3\.

---

## **11\. Phased delivery plan**

Aggressive but realistic for \~4 engineers \+ Claude/Codex pairing.

### **Phase 0 — Day 0/1 setup (this week)**

* Repo, monorepo (Turborepo): `apps/web`, `apps/admin`, `apps/jobs`, `packages/db`, `packages/rules`, `packages/integrations`  
* AWS account \+ Terraform skeleton (VPC, RDS, S3, Cognito, Transfer Family stubs)  
* CI: lint, typecheck, test, axe-core, Snyk  
* Auth scaffolding (student OTP \+ staff SSO mock)  
* Empty data model migrated to RDS  
* Storybook for shared UI  
* ADRs for: stack choice, DB strategy, secrets handling

### **Phase 1 — Core platform (weeks 1-4)**

* Full data model \+ migrations  
* RBAC \+ RLS policies  
* Student portal: auth → dashboard → task list → upload (without rules engine yet, manual tasks)  
* Admin portal: case list → case detail → accept/reject docs → notes  
* Audit log infra  
* Email \+ SMS sending (templates)  
* Manual case creation (no ISIR yet)  
* WCAG 2.1 AA baseline pass

### **Phase 2 — Verification rules engine \+ ISIR ingestion (weeks 5-8)**

* ISIR parser (start with 2025-26 \+ 2026-27 ISIR layouts) — operate on CSV first, fixed-width Phase 3  
* Banner SFTP ingest job  
* Rules engine: V1/V4/V5 task generation with FA-DDX short-circuit  
* Auto-recompute on new ISIR transaction  
* E-signature flow  
* Standard reports (10 reports from §8)  
* Contributor/parent portal  
* LA-specific dashboard (GO Grant priority queue)

### **Phase 3 — Identity (IAL2), corrections, FPP outcome reporting (weeks 9-12)**

* Persona / Stripe Identity integration  
* In-house video call flow \+ recording retention  
* ISIR corrections staging \+ approval workflow  
* Banner write-back via SFTP (RRRAREQ, RHACOMM, corrections)  
* FPP outcome batch generator  
* Direct SAIG enrollment evaluation  
* OCR pipeline live for tax transcripts, W-2s, IDs

### **Phase 4 — Hardening, accessibility, pilot (weeks 13-16)**

* Full WCAG 2.1 AA audit (manual \+ axe-core CI gates)  
* External pentest \+ remediation  
* Load testing (peak: 5,000 concurrent students, \~200 staff)  
* DR drill  
* Pilot with 100 verification cases at the client college  
* NASFAA-credentialed staff training on the admin portal  
* Documentation: runbooks, IR plan, GLBA Safeguards Rule annual report template

### **Phase 5+ — Post-pilot**

* Custom report builder  
* AI document classification \+ missing-doc prediction  
* Multi-tenant expansion to other Example College System colleges  
* LOSFA API integration if/when exposed  
* Mobile app (React Native) if data shows mobile completion lags  
* Twilio Voice call center integration  
* TECH LOCK certification

---

## **12\. Team workstreams (parallelizable from Day 1\)**

Assuming 4 engineers \+ Vaibhav as lead, this is how I'd split:

| Stream | Owner | Phase 1 deliverables |
| ----- | ----- | ----- |
| **A — Platform foundation** | Eng 1 (infra-leaning) | Terraform stack, CI/CD, RDS, Cognito wiring, S3, SFTP, secrets, observability |
| **B — Student/parent UI** | Eng 2 (frontend-leaning) | Auth, dashboard, task list, upload, sign, accessibility |
| **C — Admin UI \+ reporting** | Eng 3 (full-stack) | Case list, case detail, queues, audit view, 10 standard reports |
| **D — Domain/rules engine \+ ISIR** | Eng 4 (backend-leaning) | Data model, rules engine, ISIR parser, Banner adapter scaffolding |
| **E — Lead / integrations / compliance** | Vaibhav | Banner field map, identity provider integration, FPP batch, compliance docs, stakeholder comms |

Each stream gets its own folder under `apps/` or `packages/`. Daily 15-min standup. Shared `DECISIONS.md` for ADRs.

---

## **13\. Day-1 setup checklist**

Before any feature code:

*  Lock this spec; review with Interon ops lead; get sign-off on scope  
*  Confirm with client college: aid year focus (2526 \+ 2627?), institution branding, SSO provider details (Example College System IdP metadata), SFTP credentials path  
*  Stand up GitHub org / repo  
*  Provision AWS Org \+ workload accounts (dev / staging / prod)  
*  Terraform skeleton committed  
*  Set up Linear/Jira project mirroring the workstreams in §12  
*  Draft `BANNER_FIELD_MAP.md` — start from §1.8 and expand  
*  Request ISIR sample files from Example College System (de-identified) for parser dev  
*  Persona / Stripe Identity sandbox accounts  
*  Twilio \+ Resend accounts, A2P 10DLC registration kicked off (takes weeks)  
*  Draft data processing agreement template for the school  
*  Schedule weekly compliance review (FERPA/GLBA checklist)

---

## **14\. Open questions for stakeholders (resolve before Phase 1 closes)**

1. Which exact Example College System college is the client? Drives Banner config, SSO metadata, branding.  
2. What aid years are in scope at launch? 2526 only, or 2526 \+ 2627?  
3. Does the college currently use Banner's `RRRAREQ` extensively for verification tracking, or is it a clean slate?  
4. Who at the college is the Banner DBA / FA module admin contact?  
5. SAIG TG number: do we operate under the college's existing TG, or get our own?  
6. Does the college's SSO (Example SSO) support SAML 2.0 SP-initiated for our app, or do they want OIDC?  
7. Volume estimates: how many FAFSAs/aid year, what % verification rate historically?  
8. Existing communication templates from the aid office — do we adopt or rewrite?  
9. Call center scope — is voice in Phase 1 or Phase 5?  
10. Does Interon have a TECH LOCK relationship, or do we pursue post-launch?  
11. NASFAA credentialing timeline — who is credentialed today, who needs to be by go-live?  
12. RFP go-live date and pilot date — drives whether the 16-week plan compresses

---

## **15\. Out of scope (explicit)**

* Award packaging / disbursement (Banner does this)  
* COD origination / disbursement reporting (Banner does this)  
* NSLDS reporting (Banner does this)  
* Satisfactory Academic Progress (academic side)  
* Scholarship management (separate product opportunity)  
* Loan servicing  
* Direct integration with studentaid.gov (only via ISIR / FPP, federal interfaces)

---

## **16\. Appendix — research sources used to build this spec**

* 2025-26 FSA Handbook, Application & Verification Guide Ch. 4 (fsapartners.ed.gov)  
* 2026-27 FSA Handbook, AVG Ch. 4  
* Federal Register 90 FR 34487 (July 22, 2025\) — V4/V5 identity verification updates  
* Federal Register 90 FR 54316 (Nov 26, 2025\) — 2026-27 verification items  
* APP-25-16 (June 6, 2025\) — Identity Verification Updates  
* GENERAL-25-36 (Aug 12, 2025\) — V4/V5 Outcome Reporting  
* GEN-24-10 (July 23, 2024\) — SEP update  
* Banner Financial Aid User Guide 9.3.21 — ISIR data load, table reference  
* LOSFA GO Grant Policy 2025-2026 — eligibility coupling to Pell \+ verification  
* GLBA Safeguards Rule (16 CFR 314\) — security baseline for Title IV  
* the incumbent vendor Verification Gateway public marketing material — UX patterns to match/beat  
* ChatGPT threads provided by Interon: Financial Aid Verification Research, Scope of Work Review, Cloud Platform Design, School Verification Portal

---

Jane asks: "donde subo mi formulario W-2?"  
                                       │  
                                       ▼  
                          ┌────────────────────────┐  
                          │   Chatbot API Endpoint │  
                          │   (Next.js route)      │  
                          └───────────┬────────────┘  
                                      │  
                       ┌──────────────┼──────────────┐  
                       ▼              ▼              ▼  
                ┌──────────┐  ┌────────────┐  ┌──────────────┐  
                │  RAG     │  │ Student's  │  │ Tool         │  
                │  Index   │  │ case ctx   │  │ definitions  │  
                │ (Vertex  │  │ (her tasks,│  │ (scoped to   │  
                │  AI      │  │  status,   │  │  her case)   │  
                │  Search) │  │  uploads)  │  │              │  
                └────┬─────┘  └─────┬──────┘  └──────┬───────┘  
                     │              │                │  
                     └──────────────┼────────────────┘  
                                    ▼  
                       ┌────────────────────────┐  
                       │  Gemini 2.5/3 Flash    │  
                       │  via Vertex AI         │  
                       │  (FERPA-compliant)     │  
                       └───────────┬────────────┘  
                                   │  
                                   ▼  
                "Hola Jane\! Para subir tu W-2, ve a tu lista  
                 de tareas y haz clic en 'Verificación de  
                 Familia'. ¿Quieres que te lleve allí?"  
                 \[Botón: Ir a mis tareas\]

**X. Chatbot & multilingual support**

Two related but separate problems share this section. Translation is mostly a build-time problem. The chatbot is a runtime problem. Don't conflate them.

#### **X.1 Languages we support**

| Language | Phase | Why |
| ----- | ----- | ----- |
| English | Launch | Mandatory |
| Spanish | Launch | LA has \~300K Spanish speakers; community college demographic skews heavily toward Spanish-speaking households |
| Vietnamese | Phase 2 | Gulf Coast has \~30K Vietnamese speakers, big presence at Example College System Gulf Coast colleges |
| French / Cajun | Skipped | Heritage language, almost no practical demand for financial aid services |

#### **X.2 How translation actually works**

**Do not LLM-translate the UI at runtime.** It's slow, expensive, inconsistent (the same button can come back three different ways), and breaks screen readers. Real production multilingual apps work like this:

| Content type | How it's translated | When |
| ----- | ----- | ----- |
| **Static UI strings** (button labels, headings, form errors) | `i18next` \+ JSON files, one per language | Build time |
| **Static content** (FAQ, help articles, email templates, SMS templates) | Markdown files per language | Build time |
| **Documents** (verification worksheets, instructions) | Pre-translated PDF templates per language | Build time |
| **Staff ↔ student messages** | Runtime LLM translation with original/translated toggle | Runtime |
| **Uploaded documents in non-English** (Jane uploads a Spanish W-2 equivalent) | OCR \+ LLM translation, shown in staff review pane only | Runtime |

The build-time pipeline is a simple script in the repo: takes `en.json` as source, runs Claude over it to draft `es.json` and `vi.json`, commits the output, then a human reviewer (ideally a paid translator, or at minimum a native-speaking team member) reviews before merge. This is not infrastructure — it's a build step that runs when we add or change strings.

Critical rule: every user-facing string in the codebase goes through `t('key.path')`. No hardcoded strings. We catch violations with an ESLint rule in CI.

#### **X.3 The chatbot architecture**

The student-facing chatbot answers questions like "where do I upload my W-2?" or "what does V1 mean?" or "why hasn't my Pell shown up?" — in whatever language the student writes in.

       Jane: "donde subo mi formulario W-2?"  
                          │  
                          ▼  
            ┌──────────────────────────┐  
            │  Chatbot route handler   │  
            │  (Next.js)               │  
            └─────────────┬────────────┘  
                          │  
        ┌─────────────────┼─────────────────┐  
        ▼                 ▼                 ▼  
   ┌─────────┐      ┌──────────┐      ┌──────────┐  
   │  RAG    │      │ Jane's   │      │ Scoped   │  
   │ corpus  │      │ case ctx │      │ tools    │  
   │ (FSA    │      │ (tasks,  │      │          │  
   │  hdbk \+ │      │  status, │      │          │  
   │  help)  │      │  docs)   │      │          │  
   └────┬────┘      └────┬─────┘      └────┬─────┘  
        │                │                  │  
        └────────────────┼──────────────────┘  
                         ▼  
            ┌──────────────────────────┐  
            │ Claude Haiku 4.5         │  
            │ on AWS Bedrock           │  
            │ (FERPA-compliant)        │  
            └─────────────┬────────────┘  
                          ▼  
        "Hola Jane\! Para subir tu W-2, ve a tu lista  
         de tareas y haz clic en 'Verificación de  
         familia'. ¿Quieres que te lleve allí?"  
         \[Botón: Ir a mis tareas\]

**The pieces:**

**Model:** Claude Haiku 4.5 on AWS Bedrock. Cheap, fast, multilingual native (the same prompt works in English, Spanish, and Vietnamese). Reserve Sonnet for the admin copilot if we build one in Phase 5\.

**Why Bedrock, not the Anthropic API directly:** Bedrock gives us the AWS BAA, FedRAMP-authorized infrastructure, data residency, and audit logs to CloudTrail. The college's compliance team will ask. Also: same VPC, same IAM, same observability as the rest of the platform.

**RAG corpus** (pgvector in our existing Postgres, or AWS OpenSearch if we outgrow that):

* Full FSA Handbook, public and free (\~3,000 pages, chunked \+ embedded)  
* Our own help articles (per language, kept in sync)  
* LOSFA TOPS/GO Grant FAQ  
* The college's specific aid office policies  
* Common student questions \+ canonical answers (we grow this from real chat logs)

**Student case context** injected into every prompt:

* Current case status, tracking group, deadlines  
* Open tasks (what she still owes us)  
* Documents she's uploaded  
* Whether parent has an account yet  
* Preferred language

This is what makes it feel like a real assistant rather than a generic FAQ bot. It knows Jane's situation.

**Scoped tools (function calling):**

* `getMyTasks()` — her active tasks  
* `getMyDocuments()` — what she's uploaded  
* `getMyDeadline()` — federal \+ institutional  
* `scheduleIdentityCall()` — books a slot for V4/V5  
* `escalateToHuman()` — pages staff and creates a `case_notes` entry  
* `sendDocumentInstructions(taskType)` — DMs her step-by-step instructions

Every tool enforces row-level security: the bot literally cannot access another student's data even if Jane asks it to. The chat session carries her `user_id` and Postgres RLS does the rest.

#### **X.4 Hard guardrails**

These are non-negotiable. The chatbot:

* **Never gives definitive financial aid advice.** "You'll get $X in Pell" is forbidden. "Pell is based on your SAI; once verification completes the aid office calculates your award" is fine.  
* **Never processes appeals, professional judgment requests, or dependency overrides.** Those are staff-only decisions.  
* **Always offers human handoff** at least every 5 turns, and immediately any time it says "I'm not sure" or the student asks about something case-specific that it can't resolve.  
* **Refuses requests about other students.** Strict refusal pattern, not soft.  
* **Logs every conversation** to the `communications` table. Staff can see what the bot said to Jane in the admin portal.  
* **Never asks for SSN, password, or full credit card / bank info.** If a student tries to send any of these, the bot refuses and tells them how to enter the data securely in the portal.

#### **X.5 Multilingual handling**

Claude responds in whatever language the user writes in, automatically. No language detection step needed for student inbound messages.

For the staff → student direction, we do explicit translation: Student writes a note in English, our backend detects her preferred language (English) and the student's preferred language (from `students.preferred_language`), translates if they differ, and stores both `original` and `translated` on the `communications` row. Jane sees the Spanish version with an "Original (English)" toggle.

#### **X.6 Why Claude, not Gemini**

Briefly, because the question will come up:

Gemini Flash is a great model, particularly cheap, and Vertex AI has solid compliance. But the team is already on Claude \+ Codex daily. Adding Gemini means a second vendor relationship, a second DPA, a second GCP project with VPC Service Controls, a second compliance review with the college, a second monitoring surface. None of which pays back, because Claude on Bedrock matches Gemini on every dimension that matters for this product: multilingual quality, FERPA compliance, cost at our scale, tool use reliability. Tool use is actually Claude's stronger lane — we lean on it heavily for the scoped tools above.

The cost math: even at 10,000 students × 20 messages × 2,000 tokens, we're talking $1K–$6K per cycle on Claude. Pocket change versus the contract value. Cost is not the deciding factor.

#### **X.7 Stack additions**

Adds to the stack from §10:

| Layer | Choice |
| ----- | ----- |
| Chatbot model | Claude Haiku 4.5 via AWS Bedrock |
| Embeddings | Amazon Titan Embeddings v2 (or `voyage-3` if we want best-in-class) |
| Vector store | pgvector in our existing RDS Postgres (simpler than adding OpenSearch) |
| Translation (build time) | Claude Sonnet via Bedrock as the drafter, human-reviewed |
| Static i18n | `i18next` \+ `react-i18next` \+ `i18next-http-backend` for lazy locale loading |

#### **X.8 Three docs to add to the repo**

Spin these up as part of the chatbot workstream:

* **`CHATBOT_PROMPTS.md`** — system prompt, tool descriptions, refusal patterns, escalation triggers, conversational style guide  
* **`RAG_CORPUS.md`** — what's indexed, how it gets updated, version pinning, re-indexing cadence  
* **`I18N.md`** — the build-time translation pipeline, which strings are translatable, how to add a new language

#### **X.9 What this means for workstreams**

The chatbot is its own workstream — call it **F**. Either spin up a 5th engineer for it, or have Engineer 3 (Admin UI \+ Reports) own it starting in Phase 2 once the admin portal is stable enough that the bot has something to read from. The i18n pipeline is small and can be Engineer 2's responsibility as part of Phase 1 student portal work (it's basically a build script \+ linting rule \+ initial Spanish translation pass).

**Sample ISIRs on Day 1\.** Tell your boss this week. You can't write the parser without them and waiting until week 3 to discover you don't have them is the dumb timeline killer.  
**2025-26 vs 2026-27 ISIR layouts differ.** Fixed-width files, different field positions per aid year. Your parser needs to be version-aware from the start, not "we'll add 2627 later." Cheap to design in, expensive to retrofit.  
**Idempotent ISIR ingestion.** Same student gets a new ISIR every time their FAFSA is corrected — could be 5+ per year. Re-ingest of the same transaction can't double-process. Dedupe on `(student_id, aid_year, transaction_number)` and treat the current one as a pointer, not a copy.  
**Mock everything that's not yours.** Build against a fake Banner SFTP, fake ISIR fixtures, fake Persona webhook. Don't let your team's velocity depend on real integrations being live. The political/procurement stuff will lag — your team shouldn't.  
**Case state machine in code, not in vibes.** Define the allowed transitions as a real state machine (XState or a hand-rolled switch). Reject illegal transitions at the API layer. Bug-class you don't want: case stuck in some weird in-between state nobody designed for.  
**Timezones everywhere \= America/Chicago.** ISIRs use Central. Federal deadlines are stated in Central. Store UTC, display Central, never assume browser locale. Get this right Day 1 or you'll spend two days fixing it Day 30\.  
**Audit log on every state-change path, baked in.** Not because compliance asked — because retrofitting audit logging through 60 endpoints is the worst Tuesday of someone's life. Just make it a middleware/hook from the start.  
**The chatbot's tool layer is the actual product surface.** RAG handles "what is V1." Tools handle "what's MY deadline." Design the tool contracts carefully — every tool gets the caller's `user_id` from the session, never from the LLM's input. Treat the model as untrusted; treat the auth context as trusted.  
**Admin queue performance.** September deadline week, 2K+ open cases, every processor refreshing. Index `(institution_id, status, deadline)`. Materialized view for the dashboard KPIs, refreshed every 5min via Inngest. Don't ship raw aggregations against the live table.  
**The "ISIR correction" workflow has teeth.** Staff approve corrections that get pushed back to FAFSA. Wrong correction \= wrong aid \= real harm. Build it as a two-step (draft → approved-by-supervisor → batch-out) with full diff visibility. Don't let a one-click flow exist.

For shipping portal scaffolding tomorrow, the traps shift to "future you in week 3" stuff. Here's the tactical Day 1 list:

**Lock these decisions before you write a line of code:**

1. **One Next.js app, two route groups.** Not two separate apps. Structure: `app/(student)/...` and `app/(admin)/...`. Same auth, same DB client, same design tokens. Splitting later is easy; merging later is hell.  
2. **`pnpm` \+ Turborepo monorepo with these packages from Day 1:**  
   * `apps/web` (the Next app)  
   * `packages/db` (Postgres schema \+ Drizzle/Prisma client \+ Zod schemas)  
   * `packages/ui` (shared shadcn components \+ design tokens)  
   * `packages/types` (shared TS types, including API contracts)  
3. Even if it feels overkill on Day 1, this saves you from "I have 4 copies of the Student type" by week 3\.  
4. **Shared Zod schemas for everything.** The schema that validates the form is the same schema that validates the API. Lives in `packages/db` or `packages/types`. Don't duplicate.  
5. **i18n keys from the first string.** Even if you ship English-only tomorrow, wrap every visible string in `t('...')`. Add an ESLint rule that bans bare strings in JSX. Retrofitting i18n is the worst day of an engineer's life and it's free to do now.

**Scaffolding traps:**

5. **Mock auth from minute one.** Build a `useUser()` hook backed by a fake session with a role-switcher in the dev nav. Real Cognito/Auth integration is week 2 — but every page you build assumes there's a user with a role. Don't write a single page without auth-awareness.  
6. **Build the case detail page first** (admin) and the **task detail** page first (student). Those are 70% of the value of each portal. Lists, dashboards, settings can come later. If you build the dashboard first you'll waste time on a screen that mostly just links to the screens that actually do work.  
7. **shadcn/ui \+ design tokens before features.** Install shadcn, configure your color/spacing/font tokens, build 5 base components into Storybook (Button, Input, Select, Card, Table) before any feature work. Otherwise you get 4 button variants by Friday.  
8. **axe-core in dev mode \+ Storybook a11y addon.** Set up axe-core as a Vitest middleware or use `@axe-core/react` in dev. Catches accessibility violations as you write components. Compliance person will love you and you'll never have to do an accessibility retrofit.

**Trap that bites everyone:**

9. **Seed fake data with obviously-fake PII.** SSN `000-00-0000`, DOB `1900-01-01`, addresses with `Test St`. Easier to grep when something accidentally leaks into a log or screenshot. Never use real-looking PII in dev.  
10. **Loading and error state patterns first.** Build a `<LoadingState />`, `<ErrorState />`, `<EmptyState />` before any feature page. Otherwise every engineer rolls their own and your app looks schizophrenic. Same for `<PageHeader />`, `<DataTable />`, `<FormSection />`.

**Things to NOT do tomorrow:**

* Don't write the ISIR parser — wait until you have a real sample file  
* Don't wire up real auth — mock it  
* Don't build the Banner integration — it's blocked anyway  
* Don't build the chatbot — that's a separate workstream  
* Don't optimize anything — ship ugly, iterate  
* Don't write tests for UI yet — test the rules engine and the data layer; UI tests come later

**The actual shape of a successful Day 1:**

By EOD tomorrow your team should have:

* Repo \+ Turborepo structure committed  
* Vercel preview deploys working off `main`  
* Storybook running with 5 base components  
* Mocked auth with role switcher  
* The student `/dashboard` and `/tasks/[id]` pages stubbed with fake data  
* The admin `/cases` list and `/cases/[id]` detail pages stubbed with fake data  
* ESLint, Prettier, TS strict mode, axe-core all running on commit  
* A README that gets a new engineer running in 10 minutes

