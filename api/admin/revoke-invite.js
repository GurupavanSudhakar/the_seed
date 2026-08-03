// Vercel serverless function: admin panel — revoke an unused invite code
// (e.g. one that leaked before anyone claimed it). Revoking an already-used
// code isn't supported here — delete-user.js is what frees a used code back
// up for reissue.

import { createAdminClient } from '@supabase/server/core';
import { requireAdmin } from '../_lib/require-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { code } = req.body || {};
  if (!code) {
    res.status(400).json({ error: 'Missing code' });
    return;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('invite_codes')
    .delete()
    .eq('code', code)
    .eq('used', false)
    .select('code');

  if (error) {
    console.error('revoke invite failed:', error);
    res.status(500).json({ error: 'Server error revoking invite code' });
    return;
  }
  if (!data || data.length === 0) {
    res.status(400).json({ error: "Code already used or doesn't exist" });
    return;
  }

  res.status(200).json({ ok: true });
}
