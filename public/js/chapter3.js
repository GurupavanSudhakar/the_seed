function showChapter3(){
  clearScreens();
  createAmbient();
  const s = showScreen(`
    <h2>Chapter 3 — Underworld Fall</h2>
    <p>[TODO: narration + countdown-dodge mini-game — see docs/plan.txt]</p>
    <button class="btn" id="nextBtn">Next ➤</button>
  `);
  addRestartBtn(s);
  s.querySelector('#nextBtn').onclick = () => location.href = '/chapter4';
}
requireSession(showChapter3);
