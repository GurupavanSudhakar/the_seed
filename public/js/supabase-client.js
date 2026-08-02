// Supabase client + save/load helpers.
//
// SUPABASE_URL/SUPABASE_ANON_KEY are meant to be public (Row Level Security is
// what actually protects data, not secrecy of these values) — see docs/architecture.md.
// Placeholders below until a real Supabase project exists; swap in the real
// values from your project's API settings once it's created.
//
// Requires the Supabase UMD build loaded first via <script> CDN tag, e.g.:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-public-key-here';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Returns { current_chapter, chapter_state } for the logged-in user, or null if
// there's no session or no saved row yet (caller should treat null as "start at Chapter 1").
async function getProgress(){
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabaseClient
    .from('game_progress')
    .select('current_chapter, chapter_state')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('getProgress failed:', error);
    return null;
  }
  return data;
}

// Full-overwrite save of the caller's own progress row (chapters are sequential,
// so there's no need for partial jsonb merge semantics here).
async function saveProgress(currentChapter, chapterState){
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return { error: 'not logged in' };

  const { error } = await supabaseClient
    .from('game_progress')
    .update({
      current_chapter: currentChapter,
      chapter_state: chapterState,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', session.user.id);

  if (error) console.error('saveProgress failed:', error);
  return { error };
}

async function requireLogin(){
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) location.href = '/login';
  return session;
}
