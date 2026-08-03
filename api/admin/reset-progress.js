// Vercel serverless function: admin panel — reset a user's progress back to
// Chapter 1 without touching their account.

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
  const { error } = await admin
    .from('game_progress')
    .update({ current_chapter: 1, chapter_state: {} })
    .eq('user_id', userId);

  if (error) {
    console.error('reset progress failed:', error);
    res.status(500).json({ error: 'Server error resetting progress' });
    return;
  }

  res.status(200).json({ ok: true });
}
