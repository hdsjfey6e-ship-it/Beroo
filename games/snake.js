// Snake Game Logic - Enhanced

let snakeCanvas, snakeCtx;
let snake = [];
let food = {};
let snakeDirection = 'RIGHT';
let snakeNextDirection = 'RIGHT';
let snakeScore = 0;
let snakeGameLoop;
let snakeSpeed = 150;
const box = 20;

let snakeDifficulty = 'NORMAL';
let snakePaused = false;
let specialFood = null;
let specialFoodTimer = 0;
let obstacles = [];
let gameStarted = false;

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
            
            <div class="game-settings" style="margin-bottom: 1rem; display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div>
                    <label style="color: #ccc; margin-left: 10px;">السرعة:</label>
                    <select id="snake-speed" onchange="setSnakeSpeed(this.value)" style="padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--secondary-color);">
                        <option value="SLOW" ${snakeDifficulty === 'SLOW' ? 'selected' : ''}>بطيء (سهل)</option>
                        <option value="NORMAL" ${snakeDifficulty === 'NORMAL' ? 'selected' : ''}>عادي</option>
                        <option value="FAST" ${snakeDifficulty === 'FAST' ? 'selected' : ''}>سريع (محترف)</option>
                    </select>
                </div>
                <button class="btn-sm" onclick="toggleSnakePause()" title="إيقاف مؤقت (P)">
                    <i class="fas fa-pause"></i> إيقاف
                </button>
                <button class="btn-sm" onclick="showInstructions('snake')">
                    <i class="fas fa-info-circle"></i> التعليمات
                </button>
            </div>
            <div id="snake-powerup" style="color: gold; font-size: 0.9rem; margin-top: 0.5rem; display: none;">
                <i class="fas fa-bolt"></i> طعام خاص نشط!
            </div>
        </div>
        <div style="position: relative; width: fit-content; margin: 0 auto;">
            <canvas id="snake-canvas" width="400" height="400"></canvas>
            
            <!-- Start Overlay -->
            <div id="snake-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; cursor: pointer; border-radius: 10px; z-index: 10;">
                <h2 style="color: #fff; text-shadow: 0 0 10px var(--primary-color);">اضغط للبدء 🐍</h2>
            </div>

            <!-- Pause Overlay -->
            <div id="snake-paused-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; justify-content: center; align-items: center; cursor: pointer; border-radius: 10px; z-index: 10;">
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
    gameStarted = false;
    specialFood = null;
    obstacles = [];

    // Set Speed based on difficulty
    if (snakeDifficulty === 'SLOW') snakeSpeed = 200;
    else if (snakeDifficulty === 'NORMAL') snakeSpeed = 150;
    else if (snakeDifficulty === 'FAST') snakeSpeed = 80;

    spawnFood();
    spawnObstacles();

    // Draw initial state
    drawSnakeGame(true);

    // Event listeners
    document.addEventListener('keydown', handleSnakeInput);
    document.getElementById('snake-overlay').addEventListener('click', startSnakeGame);

    // Touch Controls
    snakeCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    snakeCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Stop any existing loop
    clearInterval(snakeGameLoop);
}

function startSnakeGame() {
    if (gameStarted) return;
    
    document.getElementById('snake-overlay').style.display = 'none';
    gameStarted = true;
    audioSys.playClick();
    clearInterval(snakeGameLoop);
    snakeGameLoop = setInterval(drawSnakeGame, snakeSpeed);
}

function toggleSnakePause() {
    if (!gameStarted) return;
    
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
    evt.preventDefault();
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
        if (xDiff > 0) {
            setDirection('LEFT');
        } else {
            setDirection('RIGHT');
        }
    } else {
        if (yDiff > 0) {
            setDirection('UP');
        } else {
            setDirection('DOWN');
        }
    }

    xDown = null;
    yDown = null;
    evt.preventDefault();
}

function setSnakeSpeed(speed) {
    snakeDifficulty = speed;
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
    const overlay = document.getElementById('snake-overlay');
    if (overlay) {
        overlay.removeEventListener('click', startSnakeGame);
    }
}

function handleSnakeInput(e) {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        toggleSnakePause();
        return;
    }

    if (snakePaused || !gameStarted) return;

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
    
    // Occasionally spawn special food
    if (Math.random() < 0.2 && snakeScore > 5) {
        specialFood = {
            x: Math.floor(Math.random() * (snakeCanvas.width / box)) * box,
            y: Math.floor(Math.random() * (snakeCanvas.height / box)) * box,
            type: Math.random() < 0.5 ? 'speed' : 'points'
        };
        specialFoodTimer = 300; // 300 frames ~ 15 seconds
    }
}

function spawnObstacles() {
    obstacles = [];
    const obstacleCount = Math.floor(snakeScore / 10) + 2;
    
    for (let i = 0; i < obstacleCount; i++) {
        let obstacle;
        let validPosition = false;
        
        while (!validPosition) {
            obstacle = {
                x: Math.floor(Math.random() * (snakeCanvas.width / box)) * box,
                y: Math.floor(Math.random() * (snakeCanvas.height / box)) * box
            };
            
            // Check if obstacle doesn't overlap with snake or food
            validPosition = !collision(obstacle.x, obstacle.y, snake) && 
                           (obstacle.x !== food.x || obstacle.y !== food.y);
        }
        
        obstacles.push(obstacle);
    }
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
    if (!isStatic && gameStarted && !snakePaused) {
        snakeDirection = snakeNextDirection;

        // Move Snake
        let snakeX = snake[0].x;
        let snakeY = snake[0].y;

        if (snakeDirection === 'LEFT') snakeX -= box;
        if (snakeDirection === 'UP') snakeY -= box;
        if (snakeDirection === 'RIGHT') snakeX += box;
        if (snakeDirection === 'DOWN') snakeY += box;

        // Check Collision (Walls, Self, or Obstacles)
        if (snakeX < 0 || snakeX >= snakeCanvas.width || snakeY < 0 || snakeY >= snakeCanvas.height || 
            collision(snakeX, snakeY, snake) || collision(snakeX, snakeY, obstacles)) {
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

            if (isRecord && snakeScore > 0) {
                fireConfetti();
                snakeCtx.fillStyle = '#00fff2';
                snakeCtx.fillText('رقم قياسي جديد! 🏆', snakeCanvas.width / 2, snakeCanvas.height / 2 + 60);
            }
            return;
        }

        // Eat Food
        let ateFood = false;
        if (snakeX === food.x && snakeY === food.y) {
            snakeScore++;
            document.getElementById('snake-score').innerText = snakeScore;
            audioSys.playWin();
            spawnFood();
            spawnObstacles();
            ateFood = true;
            
            // Increase speed slightly
            if (snakeSpeed > 50) {
                clearInterval(snakeGameLoop);
                snakeSpeed -= 2;
                snakeGameLoop = setInterval(drawSnakeGame, snakeSpeed);
            }
        }
        
        // Eat Special Food
        if (specialFood && snakeX === specialFood.x && snakeY === specialFood.y) {
            if (specialFood.type === 'speed') {
                // Speed boost
                clearInterval(snakeGameLoop);
                snakeSpeed = Math.max(30, snakeSpeed - 30);
                snakeGameLoop = setInterval(drawSnakeGame, snakeSpeed);
                document.getElementById('snake-powerup').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('snake-powerup').style.display = 'none';
                }, 3000);
            } else {
                // Points boost
                snakeScore += 5;
                document.getElementById('snake-score').innerText = snakeScore;
            }
            specialFood = null;
            audioSys.playPoint();
        }

        if (!ateFood) {
            snake.pop();
        }

        let newHead = { x: snakeX, y: snakeY };
        snake.unshift(newHead);
        
        // Update special food timer
        if (specialFood) {
            specialFoodTimer--;
            if (specialFoodTimer <= 0) {
                specialFood = null;
            }
        }
    }

    // Draw Background with gradient
    const gradient = snakeCtx.createLinearGradient(0, 0, snakeCanvas.width, snakeCanvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    snakeCtx.fillStyle = gradient;
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    // Draw Grid (subtle)
    snakeCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    snakeCtx.lineWidth = 1;
    for (let x = 0; x < snakeCanvas.width; x += box) {
        snakeCtx.beginPath();
        snakeCtx.moveTo(x, 0);
        snakeCtx.lineTo(x, snakeCanvas.height);
        snakeCtx.stroke();
    }
    for (let y = 0; y < snakeCanvas.height; y += box) {
        snakeCtx.beginPath();
        snakeCtx.moveTo(0, y);
        snakeCtx.lineTo(snakeCanvas.width, y);
        snakeCtx.stroke();
    }

    // Draw Obstacles
    snakeCtx.fillStyle = '#7b2cbf';
    snakeCtx.shadowBlur = 10;
    snakeCtx.shadowColor = '#7b2cbf';
    for (let obstacle of obstacles) {
        snakeCtx.fillRect(obstacle.x, obstacle.y, box, box);
    }

    // Draw Food
    snakeCtx.fillStyle = '#ff00de';
    snakeCtx.shadowBlur = 15;
    snakeCtx.shadowColor = '#ff00de';
    snakeCtx.beginPath();
    snakeCtx.arc(food.x + box / 2, food.y + box / 2, box / 2 - 2, 0, Math.PI * 2);
    snakeCtx.fill();

    // Draw Special Food
    if (specialFood) {
        snakeCtx.fillStyle = specialFood.type === 'speed' ? '#00ff00' : 'gold';
        snakeCtx.shadowBlur = 15;
        snakeCtx.shadowColor = specialFood.type === 'speed' ? '#00ff00' : 'gold';
        snakeCtx.beginPath();
        snakeCtx.arc(specialFood.x + box / 2, specialFood.y + box / 2, box / 2 - 1, 0, Math.PI * 2);
        snakeCtx.fill();
        
        // Pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 2 + 2;
        snakeCtx.shadowBlur = 10 + pulse;
    }

    // Draw Snake
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        const isHead = i === 0;
        
        // Gradient for snake segments
        const segmentGradient = snakeCtx.createRadialGradient(
            segment.x + box/2, segment.y + box/2, 0,
            segment.x + box/2, segment.y + box/2, box/2
        );
        
        if (isHead) {
            segmentGradient.addColorStop(0, '#00fff2');
            segmentGradient.addColorStop(1, '#00a8a8');
        } else {
            const intensity = 1 - (i / snake.length) * 0.5;
            segmentGradient.addColorStop(0, `rgba(0, ${255 * intensity}, ${242 * intensity}, 1)`);
            segmentGradient.addColorStop(1, `rgba(0, ${168 * intensity}, ${168 * intensity}, 1)`);
        }
        
        snakeCtx.fillStyle = segmentGradient;
        snakeCtx.shadowBlur = isHead ? 15 : 5;
        snakeCtx.shadowColor = isHead ? '#00fff2' : '#00ccbf';

        // Rounded Segments
        let radius = isHead ? 8 : 4;
        snakeCtx.beginPath();
        snakeCtx.roundRect(segment.x + 1, segment.y + 1, box - 2, box - 2, radius);
        snakeCtx.fill();

        // Draw Eyes for Head
        if (isHead) {
            snakeCtx.fillStyle = 'black';
            let eyeSize = 3;

            // Adjust eye position based on direction
            let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
            
            switch(snakeDirection) {
                case 'RIGHT':
                    leftEyeX = segment.x + 14; leftEyeY = segment.y + 8;
                    rightEyeX = segment.x + 14; rightEyeY = segment.y + 14;
                    break;
                case 'LEFT':
                    leftEyeX = segment.x + 6; leftEyeY = segment.y + 8;
                    rightEyeX = segment.x + 6; rightEyeY = segment.y + 14;
                    break;
                case 'UP':
                    leftEyeX = segment.x + 8; leftEyeY = segment.y + 6;
                    rightEyeX = segment.x + 14; rightEyeY = segment.y + 6;
                    break;
                case 'DOWN':
                    leftEyeX = segment.x + 8; leftEyeY = segment.y + 14;
                    rightEyeX = segment.x + 14; rightEyeY = segment.y + 14;
                    break;
            }

            snakeCtx.beginPath();
            snakeCtx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
            snakeCtx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
            snakeCtx.fill();
        }
    }

    snakeCtx.shadowBlur = 0;
}

window.stopSnakeGame = stopSnakeGame;
