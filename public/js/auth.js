// login.html / signup.html form wiring. Depends on supabase-client.js being
// loaded first (for supabaseClient) and shared.js (for showScreen helpers, if used).

function wireLoginForm(){
  const form = $('loginForm');
  const errEl = $('loginError');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      errEl.textContent = 'Wrong email or password.';
      return;
    }
    location.href = '/';
  });
}

function wireSignupForm(){
  const form = $('signupForm');
  const errEl = $('signupError');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const email = $('signupEmail').value.trim();
    const password = $('signupPassword').value;
    const inviteCode = $('signupInviteCode').value.trim();

    let res;
    try {
      res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, inviteCode }),
      });
    } catch (err) {
      errEl.textContent = 'Could not reach the server. Try again.';
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errEl.textContent = body.error || 'Could not create account.';
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      errEl.textContent = 'Account created — log in from the login page.';
      return;
    }
    location.href = '/';
  });
}
