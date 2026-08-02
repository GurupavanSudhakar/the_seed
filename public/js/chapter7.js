// Starts chaotic, mid-chapter tone shift to sincere once Piper is struck down
// (see docs/plan.txt) — toggle body.classList.add('tone-sincere') at that beat.
function showChapter7(){
  clearScreens();
  createAmbient();
  const s = showScreen(`
    <h2>Chapter 7 — Final Battle</h2>
    <p>[TODO: narration + word-unscramble mini-game — see docs/plan.txt]</p>
    <button class="btn" id="nextBtn">Next ➤</button>
  `);
  addRestartBtn(s);
  s.querySelector('#nextBtn').onclick = () => location.href = '/credits';
}
showChapter7();
