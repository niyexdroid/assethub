# Tenant Web Pages — Full Implementation

**Date:** 2026-07-10
**Status:** Approved
**Scope:** Replace 15 Placeholder routes with real pages — 9 tenant-specific + 6 shared (both roles)

## Context

The web app (React + Vite + Tailwind) has 5 built tenant pages (Home, PropertyDetail, Tenancy,
Payments, Complaints) and 15 placeholder routes. The landlord batch (6 pages) is complete.
This spec covers the remaining tenant and shared pages. Desktop-first, power-user oriented —
mirroring mobile features where sensible but enhancing with richer layouts (tables, inline
editing, keyboard-friendly forms) for desktop use.

## Pages to Build (15)

### Tenant-Specific (9 pages)

| Route | Page | Purpose |
|---|---|---|
| `/apply/:propertyId` | Apply | Form: tenancy type, move-in date, message. Property summary card. Submit → API |
| `/tenancy/:id` | TenancyDetail | Info cards: property, rent, dates, landlord, status. Terminate + payment history |
| `/payments/pay` | PayRent | Form: amount, payment method. Initiates Paystack checkout flow |
| `/payments/receipt` | Receipt | Receipt view (router state or fetch by ID). Print-friendly, reference + amount + date |
| `/complaints/new` | NewComplaint | Form: title, category, priority, description, optional photo |
| `/complaints/:id` | ComplaintDetail | Message thread/timeline, status badge, follow-up reply input |
| `/roommates` | RoommatesList | Filterable grid: budget, location, occupation, lifestyle tags |
| `/roommates/profile` | RoommateProfile | View/edit own roommate profile form |
| `/roommates/requests` | RoommateRequests | Sent/received requests with status, accept/reject on incoming |

### Shared Pages — Both Roles (6 pages)

| Route | Page | Purpose |
|---|---|---|
| `/kyc` | KycOverview | Verification dashboard: method list with status per method |
| `/kyc/bvn` | KycBvn | BVN verification form: number input, validation, submit |
| `/kyc/nin` | KycNin | NIN verification form: NIN input + optional document upload |
| `/kyc/student` | KycStudent | Student verification: school, matric number, ID upload |
| `/kyc/review` | KycReview | Submitted KYC data display with verification status/result |
| `/notifications` | Notifications | Paginated list, read/unread styling, click-to-mark-read, type icons |

## API Surface (Already Wired)

All endpoints already exist in `web/src/services/`:

- `tenanciesService.apply(data)` — submit application
- `tenanciesService.getTenantTenancies()` — list tenant's tenancies
- `tenanciesService.getById(id)` — single tenancy detail
- `tenanciesService.terminate(id)` — terminate tenancy
- `paymentsService.getHistory()` — payment transaction list
- `paymentsService.initiatePayment(data)` — start Paystack checkout
- `paymentsService.getReceipt(id)` — fetch receipt
- `complaintsService.list()` — list complaints
- `complaintsService.create(data)` — file complaint
- `complaintsService.getById(id)` — complaint detail with messages
- `complaintsService.reply(id, message)` — add follow-up
- `roommatesService.list(filters)` — browse roommate profiles
- `roommatesService.getProfile()` — get own profile
- `roommatesService.updateProfile(data)` — update own profile
- `roommatesService.getRequests()` — list requests
- `roommatesService.sendRequest(userId)` — send connection request
- `roommatesService.respondRequest(requestId, action)` — accept/reject
- `notificationsService.list()` — paginated notifications
- `notificationsService.markRead(id)` — mark single as read
- `kycService.getStatus()` — KYC overview
- `kycService.verifyBvn(data)` — BVN verification
- `kycService.verifyNin(data)` — NIN verification
- `kycService.verifyStudent(data)` — student verification

## UI Patterns (Follow Existing Conventions)

Every page follows the established patterns from the landlord batch and existing tenant pages:

1. **Loading:** Tailwind `animate-pulse` skeleton placeholders
2. **Error:** `<ErrorState message={error} onRetry={load} />`
3. **Empty:** `<EmptyState title="..." description="..." />` with optional CTA action
4. **Data:** Cards, tables, badges — same color tokens (`brand-green`, `emerald`, `amber`, `muted`, `destructive`)
5. **Data fetching:** `useState` + `useCallback` + `useEffect` pattern
6. **Icons:** `lucide-react`
7. **Layout:** All pages render inside `<TenantLayout>` via `<Outlet />`

## Page Details

### Apply (`/apply/:propertyId`)

- Fetch property by ID, show summary card (title, address, rent amounts)
- Tenancy type toggle (yearly/monthly) with contextual help text
- Move-in date input (text with YYYY-MM-DD format hint)
- Optional message textarea (occupation, occupants, references)
- Info banner explaining review process
- Submit → `tenanciesService.apply()` → success alert → redirect to /tenancy
- Cancel button → navigate back

### TenancyDetail (`/tenancy/:id`)

- Fetch tenancy by ID via `tenanciesService.getById(id)`
- Info cards: property name (linked), rent amount, start/end dates, landlord contact, status badge
- Payment history section for this tenancy (filtered from payments)
- Terminate button with confirmation dialog (matching landlord TenancyDetail pattern)
- Error handling with type assertion on catch (matching the fix applied in landlord batch)

### PayRent (`/payments/pay`)

- Show outstanding balance if available
- Amount input (pre-filled with rent amount if tenancy is active)
- Payment method selector (Paystack card/bank/transfer)
- Submit → `paymentsService.initiatePayment()` → redirect to Paystack URL
- Form validation: amount > 0 required

### Receipt (`/payments/receipt`)

- Read transaction from router state (via `useLocation`) or fetch by query param ID
- Print-friendly layout: AssetHub logo/name, transaction reference, amount, date, property, status
- Download as PDF button (or browser print)
- Back to payments link

### NewComplaint (`/complaints/new`)

- Form fields: title (text), category (dropdown: maintenance, utilities, security, noise, other), priority (low/medium/high), description (textarea)
- Optional photo field (file input, deferred upload — same pattern as landlord)
- Submit → `complaintsService.create()` → navigate to `/complaints/:newId`
- Cancel → navigate back

### ComplaintDetail (`/complaints/:id`)

- Fetch complaint by ID → display in thread/timeline layout
- Status badge (open/in_progress/escalated/resolved)
- Metadata: category, priority, date filed
- Message thread: original complaint + landlord responses + tenant follow-ups
- Reply input at bottom (if status !== resolved)
- Submit reply → `complaintsService.reply(id, message)` → refresh thread

### RoommatesList (`/roommates`)

- Fetch via `roommatesService.list(filters)`
- Filter chips: budget range, preferred LGA, gender, occupation
- Grid of profile cards: name, budget, location, occupation, lifestyle tags
- Click card → view full profile (inline expand or link to profile if already connected)
- Send request button on each card

### RoommateProfile (`/roommates/profile`)

- View mode: display current profile fields
- Edit mode (toggle): form with budget range, preferred LGAs (multi-select chips), occupation, bio, lifestyle tags (tag input), gender
- Save → `roommatesService.updateProfile(data)` → switch back to view mode
- Cancel → discard changes, switch to view mode

### RoommateRequests (`/roommates/requests`)

- Two tabs: Sent (pending/accepted/rejected) and Received (pending action)
- Incoming pending: accept/reject buttons → `roommatesService.respondRequest(id, action)`
- Each card: name, profile snippet, status badge, time ago
- Empty state per tab

### KycOverview (`/kyc`)

- Fetch KYC status via `kycService.getStatus()`
- Cards for each method: BVN, NIN, Student — each shows status (not_started/pending/verified/rejected)
- Click card → navigate to specific method page
- Verified badge if all methods complete

### KycBvn (`/kyc/bvn`)

- Form: BVN (11-digit number), date of birth, submit
- Validation: BVN format (11 digits)
- Inline result display after submission (success/failure with reason)

### KycNin (`/kyc/nin`)

- Form: NIN (11-digit number), optional document upload
- Validation: NIN format
- Result display after submission

### KycStudent (`/kyc/student`)

- Form: school name, matriculation number, student ID upload
- Submit → `kycService.verifyStudent(data)` → result display

### KycReview (`/kyc/review`)

- Read-only display of submitted KYC data across all methods
- Verification status and any rejection reasons
- "Edit" link back to respective method page if rejected

### Notifications (`/notifications`)

- Fetch via `notificationsService.list()`
- Paginated list with infinite scroll or load-more
- Each item: type icon (payment/tenancy/complaint/system), title, body preview, time ago, read/unread state
- Click → mark as read via `notificationsService.markRead(id)` + navigate to relevant page if deep link
- "Mark all read" button at top
- Unread count badge

## Out of Scope

- Photo/file upload UI in complaints/KYC (backend endpoints exist, upload deferred — same as landlord batch)
- Real-time notifications (polling only, matching existing patterns)
- Chat/messaging between roommates (request-only, no ongoing chat)
- Form validation library (plain inline checks, matching existing pattern)
- New services or API endpoints (all exist)

## Files

| File | Action |
|---|---|
| `web/src/App.tsx` | Replace 15 Placeholder imports + routes with real components |
| `web/src/pages/tenant/Apply.tsx` | Create |
| `web/src/pages/tenant/TenancyDetail.tsx` | Create |
| `web/src/pages/tenant/PayRent.tsx` | Create |
| `web/src/pages/tenant/Receipt.tsx` | Create |
| `web/src/pages/tenant/NewComplaint.tsx` | Create |
| `web/src/pages/tenant/ComplaintDetail.tsx` | Create |
| `web/src/pages/tenant/RoommatesList.tsx` | Create |
| `web/src/pages/tenant/RoommateProfile.tsx` | Create |
| `web/src/pages/tenant/RoommateRequests.tsx` | Create |
| `web/src/pages/shared/KycOverview.tsx` | Create |
| `web/src/pages/shared/KycBvn.tsx` | Create |
| `web/src/pages/shared/KycNin.tsx` | Create |
| `web/src/pages/shared/KycStudent.tsx` | Create |
| `web/src/pages/shared/KycReview.tsx` | Create |
| `web/src/pages/shared/Notifications.tsx` | Create |
