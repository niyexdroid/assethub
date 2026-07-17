# Tier 1 Trust Features — Implementation Plan

Two features: Digital Inventory Checklist (#10) and Landlord Verification Badges (#4).

## Architecture Decisions

### Digital Inspections
- **Camera-only capture** — `capture_source` field always `"camera"`, no gallery picker
- **Anti-spoof timestamps** — GPS + network-synced time captured at shutter click, not EXIF
- **Offline-first mobile** — expo-sqlite drafts, AsyncStorage upload queue, submit/sign blocked until queue drained
- **Tamper detection** — `content_hash` (SHA-256 of items JSON) stored at signing; both signatures validate against same hash
- **State machine** — `draft` → `pending_review` → `signed` → `disputed` → `draft` (cycle)
  - On dispute: items locked, signatures cleared, both parties re-sign
- **PDF generation** — pdfkit synchronous on dual-sign, uploaded to ImageKit

### Verification Badges
- **Materialized column** — `landlord_badge SMALLINT` on `users` table (NOT computed function in search queries)
- **Trigger-driven** — PostgreSQL triggers on `kyc_verifications`, `landlord_verifications`, `landlord_ratings`, `tenancies` recompute badge
- **Write-path compute** — triggers fire on rare writes (KYC approval, verification, rating, tenancy expiry)
- **Read-path O(1)** — property search reads static integer column
- **Tiers:**
  - 0: None
  - 1: Identity Verified (KYC approved)
  - 2: Ownership Verified (KYC + utility bill / land registry)
  - 3: AssetHub Trusted (Tier 2 + 3+ expired tenancies + avg rating >= 3.5)

## Database Migrations

| # | Name | Tables |
|---|------|--------|
| 020 | inspections | `inspection_reports`, `inspection_items` |
| 021 | verification_badges | `landlord_verifications`, `landlord_ratings`, `landlord_badge` column, trigger function |

## File Breakdown (26 total: 18 new, 8 modified)

### Backend — New (9)
- `modules/inspections/inspections.routes.ts`
- `modules/inspections/inspections.controller.ts`
- `modules/inspections/inspections.service.ts`
- `modules/inspections/inspections.validator.ts`
- `modules/inspections/inspections.types.ts`
- `modules/verifications/verifications.routes.ts`
- `modules/verifications/verifications.controller.ts`
- `modules/verifications/verifications.service.ts`
- `modules/verifications/verifications.validator.ts`

### Backend — Modified (5)
- `modules/properties/properties.service.ts` — read `landlord_badge` column in search queries
- `modules/properties/properties.types.ts` — add `landlord_badge` to property owner info
- `app.ts` or router index — mount new routes
- `modules/kyc/kyc.service.ts` — no code change needed (trigger fires on status update)
- `modules/tenancies/tenancies.service.ts` — no code change needed (trigger fires on status change)

### Mobile — New (7)
- `services/inspections.service.ts` — API client
- `hooks/useInspections.ts` — react-query hooks
- `hooks/useOfflineQueue.ts` — AsyncStorage upload queue
- `components/inspection/InspectionCamera.tsx` — camera-only capture component
- `components/inspection/InspectionItem.tsx` — single item row with photo + condition
- `app/(shared)/inspections/[id].tsx` — inspection detail/review screen
- `app/(tenant)/inspections/new.tsx` — new inspection flow

### Mobile — Modified (5)
- `app/(tenant)/tenancy/[id].tsx` — add "Start Inspection" button
- `app/(landlord)/tenancies/[id].tsx` — add review/sign inspection
- `types/index.ts` — add inspection types
- `services/api.ts` — no change (uses existing client)
- `store/` — zustand store for offline drafts (or use expo-sqlite directly)

### Admin — New (2)
- `src/pages/Verifications.tsx` — review landlord verification docs
- `src/pages/VerificationDetail.tsx` — single verification review

### Admin — Modified (2)
- `src/App.tsx` — add routes
- `src/api.ts` — add verification endpoints (or use existing client)

## Implementation Phases

### Phase 1: DB Migrations
Create migrations 020 and 021. Run against local DB. Verify tables, types, triggers.

### Phase 2: Backend — Inspections
Routes, controller, service, validator, types. CRUD for reports and items. State machine transitions. PDF generation endpoint. ImageKit upload presets.

### Phase 3: Backend — Verifications
Routes, controller, service, validator. Admin review endpoints. Trigger function already handles badge recomputation.

### Phase 4: Mobile — Badges
Display `landlord_badge` on property cards, landlord profiles. Read-only — badge is materialized server-side.

### Phase 5: Mobile — Inspections
Offline-first inspection flow. Camera component. Draft storage. Upload queue. Signing flow.

### Phase 6: Admin Panel
Verification review screens. Approve/reject with reason.

### Phase 7: Polish
Error handling, loading states, empty states. Cross-platform testing. PDF verification.

## Deferred
- Agent marketplace integration (needs verification badges first)
- Rent financing risk scoring (needs landlord trust data)
- Area intelligence / neighborhood scoring
