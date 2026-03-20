import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @supabase/supabase-js — same require() pattern used by supabase-provider.ts
const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

import { getGatewayCredentials } from '@/lib/secrets';

describe('getGatewayCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
  });

  it('returns null when no credentials stored', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    const result = await getGatewayCredentials('cons-1', 'cardcom');
    expect(result).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('conservatorium_gateway_credentials');
  });

  it('returns credentials when found', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{
            gateway_type: 'cardcom',
            credentials_encrypted: 'encrypted-blob',
            credentials_iv: 'iv-blob',
          }],
          error: null,
        }),
      }),
    });
    const result = await getGatewayCredentials('cons-1', 'cardcom');
    expect(result).not.toBeNull();
    expect(result?.gatewayType).toBe('cardcom');
    expect(result?.credentialsEncrypted).toBe('encrypted-blob');
    expect(result?.credentialsIv).toBe('iv-blob');
  });

  it('returns null on Supabase error — never throws', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
      }),
    });
    const result = await getGatewayCredentials('cons-1', 'hyp');
    expect(result).toBeNull();
  });

  it('returns null when data is null', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });
    const result = await getGatewayCredentials('cons-1', 'sumit');
    expect(result).toBeNull();
  });
});
