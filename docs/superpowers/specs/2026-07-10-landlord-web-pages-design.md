# Landlord Web Pages — Listings & Tenancies

**Date:** 2026-07-10  
**Status:** Approved  
**Scope:** Replace 5 Placeholder routes with real landlord pages

## Context

The web app (React + Vite + Tailwind) has 29 placeholder pages. The landlord section is the
biggest gap — only Dashboard exists. Property listing management and tenancy administration
are critical for landlords to use the platform from web.

## Pages to Build (5)

| Route | Page | Purpose |
|---|---|---|
| `/landlord/listings` | MyListings | Grid of landlord's properties with status badges |
| `/landlord/listings/create` | CreateListing | Single-page form, also used for Edit mode |
| `/landlord/listings/:id` | ListingDetail | View property details, active tenancies, edit/delete |
| `/landlord/tenancies` | TenanciesList | Filterable table of tenancies |
| `/landlord/tenancies/:id` | TenancyDetail | Tenancy info, signatures, payment schedule, actions |

## Shared Component

**ListingForm** — single-page form with 4 sections:
1. **Basic Info:** title, property_type, listing_type, description
2. **Location:** address, LGA, nearest_landmark
3. **Pricing:** monthly_rent/yearly_rent (gated by tenancy_mode), caution_fee, agency_fee
4. **Details:** bedrooms, bathrooms, amenities (tag input), available_units, tenancy_mode

Used by both CreateListing (blank) and ListingDetail (edit mode, pre-filled).
Submits via `propertiesService.create()` or `propertiesService.update()`.

## API Surface (Already Wired)

All endpoints already exist in `web/src/services/`:

- `propertiesService.getLandlordProperties()` — list own properties
- `propertiesService.getById(id)` — single property detail
- `propertiesService.create(data)` — create property
- `propertiesService.update(id, data)` — update property
- `tenanciesService.getLandlordTenancies()` — list landlord's tenancies
- `tenanciesService.getById(id)` — single tenancy detail
- `tenanciesService.terminate(id)` — terminate tenancy

## UI Patterns (Follow Dashboard)

Every page follows the Dashboard conventions:

1. **Loading:** Tailwind `animate-pulse` skeleton placeholders
2. **Error:** `<ErrorState message={error} onRetry={load} />`
3. **Empty:** Centered message with CTA button
4. **Data:** Tailwind cards, tables, badges — same color tokens (`brand-green`, `emerald`, `amber`, `muted`)
5. **Data fetching:** `useState` + `useCallback` + `useEffect` + `Promise.allSettled`
6. **Icons:** `lucide-react`

## Out of Scope

- Photo upload (backend endpoint exists, UI deferred)
- Form validation library (plain checks, matching existing pattern)
- New services or API endpoints
- Tenant-side pages (separate spec)

## Files

| File | Action |
|---|---|
| `web/src/App.tsx` | Replace 5 Placeholder imports with real page components |
| `web/src/pages/landlord/MyListings.tsx` | Create |
| `web/src/pages/landlord/CreateListing.tsx` | Create |
| `web/src/pages/landlord/ListingDetail.tsx` | Create |
| `web/src/pages/landlord/TenanciesList.tsx` | Create |
| `web/src/pages/landlord/TenancyDetail.tsx` | Create |
| `web/src/components/listings/ListingForm.tsx` | Create |
