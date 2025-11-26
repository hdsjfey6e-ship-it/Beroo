// Snake Game Logic

let snakeCanvas, snakeCtx;
let snake = [];
let food = {};
let snakeDirection = 'RIGHT';
let snakeNextDirection = 'RIGHT';
let snakeScore = 0;
let snakeGameLoop;
let snakeSpeed = 150;
const box = 20; // Size of one grid unit

let snakeDifficulty = 'NORMAL'; // SLOW, NORMAL, FAST

let snakePaused = false;

function initSnakeGame() {
    const bestScore = scoreMgr.getScore('snake');

    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <div class="snake-header">
            <h2>الثعبان</h2>
            <div class="score-board">
                <p>النقاط: <span id="snake-score">0</span></p>
                <p class="best-score">الأفضل: <span>${bestScore}</span></p>
            </div>
            
            <div class="game-settings" style="margin-bottom: 1rem;">
                <label style="color: #ccc; margin-left: 10px;">السرعة:</label>
                <select id="snake-speed" onchange="setSnakeSpeed(this.value)" style="padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--secondary-color);">
                    <option value="SLOW" ${snakeDifficulty === 'SLOW' ? 'selected' : ''}>بطيء (سهل)</option>
                    <option value="NORMAL" ${snakeDifficulty === 'NORMAL' ? 'selected' : ''}>عادي</option>
                    <option value="FAST" ${snakeDifficulty === 'FAST' ? 'selected' : ''}>سريع (محترف)</option>
                </select>
                <button class="btn-sm" onclick="toggleSnakePause()" style="margin-right: 10px;" title="إيقاف مؤقت (P)"><i class="fas fa-pause"></i></button>
                <button class="btn-sm" onclick="showInstructions('snake')" style="margin-right: 5px;"><i class="fas fa-info-circle"></i></button>
            </div>
        </div>
            </div>
        </div>
        <div style="position: relative; width: fit-content; margin: 0 auto;">
            <canvas id="snake-canvas" width="400" height="400"></canvas>
            
            <!-- Start Overlay -->
            <div id="snake-overlay" onclick="startSnakeGame()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; cursor: pointer; border-radius: 10px; z-index: 10;">
                <h2 style="color: #fff; text-shadow: 0 0 10px var(--primary-color);">اضغط للبدء 🐍</h2>
            </div>

            <!-- Pause Overlay -->
            <div id="snake-paused-overlay" onclick="toggleSnakePause()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: center; cursor: pointer; border-radius: 10px; z-index: 10;">
                <h2 style="color: #fff; text-shadow: 0 0 10px var(--secondary-color);">موقوف ⏸️</h2>
            </div>
        </div>
        <div class="snake-controls">
            <button class="btn-control" onclick="setDirection('UP')"><i class="fas fa-arrow-up"></i></button>
            <div class="horizontal-controls">
                <button class="btn-control" onclick="setDirection('LEFT')"><i class="fas fa-arrow-left"></i></button>
                <button class="btn-control" onclick="setDirection('RIGHT')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <button class="btn-control" onclick="setDirection('DOWN')"><i class="fas fa-arrow-down"></i></button>
        </div>
        <button class="btn" onclick="initSnakeGame()" style="margin-top: 1rem;">إعادة اللعب</button>
    `;

    snakeCanvas = document.getElementById('snake-canvas');
    snakeCtx = snakeCanvas.getContext('2d');

    // Initial State
    snake = [{ x: 10 * box, y: 10 * box }];
    snakeDirection = 'RIGHT';
    snakeNextDirection = 'RIGHT';
    snakeScore = 0;
    snakePaused = false;

    // Set Speed based on difficulty
    if (snakeDifficulty === 'SLOW') snakeSpeed = 200;
    else if (snakeDifficulty === 'NORMAL') snakeSpeed = 150;
    else if (snakeDifficulty === 'FAST') snakeSpeed = 80;

    spawnFood();

    // Draw initial state (static)
    drawSnakeGame(true); // Pass true to indicate static draw (no move)

    // Keyboard Controls
    document.addEventListener('keydown', handleSnakeInput);

    // Touch Controls (Swipe)
    const canvas = document.getElementById('snake-canvas');
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Stop any existing loop
    clearInterval(snakeGameLoop);
}

function startSnakeGame() {
    const overlay = document.getElementById('snake-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    audioSys.playClick();
    clearInterval(snakeGameLoop);
    snakeGameLoop = setInterval(drawSnakeGame, snakeSpeed);
}

function toggleSnakePause() {
    const overlay = document.getElementById('snake-paused-overlay');
    if (!snakePaused) {
        snakePaused = true;
        clearInterval(snakeGameLoop);
        if (overlay) overlay.style.display = 'flex';
    } else {
        snakePaused = false;
        snakeGameLoop = setInterval(drawSnakeGame, snakeSpeed);
        if (overlay) overlay.style.display = 'none';
    }
}

// --- Swipe Logic ---
let xDown = null;
let yDown = null;

function handleTouchStart(evt) {
    const firstTouch = evt.touches[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
    evt.preventDefault(); // Prevent scrolling while playing
}

function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }

    let xUp = evt.touches[0].clientX;
    let yUp = evt.touches[0].clientY;

    let xDiff = xDown - xUp;
    let yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        // Horizontal Swipe
        if (xDiff > 0) {
            setDirection('LEFT');
        } else {
            setDirection('RIGHT');
        }
    } else {
        // Vertical Swipe
        if (yDiff > 0) {
            setDirection('UP');
        } else {
            setDirection('DOWN');
        }
    }

    // Reset values
    xDown = null;
    yDown = null;
    evt.preventDefault();
}

function setSnakeSpeed(speed) {
    snakeDifficulty = speed;
    // Restart game with new speed
    document.getElementById('snake-canvas').focus(); // Keep focus
    initSnakeGame();
}

function stopSnakeGame() {
    clearInterval(snakeGameLoop);
    document.removeEventListener('keydown', handleSnakeInput);
    const canvas = document.getElementById('snake-canvas');
    if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
    }
}

function handleSnakeInput(e) {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        toggleSnakePause();
        return;
    }

    if (snakePaused) return; // Don't allow move if paused

    if (e.key === 'ArrowLeft') setDirection('LEFT');
    else if (e.key === 'ArrowUp') setDirection('UP');
    else if (e.key === 'ArrowRight') setDirection('RIGHT');
    else if (e.key === 'ArrowDown') setDirection('DOWN');
}

function setDirection(direction) {
    if (direction === 'LEFT' && snakeDirection !== 'RIGHT') snakeNextDirection = 'LEFT';
    else if (direction === 'UP' && snakeDirection !== 'DOWN') snakeNextDirection = 'UP';
    else if (direction === 'RIGHT' && snakeDirection !== 'LEFT') snakeNextDirection = 'RIGHT';
    else if (direction === 'DOWN' && snakeDirection !== 'UP') snakeNextDirection = 'DOWN';
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (snakeCanvas.width / box)) * box,
        y: Math.floor(Math.random() * (snakeCanvas.height / box)) * box
    };
}

function collision(headX, headY, array) {
    for (let i = 0; i < array.length; i++) {
        if (headX === array[i].x && headY === array[i].y) {
            return true;
        }
    }
    return false;
}

function drawSnakeGame(isStatic = false) {
    if (!isStatic) {
        snakeDirection = snakeNextDirection;

        // Move Snake
        let snakeX = snake[0].x;
        let snakeY = snake[0].y;

        if (snakeDirection === 'LEFT') snakeX -= box;
        if (snakeDirection === 'UP') snakeY -= box;
        if (snakeDirection === 'RIGHT') snakeX += box;
        if (snakeDirection === 'DOWN') snakeY += box;

        // Check Collision (Walls or Self)
        if (snakeX < 0 || snakeX >= snakeCanvas.width || snakeY < 0 || snakeY >= snakeCanvas.height || collision(snakeX, snakeY, snake)) {
            clearInterval(snakeGameLoop);
            audioSys.playLose();

            // Update High Score
            const isRecord = scoreMgr.updateScore('snake', snakeScore);

            snakeCtx.fillStyle = 'rgba(0,0,0,0.7)';
            snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

            snakeCtx.fillStyle = '#fff';
            snakeCtx.font = '30px Outfit';
            snakeCtx.textAlign = 'center';
            snakeCtx.fillText('انتهت اللعبة!', snakeCanvas.width / 2, snakeCanvas.height / 2 - 20);
            snakeCtx.font = '20px Outfit';
            snakeCtx.fillText('النقاط: ' + snakeScore, snakeCanvas.width / 2, snakeCanvas.height / 2 + 20);

            if (isRecord) {
                fireConfetti(); // Celebration
                snakeCtx.fillStyle = '#00fff2';
                snakeCtx.fillText('رقم قياسي جديد! 🏆', snakeCanvas.width / 2, snakeCanvas.height / 2 + 60);
            }
            return;
        }

        // Eat Food
        if (snakeX === food.x && snakeY === food.y) {
            snakeScore++;
            document.getElementById('snake-score').innerText = snakeScore;
            audioSys.playWin(); // Use click sound for eating for now, or add specific eat sound
            spawnFood();
            // Increase speed slightly
            if (snakeSpeed > 50) {
                clearInterval(snakeGameLoop);
                snakeSpeed -= 2;
                snakeGameLoop = setInterval(drawSnakeGame, snakeSpeed);
            }
        } else {
            snake.pop();
        }

        let newHead = { x: snakeX, y: snakeY };
        snake.unshift(newHead);
    }

    // Draw Background
    snakeCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    // Draw Food
    snakeCtx.fillStyle = '#ff00de';
    snakeCtx.shadowBlur = 10;
    snakeCtx.shadowColor = '#ff00de';
    snakeCtx.beginPath();
    snakeCtx.arc(food.x + box / 2, food.y + box / 2, box / 2 - 2, 0, Math.PI * 2);
    snakeCtx.fill();
    snakeCtx.shadowBlur = 0;

    // Draw Snake
    for (let i = 0; i < snake.length; i++) {
        snakeCtx.fillStyle = (i === 0) ? '#00fff2' : '#00ccbf';

        // Rounded Segments
        let x = snake[i].x;
        let y = snake[i].y;
        let size = box - 2;
        let radius = (i === 0) ? 5 : 2; // Head is rounder

        snakeCtx.beginPath();
        snakeCtx.roundRect(x + 1, y + 1, size, size, radius);
        snakeCtx.fill();

        // Draw Eyes for Head
        if (i === 0) {
            snakeCtx.fillStyle = 'black';
            let eyeSize = 3;

            snakeCtx.beginPath();
            snakeCtx.arc(x + 6, y + 6, eyeSize, 0, Math.PI * 2); // Left eye
            snakeCtx.arc(x + 14, y + 6, eyeSize, 0, Math.PI * 2); // Right eye
            snakeCtx.fill();
        }
    }
}
