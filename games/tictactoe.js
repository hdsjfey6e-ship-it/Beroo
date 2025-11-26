// Tic-Tac-Toe Game Logic

let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttCurrentPlayer = 'X';
let tttGameActive = true;
let tttMode = 'AI'; // 'AI' or 'PVP'

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let tttDifficulty = 'HARD'; // 'EASY' or 'HARD'

function initTicTacToe() {
    const bestScore = scoreMgr.getScore('tictactoe');

    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <div class="ttt-header">
            <h2>إكس أو</h2>
            <div class="score-board">
                <p class="best-score">مرات الفوز: <span>${bestScore}</span></p>
            </div>
            
            <div class="ttt-settings" style="margin-bottom: 1rem;">
                <label style="color: #ccc; margin-left: 10px;">المستوى:</label>
                <select id="ttt-difficulty" onchange="setTTTDifficulty(this.value)" style="padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--primary-color);">
                    <option value="EASY" ${tttDifficulty === 'EASY' ? 'selected' : ''}>سهل (عشوائي)</option>
                    <option value="HARD" ${tttDifficulty === 'HARD' ? 'selected' : ''}>صعب (ذكاء خارق)</option>
                </select>
                <button class="btn-sm" onclick="showInstructions('tictactoe')" style="margin-right: 10px;"><i class="fas fa-info-circle"></i></button>
            </div>

            <div class="ttt-controls">
                <button class="btn-sm ${tttMode === 'AI' ? 'active' : ''}" onclick="setTTTMode('AI')">ضد الكمبيوتر</button>
                <button class="btn-sm ${tttMode === 'PVP' ? 'active' : ''}" onclick="setTTTMode('PVP')">لاعبين</button>
            </div>
            <p id="ttt-status">دور اللاعب X</p>
        </div>
        <div class="ttt-grid" id="ttt-grid"></div>
        <button class="btn" onclick="resetTTT()" style="margin-top: 2rem;">إعادة اللعب</button>
    `;

    renderTTTBoard();
    resetTTT();
}

function setTTTDifficulty(diff) {
    tttDifficulty = diff;
    resetTTT();
}

function setTTTMode(mode) {
    tttMode = mode;
    initTicTacToe(); // Re-render to update active button state
}

function renderTTTBoard() {
    const grid = document.getElementById('ttt-grid');
    grid.innerHTML = '';

    tttBoard.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('ttt-cell');
        cellDiv.setAttribute('data-index', index);
        cellDiv.innerText = cell;

        if (cell === 'X') cellDiv.classList.add('x');
        if (cell === 'O') cellDiv.classList.add('o');

        cellDiv.addEventListener('click', handleCellClick);
        grid.appendChild(cellDiv);
    });
}

function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (tttBoard[clickedCellIndex] !== '' || !tttGameActive) {
        return;
    }

    audioSys.playClick(); // Sound
    handleCellPlayed(clickedCell, clickedCellIndex);
    handleResultValidation();

    if (tttGameActive && tttMode === 'AI' && tttCurrentPlayer === 'O') {
        setTimeout(makeAIMove, 500);
    }
}

function handleCellPlayed(clickedCell, clickedCellIndex) {
    tttBoard[clickedCellIndex] = tttCurrentPlayer;
    clickedCell.innerText = tttCurrentPlayer;
    clickedCell.classList.add(tttCurrentPlayer.toLowerCase());
}

function handleResultValidation() {
    let roundWon = false;
    let winningLine = [];

    for (let i = 0; i <= 7; i++) {
        const winCondition = winningConditions[i];
        let a = tttBoard[winCondition[0]];
        let b = tttBoard[winCondition[1]];
        let c = tttBoard[winCondition[2]];
        if (a === '' || b === '' || c === '') {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            winningLine = winCondition;
            break;
        }
    }

    if (roundWon) {
        document.getElementById('ttt-status').innerText = `اللاعب ${tttCurrentPlayer} فاز! 🎉`;
        tttGameActive = false;
        audioSys.playWin(); // Sound
        fireConfetti(); // Celebration

        // Highlight winning cells
        winningLine.forEach(index => {
            const cell = document.querySelector(`.ttt-cell[data-index='${index}']`);
            if (cell) cell.classList.add('winning-cell');
        });

        // Update score if Player won (assuming Player is always X in AI mode, or count wins generally)
        if (tttCurrentPlayer === 'X') {
            const currentWins = scoreMgr.getScore('tictactoe');
            scoreMgr.updateScore('tictactoe', currentWins + 1);
        }
        return;
    }

    let roundDraw = !tttBoard.includes("");
    if (roundDraw) {
        document.getElementById('ttt-status').innerText = 'تعادل! 🤝';
        tttGameActive = false;
        audioSys.playLose(); // Sound (Draw sound)
        return;
    }

    tttCurrentPlayer = tttCurrentPlayer === "X" ? "O" : "X";
    document.getElementById('ttt-status').innerText = `دور اللاعب ${tttCurrentPlayer}`;
}

function makeAIMove() {
    if (!tttGameActive) return;

    let moveIndex;

    if (tttDifficulty === 'EASY') {
        // Random Move
        const emptyIndices = tttBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
        if (emptyIndices.length > 0) {
            moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        }
    } else {
        // Minimax Move (Unbeatable)
        moveIndex = getBestMove(tttBoard);
    }

    if (moveIndex !== undefined) {
        const cell = document.querySelector(`.ttt-cell[data-index='${moveIndex}']`);
        handleCellPlayed(cell, moveIndex);
        handleResultValidation();
    }
}

// --- Minimax Algorithm ---
function getBestMove(board) {
    let bestScore = -Infinity;
    let move;

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O'; // AI is 'O'
            let score = minimax(board, 0, false);
            board[i] = ''; // Undo
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

const scores = {
    X: -10, // Player wins (Bad for AI)
    O: 10,  // AI wins (Good for AI)
    TIE: 0
};

function minimax(board, depth, isMaximizing) {
    let result = checkWinner(board);
    if (result !== null) {
        return scores[result];
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinner(board) {
    for (let i = 0; i < 8; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (!board.includes('')) return 'TIE';
    return null;
}


function resetTTT() {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttGameActive = true;
    tttCurrentPlayer = 'X';
    document.getElementById('ttt-status').innerText = `دور اللاعب X`;
    document.querySelectorAll('.ttt-cell').forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('x', 'o');
    });
}
