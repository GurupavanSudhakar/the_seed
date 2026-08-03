function showChapter2(){
  clearScreens();
  createAmbient();
  const s = showScreen(`
    <h2>Chapter 2 — Desert Trek</h2>
    <p>[TODO: narration + heat-meter mini-game — see docs/plan.txt]</p>
    <button class="btn" id="nextBtn">Next ➤</button>
  `);
  addRestartBtn(s);
  s.querySelector('#nextBtn').onclick = () => location.href = '/chapter3';
}
requireSession(showChapter2);
