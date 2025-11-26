// Main Game Hub Logic

const homeScreen = document.getElementById('home-screen');
const gameArea = document.getElementById('game-area');
const gameContent = document.getElementById('game-content');

// --- Particle System ---
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particlesArray;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = Math.random() > 0.5 ? '#00fff2' : '#ff00de';
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.2) this.size -= 0.01;
        if (this.size <= 0.2 || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
        }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
    }
}

function initParticles() {
    particlesArray = [];
    for (let i = 0; i < 50; i++) {
        particlesArray.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    ctx.shadowBlur = 0;
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
});

initParticles();
animateParticles();
// --- End Particle System ---

// --- Audio System ---
class AudioSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.3;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playTone(freq, type, duration) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playClick() { this.playTone(600, 'sine', 0.1); }
    playWin() {
        this.playTone(400, 'square', 0.1);
        setTimeout(() => this.playTone(600, 'square', 0.1), 100);
        setTimeout(() => this.playTone(800, 'square', 0.2), 200);
    }
    playLose() {
        this.playTone(300, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.4), 200);
    }
    playMove() { this.playTone(300, 'triangle', 0.05); }
    playFlap() { this.playTone(300, 'sine', 0.1); }
    playPoint() { this.playTone(800, 'square', 0.2); }
}

const audioSys = new AudioSystem();

// --- Score Manager ---
class ScoreManager {
    constructor() {
        try {
            this.scores = JSON.parse(localStorage.getItem('gameHubScores')) || {
                memory: 0,
                snake: 0,
                tictactoe: 0,
                flappy: 0
            };
        } catch (e) {
            this.scores = { memory: 0, snake: 0, tictactoe: 0, flappy: 0 };
        }
    }

    save() {
        try {
            localStorage.setItem('gameHubScores', JSON.stringify(this.scores));
        } catch (e) {
            console.warn('LocalStorage not available');
        }
    }

    updateScore(game, score) {
        let isNewRecord = false;
        if (game === 'memory') {
            // For memory, lower is better
            if (this.scores.memory === 0 || score < this.scores.memory) {
                this.scores.memory = score;
                isNewRecord = true;
            }
        } else {
            // For other games, higher is better
            if (score > this.scores[game]) {
                this.scores[game] = score;
                isNewRecord = true;
            }
        }
        if (isNewRecord) this.save();
        return isNewRecord;
    }

    getScore(game) {
        return this.scores[game] || 0; // Ensure we always return a number
    }
}

const scoreMgr = new ScoreManager();

// Toggle Sound Button Logic
document.getElementById('sound-toggle').addEventListener('click', (e) => {
    const isEnabled = audioSys.toggle();
    const icon = e.currentTarget.querySelector('i');
    if (isEnabled) {
        icon.classList.remove('fa-volume-mute');
        icon.classList.add('fa-volume-up');
    } else {
        icon.classList.remove('fa-volume-up');
        icon.classList.add('fa-volume-mute');
    }

    if (audioSys.ctx.state === 'suspended') {
        audioSys.ctx.resume();
    }
});

// --- Theme System ---
function setTheme(themeName) {
    document.body.className = themeName;
    try {
        localStorage.setItem('gameHubTheme', themeName);
    } catch (e) {
        console.warn('LocalStorage not available');
    }

    setTimeout(initParticles, 100);
}

// Load saved theme
let savedTheme = 'theme-cyan';
try {
    savedTheme = localStorage.getItem('gameHubTheme') || 'theme-cyan';
} catch (e) {
    console.warn('LocalStorage not available');
}
setTheme(savedTheme);

// --- Confetti System ---
function fireConfetti() {
    createConfettiBurst();
}

function createConfettiBurst() {
    const colors = ['#00fff2', '#ff00de', '#00ff00', '#ffd700', '#ff0000', '#7b2cbf'];
    for (let i = 0; i < 150; i++) {
        const p = new Particle();
        p.x = window.innerWidth / 2;
        p.y = window.innerHeight / 2;
        p.speedX = (Math.random() - 0.5) * 15;
        p.speedY = (Math.random() - 0.7) * 15;
        p.size = Math.random() * 6 + 3;
        p.color = colors[Math.floor(Math.random() * colors.length)];
        particlesArray.push(p);
    }
}

// --- Instructions Modal ---
const instructionsData = {
    'memory': `
        <strong>الهدف:</strong> إيجاد جميع أزواج البطاقات المتطابقة.<br><br>
        1. اضغط على أي بطاقة لقلبها.<br>
        2. حاول تذكر الصورة ومكانها.<br>
        3. ابحث عن البطاقة المشابهة لها.<br>
        4. كلما قلت عدد حركاتك، زاد تقييمك!<br>
        <br>
        <em>نصيحة: ركز جيداً في المستوى الصعب!</em>
    `,
    'snake': `
        <strong>الهدف:</strong> أكل الطعام لتكبر دون الاصطدام.<br><br>
        1. استخدم الأسهم (أو الأزرار) للتحكم في الثعبان.<br>
        2. كل قطعة طعام تزيد من طولك ونقاطك.<br>
        3. تجنب الاصطدام بالجدران أو بنفسك.<br>
        <br>
        <em>نصيحة: السرعة العالية تعطي تحدياً أكبر!</em>
    `,
    'tictactoe': `
        <strong>الهدف:</strong> تكوين خط مستقيم من 3 رموز (X أو O).<br><br>
        1. العب ضد الكمبيوتر أو ضد صديق.<br>
        2. حاول وضع 3 رموز في صف، عمود، أو قطر.<br>
        3. امنع خصمك من الفوز.<br>
        <br>
        <em>نصيحة: المستوى الصعب لا يمكن هزيمته بسهولة!</em>
    `,
    'flappy': `
        <strong>الهدف:</strong> توجيه الطائر عبر الأنابيب دون الاصطدام.<br><br>
        1. اضغط المسافة أو انقر للطيران للأعلى.<br>
        2. تجنب الأنابيب الخضراء والسقوط.<br>
        3. كل أنبوب تعبره يعطيك نقطة.<br>
        4. حاول البقاء لأطول فترة ممكنة!<br>
        <br>
        <em>نصيحة: حافظ على ارتفاع متوسط لتسهيل المناورة!</em>
    `
};

function showInstructions(game) {
    const modal = document.getElementById('instructions-modal');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('modal-text');

    title.innerText = game === 'memory' ? 'لعبة الذاكرة' :
        game === 'snake' ? 'لعبة الثعبان' : 
        game === 'flappy' ? 'الطائر الطيار' : 'إكس أو';

    text.innerHTML = instructionsData[game];
    modal.style.display = 'flex';
}

function closeInstructions() {
    document.getElementById('instructions-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    const instructionsModal = document.getElementById('instructions-modal');
    const statsModal = document.getElementById('stats-modal');
    if (event.target == instructionsModal) {
        instructionsModal.style.display = "none";
    }
    if (event.target == statsModal) {
        statsModal.style.display = "none";
    }
}

function showStats() {
    const modal = document.getElementById('stats-modal');
    const content = document.getElementById('stats-content');
    const scores = scoreMgr.scores;

    content.innerHTML = `
        <div class="stat-item" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; border: 1px solid var(--primary-color);">
            <h3><i class="fas fa-brain"></i> الذاكرة</h3>
            <p style="font-size: 1.5rem; margin-top: 0.5rem;">${scores.memory === 0 ? 'لا توجد' : scores.memory + ' حركة'}</p>
        </div>
        <div class="stat-item" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; border: 1px solid var(--secondary-color);">
            <h3><i class="fas fa-dragon"></i> الثعبان</h3>
            <p style="font-size: 1.5rem; margin-top: 0.5rem;">${scores.snake}</p>
        </div>
        <div class="stat-item" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; border: 1px solid var(--accent-color);">
            <h3><i class="fas fa-times"></i> إكس أو (فوز)</h3>
            <p style="font-size: 1.5rem; margin-top: 0.5rem;">${scores.tictactoe}</p>
        </div>
        <div class="stat-item" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; border: 1px solid var(--primary-color);">
            <h3><i class="fas fa-dove"></i> الطائر الطيار</h3>
            <p style="font-size: 1.5rem; margin-top: 0.5rem;">${scores.flappy}</p>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeStats() {
    document.getElementById('stats-modal').style.display = 'none';
}

function loadGame(gameName) {
    homeScreen.style.display = 'none';
    gameArea.style.display = 'flex';
    gameContent.innerHTML = '';

    switch (gameName) {
        case 'memory':
            initMemoryGame();
            break;
        case 'snake':
            initSnakeGame();
            break;
        case 'tictactoe':
            initTicTacToe();
            break;
        case 'flappy':
            initFlappyGame();
            break;
        default:
            console.error('Game not found');
            goHome();
    }
}

function goHome() {
    if (typeof stopSnakeGame === 'function') stopSnakeGame();

    gameArea.style.display = 'none';
    homeScreen.style.display = 'block';
    gameContent.innerHTML = '';
}

// Placeholder init functions
window.initMemoryGame = window.initMemoryGame || function () { 
    gameContent.innerHTML = '<h2>لعبة الذاكرة قريباً...</h2>'; 
};
window.initSnakeGame = window.initSnakeGame || function () { 
    gameContent.innerHTML = '<h2>لعبة الثعبان قريباً...</h2>'; 
};
window.initTicTacToe = window.initTicTacToe || function () { 
    gameContent.innerHTML = '<h2>إكس أو قريباً...</h2>'; 
};
window.initFlappyGame = window.initFlappyGame || function () { 
    gameContent.innerHTML = '<h2>الطائر الطيار قريباً...</h2>'; 
};
