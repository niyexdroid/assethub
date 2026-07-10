import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthGate } from '@/components/guards/AuthGate'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { RequireRole } from '@/components/guards/RequireRole'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { TenantLayout } from '@/components/layout/TenantLayout'
import { LandlordLayout } from '@/components/layout/LandlordLayout'

// Auth pages
import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { VerifyEmail } from '@/pages/auth/VerifyEmail'
import { VerifyLoginOtp } from '@/pages/auth/VerifyLoginOtp'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import { ResetPassword } from '@/pages/auth/ResetPassword'
import { GoogleComplete } from '@/pages/auth/GoogleComplete'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

// Tenant pages
import HomeScreen from '@/pages/tenant/Home'
import PropertyDetailScreen from '@/pages/tenant/PropertyDetail'
import TenancyScreen from '@/pages/tenant/Tenancy'
import PaymentsScreen from '@/pages/tenant/Payments'
import ComplaintsScreen from '@/pages/tenant/Complaints'

// Landlord pages
import DashboardScreen from '@/pages/landlord/Dashboard'
import MyListings from '@/pages/landlord/MyListings'
import CreateListing from '@/pages/landlord/CreateListing'
import ListingDetail from '@/pages/landlord/ListingDetail'
import TenanciesList from '@/pages/landlord/TenanciesList'
import TenancyDetail from '@/pages/landlord/TenancyDetail'

// Placeholder for pages not yet built
import { Placeholder } from '@/pages/Placeholder'

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthGate />}>
            {/* ── Auth (public) ────────────────────────── */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-login-otp" element={<VerifyLoginOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/google-complete" element={<GoogleComplete />} />
            </Route>

          {/* ── Tenant ───────────────────────────────── */}
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole role="tenant" />}>
              <Route element={<TenantLayout />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/property/:id" element={<PropertyDetailScreen />} />
                <Route path="/apply/:propertyId" element={<Placeholder title="Apply" />} />
                <Route path="/tenancy" element={<TenancyScreen />} />
                <Route path="/tenancy/:id" element={<Placeholder title="Tenancy Detail" />} />
                <Route path="/payments" element={<PaymentsScreen />} />
                <Route path="/payments/pay" element={<Placeholder title="Pay Rent" />} />
                <Route path="/payments/receipt" element={<Placeholder title="Receipt" />} />
                <Route path="/complaints" element={<ComplaintsScreen />} />
                <Route path="/complaints/new" element={<Placeholder title="New Complaint" />} />
                <Route path="/complaints/:id" element={<Placeholder title="Complaint Detail" />} />
                <Route path="/roommates" element={<Placeholder title="Roommates" />} />
                <Route path="/roommates/profile" element={<Placeholder title="Roommate Profile" />} />
                <Route path="/roommates/requests" element={<Placeholder title="Requests" />} />
                <Route path="/notifications" element={<Placeholder title="Notifications" />} />
                <Route path="/settings" element={<Placeholder title="Settings" />} />
                <Route path="/kyc" element={<Placeholder title="KYC" />} />
                <Route path="/kyc/bvn" element={<Placeholder title="KYC - BVN" />} />
                <Route path="/kyc/nin" element={<Placeholder title="KYC - NIN" />} />
                <Route path="/kyc/student" element={<Placeholder title="KYC - Student" />} />
                <Route path="/kyc/review" element={<Placeholder title="KYC - Review" />} />
              </Route>
            </Route>
          </Route>

          {/* ── Landlord ─────────────────────────────── */}
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole role="landlord" />}>
              <Route element={<LandlordLayout />}>
                <Route path="/landlord" element={<Navigate to="/landlord/dashboard" replace />} />
                <Route path="/landlord/dashboard" element={<DashboardScreen />} />
                <Route path="/landlord/listings" element={<MyListings />} />
                <Route path="/landlord/listings/create" element={<CreateListing />} />
                <Route path="/landlord/listings/:id" element={<ListingDetail />} />
                <Route path="/landlord/tenancies" element={<TenanciesList />} />
                <Route path="/landlord/tenancies/:id" element={<TenancyDetail />} />
                <Route path="/landlord/payments" element={<Placeholder title="Payments" />} />
                <Route path="/landlord/complaints" element={<Placeholder title="Complaints" />} />
                <Route path="/landlord/complaints/:id" element={<Placeholder title="Complaint Detail" />} />
                <Route path="/notifications" element={<Placeholder title="Notifications" />} />
                <Route path="/settings" element={<Placeholder title="Settings" />} />
                <Route path="/kyc" element={<Placeholder title="KYC" />} />
                <Route path="/kyc/bvn" element={<Placeholder title="KYC - BVN" />} />
                <Route path="/kyc/nin" element={<Placeholder title="KYC - NIN" />} />
                <Route path="/kyc/student" element={<Placeholder title="KYC - Student" />} />
                <Route path="/kyc/review" element={<Placeholder title="KYC - Review" />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
