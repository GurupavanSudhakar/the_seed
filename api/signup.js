// Vercel serverless function: invite-code-gated account creation.
//
// Real signup can't happen client-side (nothing would stop someone from calling
// supabase.auth.signUp() directly and skipping the invite check), so this function
// uses an admin client (server-only secret key, never sent to the browser) to
// atomically claim an invite code before creating the account. See docs/architecture.md.
//
// This endpoint has to stay callable by anyone with an invite code (there's no
// user session yet at signup time), so it doesn't go through @supabase/server's
// withSupabase/auth-mode wrapper — it just uses createAdminClient() directly for
// the elevated queries, per that package's guidance for admin-only access with
// no specific inbound auth mode required.

const { createAdminClient } = require('@supabase/server/core');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email, password, inviteCode } = req.body || {};
  if (!email || !password || !inviteCode) {
    res.status(400).json({ error: 'Missing email, password, or invite code' });
    return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const admin = createAdminClient();

  // 1. Atomically claim the invite code — zero rows back means it was already
  //    used or never existed. This has to happen before any account is created.
  const { data: claimed, error: claimErr } = await admin
    .from('invite_codes')
    .update({ used: true })
    .eq('code', inviteCode)
    .eq('used', false)
    .select('code');

  if (claimErr) {
    console.error('invite code claim failed:', claimErr);
    res.status(500).json({ error: 'Server error validating invite code' });
    return;
  }
  if (!claimed || claimed.length === 0) {
    res.status(400).json({ error: 'Invalid or already-used invite code' });
    return;
  }

  // 2. Create the user via the Admin API. No email verification flow needed
  //    for a two-person invite-only game.
  const { data: userData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    // Best-effort revert so the code isn't burned on an edge case (e.g. email
    // already registered) — not blocking the error response either way.
    await admin.from('invite_codes').update({ used: false }).eq('code', inviteCode);
    console.error('user creation failed:', createErr);
    res.status(500).json({ error: 'Could not create account' });
    return;
  }

  const userId = userData.user.id;

  // 3. Record which user claimed the code.
  await admin.from('invite_codes').update({ used_by: userId }).eq('code', inviteCode);

  // 4. Seed a starting game_progress row. Non-fatal if it fails — getProgress()
  //    on the client already treats "no row" as "start at Chapter 1".
  const { error: progressErr } = await admin.from('game_progress').insert({
    user_id: userId,
    current_chapter: 1,
    chapter_state: {},
  });
  if (progressErr) {
    console.error('game_progress seed failed:', progressErr);
  }

  res.status(200).json({ ok: true });
};
