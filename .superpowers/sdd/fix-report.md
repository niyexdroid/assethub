# Code Review Fix Report

**Status:** All fixes applied and verified  
**Commit:** `156da7b`  
**Branch:** `worktree-tenant-web-pages`  
**Date:** 2026-07-11  

## Fixes Applied

### CRITICAL

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `web/src/pages/shared/KycStudent.tsx` | Frontend sent `school` / `matric_number` instead of backend-expected `school_name` / `school_email`; no file upload | Replaced fields to match backend validator (`school_name`, `school_email`), added file input (`accept="image/*"`) appended as `student_id` to FormData, shows selected filename |
| 2 | `web/src/pages/tenant/RoommatesList.tsx` | Profile extraction only read `r.sender_id` / `r.sender`, missing the other person on sent requests | Added loop over both `sender` and `receiver` roles when building unique profile list |

### IMPORTANT

| # | File | Issue | Fix |
|---|------|-------|-----|
| 3 | `web/src/pages/tenant/Apply.tsx` | Used `alert()` for success message | Replaced with inline success state: shows a CheckCircle2 success card with "View My Tenancy" link to `/tenancy` |
| 4 | `web/src/pages/tenant/RoommateRequests.tsx` | Silent catch blocks in accept/decline handlers | Added `actionError` state, catch blocks now set error message, error displayed above request list |
| 5 | `web/src/pages/tenant/RoommateProfile.tsx` | Used `toLocaleString()` for currency formatting | Replaced with `formatNGN()` (imported from `@/lib/utils`) for consistent Naira formatting |

## Verification

- `npx tsc --noEmit --pretty` passed with zero errors
- All form submissions align with backend validators and route expectations
