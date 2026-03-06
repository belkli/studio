export function normalizeInstrumentToken(value?: string | null): string {
  return (value || '').toString().trim().toLowerCase();
}

export function collectInstrumentTokensFromConservatoriumInstrument(item: {
  id: string;
  instrumentCatalogId?: string;
  names: { he: string; en: string; ar?: string; ru?: string };
}): Set<string> {
  const tokens = new Set<string>();
  [
    item.id,
    item.instrumentCatalogId,
    item.names.he,
    item.names.en,
    item.names.ar,
    item.names.ru,
  ]
    .map((v) => normalizeInstrumentToken(v))
    .filter(Boolean)
    .forEach((v) => tokens.add(v));
  return tokens;
}

export function collectInstrumentTokensFromTeacherInstrument(
  instrumentValue: string,
  conservatoriumInstruments: Array<{
    id: string;
    conservatoriumId: string;
    instrumentCatalogId?: string;
    names: { he: string; en: string; ar?: string; ru?: string };
  }>,
  conservatoriumId?: string
): Set<string> {
  const normalized = normalizeInstrumentToken(instrumentValue);
  const tokens = new Set<string>();
  if (!normalized) return tokens;

  tokens.add(normalized);

  const matches = conservatoriumInstruments.filter((item) => {
    if (conservatoriumId && item.conservatoriumId !== conservatoriumId) return false;
    const itemTokens = collectInstrumentTokensFromConservatoriumInstrument(item);
    return itemTokens.has(normalized);
  });

  matches.forEach((item) => {
    collectInstrumentTokensFromConservatoriumInstrument(item).forEach((token) => tokens.add(token));
  });

  return tokens;
}

export function tokenSetsIntersect(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  for (const token of a) {
    if (b.has(token)) return true;
  }
  return false;
}


export function userHasInstrument(
  userInstrumentValues: Array<string | undefined | null> | undefined,
  selectedInstrumentValue: string | undefined | null,
  conservatoriumInstruments: Array<{
    id: string;
    conservatoriumId: string;
    instrumentCatalogId?: string;
    names: { he: string; en: string; ar?: string; ru?: string };
  }>,
  conservatoriumId?: string
): boolean {
  if (!selectedInstrumentValue) return true;
  const selectedToken = normalizeInstrumentToken(selectedInstrumentValue);
  if (!selectedToken) return true;

  const selectedTokens = new Set<string>([selectedToken]);

  const matchingSelectedInstruments = conservatoriumInstruments.filter((item) => {
    if (conservatoriumId && item.conservatoriumId !== conservatoriumId) return false;
    return collectInstrumentTokensFromConservatoriumInstrument(item).has(selectedToken);
  });

  matchingSelectedInstruments.forEach((item) => {
    collectInstrumentTokensFromConservatoriumInstrument(item).forEach((token) => selectedTokens.add(token));
  });

  return (userInstrumentValues || []).some((value) => {
    const teacherTokens = collectInstrumentTokensFromTeacherInstrument(
      String(value || ''),
      conservatoriumInstruments,
      conservatoriumId
    );
    return tokenSetsIntersect(selectedTokens, teacherTokens);
  });
}
