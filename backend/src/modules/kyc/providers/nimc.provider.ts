/**
 * NIMC NIN verification provider.
 * Requires CAC business registration to access NIMC API.
 * Until API access is granted, NIN is accepted as a document upload
 * and reviewed manually by admin.
 *
 * TODO: Replace with live NIMC API integration when credentials are obtained.
 */
export async function verifyNin(_nin: string): Promise<{ verified: boolean }> {
  // Placeholder — submit for manual admin review
  return { verified: false };
}
