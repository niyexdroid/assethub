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

// Landlord pages
import DashboardScreen from '@/pages/landlord/Dashboard'
import MyListings from '@/pages/landlord/MyListings'
import CreateListing from '@/pages/landlord/CreateListing'
import ListingDetail from '@/pages/landlord/ListingDetail'
import TenanciesList from '@/pages/landlord/TenanciesList'
import TenancyDetail from '@/pages/landlord/TenancyDetail'
import Settings from '@/pages/Settings'

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
                <Route path="/apply/:propertyId" element={<ApplyScreen />} />
                <Route path="/tenancy" element={<TenancyScreen />} />
                <Route path="/tenancy/:id" element={<TenancyDetailScreen />} />
                <Route path="/payments" element={<PaymentsScreen />} />
                <Route path="/payments/pay" element={<PayRentScreen />} />
                <Route path="/payments/receipt" element={<ReceiptScreen />} />
                <Route path="/complaints" element={<ComplaintsScreen />} />
                <Route path="/complaints/new" element={<NewComplaintScreen />} />
                <Route path="/complaints/:id" element={<ComplaintDetailScreen />} />
                <Route path="/roommates" element={<RoommatesListScreen />} />
                <Route path="/roommates/profile" element={<RoommateProfileScreen />} />
                <Route path="/roommates/requests" element={<RoommateRequestsScreen />} />
                <Route path="/notifications" element={<NotificationsScreen />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/kyc" element={<KycOverviewScreen />} />
                <Route path="/kyc/bvn" element={<KycBvnScreen />} />
                <Route path="/kyc/nin" element={<KycNinScreen />} />
                <Route path="/kyc/student" element={<KycStudentScreen />} />
                <Route path="/kyc/review" element={<KycReviewScreen />} />
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
                <Route path="/notifications" element={<NotificationsScreen />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/kyc" element={<KycOverviewScreen />} />
                <Route path="/kyc/bvn" element={<KycBvnScreen />} />
                <Route path="/kyc/nin" element={<KycNinScreen />} />
                <Route path="/kyc/student" element={<KycStudentScreen />} />
                <Route path="/kyc/review" element={<KycReviewScreen />} />
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
