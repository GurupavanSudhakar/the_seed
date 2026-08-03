// Vercel serverless function: admin panel — flip a single page's granular
// lock in page_locks. Independent of (and subordinate to) the global
// site_config.locked flag — see docs/schema.sql's page_locks comment and
// public/js/shared.js's isPageLocked(). /login, /signup, /admin are not rows
// in page_locks and can never be locked, so any such page value is rejected.

import { createAdminClient } from '@supabase/server/core';
import { requireAdmin } from '../_lib/require-admin.js';

const LOCKABLE_PAGES = new Set([
  '/', '/chapter1', '/chapter2', '/chapter3', '/chapter4', '/chapter5',
  '/chapter6', '/chapter7', '/credits', '/story-source',
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { page, locked } = req.body || {};
  if (!LOCKABLE_PAGES.has(page)) {
    res.status(400).json({ error: 'page must be one of: ' + [...LOCKABLE_PAGES].join(', ') });
    return;
  }
  if (typeof locked !== 'boolean') {
    res.status(400).json({ error: 'locked must be a boolean' });
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('page_locks')
    .update({ locked })
    .eq('page', page);

  if (error) {
    console.error('toggle page lock failed:', error);
    res.status(500).json({ error: 'Server error updating page lock state' });
    return;
  }

  res.status(200).json({ page, locked });
}
