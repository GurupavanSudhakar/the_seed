// public/admin.html wiring. Depends on shared.js for $/clearScreens/showScreen.
// Auth is a single shared password (see api/_lib/require-admin.js) — not a
// Supabase session — remembered in sessionStorage so it clears when the
// tab/browser closes, and sent as x-admin-password on every /api/admin/* call.

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

async function adminFetch(path, options = {}) {
  const password = sessionStorage.getItem('adminPassword') || '';
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
      ...(options.headers || {}),
    },
  });
  return res;
}

function initAdminPage() {
  clearScreens();
  if (sessionStorage.getItem('adminPassword')) {
    loadDashboard().then(ok => { if (!ok) showAdminLoginForm(); });
  } else {
    showAdminLoginForm();
  }
}

function showAdminLoginForm() {
  clearScreens();
  const s = showScreen(`
    <div class="admin-panel">
      <h1 class="admin-title">Admin</h1>
      <form class="auth-form" id="adminLoginForm">
        <input type="password" id="adminPasswordInput" placeholder="Password" required autocomplete="current-password">
        <div class="error" id="adminLoginError"></div>
        <button class="btn" type="submit">Enter</button>
      </form>
    </div>
  `);

  s.querySelector('#adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = s.querySelector('#adminLoginError');
    errEl.textContent = '';
    const password = s.querySelector('#adminPasswordInput').value;

    let res;
    try {
      res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
    } catch (err) {
      errEl.textContent = 'Could not reach the server. Try again.';
      return;
    }

    if (!res.ok) {
      errEl.textContent = 'Wrong password.';
      return;
    }

    sessionStorage.setItem('adminPassword', password);
    const ok = await loadDashboard();
    if (!ok) showAdminLoginForm();
  });
}

// Returns true on success (dashboard rendered), false if the stored password
// was rejected (caller should fall back to the login form).
async function loadDashboard() {
  let res;
  try {
    res = await adminFetch('/api/admin/dashboard');
  } catch (err) {
    clearScreens();
    showScreen('<div class="admin-panel"><p>Could not reach the server.</p></div>');
    return true; // not a bad-password case, don't kick back to the login form
  }

  if (res.status === 401) {
    sessionStorage.removeItem('adminPassword');
    return false;
  }

  const data = await res.json();
  renderDashboard(data);
  return true;
}

function renderDashboard(data) {
  clearScreens();
  const s = showScreen(`
    <div class="admin-panel">
      <h1 class="admin-title">Admin</h1>

      <div class="admin-section">
        <h2>Site lock</h2>
        <div class="lock-row">
          <input type="checkbox" id="lockToggle" ${data.locked ? 'checked' : ''}>
          <label for="lockToggle">Locked (redirects every page except /signup, /login, /admin)</label>
        </div>
      </div>

      <div class="admin-section">
        <h2>Users (${data.users.length})</h2>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr>
              <th>Username</th><th>Email</th><th>Chapter</th><th>Created</th><th>Last login</th><th></th>
            </tr></thead>
            <tbody>
              ${data.users.map(u => `
                <tr>
                  <td>${escapeHtml(u.username) || '—'}</td>
                  <td>${escapeHtml(u.email)}</td>
                  <td>${u.current_chapter ?? '—'}</td>
                  <td>${fmtDate(u.created_at)}</td>
                  <td>${fmtDate(u.last_sign_in_at)}</td>
                  <td>
                    <button class="mini-btn neutral" data-reset="${escapeHtml(u.id)}">Reset progress</button>
                    <button class="mini-btn danger" data-delete="${escapeHtml(u.id)}" data-username="${escapeHtml(u.username || u.email)}">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="admin-section">
        <h2>Invite codes (${data.invites.length})</h2>
        <form class="generate-form" id="generateForm">
          <input type="number" id="generateCount" min="1" max="20" value="1">
          <button class="btn" type="submit" style="margin-top:0;padding:8px 20px;">Generate</button>
        </form>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr>
              <th>Code</th><th>Used</th><th>Used by</th><th>Created</th><th></th>
            </tr></thead>
            <tbody>
              ${data.invites.map(i => `
                <tr>
                  <td>${escapeHtml(i.code)}</td>
                  <td>${i.used ? 'yes' : 'no'}</td>
                  <td>${escapeHtml(i.used_by_username) || '—'}</td>
                  <td>${fmtDate(i.created_at)}</td>
                  <td>${!i.used ? `<button class="mini-btn danger" data-revoke="${escapeHtml(i.code)}">Revoke</button>` : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `);

  s.querySelector('#lockToggle').addEventListener('change', async (e) => {
    const locked = e.target.checked;
    e.target.disabled = true;
    await adminFetch('/api/admin/toggle-lock', {
      method: 'POST',
      body: JSON.stringify({ locked }),
    });
    e.target.disabled = false;
  });

  s.querySelectorAll('[data-reset]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Reset this user’s progress to Chapter 1?')) return;
      await adminFetch('/api/admin/reset-progress', {
        method: 'POST',
        body: JSON.stringify({ userId: btn.dataset.reset }),
      });
      loadDashboard();
    });
  });

  s.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Delete account "${btn.dataset.username}"? This frees their invite code for reuse.`)) return;
      await adminFetch('/api/admin/delete-user', {
        method: 'POST',
        body: JSON.stringify({ userId: btn.dataset.delete }),
      });
      loadDashboard();
    });
  });

  s.querySelectorAll('[data-revoke]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Revoke unused code "${btn.dataset.revoke}"?`)) return;
      await adminFetch('/api/admin/revoke-invite', {
        method: 'POST',
        body: JSON.stringify({ code: btn.dataset.revoke }),
      });
      loadDashboard();
    });
  });

  s.querySelector('#generateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const count = Number(s.querySelector('#generateCount').value);
    await adminFetch('/api/admin/generate-invites', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
    loadDashboard();
  });
}
