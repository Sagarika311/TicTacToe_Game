// ===============================
// Tic-Tac-Toe Game 
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // Elements
  // -------------------------------
  const els = {
    board: document.getElementById("board"),
    turnIndicator: document.getElementById("turnIndicator"),
    subtle: document.getElementById("subtle"),
    resetBtn: document.getElementById("resetBtn"),
    clearScoreBtn: document.getElementById("clearScore"),
    playerVsComputerToggle: document.getElementById("playerVsComputerToggle"),
    playerVsPlayerToggle: document.getElementById("playerVsPlayerToggle"),
    scoreX: document.getElementById("scoreX"),
    scoreO: document.getElementById("scoreO"),
    scoreT: document.getElementById("scoreT"),
    // sounds
    winSound: document.getElementById("winSound"),
    tieSound: document.getElementById("tieSound"),
    ambientSound: document.getElementById("ambientSound"),
    animatedSound: document.getElementById("animatedSound"),
    musicToggle: document.getElementById("soundToggle"),
    soundToggle1: document.getElementById("soundToggle1"),
    soundEffectsToggle: document.getElementById("soundEffectsToggle"),
    // stickers
    s1: document.getElementById("sticker1"),
    s2: document.getElementById("sticker2"),
  };

  // -------------------------------
  // Game State
  // -------------------------------
  const State = {
    board: Array(9).fill(null),
    running: true,
    turn: "X",
    playerStartsX: true,
    scores: JSON.parse(localStorage.getItem("scores")) || { X: 0, O: 0, T: 0 },
    WIN_COMBINATIONS: [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ],
    soundEffectsEnabled: JSON.parse(localStorage.getItem("soundEffectsEnabled")) ?? true,
    difficulty: localStorage.getItem("difficulty") || "hard"
  };

  // -------------------------------
  // Game Logic
  // -------------------------------
  const Game = {
    renderBoard() {
      els.board.innerHTML = "";
      State.board.forEach((val, i) => {
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.dataset.index = i;
        cell.innerText = val || "";
        cell.disabled = !State.running || !!val;
        if (val) cell.classList.add("disabled");
        cell.addEventListener("click", Game.onCellClick);
        els.board.appendChild(cell);
      });
    },

    onCellClick(e) {
      const idx = Number(e.currentTarget.dataset.index);
      if (!State.running || State.board[idx]) return;

      if (els.playerVsComputerToggle.checked && State.turn !== (State.playerStartsX ? "X" : "O")) return;

      Game.makeMove(idx, State.turn);
      Game.update();

      // Computer move
      if (State.running && els.playerVsComputerToggle.checked && State.turn === (State.playerStartsX ? "O" : "X")) {
        setTimeout(() => {
          const best = AI.findBestMove(State.board, State.turn);
          Game.makeMove(best, State.turn);
          Game.update();
        }, 200);
      }
    },

    makeMove(idx, player) {
      State.board[idx] = player;
    },

    calculateWinner(bd) {
      for (const line of State.WIN_COMBINATIONS) {
        const [a, b, c] = line;
        if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) {
          return { player: bd[a], line };
        }
      }
      return null;
    },

    highlightWin(line) {
      const cells = els.board.querySelectorAll(".cell");
      line.forEach(i => cells[i].classList.add("win"));
      cells.forEach(c => c.disabled = true);
    },

    update() {
      Game.renderBoard();
      const winner = Game.calculateWinner(State.board);

      if (winner) {
        State.running = false;
        Game.highlightWin(winner.line);
        els.turnIndicator.innerText = `Winner: ${winner.player}`;
        els.subtle.innerText = `Player ${winner.player} won!`;
        State.scores[winner.player]++;
        UI.refreshScores();

        Sound.playEffect(els.winSound);
        launchConfetti();
        return;
      }

      if (State.board.every(Boolean)) {
        State.running = false;
        els.turnIndicator.innerText = "Tie";
        els.subtle.innerText = "It's a draw!";
        State.scores.T++;
        UI.refreshScores();

        Sound.playEffect(els.tieSound);
        return;
      }

      State.turn = State.turn === "X" ? "O" : "X";
      els.turnIndicator.innerText = `Turn: ${State.turn}`;
      els.subtle.innerText = els.playerVsComputerToggle.checked
        ? (State.turn === (State.playerStartsX ? "X" : "O") ? "Your move" : "Computer thinking...")
        : "Two-player game";
    },

    reset() {
      stopConfetti(); // ✅ ensure confetti is cleared on restart
      State.board = Array(9).fill(null);
      State.running = true;

      // alternate who starts
      State.playerStartsX = !State.playerStartsX;
      State.turn = State.playerStartsX ? "X" : "O";

      els.turnIndicator.innerText = `Turn: ${State.turn}`;
      
      if (els.playerVsComputerToggle.checked) {
        els.subtle.innerText = "Your move";
      } else {
        els.subtle.innerText = `Two-player game — Player ${State.turn} starts`;
      }

      Game.renderBoard();

      // Only auto-move for computer if needed
      const compSymbol = State.playerStartsX ? "O" : "X";
      if (els.playerVsComputerToggle.checked && compSymbol === "X") {
        setTimeout(() => {
          const best = AI.findBestMove(State.board, "X");
          Game.makeMove(best, "X");
          Game.update();
        }, 200);
      }
    }
  };

  // -------------------------------
  // AI Module with difficulty
  // -------------------------------
  const AI = {
    findBestMove(bd, player) {
      if (State.difficulty === "easy") {
        const empty = bd.map((v, i) => v ? null : i).filter(v => v !== null);
        return empty[Math.floor(Math.random() * empty.length)];
      }

      if (State.difficulty === "medium") {
        if (Math.random() < 0.5) {
          const empty = bd.map((v, i) => v ? null : i).filter(v => v !== null);
          return empty[Math.floor(Math.random() * empty.length)];
        }
      }

      // Hard (perfect minimax)
      if (bd.every(v => v === null)) return 4;

      function score(b) {
        const winner = Game.calculateWinner(b);
        if (winner) return winner.player === player ? 10 : -10;
        if (b.every(Boolean)) return 0;
        return null;
      }

      function minimax(b, isMax) {
        const s = score(b);
        if (s !== null) return { score: s };
        const moves = [];
        for (let i = 0; i < 9; i++) {
          if (!b[i]) {
            const newB = b.slice();
            newB[i] = isMax ? player : (player === "X" ? "O" : "X");
            const result = minimax(newB, !isMax);
            moves.push({ index: i, score: result.score });
          }
        }
        return isMax
          ? moves.reduce((best, m) => m.score > best.score ? m : best)
          : moves.reduce((best, m) => m.score < best.score ? m : best);
      }

      return minimax(bd, true).index;
    }
  };

  // -------------------------------
  // UI Helpers
  // -------------------------------
  const UI = {
    refreshScores() {
      els.scoreX.innerText = `X: ${State.scores.X}`;
      els.scoreO.innerText = `O: ${State.scores.O}`;
      els.scoreT.innerText = `Ties: ${State.scores.T}`;
      localStorage.setItem("scores", JSON.stringify(State.scores));
    }
  };

  // -------------------------------
  // Sound Module
  // -------------------------------
  const Sound = {
    init() {
      els.ambientSound.muted = true;
      els.animatedSound.muted = true;
      els.ambientSound.volume = 0.5;
      els.animatedSound.volume = 0.5;

      UI.updateMusicButton();
      UI.updateSoundButton();
      UI.updateEffectsButton();
    },

    play(el) {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  };

  // -------------------------------
  // Extend Sound Module
  // -------------------------------
  Sound.playEffect = function (el) {
    if (!State.soundEffectsEnabled) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  };

  // Extend UI for sound buttons
  UI.updateMusicButton = function () {
    els.musicToggle.innerText = els.ambientSound.muted ? "🔇 Music Off" : "🔊 Music On";
    els.musicToggle.classList.toggle("sound-active", !els.ambientSound.muted);
  };

  UI.updateSoundButton = function () {
    els.soundToggle1.innerText = els.animatedSound.muted ? "🔇 Sound Off" : "🔊 Sound On";
    els.soundToggle1.classList.toggle("sound-active", !els.animatedSound.muted);
  };

  UI.updateEffectsButton = function () {
    els.soundEffectsToggle.innerText = State.soundEffectsEnabled
      ? "🔊 Sound Effects On"
      : "🔇 Sound Effects Off";
    els.soundEffectsToggle.classList.toggle("sound-active", State.soundEffectsEnabled);
  };

  // -------------------------------
  // Stickers Animation
  // -------------------------------
  function animateSticker(sticker, direction = 1) {
    const stickerWidth = sticker.offsetWidth;
    let pos = parseFloat(sticker.dataset.pos) || 0;
    let dir = parseFloat(sticker.dataset.dir) || direction;

    function step() {
      pos += dir * 2;
      const maxPos = window.innerWidth - stickerWidth - 20;
      if (pos >= maxPos) { dir = -1; pos = maxPos; }
      if (pos <= 0) { dir = 1; pos = 0; }

      sticker.style.transform = `translateX(${pos}px)`;
      sticker.dataset.pos = pos;
      sticker.dataset.dir = dir;
      requestAnimationFrame(step);
    }
    step();
  }

  // -------------------------------
  // Confetti Animation
  // -------------------------------
  let confettiRunning = false;
  let confettiFrame;

  function launchConfetti() {
    const canvas = document.getElementById("confettiCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 0.5 + 0.5,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confetti.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      update();
      confettiFrame = requestAnimationFrame(draw);
    }

    function update() {
      confetti.forEach(p => {
        p.y += p.d * 5;
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });
    }

    confettiRunning = true;
    draw();

    // stop automatically after 3s
    setTimeout(stopConfetti, 3000);
  }

  function stopConfetti() {
  if (!confettiRunning) return;
  const canvas = document.getElementById("confettiCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  cancelAnimationFrame(confettiFrame);
  confettiRunning = false;
  }

  // -------------------------------
  // Event Listeners
  // -------------------------------
  els.clearScoreBtn.addEventListener("click", () => {
    stopConfetti(); // ✅ stop confetti when clearing scores
    State.scores = { X: 0, O: 0, T: 0 };
    UI.refreshScores();
  });

  els.resetBtn.addEventListener("click", () => {
    stopConfetti(); // ✅ stop confetti when resetting
    Game.reset();
  });

  // -------------------------------
  // Game Mode Toggles
  // -------------------------------
  els.playerVsComputerToggle.addEventListener("change", () => {
    if (els.playerVsComputerToggle.checked) {
      // restore difficulty selection
      diffButtons.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.diff === State.difficulty);
      });
    }
    Game.reset();
  });

  els.playerVsPlayerToggle.addEventListener("change", () => {
    if (els.playerVsPlayerToggle.checked) {
      // clear all difficulty highlights
      diffButtons.forEach(btn => btn.classList.remove("active"));
    }
    Game.reset();
  });

  els.musicToggle.addEventListener("click", () => {
    if (els.ambientSound.muted) {
      els.animatedSound.pause();
      els.animatedSound.muted = true;
      UI.updateSoundButton();
      els.ambientSound.muted = false;
      els.ambientSound.play();
    } else {
      els.ambientSound.muted = true;
      els.ambientSound.pause();
    }
    UI.updateMusicButton();
  });

  els.soundToggle1.addEventListener("click", () => {
    if (els.animatedSound.muted) {
      els.ambientSound.pause();
      els.ambientSound.muted = true;
      UI.updateMusicButton();
      els.animatedSound.muted = false;
      els.animatedSound.play();
    } else {
      els.animatedSound.muted = true;
      els.animatedSound.pause();
    }
    UI.updateSoundButton();
  });

  document.addEventListener("click", () => {
    if (!els.ambientSound.muted && els.ambientSound.paused) els.ambientSound.play().catch(() => {});
    if (!els.animatedSound.muted && els.animatedSound.paused) els.animatedSound.play().catch(() => {});
  }, { once: true });

  els.soundEffectsToggle.addEventListener("click", () => {
    State.soundEffectsEnabled = !State.soundEffectsEnabled;
    localStorage.setItem("soundEffectsEnabled", JSON.stringify(State.soundEffectsEnabled));
    UI.updateEffectsButton();
  });

  // -------------------------------
  // Difficulty Toggle
  // -------------------------------
  const diffButtons = document.querySelectorAll(".diff-btn");

  // set initial state
  diffButtons.forEach(btn => {
    if (btn.dataset.diff === State.difficulty) {
      btn.classList.add("active");
    }
  });

  // click handler
  diffButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      State.difficulty = btn.dataset.diff;
      localStorage.setItem("difficulty", State.difficulty);

      // update UI
      diffButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      Game.reset();
    });
  });

  // -------------------------------
  // Initialize Game
  // -------------------------------
  Game.reset();
  UI.refreshScores();
  Sound.init();
  animateSticker(els.s1, 1);
  animateSticker(els.s2, -1);
});


// -------------------------------
// Theme Toggle (Dark/Light)
// -------------------------------
const themeToggle = document.getElementById("themeToggle");

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeToggle.innerText = "☀️ Light Mode";
} else {
  themeToggle.innerText = "🌙 Dark Mode";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});
