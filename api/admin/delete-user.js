// Vercel serverless function: admin panel — delete a user account.
// Frees up their invite code for reuse first (and avoids an FK error, since
// invite_codes.used_by -> auth.users(id) has no ON DELETE action), then
// deletes the user (cascades their game_progress row). See docs/schema.sql.

import { createAdminClient } from '@supabase/server/core';
import { requireAdmin } from '../_lib/require-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { userId } = req.body || {};
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }

  const admin = createAdminClient();

  const { error: freeErr } = await admin
    .from('invite_codes')
    .update({ used: false, used_by: null })
    .eq('used_by', userId);
  if (freeErr) {
    console.error('freeing invite code failed:', freeErr);
    res.status(500).json({ error: 'Server error freeing invite code' });
    return;
  }

  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
  if (deleteErr) {
    console.error('delete user failed:', deleteErr);
    res.status(500).json({ error: 'Server error deleting user' });
    return;
  }

  res.status(200).json({ ok: true });
}
