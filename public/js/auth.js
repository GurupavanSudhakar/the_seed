// login.html / signup.html form wiring. Depends on supabase-client.js being
// loaded first (for supabaseClient) and shared.js (for showScreen helpers, if used).

function wireLoginForm(){
  const form = $('loginForm');
  const errEl = $('loginError');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const username = $('loginUsername').value.trim();
    const password = $('loginPassword').value;

    let res;
    try {
      res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch (err) {
      errEl.textContent = 'Could not reach the server. Try again.';
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errEl.textContent = body.error || 'Wrong username or password.';
      return;
    }

    const { access_token, refresh_token } = await res.json();
    const { error } = await supabaseClient.auth.setSession({ access_token, refresh_token });
    if (error) {
      errEl.textContent = 'Could not log in. Try again.';
      return;
    }
    location.href = '/';
  });
}

// onSuccess is called after account creation instead of signing the user in —
// signup and login are deliberately separate links (see docs/architecture.md),
// so this never creates a session or redirects.
function wireSignupForm(onSuccess){
  const form = $('signupForm');
  const errEl = $('signupError');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const username = $('signupUsername').value.trim();
    const email = $('signupEmail').value.trim();
    const password = $('signupPassword').value;
    const inviteCode = $('signupInviteCode').value.trim();

    let res;
    try {
      res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, inviteCode }),
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

    onSuccess();
  });
}
