// Vercel serverless function: public read-only site settings. Currently just
// the pre-launch LOCKED flag (public/js/shared.js fetches this on every page
// load). No auth — it only reveals a boolean; writes go through the
// password-gated api/admin/toggle-lock.js.

import { createAdminClient } from '@supabase/server/core';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('site_config')
    .select('locked')
    .eq('id', true)
    .maybeSingle();

  if (error) {
    console.error('settings load failed:', error);
    // Fail locked rather than leaking the game if this call breaks.
    res.status(200).json({ locked: true });
    return;
  }

  res.status(200).json({ locked: data ? data.locked : true });
}
