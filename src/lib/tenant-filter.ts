import type { User } from './types';

/**
 * Filter items by the current user's conservatorium.
 * site_admin and ministry_director see all data (no filtering).
 * All other roles only see data from their own conservatorium.
 */
export function tenantFilter<T extends { conservatoriumId?: string }>(
  items: T[],
  currentUser: Pick<User, 'conservatoriumId' | 'role'>,
): T[] {
  if (currentUser.role === 'site_admin' || currentUser.role === 'ministry_director') {
    return items;
  }
  return items.filter(item => item.conservatoriumId === currentUser.conservatoriumId);
}

/**
 * Filter users by role AND tenant. Convenience wrapper for the common pattern:
 * `users.filter(u => u.role === 'teacher')` → `tenantUsers(users, user, 'teacher')`
 */
export function tenantUsers(
  users: User[],
  currentUser: Pick<User, 'conservatoriumId' | 'role'>,
  ...roles: string[]
): User[] {
  const filtered = roles.length > 0
    ? users.filter(u => roles.includes(u.role))
    : users;
  return tenantFilter(filtered, currentUser);
}
