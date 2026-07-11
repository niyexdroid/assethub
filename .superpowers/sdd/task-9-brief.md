# Task 9: Router Wiring

## Goal

Replace all 15 Placeholder elements in `web/src/App.tsx` with real page imports and routes. This also replaces the landlord KYC/notification placeholders with the same shared components.

## Steps

### 1. Add new imports after existing tenant page imports (after the `import ComplaintsScreen from '@/pages/tenant/Complaints'` line)

```tsx
// Tenant pages (new)
import ApplyScreen from '@/pages/tenant/Apply'
import TenancyDetailScreen from '@/pages/tenant/TenancyDetail'
import PayRentScreen from '@/pages/tenant/PayRent'
import ReceiptScreen from '@/pages/tenant/Receipt'
import NewComplaintScreen from '@/pages/tenant/NewComplaint'
import ComplaintDetailScreen from '@/pages/tenant/ComplaintDetail'
import RoommatesListScreen from '@/pages/tenant/RoommatesList'
import RoommateProfileScreen from '@/pages/tenant/RoommateProfile'
import RoommateRequestsScreen from '@/pages/tenant/RoommateRequests'

// Shared pages
import KycOverviewScreen from '@/pages/shared/KycOverview'
import KycBvnScreen from '@/pages/shared/KycBvn'
import KycNinScreen from '@/pages/shared/KycNin'
import KycStudentScreen from '@/pages/shared/KycStudent'
import KycReviewScreen from '@/pages/shared/KycReview'
import NotificationsScreen from '@/pages/shared/Notifications'
```

### 2. Replace tenant placeholder routes (currently lines ~64-82)

Replace ALL Placeholder-referencing routes with:

```tsx
                <Route path="/apply/:propertyId" element={<ApplyScreen />} />
                <Route path="/tenancy/:id" element={<TenancyDetailScreen />} />
                <Route path="/payments/pay" element={<PayRentScreen />} />
                <Route path="/payments/receipt" element={<ReceiptScreen />} />
                <Route path="/complaints/new" element={<NewComplaintScreen />} />
                <Route path="/complaints/:id" element={<ComplaintDetailScreen />} />
                <Route path="/roommates" element={<RoommatesListScreen />} />
                <Route path="/roommates/profile" element={<RoommateProfileScreen />} />
                <Route path="/roommates/requests" element={<RoommateRequestsScreen />} />
                <Route path="/notifications" element={<NotificationsScreen />} />
                <Route path="/kyc" element={<KycOverviewScreen />} />
                <Route path="/kyc/bvn" element={<KycBvnScreen />} />
                <Route path="/kyc/nin" element={<KycNinScreen />} />
                <Route path="/kyc/student" element={<KycStudentScreen />} />
                <Route path="/kyc/review" element={<KycReviewScreen />} />
```

### 3. Replace landlord KYC/notification placeholder routes

Replace the landlord routes that still use Placeholder for KYC + notifications:

```tsx
                <Route path="/notifications" element={<NotificationsScreen />} />
                <Route path="/kyc" element={<KycOverviewScreen />} />
                <Route path="/kyc/bvn" element={<KycBvnScreen />} />
                <Route path="/kyc/nin" element={<KycNinScreen />} />
                <Route path="/kyc/student" element={<KycStudentScreen />} />
                <Route path="/kyc/review" element={<KycReviewScreen />} />
```

### 4. Remove Placeholder import

Remove this line: `import { Placeholder } from '@/pages/Placeholder'`

## Verification

1. Run `cd web && npx tsc --noEmit --pretty 2>&1 | head -40` — expect no errors
2. Run `cd web && npm run build 2>&1 | tail -10` — expect build succeeds
3. Commit: `git add web/src/App.tsx && git commit -m "feat: wire all tenant and shared page routes, remove Placeholder"`

## Notes

- The current App.tsx has both tenant and landlord route groups. Make sure shared pages are used in BOTH groups.
- The `Placeholder` import can be removed IF no other routes reference it. Check first.
- The landlord `payments` and `complaints` routes still use Placeholder — those are NOT in this task's scope, leave them alone.
