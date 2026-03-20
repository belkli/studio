/**
 * Per-tenant BYOD payment gateway credential retrieval.
 *
 * Credentials are stored in Supabase as pgcrypto-encrypted columns.
 * This module is the ONLY place that reads conservatorium_gateway_credentials
 * — no other module should query this table directly.
 *
 * Decryption is handled by Supabase pgcrypto via a DB function,
 * not in application code. The encrypted blob is passed to the
 * payment gateway module as-is.
 *
 * FUTURE: When HYP/Sumit/Tranzila HMAC docs are available,
 * each gateway module (hyp.ts, sumit.ts, tranzila.ts) will call
 * getGatewayCredentials() to retrieve its secret.
 */

import { createClient } from '@supabase/supabase-js';

export type GatewayType = 'cardcom' | 'hyp' | 'sumit' | 'tranzila';

export interface GatewayCredentials {
  gatewayType: GatewayType;
  /** Encrypted blob — pass to payment gateway module; NEVER log this value */
  credentialsEncrypted: string;
  credentialsIv: string;
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Retrieve BYOD gateway credentials for a conservatorium.
 * Returns null if no credentials are configured for this gateway type.
 * Never throws — returns null on any error.
 */
export async function getGatewayCredentials(
  conservatoriumId: string,
  gatewayType: GatewayType,
): Promise<GatewayCredentials | null> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('conservatorium_gateway_credentials')
      .select('gateway_type, credentials_encrypted, credentials_iv')
      .eq('conservatorium_id', conservatoriumId)
      .eq('gateway_type', gatewayType);

    if (error || !data || data.length === 0) return null;

    const row = data[0];
    return {
      gatewayType: row.gateway_type as GatewayType,
      credentialsEncrypted: row.credentials_encrypted,
      credentialsIv: row.credentials_iv,
    };
  } catch {
    return null;
  }
}
