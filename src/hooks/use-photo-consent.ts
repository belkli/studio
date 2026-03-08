'use client';

/**
 * usePhotoConsent
 *
 * Fetches PHOTOS consent status for a list of user IDs from the server.
 * Used in event management UIs to flag students who have not consented
 * to commercial/promotional photo use.
 *
 * LEGAL NOTE (Israel):
 * - Minors (<18): PHOTOS consent required for ALL uses — event, commercial, social media.
 * - Adults (≥18): Event/documentary photography is generally permitted without consent
 *   (public domain doctrine). However, use for COMMERCIAL purposes (paid ads, sponsored
 *   content) requires explicit consent regardless of age.
 * - Without consent5/PHOTOS: conservatory may document events internally but MUST NOT
 *   publish identifiable images in promotional/commercial contexts.
 */

import { useState, useEffect, useCallback } from 'react';
import { getConsentStatus } from '@/app/actions/consent';

type ConsentMap = Record<string, boolean>; // userId → hasPhotoConsent

export function usePhotoConsent(userIds: string[]) {
  const [consentMap, setConsentMap] = useState<ConsentMap>({});
  const [loading, setLoading] = useState(false);

  const fetchConsents = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        ids.map(async (userId) => {
          const res = await getConsentStatus({ userId });
          const hasConsent = res.success && (res as { success: true; status: Record<string, boolean> }).status['PHOTOS'] === true;
          return [userId, hasConsent] as const;
        })
      );
      setConsentMap(Object.fromEntries(results));
    } catch {
      // Non-fatal: UI degrades gracefully — show unknown state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsents(userIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds.join(',')]);

  return { consentMap, loading, refetch: () => fetchConsents(userIds) };
}
