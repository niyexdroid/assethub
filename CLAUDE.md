# AssetHub — Project Context

Nigerian proptech platform for landlords and tenants.

## Architecture

| Layer | Tech | Location | Port |
|---|---|---|---|
| Mobile app | Expo / React Native 0.83 / expo-router | `src/` | 8081 |
| Backend API | Express + TypeScript + PostgreSQL | `backend/src/` | 4000 |
| Admin panel | React + Vite + Tailwind | `admin/src/` | 5173 |
| DB | PostgreSQL 16 (Docker) | docker-compose | 5432 |
| Queue | BullMQ + Redis 7 (Docker) | docker-compose | 6379 |

## Key Commands

```bash
# Start everything
npm run dev                  # docker + expo

# Backend only
npm run backend              # docker-compose up -d
npm run backend:logs         # tail api logs
npm run backend:rebuild      # rebuild docker image

# ADB port forwarding (physical device)
npm run adb:device

# Migrations
cd backend && npm run migrate
```

## Mobile App Structure (`src/`)

```
app/
  (auth)/          # Login, register, forgot-password
  (onboarding)/    # Role selection, profile setup
  (landlord)/      # Landlord tabs: dashboard, listings, tenancies, payments, complaints
  (tenant)/        # Tenant tabs: home, property, tenancy, payments, complaints, roommates
  (shared)/        # Shared screens
components/
  ui/              # Reusable UI primitives
  property/        # Property-specific components
store/             # Zustand stores
services/          # API client (axios + react-query)
hooks/             # Custom hooks
types/             # Shared TypeScript types
```

## Backend Structure (`backend/src/`)

```
modules/
  auth/            # JWT auth, bcrypt passwords
  users/           # User profiles
  properties/      # Property CRUD
  tenancies/       # Lease management
  payments/        # Paystack integration
  complaints/      # Maintenance requests
  notifications/   # Firebase push + nodemailer email
  kyc/             # Identity verification
  roommates/       # Roommate matching
  admin/           # Admin endpoints
services/          # Shared services (imagekit uploads, pdf generation)
jobs/              # BullMQ background jobs
database/          # PostgreSQL client + migrations
middleware/        # Auth, rate-limit, error handler
```

## Key Libraries

- **State**: Zustand (global), React Query (server state)
- **Forms**: react-hook-form + zod
- **Lists**: @shopify/flash-list
- **Charts**: react-native-gifted-charts
- **Maps**: react-native-maps
- **Payments**: Paystack
- **Storage**: ImageKit (media), expo-secure-store (tokens)
- **Auth**: JWT + bcrypt
- **Queue**: BullMQ + Redis
- **Fonts**: Plus Jakarta Sans

## DevOps — Railway Deployment

Use the **railway-devops** agent for ALL deployment operations. The main coding agent never deploys directly — it hands off to this agent.

```bash
# Spawn from main coding agent:
Agent(subagent_type="railway-devops", description="Deploy <feature> to production",
  prompt="Deploy commit <sha> to production. Changes: <summary>. Env vars: <if any>.")
```

**Railway IDs:** Project `4383208a-1a61-465c-ad0c-b70b7b712b5f` | Service `9a0e9047-3d2e-4208-a294-19343f8e7a4b` | Env `5d1c6603-1a56-4f46-aefc-27fdf43db8bc`

**Known issues:** GitHub auto-deploy webhook is unreliable — use direct `deploy` (tarball), not push-to-deploy. Dashboard "Redeploy" re-runs last-built commit, not HEAD.

See `.claude/agents/railway-devops.md` for full agent spec.

## Environment

- `backend/.env` — DB URL, Redis URL, JWT secret, Paystack keys, Firebase, ImageKit, SMTP
- Docker services: `assethub_postgres`, `assethub_redis`, `assethub_api`
- DB name: `niyexdroid_assethub`, user: `niyexdroid`
