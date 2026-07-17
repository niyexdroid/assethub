# Task 4: NewComplaint + ComplaintDetail Pages

## Status: Complete

## Files Created
- `web/src/pages/tenant/NewComplaint.tsx` — Complaint filing form with title, category (5 options), priority (low/medium/high), and description. Submits via `complaintsService.create()` and navigates to the new complaint detail on success.
- `web/src/pages/tenant/ComplaintDetail.tsx` — Message thread view with original complaint header, status badge, message list with sender avatars, and reply input (hidden when resolved). Uses `complaintsService.getById()`, `getMessages()`, and `addMessage()`.

## TypeScript Check
- `npx tsc --noEmit --pretty` — **0 errors** (empty output)

## Commit
- Hash: `35e9889`
- Message: `feat: add tenant NewComplaint and ComplaintDetail pages`
- 2 files, 263 insertions

## Key Design Details
- Error handling follows project convention: `(err as any)?.response?.data?.message ?? (err as any)?.message ?? 'fallback'`
- Icons from `lucide-react` only (ArrowLeft, Send, AlertTriangle, Clock, CheckCircle2, MessageSquare)
- Time formatting via `timeAgo` from `@/lib/utils`
- Loading state uses skeleton pulse animations matching existing patterns
- ErrorState component from `@/components/custom/ErrorState` for error/not-found states
- Reply input supports both button click and Enter key submission
- Reply input is hidden when complaint status is `resolved`
