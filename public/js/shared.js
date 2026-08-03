// Shared screen/navigation helpers for The Seed Chronicles.
// Ported from docs/valentine.html (clearScreens/showScreen/showOverlay/addRestartBtn)
// and seed_chronicles.html (createAmbient/seedSVG), merged for the multi-page site.
//
// Each page is responsible for calling createAmbient() itself once on load —
// there's no persistent app shell across page navigations anymore.

const $ = id => document.getElementById(id);
const app = $('app');

// Single flag controlling whether the game is publicly revealed yet.
// Flip to false + redeploy on launch day. Every page except /signup itself
// redirects there while locked, since it's the only link ever shared.
const LOCKED = true;
if (LOCKED && location.pathname !== '/signup' && location.pathname !== '/signup.html') {
  location.replace('/signup');
}

function clearScreens(){
  app.querySelectorAll('.screen,.overlay').forEach(e=>e.remove());
}

function showScreen(html, cls=''){
  const d = document.createElement('div');
  d.className = 'screen active ' + cls;
  d.innerHTML = html;
  app.appendChild(d);
  return d;
}

function showOverlay(lines, duration, cb){
  const d = document.createElement('div');
  d.className = 'overlay';
  d.style.opacity = '0';
  d.style.transition = 'opacity 0.4s';
  app.appendChild(d);
  requestAnimationFrame(() => d.style.opacity = '1');
  let i = 0;
  function next(){
    if (i >= lines.length){
      setTimeout(() => {
        d.style.opacity = '0';
        setTimeout(() => { d.remove(); if (cb) cb(); }, 400);
      }, duration);
      return;
    }
    const tag = i === 0 ? 'h2' : 'p';
    const el = document.createElement(tag);
    el.textContent = lines[i];
    el.style.opacity = '0'; el.style.transition = 'opacity 0.4s';
    d.appendChild(el);
    requestAnimationFrame(() => el.style.opacity = '1');
    i++;
    setTimeout(next, 1200);
  }
  next();
}

function addRestartBtn(screen){
  const b = document.createElement('button');
  b.className = 'restart-btn';
  b.textContent = '↩ Return to start';
  // Multi-page site now — no in-page showLanding() to call back into.
  b.onclick = () => location.href = '/';
  screen.appendChild(b);
}

// ===== Ambient background: floating leaves + sun glow =====
function createAmbient(){
  const leafC = document.createElement('div');
  leafC.className = 'leaves-bg';
  const emojis = ['🍃', '🌿', '🍂'];
  for (let i = 0; i < 12; i++){
    const l = document.createElement('div');
    l.className = 'leaf-float';
    l.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    l.style.top = Math.random() * 80 + '%';
    l.style.left = '-10vw';
    l.style.animationDuration = (10 + Math.random() * 10) + 's';
    l.style.animationDelay = (-Math.random() * 20) + 's';
    l.style.fontSize = (16 + Math.random() * 14) + 'px';
    leafC.appendChild(l);
  }
  app.appendChild(leafC);

  const sun = document.createElement('div');
  sun.className = 'sun-glow';
  app.appendChild(sun);

  const grass = document.createElement('div');
  grass.className = 'grass-strip';
  app.appendChild(grass);
}

// ===== Seed character SVG =====
// Not currently used anywhere (superseded by the Zelda-BOTW-style title screen —
// see docs/plan.txt VERSION LOG) but kept around for chapter pages, since the
// story plan has the seed character evolving visually chapter to chapter.
function seedSVG(){
  return `
  <svg viewBox="0 0 150 180" xmlns="http://www.w3.org/2000/svg">
    <!-- leaf sprout -->
    <g class="leaf-part">
      <path d="M70 55 C 40 45, 20 15, 45 5 C 60 25, 65 40, 70 55 Z" fill="#4CAF6B"/>
      <path d="M70 55 C 40 48, 38 30, 45 6" stroke="#3a8a54" stroke-width="1.5" fill="none"/>
    </g>
    <!-- seed body -->
    <ellipse cx="75" cy="115" rx="48" ry="55" fill="#C98A4B"/>
    <ellipse cx="75" cy="115" rx="48" ry="55" fill="url(#shine)" opacity="0.5"/>
    <path d="M75 60 C 90 80, 92 150, 75 170 C 58 150, 60 80, 75 60 Z" fill="#B8783D" opacity="0.4"/>
    <!-- eyes -->
    <ellipse class="eye left" cx="60" cy="108" rx="5" ry="7" fill="#2A1608"/>
    <ellipse class="eye right" cx="88" cy="108" rx="5" ry="7" fill="#2A1608"/>
    <!-- blush -->
    <ellipse cx="52" cy="122" rx="7" ry="4" fill="#E8A87C" opacity="0.6"/>
    <ellipse cx="98" cy="122" rx="7" ry="4" fill="#E8A87C" opacity="0.6"/>
    <!-- smile -->
    <path d="M65 130 Q75 140, 85 130" stroke="#2A1608" stroke-width="3" fill="none" stroke-linecap="round"/>
    <defs>
      <radialGradient id="shine" cx="35%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
  </svg>`;
}
