import { getDb } from '@/lib/db';
import type { Conservatorium, ConservatoriumPolicyContact, User } from '@/lib/types';

export type StatementContactKind = 'privacy' | 'accessibility';
export type StatementContactSource = 'configured' | 'primary_admin' | 'conservatorium_defaults';

export type ResolvedConservatoriumContact = {
  conservatorium: Conservatorium;
  contact: ConservatoriumPolicyContact;
  source: StatementContactSource;
};

function hasValue(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

function hasContact(contact?: ConservatoriumPolicyContact) {
  if (!contact) return false;
  return hasValue(contact.name) || hasValue(contact.email) || hasValue(contact.phone);
}

function pickPrimaryAdmin(users: User[], conservatoriumId: string) {
  const admins = users.filter(
    (user) =>
      user.role === 'conservatorium_admin' &&
      user.approved &&
      user.conservatoriumId === conservatoriumId &&
      user.isDelegatedAdmin !== true
  );

  return (
    admins.find((user) => user.isPrimaryConservatoriumAdmin === true) ??
    admins[0]
  );
}

function normalizePhone(value?: string) {
  return value?.trim() || undefined;
}

function normalizeEmail(value?: string) {
  return value?.trim() || undefined;
}

export function resolveConservatoriumStatementContact(
  conservatorium: Conservatorium,
  kind: StatementContactKind,
  users: User[]
): ResolvedConservatoriumContact {
  const configuredContact =
    kind === 'privacy' ? conservatorium.privacyContact : conservatorium.accessibilityContact;
  const primaryAdmin = pickPrimaryAdmin(users, conservatorium.id);

  const fallbackContact: ConservatoriumPolicyContact = {
    name: primaryAdmin?.name || conservatorium.manager?.name,
    role: primaryAdmin?.role || conservatorium.manager?.role,
    email: normalizeEmail(primaryAdmin?.email || conservatorium.email || conservatorium.secondaryEmail),
    phone: normalizePhone(primaryAdmin?.phone || conservatorium.tel || conservatorium.socialMedia?.whatsapp),
  };

  const contact: ConservatoriumPolicyContact = {
    name: configuredContact?.name || fallbackContact.name,
    role: configuredContact?.role || fallbackContact.role,
    email: normalizeEmail(configuredContact?.email || fallbackContact.email),
    phone: normalizePhone(configuredContact?.phone || fallbackContact.phone),
  };

  let source: StatementContactSource = 'conservatorium_defaults';
  if (hasContact(configuredContact)) {
    source = 'configured';
  } else if (primaryAdmin) {
    source = 'primary_admin';
  }

  return { conservatorium, contact, source };
}

export async function getConservatoriumStatementContacts(kind: StatementContactKind) {
  const db = await getDb();
  const [conservatoriums, users] = await Promise.all([db.conservatoriums.list(), db.users.list()]);

  return conservatoriums.map((conservatorium) =>
    resolveConservatoriumStatementContact(conservatorium, kind, users)
  );
}
