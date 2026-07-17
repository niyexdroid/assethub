# Task 6: RoommateProfile + RoommateRequests Pages — Report

## Status

SUCCESS

## Files Created

| File | Lines |
|---|---|
| `web/src/pages/tenant/RoommateProfile.tsx` | 216 |
| `web/src/pages/tenant/RoommateRequests.tsx` | 356 |

## Commit

```
b506059ff026e4b09021a9c6ca426b9d9c286375
feat: add tenant Roommate Profile and Requests pages
```

## TypeScript Check

`npx tsc --noEmit --pretty` — no errors.

## Implementation Details

### RoommateProfile.tsx
- View/edit toggle pattern with loading skeleton, error state, and save error display
- Edit mode: budget min/max (number inputs), preferred LGAs (multi-select chips from `LAGOS_LGAS`), gender preference toggle (`male`/`female`/`any`), bio textarea
- Save uses `roommatesService.upsertProfile(data)` with type assertions on catch blocks
- Cancel button resets form from server state via `load()`

### RoommateRequests.tsx
- Two-tab layout: Received and Sent, with pending count badge on Received tab
- Received tab shows accept/decline buttons for pending requests with loading state per row
- Status badges with color coding (amber=warning for pending, emerald=success for accepted)
- Empty state via `EmptyState` component, error via `ErrorState` component
- Uses `timeAgo()` for relative timestamps
