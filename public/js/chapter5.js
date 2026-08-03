function showChapter5(){
  clearScreens();
  createAmbient();
  const s = showScreen(`
    <h2>Chapter 5 — Training Montage</h2>
    <p>[TODO: narration + whack-a-mole mini-game — see docs/plan.txt]</p>
    <button class="btn" id="nextBtn">Next ➤</button>
  `);
  addRestartBtn(s);
  s.querySelector('#nextBtn').onclick = () => location.href = '/chapter6';
}
requireSession(showChapter5);
