// Vercel serverless function: admin panel data — all users (joined with their
// game_progress), all invite codes (with used_by resolved to a username), and
// the current site_config.locked value. See api/_lib/require-admin.js.

import { createAdminClient } from '@supabase/server/core';
import { requireAdmin } from '../_lib/require-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const admin = createAdminClient();

  const [{ data: listData, error: listErr }, { data: progressRows, error: progressErr }, { data: inviteRows, error: inviteErr }, { data: configRow, error: configErr }] =
    await Promise.all([
      admin.auth.admin.listUsers(),
      admin.from('game_progress').select('*'),
      admin.from('invite_codes').select('*').order('created_at'),
      admin.from('site_config').select('locked').eq('id', true).maybeSingle(),
    ]);

  if (listErr || progressErr || inviteErr || configErr) {
    console.error('dashboard load failed:', listErr || progressErr || inviteErr || configErr);
    res.status(500).json({ error: 'Server error loading dashboard' });
    return;
  }

  const progressByUser = new Map(progressRows.map(p => [p.user_id, p]));
  const usernameById = new Map(
    listData.users.map(u => [u.id, u.user_metadata && u.user_metadata.username])
  );

  const users = listData.users.map(u => {
    const progress = progressByUser.get(u.id);
    return {
      id: u.id,
      username: u.user_metadata && u.user_metadata.username,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      current_chapter: progress ? progress.current_chapter : null,
      chapter_state: progress ? progress.chapter_state : null,
    };
  });

  const invites = inviteRows.map(i => ({
    code: i.code,
    used: i.used,
    used_by: i.used_by,
    used_by_username: i.used_by ? usernameById.get(i.used_by) || null : null,
    created_at: i.created_at,
  }));

  res.status(200).json({ users, invites, locked: configRow ? configRow.locked : true });
}
