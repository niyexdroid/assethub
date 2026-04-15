const getApiUrl = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.niyexdroid.com';
  }
  // Set EXPO_PUBLIC_API_URL in .env for local development
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'http://localhost:4000';
};

export const API_BASE_URL = getApiUrl();
console.log('[api] base url:', API_BASE_URL);

export const API_ENDPOINTS = {
  auth: {
    login:          '/auth/login',
    register:       '/auth/register',
    requestOtp:     '/auth/login/otp',
    verifyOtp:      '/auth/verify-otp',
    logout:         '/auth/logout',
    refresh:        '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword:  '/auth/reset-password',
  },
  users: {
    me:                '/users/me',
    changePassword:    '/users/me/change-password',
    changePhone:       '/users/me/change-phone',
    changePhoneVerify: '/users/me/change-phone/verify',
    fcmToken:          '/users/me/fcm-token',
    avatar:            '/users/me/avatar',
  },
  properties: {
    search:           '/properties',
    detail:           (id: string) => `/properties/${id}`,
    landlordMine:     '/properties/landlord/mine',
    saved:            '/properties/saved',
    save:             (id: string) => `/properties/${id}/save`,
    photos:           (id: string) => `/properties/${id}/photos`,
  },
  tenancies: {
    create:           '/tenancies',
    tenantMine:       '/tenancies/tenant/mine',
    landlordMine:     '/tenancies/landlord/mine',
    detail:           (id: string) => `/tenancies/${id}`,
    agreement:        (id: string) => `/tenancies/${id}/agreement`,
    accept:           (id: string) => `/tenancies/${id}/accept`,
    decline:          (id: string) => `/tenancies/${id}/decline`,
    terminate:        (id: string) => `/tenancies/${id}/terminate`,
    signTenant:       (id: string) => `/tenancies/${id}/sign/tenant`,
    signLandlord:     (id: string) => `/tenancies/${id}/sign/landlord`,
  },
  payments: {
    initialize:       '/payments/initialize',
    verify:           (ref: string) => `/payments/verify/${ref}`,
    schedule:         (tenancyId: string) => `/payments/schedule/${tenancyId}`,
    history:          '/payments/history',
    transaction:      (id: string) => `/payments/history/${id}`,
  },
  complaints: {
    list:             '/complaints',
    create:           '/complaints',
    detail:           (id: string) => `/complaints/${id}`,
    messages:         (id: string) => `/complaints/${id}/messages`,
    escalate:         (id: string) => `/complaints/${id}/escalate`,
    resolve:          (id: string) => `/complaints/${id}/resolve`,
  },
  roommates: {
    profile:          '/roommates/profile',
    matches:          (propertyId: string) => `/roommates/matches/${propertyId}`,
    request:          '/roommates/request',
    acceptRequest:    (id: string) => `/roommates/request/${id}/accept`,
    declineRequest:   (id: string) => `/roommates/request/${id}/decline`,
    receivedRequests: '/roommates/requests/received',
    sentRequests:     '/roommates/requests/sent',
  },
  kyc: {
    bvn:     '/kyc/bvn',
    nin:     '/kyc/nin',
    student: '/kyc/student',
    status:  '/kyc/status',
  },
  notifications: {
    list:    '/notifications',
    markRead:    (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    preferences: '/notifications/preferences',
  },
};
