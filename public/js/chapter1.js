function showChapter1(){
  clearScreens();
  createAmbient();
  const s = showScreen(`
    <h2>Chapter 1 — The Breeze</h2>
    <p>[TODO: narration content — see docs/plan.txt]</p>
    <button class="btn" id="nextBtn">Next ➤</button>
  `);
  addRestartBtn(s);
  s.querySelector('#nextBtn').onclick = () => location.href = '/chapter2';
}
showChapter1();
