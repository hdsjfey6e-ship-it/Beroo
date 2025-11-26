// Flappy Bird Game Logic

let flappyCanvas, flappyCtx;
let bird = {};
let pipes = [];
let flappyScore = 0;
let flappyGameLoop;
let gravity = 0.5;
let isGameRunning = false;
let pipeSpeed = 3;
let pipeGap = 150;
let pipeWidth = 60;

function initFlappyGame() {
    const bestScore = scoreMgr.getScore('flappy');

    const gameContent = document.getElementById('game-content');
    gameContent.innerHTML = `
        <div class="flappy-header">
            <h2>الطائر الطيار</h2>
            <div class="score-board">
                <p>النقاط: <span id="flappy-score">0</span></p>
                <p class="best-score">الأفضل: <span>${bestScore}</span></p>
            </div>
            
            <div class="game-settings" style="margin-bottom: 1rem;">
                <button class="btn-sm" onclick="showInstructions('flappy')" style="margin-right: 10px;"><i class="fas fa-info-circle"></i></button>
            </div>
        </div>
        <div style="position: relative; width: fit-content; margin: 0 auto;">
            <canvas id="flappy-canvas" width="400" height="600"></canvas>
            
            <!-- Start Overlay -->
            <div id="flappy-overlay" onclick="startFlappyGame()" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; border-radius: 10px; z-index: 10;">
                <h2 style="color: #fff; text-shadow: 0 0 10px var(--primary-color); margin-bottom: 1rem;">الطائر الطيار</h2>
                <p style="color: #ccc; text-align: center; margin-bottom: 2rem;">اضغط أو انقر للبدء<br>استخدم المسافة أو النقر للطيران</p>
                <div class="btn">ابدأ اللعب</div>
            </div>

            <!-- Game Over Overlay -->
            <div id="flappy-gameover" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; flex-direction: column; justify-content: center; align-items: center; border-radius: 10px; z-index: 20;">
                <h2 style="color: #fff; margin-bottom: 1rem;">انتهت اللعبة!</h2>
                <p style="color: #ccc; font-size: 1.5rem; margin-bottom: 2rem;">النقاط: <span id="final-score">0</span></p>
                <button class="btn" onclick="initFlappyGame()">إعادة اللعب</button>
            </div>
        </div>
        <div class="flappy-controls" style="margin-top: 1rem; text-align: center;">
            <button class="btn-control" onclick="flappyJump()" style="width: 80px; height: 80px; margin: 0 auto;">
                <i class="fas fa-arrow-up"></i>
            </button>
        </div>
    `;

    flappyCanvas = document.getElementById('flappy-canvas');
    flappyCtx = flappyCanvas.getContext('2d');

    // Initialize game state
    resetFlappyGame();

    // Event listeners
    document.addEventListener('keydown', handleFlappyInput);
    flappyCanvas.addEventListener('click', handleFlappyInput);
    
    // Draw initial state
    drawFlappyGame();
}

function resetFlappyGame() {
    bird = {
        x: 100,
        y: flappyCanvas.height / 2,
        width: 30,
        height: 30,
        velocity: 0,
        jump: -8
    };
    
    pipes = [];
    flappyScore = 0;
    isGameRunning = false;
    
    // Create first pipe
    generatePipe();
}

function startFlappyGame() {
    document.getElementById('flappy-overlay').style.display = 'none';
    isGameRunning = true;
    audioSys.playClick();
    flappyGameLoop = setInterval(updateFlappyGame, 20);
}

function handleFlappyInput(e) {
    if (e.type === 'keydown' && e.code === 'Space') {
        e.preventDefault();
        flappyJump();
    } else if (e.type === 'click') {
        flappyJump();
    }
}

function flappyJump() {
    if (!isGameRunning) {
        startFlappyGame();
        return;
    }
    bird.velocity = bird.jump;
    audioSys.playFlap();
}

function generatePipe() {
    const minHeight = 50;
    const maxHeight = flappyCanvas.height - pipeGap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipes.push({
        x: flappyCanvas.width,
        topHeight: topHeight,
        bottomY: topHeight + pipeGap,
        passed: false
    });
}

function updateFlappyGame() {
    if (!isGameRunning) return;

    // Update bird
    bird.velocity += gravity;
    bird.y += bird.velocity;

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;

        // Check if pipe is off screen
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
        
        // Check if bird passed pipe
        if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
            pipes[i].passed = true;
            flappyScore++;
            document.getElementById('flappy-score').innerText = flappyScore;
            audioSys.playPoint();
        }
    }

    // Generate new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < flappyCanvas.width - 300) {
        generatePipe();
    }

    // Check collisions
    if (checkCollisions()) {
        gameOver();
        return;
    }

    drawFlappyGame();
}

function checkCollisions() {
    // Check ground and ceiling
    if (bird.y <= 0 || bird.y + bird.height >= flappyCanvas.height) {
        return true;
    }

    // Check pipes
    for (let pipe of pipes) {
        if (bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)) {
            return true;
        }
    }

    return false;
}

function gameOver() {
    isGameRunning = false;
    clearInterval(flappyGameLoop);
    audioSys.playLose();

    // Update high score
    const isRecord = scoreMgr.updateScore('flappy', flappyScore);

    document.getElementById('final-score').innerText = flappyScore;
    const gameOverOverlay = document.getElementById('flappy-gameover');
    
    if (isRecord) {
        gameOverOverlay.innerHTML = `
            <h2 style="color: gold; margin-bottom: 1rem;">رقم قياسي جديد! 🏆</h2>
            <p style="color: #ccc; font-size: 1.5rem; margin-bottom: 2rem;">النقاط: ${flappyScore}</p>
            <button class="btn" onclick="initFlappyGame()">إعادة اللعب</button>
        `;
        fireConfetti();
    }
    
    gameOverOverlay.style.display = 'flex';
}

function drawFlappyGame() {
    // Clear canvas
    flappyCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    flappyCtx.fillRect(0, 0, flappyCanvas.width, flappyCanvas.height);

    // Draw bird
    flappyCtx.fillStyle = '#00fff2';
    flappyCtx.shadowBlur = 15;
    flappyCtx.shadowColor = '#00fff2';
    flappyCtx.beginPath();
    flappyCtx.arc(bird.x + bird.width/2, bird.y + bird.height/2, bird.width/2, 0, Math.PI * 2);
    flappyCtx.fill();

    // Draw eye
    flappyCtx.fillStyle = 'black';
    flappyCtx.beginPath();
    flappyCtx.arc(bird.x + 20, bird.y + 12, 4, 0, Math.PI * 2);
    flappyCtx.fill();

    // Draw pipes
    flappyCtx.shadowBlur = 10;
    flappyCtx.shadowColor = '#00ff00';
    flappyCtx.fillStyle = '#00ff00';
    
    for (let pipe of pipes) {
        // Top pipe
        flappyCtx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        // Bottom pipe
        flappyCtx.fillRect(pipe.x, pipe.bottomY, pipeWidth, flappyCanvas.height - pipe.bottomY);
    }

    flappyCtx.shadowBlur = 0;
}