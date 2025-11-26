// Memory Match Game Logic

const baseIcons = [
    'fa-ghost', 'fa-dragon', 'fa-gamepad', 'fa-dice-d20',
    'fa-puzzle-piece', 'fa-robot', 'fa-rocket', 'fa-meteor'
];

const extraIcons = [
    'fa-heart', 'fa-star', 'fa-bolt', 'fa-snowflake'
];

let memoryDifficulty = 'EASY'; // EASY (4x4), HARD (6x4)
let memoryCards = [];
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let memoryScore = 0;
let currentIcons = [];

function initMemoryGame() {
    const bestScore = scoreMgr.getScore('memory');
    const bestText = bestScore === 0 ? '-' : bestScore;

    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <div class="memory-header">
            <h2>لعبة الذاكرة</h2>
            <div class="score-board">
                <p>الحركات: <span id="memory-moves">0</span></p>
                <p class="best-score">أفضل نتيجة: <span>${bestText}</span></p>
            </div>
            
            <div class="game-settings" style="margin-bottom: 1rem;">
                <label style="color: #ccc; margin-left: 10px;">المستوى:</label>
                <select id="memory-diff" onchange="setMemoryDifficulty(this.value)" style="padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--primary-color);">
                    <option value="EASY" ${memoryDifficulty === 'EASY' ? 'selected' : ''}>سهل (4x4)</option>
                    <option value="HARD" ${memoryDifficulty === 'HARD' ? 'selected' : ''}>صعب (6x4)</option>
                </select>
                <button class="btn-sm" onclick="showInstructions('memory')" style="margin-right: 10px;"><i class="fas fa-info-circle"></i></button>
            </div>
        </div>
        <div class="memory-grid ${memoryDifficulty === 'HARD' ? 'hard-grid' : ''}" id="memory-grid"></div>
        <button class="btn" onclick="initMemoryGame()" style="margin-top: 2rem;">إعادة اللعب</button>
    `;

    const memoryGrid = document.getElementById('memory-grid');
    memoryScore = 0;
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;

    // Setup Icons based on difficulty
    let selectedIcons = [...baseIcons];
    if (memoryDifficulty === 'HARD') {
        selectedIcons = [...baseIcons, ...extraIcons];
    }

    // Duplicate and Shuffle
    currentIcons = [...selectedIcons, ...selectedIcons];
    currentIcons.sort(() => 0.5 - Math.random());

    // Create cards
    currentIcons.forEach(icon => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        if (memoryDifficulty === 'HARD') card.classList.add('small');
        card.dataset.icon = icon;

        card.innerHTML = `
            <div class="front-face"><i class="fas ${icon}"></i></div>
            <div class="back-face"><i class="fas fa-question"></i></div>
        `;

        card.addEventListener('click', flipCard);
        memoryGrid.appendChild(card);
    });

    // Peek Feature: Show all cards for 2 seconds
    lockBoard = true; // Prevent clicking
    setTimeout(() => {
        const cards = document.querySelectorAll('.memory-card');
        cards.forEach(card => card.classList.add('flip'));

        setTimeout(() => {
            cards.forEach(card => card.classList.remove('flip'));
            lockBoard = false; // Enable clicking
        }, 2000);
    }, 500);
}

function setMemoryDifficulty(diff) {
    memoryDifficulty = diff;
    initMemoryGame();
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    audioSys.playClick(); // Sound
    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
    incrementMoves();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.icon === secondCard.dataset.icon;

    if (isMatch) {
        audioSys.playWin(); // Sound
        disableCards();
        // Check for game over (all matched)
        if (document.querySelectorAll('.memory-card.flip').length === currentIcons.length) {
            setTimeout(() => {
                fireConfetti(); // Celebration
                const isRecord = scoreMgr.updateScore('memory', memoryScore);
                if (isRecord) {
                    alert(`رقم قياسي جديد! ${memoryScore} حركة`);
                } else {
                    alert(`فزت! عدد الحركات: ${memoryScore}`);
                }
            }, 500);
        }
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    // Visual feedback for match
    firstCard.querySelector('.front-face').style.background = 'rgba(0, 255, 242, 0.3)';
    secondCard.querySelector('.front-face').style.background = 'rgba(0, 255, 242, 0.3)';

    resetBoard();
}

function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

function incrementMoves() {
    memoryScore++;
    document.getElementById('memory-moves').innerText = memoryScore;
}
