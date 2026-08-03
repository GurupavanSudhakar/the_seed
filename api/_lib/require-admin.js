// Shared password gate for every api/admin/*.js route. Not a Supabase-user
// check — the admin panel is a single-shared-secret tool, independent of
// player accounts, gated by ADMIN_PASSWORD (server-only env var, never sent
// to the browser except as whatever the admin types into the login form).

import { timingSafeEqual } from 'crypto';

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Returns true on success. On failure, writes the error response itself and
// returns false — callers should `if (!requireAdmin(req, res)) return;`.
export function requireAdmin(req, res) {
  const password = req.headers['x-admin-password'] || '';
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || !password || !safeEqual(password, expected)) {
    res.status(401).json({ error: 'Not authorized' });
    return false;
  }
  return true;
}
