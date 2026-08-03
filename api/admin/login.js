// Vercel serverless function: admin panel login. Just confirms the shared
// admin password is correct — see api/_lib/require-admin.js and
// docs/architecture.md's admin panel notes. No session/token is issued; the
// client remembers the password itself in sessionStorage.

import { requireAdmin } from '../_lib/require-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { password } = req.body || {};
  req.headers['x-admin-password'] = password || '';
  if (!requireAdmin(req, res)) return;

  res.status(200).json({ ok: true });
}
