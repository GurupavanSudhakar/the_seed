// Vercel serverless function: public read-only site settings — the pre-launch
// LOCKED flag plus per-page granular locks (public/js/shared.js fetches this
// on every page load). No auth — it only reveals booleans; writes go through
// the password-gated api/admin/toggle-lock.js and toggle-page-lock.js.

import { createAdminClient } from '@supabase/server/core';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const admin = createAdminClient();
  const [{ data, error }, { data: pageRows, error: pageErr }] = await Promise.all([
    admin.from('site_config').select('locked').eq('id', true).maybeSingle(),
    admin.from('page_locks').select('page, locked'),
  ]);

  if (error || pageErr) {
    console.error('settings load failed:', error || pageErr);
    // Fail locked rather than leaking the game if this call breaks.
    res.status(200).json({ locked: true, pageLocks: {} });
    return;
  }

  const pageLocks = Object.fromEntries((pageRows || []).map(r => [r.page, r.locked]));
  res.status(200).json({ locked: data ? data.locked : true, pageLocks });
}
