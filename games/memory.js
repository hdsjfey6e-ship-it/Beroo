// Memory Match Game Logic - Enhanced

const baseIcons = [
    'fa-ghost', 'fa-dragon', 'fa-gamepad', 'fa-dice-d20',
    'fa-puzzle-piece', 'fa-robot', 'fa-rocket', 'fa-meteor'
];

const extraIcons = [
    'fa-heart', 'fa-star', 'fa-bolt', 'fa-snowflake',
    'fa-crown', 'fa-gem', 'fa-moon', 'fa-sun'
];

let memoryDifficulty = 'EASY';
let memoryCards = [];
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let memoryScore = 0;
let currentIcons = [];
let gameTimer;
let timeElapsed = 0;
let matchesFound = 0;
let totalMatches = 0;

function initMemoryGame() {
    const bestScore = scoreMgr.getScore('memory');
    const bestText = bestScore === 0 ? 'لا توجد' : bestScore + ' حركة';

    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <div class="memory-header">
            <h2>لعبة الذاكرة</h2>
            <div class="score-board">
                <p>الوقت: <span id="memory-timer">0</span> ثانية</p>
                <p>الحركات: <span id="memory-moves">0</span></p>
                <p class="best-score">أفضل نتيجة: <span>${bestText}</span></p>
            </div>
            
            <div class="game-settings" style="margin-bottom: 1rem; display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div>
                    <label style="color: #ccc; margin-left: 10px;">المستوى:</label>
                    <select id="memory-diff" onchange="setMemoryDifficulty(this.value)" style="padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--primary-color);">
                        <option value="EASY" ${memoryDifficulty === 'EASY' ? 'selected' : ''}>سهل (4x4)</option>
                        <option value="MEDIUM" ${memoryDifficulty === 'MEDIUM' ? 'selected' : ''}>متوسط (4x4)</option>
                        <option value="HARD" ${memoryDifficulty === 'HARD' ? 'selected' : ''}>صعب (6x4)</option>
                    </select>
                </div>
                <button class="btn-sm" onclick="showInstructions('memory')">
                    <i class="fas fa-info-circle"></i> التعليمات
                </button>
            </div>
            <div id="memory-progress" style="width: 100%; background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; margin: 1rem 0; overflow: hidden;">
                <div id="memory-progress-bar" style="height: 100%; background: var(--primary-color); width: 0%; transition: width 0.3s;"></div>
            </div>
        </div>
        <div class="memory-grid ${memoryDifficulty === 'HARD' ? 'hard-grid' : ''}" id="memory-grid"></div>
        <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
            <button class="btn" onclick="initMemoryGame()">إعادة اللعب</button>
            <button class="btn" onclick="hintMemory()" id="hint-btn" style="background: var(--accent-color);">
                <i class="fas fa-lightbulb"></i> مساعدة (3)
            </button>
        </div>
    `;

    const memoryGrid = document.getElementById('memory-grid');
    memoryScore = 0;
    timeElapsed = 0;
    matchesFound = 0;
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    hintCount = 3;

    // Setup Icons based on difficulty
    let selectedIcons = [...baseIcons];
    if (memoryDifficulty === 'MEDIUM') {
        selectedIcons = [...baseIcons, ...extraIcons.slice(0, 4)];
    } else if (memoryDifficulty === 'HARD') {
        selectedIcons = [...baseIcons, ...extraIcons];
    }

    // Calculate total matches
    totalMatches = selectedIcons.length;

    // Duplicate and Shuffle
    currentIcons = [...selectedIcons, ...selectedIcons];
    currentIcons.sort(() => 0.5 - Math.random());

    // Update progress bar
    updateProgressBar();

    // Create cards
    memoryGrid.innerHTML = '';
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

    // Start timer
    clearInterval(gameTimer);
    gameTimer = setInterval(updateTimer, 1000);

    // Peek Feature: Show all cards for different times based on difficulty
    lockBoard = true;
    let peekTime = memoryDifficulty === 'EASY' ? 3000 : 
                  memoryDifficulty === 'MEDIUM' ? 2000 : 1500;
                  
    setTimeout(() => {
        const cards = document.querySelectorAll('.memory-card');
        cards.forEach(card => card.classList.add('flip'));

        setTimeout(() => {
            cards.forEach(card => card.classList.remove('flip'));
            lockBoard = false;
        }, peekTime);
    }, 500);
}

function setMemoryDifficulty(diff) {
    memoryDifficulty = diff;
    initMemoryGame();
}

function updateTimer() {
    timeElapsed++;
    document.getElementById('memory-timer').innerText = timeElapsed;
}

function updateProgressBar() {
    const progress = (matchesFound / totalMatches) * 100;
    document.getElementById('memory-progress-bar').style.width = progress + '%';
}

let hintCount = 3;

function hintMemory() {
    if (hintCount <= 0 || lockBoard) return;
    
    const unflippedCards = Array.from(document.querySelectorAll('.memory-card:not(.flip)'));
    if (unflippedCards.length < 2) return;
    
    // Find a matching pair
    const iconCount = {};
    unflippedCards.forEach(card => {
        const icon = card.dataset.icon;
        iconCount[icon] = (iconCount[icon] || 0) + 1;
    });
    
    const matchingIcon = Object.keys(iconCount).find(icon => iconCount[icon] >= 2);
    if (!matchingIcon) return;
    
    const matchingCards = unflippedCards.filter(card => card.dataset.icon === matchingIcon).slice(0, 2);
    
    // Show hint
    lockBoard = true;
    matchingCards.forEach(card => {
        card.classList.add('flip');
        card.style.boxShadow = '0 0 20px gold';
    });
    
    hintCount--;
    document.getElementById('hint-btn').innerHTML = `<i class="fas fa-lightbulb"></i> مساعدة (${hintCount})`;
    
    setTimeout(() => {
        matchingCards.forEach(card => {
            card.classList.remove('flip');
            card.style.boxShadow = '';
        });
        lockBoard = false;
    }, 1000);
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;
    if (this.classList.contains('flip')) return;

    audioSys.playClick();
    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.icon === secondCard.dataset.icon;

    if (isMatch) {
        audioSys.playWin();
        disableCards();
        matchesFound++;
        updateProgressBar();
        
        // Check for game completion
        if (matchesFound === totalMatches) {
            setTimeout(() => {
                clearInterval(gameTimer);
                fireConfetti();
                const isRecord = scoreMgr.updateScore('memory', memoryScore);
                if (isRecord) {
                    alert(`🎉 رقم قياسي جديد! ${memoryScore} حركة في ${timeElapsed} ثانية`);
                } else {
                    alert(`🎊 فزت! ${memoryScore} حركة في ${timeElapsed} ثانية`);
                }
            }, 500);
        }
    } else {
        unflipCards();
    }
    
    incrementMoves();
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

// Clean up timer when leaving game
function stopMemoryGame() {
    clearInterval(gameTimer);
}

window.stopMemoryGame = stopMemoryGame;
