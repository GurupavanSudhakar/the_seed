// Vercel serverless function: admin panel — generate new invite codes.

import { randomInt } from 'crypto';
import { createAdminClient } from '@supabase/server/core';
import { requireAdmin } from '../_lib/require-admin.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I, easier to read aloud
const MAX_COUNT = 20;

function randomCode() {
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += CHARS[randomInt(CHARS.length)];
  return `SEED-${suffix}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const count = Number(req.body && req.body.count);
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    res.status(400).json({ error: `count must be an integer between 1 and ${MAX_COUNT}` });
    return;
  }

  const admin = createAdminClient();
  const codes = Array.from({ length: count }, () => ({ code: randomCode() }));

  const { data, error } = await admin.from('invite_codes').insert(codes).select();
  if (error) {
    console.error('generate invites failed:', error);
    res.status(500).json({ error: 'Server error generating invite codes' });
    return;
  }

  res.status(200).json({ invites: data });
}
