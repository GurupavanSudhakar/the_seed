function showChapter4(){
  clearScreens();
  createAmbient();
  const s = showScreen(`
    <h2>Chapter 4 — Pipy's Rescue</h2>
    <p>[TODO: narration + trick-button mini-game — see docs/plan.txt]</p>
    <button class="btn" id="nextBtn">Next ➤</button>
  `);
  addRestartBtn(s);
  s.querySelector('#nextBtn').onclick = () => location.href = '/chapter5';
}
requireSession(showChapter4);
