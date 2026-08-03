// Vercel serverless function: admin panel — flip the pre-launch LOCKED flag.
// See public/js/shared.js and api/settings.js.

import { createAdminClient } from '@supabase/server/core';
import { requireAdmin } from '../_lib/require-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { locked } = req.body || {};
  if (typeof locked !== 'boolean') {
    res.status(400).json({ error: 'locked must be a boolean' });
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('site_config')
    .update({ locked })
    .eq('id', true);

  if (error) {
    console.error('toggle lock failed:', error);
    res.status(500).json({ error: 'Server error updating lock state' });
    return;
  }

  res.status(200).json({ locked });
}
