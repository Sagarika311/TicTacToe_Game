const boardEl = document.getElementById('board');
const turnIndicator = document.getElementById('turnIndicator');
const subtle = document.getElementById('subtle');
const playerVsComputerToggle = document.getElementById('playerVsComputerToggle');
const playerVsPlayerToggle = document.getElementById('playerVsPlayerToggle');
const resetBtn = document.getElementById('resetBtn');
const clearScoreBtn = document.getElementById('clearScore');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreT = document.getElementById('scoreT');

const WIN_COMBINATIONS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let board = Array(9).fill(null);
let running = true;
let turn = 'X';
let playerStartsX = true;
let scores = { X:0, O:0, T:0 };

function renderBoard(){
  boardEl.innerHTML = '';
  for(let i=0;i<9;i++){
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.innerText = board[i]||'';
    cell.disabled = !running || !!board[i];
    if(board[i]) cell.classList.add('disabled');
    cell.addEventListener('click', onCellClick);
    boardEl.appendChild(cell);
  }
}

function onCellClick(e){
  const idx = Number(e.currentTarget.dataset.index);
  if(!running || board[idx]) return;

  if(playerVsComputerToggle.checked && turn !== (playerStartsX ? 'X' : 'O')) return;

  makeMove(idx, turn);
  update();

  if(running && playerVsComputerToggle.checked && turn === (playerStartsX ? 'O' : 'X')){
    setTimeout(()=> {
      const best = findBestMove(board, turn);
      makeMove(best, turn);
      update();
    }, 200);
  }
}

function makeMove(idx, player){
  board[idx] = player;
}

const winSound = document.getElementById("winSound");
const tieSound = document.getElementById("tieSound");

function update(){
  renderBoard();
  const winner = calculateWinner(board);
  if(winner){
    running = false;
    highlightWin(winner.line);
    turnIndicator.innerText = `Winner: ${winner.player}`;
    subtle.innerText = `Player ${winner.player} won!`;
    scores[winner.player]++;
    refreshScores();

      // 🔊 Play win sound
  winSound.currentTime = 0;
  winSound.play().catch(() => {});

    return;
  }
  if(board.every(Boolean)){
    running = false;
    turnIndicator.innerText = 'Tie';
    subtle.innerText = 'It\'s a draw!';
    scores.T++;
    refreshScores();

    // 🔊 Play tie sound
  tieSound.currentTime = 0;
  tieSound.play().catch(() => {});
  
    return;
  }

  turn = turn === 'X' ? 'O' : 'X';
  const playerSymbol = playerStartsX ? 'X' : 'O';
  turnIndicator.innerText = `Turn: ${turn}`;

  if(playerVsComputerToggle.checked){
    subtle.innerText = (turn === playerSymbol) ? 'Your move' : 'Computer thinking...';
  } else {
    subtle.innerText = 'Two-player game';
  }
}

function calculateWinner(bd){
  for(const line of WIN_COMBINATIONS){
    const [a,b,c] = line;
    if(bd[a] && bd[a]===bd[b] && bd[a]===bd[c]) return {player: bd[a], line};
  }
  return null;
}

function highlightWin(line){
  const cells = boardEl.querySelectorAll('.cell');
  line.forEach(i=>cells[i].classList.add('win'));
  cells.forEach(c=>c.disabled = true);
}

function refreshScores(){
  scoreX.innerText = `X: ${scores.X}`;
  scoreO.innerText = `O: ${scores.O}`;
  scoreT.innerText = `Ties: ${scores.T}`;
}

function resetGame(){
  board = Array(9).fill(null);
  running = true;
  playerStartsX = !playerStartsX;
  turn = 'X';
  turnIndicator.innerText = `Turn: ${turn}`;

  if(playerVsComputerToggle.checked){
    subtle.innerText = 'Your move';
  } else {
    subtle.innerText = 'Two-player game';
  }

  renderBoard();

  const compSymbol = playerStartsX ? 'O' : 'X';
  if(playerVsComputerToggle.checked && compSymbol === 'X'){
    setTimeout(()=> {
      const best = findBestMove(board, 'X');
      makeMove(best, 'X');
      update();
    }, 200);
  }
}

function findBestMove(bd, player){
  if(bd.every(v=>v===null)) return 4;
  function score(b){
    const winner = calculateWinner(b);
    if(winner) return winner.player === player ? 10 : -10;
    if(b.every(Boolean)) return 0;
    return null;
  }
  function minimax(b, isMax){
    const s = score(b);
    if(s !== null) return {score: s};
    const moves = [];
    for(let i=0;i<9;i++){
      if(!b[i]){
        const newB = b.slice(); newB[i] = isMax ? player : (player==='X'?'O':'X');
        const result = minimax(newB, !isMax);
        moves.push({index:i, score: result.score});
      }
    }
    return isMax ? moves.reduce((best,m)=> m.score>best.score?m:best) 
                 : moves.reduce((best,m)=> m.score<best.score?m:best);
  }
  return minimax(bd, true).index;
}

resetBtn.addEventListener('click', resetGame);
clearScoreBtn.addEventListener('click', ()=>{ scores = {X:0,O:0,T:0}; refreshScores(); });
playerVsComputerToggle.addEventListener('change', resetGame);
playerVsPlayerToggle.addEventListener('change', resetGame);

resetGame();
refreshScores();

// --- Audio Elements ---
const ambientSound = document.getElementById("ambientSound");
const animatedSound = document.getElementById("animatedSound");

// --- Buttons ---
const musicToggle = document.getElementById("soundToggle");
const soundToggle1 = document.getElementById("soundToggle1");

// --- Initialize ---
ambientSound.muted = true;
animatedSound.muted = true;
ambientSound.volume = 0.5;
animatedSound.volume = 0.5;

// --- Helper Functions ---
function updateMusicButton() {
  musicToggle.innerText = ambientSound.muted ? "🔇 Music Off" : "🔊 Music On";
  musicToggle.classList.toggle("sound-active", !ambientSound.muted);
}

function updateSoundButton() {
  soundToggle1.innerText = animatedSound.muted ? "🔇 Sound Off" : "🔊 Sound On";
  soundToggle1.classList.toggle("sound-active", !animatedSound.muted);
}

// --- Music Toggle ---
musicToggle.addEventListener("click", () => {
  if (ambientSound.muted) {
    animatedSound.pause();
    animatedSound.muted = true;
    updateSoundButton();

    ambientSound.muted = false;
    ambientSound.play();
  } else {
    ambientSound.muted = true;
    ambientSound.pause();
  }
  updateMusicButton();
});

// --- Animated Sound Toggle ---
soundToggle1.addEventListener("click", () => {
  if (animatedSound.muted) {
    ambientSound.pause();
    ambientSound.muted = true;
    updateMusicButton();

    animatedSound.muted = false;
    animatedSound.play();
  } else {
    animatedSound.muted = true;
    animatedSound.pause();
  }
  updateSoundButton();
});

// --- First user interaction for autoplay compliance ---
document.addEventListener(
  "click",
  () => {
    if (!ambientSound.muted && ambientSound.paused) ambientSound.play().catch(() => {});
    if (!animatedSound.muted && animatedSound.paused) animatedSound.play().catch(() => {});
  },
  { once: true }
);

updateMusicButton();
updateSoundButton();

// --- Stickers ---
// Stickers move left-right within viewport width
const s1 = document.getElementById("sticker1");
const s2 = document.getElementById("sticker2");

function animateSticker(sticker, direction = 1) {
  const stickerWidth = sticker.offsetWidth;
  let pos = parseFloat(sticker.dataset.pos) || 0;
  let dir = parseFloat(sticker.dataset.dir) || direction;

  function step() {
    pos += dir * 2; // speed
    const maxPos = window.innerWidth - stickerWidth - 20; // 20px padding from edge

    if (pos >= maxPos) { dir = -1; pos = maxPos; }
    if (pos <= 0) { dir = 1; pos = 0; }

    sticker.style.transform = `translateX(${pos}px)`;
    sticker.dataset.pos = pos;
    sticker.dataset.dir = dir;

    requestAnimationFrame(step);
  }
  step();
}

// Start animations
animateSticker(s1, 1); // Sticker1 moves right first
animateSticker(s2, -1); // Sticker2 moves left first
