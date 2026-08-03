// Vercel serverless function: username-based login.
//
// Supabase Auth only knows email/password — usernames only exist in each
// user's user_metadata (set at signup, see api/signup.js), not in a queryable
// table. So this endpoint uses an admin client (server-only secret key) to
// list the (tiny, invite-only) user set, resolve username -> email, verify
// the password via signInWithPassword, and hand the resulting session tokens
// back to the client to adopt via supabaseClient.auth.setSession().

import { createAdminClient } from '@supabase/server/core';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'Missing username or password' });
    return;
  }

  const admin = createAdminClient();

  const { data: listData, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.error('listUsers failed:', listErr);
    res.status(500).json({ error: 'Server error looking up account' });
    return;
  }

  const match = listData.users.find(
    u => (u.user_metadata && u.user_metadata.username || '').toLowerCase() === username.toLowerCase()
  );
  if (!match) {
    res.status(400).json({ error: 'Wrong username or password' });
    return;
  }

  const { data: signInData, error: signInErr } = await admin.auth.signInWithPassword({
    email: match.email,
    password,
  });
  if (signInErr || !signInData.session) {
    res.status(400).json({ error: 'Wrong username or password' });
    return;
  }

  res.status(200).json({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });
};
