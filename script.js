(async () => {
    const WORDS = await fetch('words.txt').then(r => r.text()).then(text =>
  text.trim().split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === 5)
);

const VALID = new Set(WORDS);

const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫']
];

let answer, currentRow, currentCol, gameOver;
let keyState = {};
let stats = { played: 0, wins: 0, streak: 0 };

function initBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  for (let r = 0; r < 6; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.id = `row-${r}`;
    for (let c = 0; c < 5; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `tile-${r}-${c}`;
      row.appendChild(tile);
    }
    board.appendChild(row);
  }
}

function initKeyboard() {
  KB_ROWS.forEach((keys, ri) => {
    const row = document.getElementById(`row${ri + 1}`);
    row.innerHTML = '';
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key' + (k.length > 1 ? ' wide' : '');
      btn.textContent = k;
      btn.dataset.key = k;
      btn.id = `key-${k}`;
      btn.addEventListener('click', () => handleKey(k));
      row.appendChild(btn);
    });
  });
}

function startGame() {
  answer = WORDS[Math.floor(Math.random() * WORDS.length)];
  currentRow = 0;
  currentCol = 0;
  gameOver = false;
  keyState = {};
  initBoard();
  initKeyboard();
  document.getElementById('new-game').style.display = 'none';
  updateStats();
}

function handleKey(k) {
  if (gameOver) return;
  if (k === '⌫' || k === 'BACKSPACE') {
    deleteLetter();
  } else if (k === 'ENTER') {
    submitRow();
  } else if (/^[A-Z]$/.test(k)) {
    typeLetter(k);
  }
}

function typeLetter(l) {
  if (currentCol >= 5) return;
  const tile = document.getElementById(`tile-${currentRow}-${currentCol}`);
  tile.textContent = l;
  tile.classList.add('filled');
  currentCol++;
}

function deleteLetter() {
  if (currentCol <= 0) return;
  currentCol--;
  const tile = document.getElementById(`tile-${currentRow}-${currentCol}`);
  tile.textContent = '';
  tile.classList.remove('filled');
}

function submitRow() {
  if (currentCol < 5) {
    shakeRow(currentRow);
    toast('Not enough letters');
    return;
  }
  const guess = Array.from({ length: 5 }, (_, i) =>
    document.getElementById(`tile-${currentRow}-${i}`).textContent
  ).join('');

  if (!VALID.has(guess)) {
    shakeRow(currentRow);
    toast('Not in word list');
    return;
  }

  const result = score(guess, answer);
  revealRow(currentRow, result, guess);

  const won = result.every(r => r === 'correct');
  if (won) {
    setTimeout(() => {
      bounceRow(currentRow);
      toast(["Brilliant!", "Excellent!", "Splendid!", "Great!", "Nice!", "Phew!"][currentRow]);
      stats.wins++;
      stats.streak++;
      stats.played++;
      updateStats();
      setTimeout(() => { document.getElementById('new-game').style.display = 'block'; }, 1000);
    }, 5 * 200 + 400);
    gameOver = true;
  } else if (currentRow === 5) {
    setTimeout(() => {
      toast(answer, 3000);
      stats.played++;
      stats.streak = 0;
      updateStats();
      setTimeout(() => { document.getElementById('new-game').style.display = 'block'; }, 1000);
    }, 5 * 200 + 400);
    gameOver = true;
  }

  currentRow++;
  currentCol = 0;
}

function score(guess, answer) {
  const result = Array(5).fill('absent');
  const ansArr = answer.split('');
  const used = Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guess[i] === ansArr[i]) {
      result[i] = 'correct';
      used[i] = true;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 'correct') {
      for (let j = 0; j < 5; j++) {
        if (!used[j] && guess[i] === ansArr[j]) {
          result[i] = 'present';
          used[j] = true;
          break;
        }
      }
    }
  }
  return result;
}

function revealRow(row, result, guess) {
  const priority = { correct: 3, present: 2, absent: 1 };
  result.forEach((state, i) => {
    const tile = document.getElementById(`tile-${row}-${i}`);
    setTimeout(() => {
      tile.classList.add('reveal');
      setTimeout(() => {
        tile.classList.remove('filled');
        tile.classList.add(state);
        const key = document.getElementById(`key-${guess[i]}`);
        if (key && (priority[state] || 0) > (priority[keyState[guess[i]]] || 0)) {
          key.classList.remove('correct', 'present', 'absent');
          key.classList.add(state);
          keyState[guess[i]] = state;
        }
      }, 250);
    }, i * 200);
  });
}

function shakeRow(row) {
  Array.from({ length: 5 }, (_, i) => {
    const t = document.getElementById(`tile-${row}-${i}`);
    t.classList.remove('shake');
    void t.offsetWidth;
    t.classList.add('shake');
  });
}

function bounceRow(row) {
  Array.from({ length: 5 }, (_, i) => {
    setTimeout(() => {
      const t = document.getElementById(`tile-${row}-${i}`);
      t.classList.add('bounce');
    }, i * 80);
  });
}

let toastTimer;
function toast(msg, dur = 1400) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), dur);
}

function updateStats() {
  document.getElementById('s-played').textContent = stats.played;
  document.getElementById('s-wins').textContent = stats.wins;
  document.getElementById('s-streak').textContent = stats.streak;
}

document.addEventListener('keydown', e => {
  const k = e.key.toUpperCase();
  if (k === 'ENTER' || k === 'BACKSPACE' || /^[A-Z]$/.test(k)) {
    handleKey(k === 'BACKSPACE' ? '⌫' : k);
  }
});

document.getElementById('new-game').addEventListener('click', startGame);

startGame();
})();