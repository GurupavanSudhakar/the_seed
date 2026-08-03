// Sincere beat — tone flag forces no taunts/jokes here (see docs/plan.txt).
function showChapter6(){
  clearScreens();
  createAmbient();
  const s = showScreen(`
    <h2>Chapter 6 — The Kiss</h2>
    <p>[TODO: narration + hold-button (heartbeat) mini-game — see docs/plan.txt]</p>
    <button class="btn" id="nextBtn">Next ➤</button>
  `);
  addRestartBtn(s);
  s.querySelector('#nextBtn').onclick = () => location.href = '/chapter7';
}
requireSession(showChapter6);
