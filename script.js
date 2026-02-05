const vocabData = [
    // Original words
    { word: "Quick-witted", def: "Able to think in a fast way" },
    { word: "Light-hearted", def: "Cheerful and without problems" },
    { word: "Bad-mannered", def: "Rude and not showing respect" },
    { word: "Open-minded", def: "Willing to accept other ideas" },
    { word: "Hard-working", def: "Putting a lot of effort into something" },
    { word: "Self-confident", def: "Having confidence in yourself" },
    { word: "Single-minded", def: "Thinking only about one goal" },
    { word: "Thick-skinned", def: "Not easily upset by criticism" },
    { word: "Easy-going", def: "Relaxed and happy to accept things" },
    { word: "Well-behaved", def: "Behaving in an acceptable way" },
    // New words
    { word: "Adaptable", def: "Able to adjust to new conditions easily" },
    { word: "Analytical", def: "Skilled at examining things in detail" },
    { word: "Argumentative", def: "Tending to argue or disagree with others" },
    { word: "Assertive", def: "Confident and direct in expressing opinions" },
    { word: "Compassionate", def: "Showing sympathy and concern for others" },
    { word: "Conscientious", def: "Careful and thorough in doing tasks" },
    { word: "Considerate", def: "Thoughtful about the feelings of others" },
    { word: "Creative", def: "Having the ability to produce original ideas" },
    { word: "Detail-oriented", def: "Paying close attention to small things" },
    { word: "Diligent", def: "Showing careful and persistent effort" },
    { word: "Disorganised", def: "Lacking order or planning skills" },
    { word: "Empathic", def: "Able to understand and share others' feelings" },
    { word: "Gregarious", def: "Enjoying the company of other people" }
];

let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let pairsFound = 0;
let moves = 0;
let timerInterval;
let startTime;
let gameStarted = false;
let streak = 0;
let maxStreak = 0;
let hintsLeft = 5;
let soundEnabled = true;

const gameBoard = document.getElementById('game-board');
const pairsCountEl = document.getElementById('pairs-count');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const modal = document.getElementById('modal');
const finalTimeEl = document.getElementById('final-time');
const finalMovesEl = document.getElementById('final-moves');
const finalStreakEl = document.getElementById('final-streak');
const restartBtn = document.querySelector('.restart-btn');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');
const streakEl = document.getElementById('streak');
const hintBtn = document.getElementById('hint-btn');
const hintsLeftEl = document.getElementById('hints-left');
const soundBtn = document.getElementById('sound-btn');
const soundIcon = document.getElementById('sound-icon');
const starRatingEl = document.getElementById('star-rating');
const bestScoreEl = document.getElementById('best-score');
const reviewBtn = document.getElementById('review-btn');
const reviewModal = document.getElementById('review-modal');
const closeReviewBtn = document.getElementById('close-review');
const vocabListEl = document.getElementById('vocab-list');
const searchInput = document.getElementById('search-input');

// --- Sound Effects (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!soundEnabled) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    switch(type) {
        case 'flip':
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
            break;
        case 'match':
            oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
            break;
        case 'wrong':
            oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime + 0.1);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2);
            break;
        case 'victory':
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.3);
                osc.start(audioCtx.currentTime + i * 0.15);
                osc.stop(audioCtx.currentTime + i * 0.15 + 0.3);
            });
            break;
        case 'hint':
            oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.2);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2);
            break;
    }
}

// --- Confetti Logic ---
let particles = [];
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createConfetti() {
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            size: Math.random() * 10 + 5,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 4 - 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5
        });
    }
}

function updateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, index) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
        ctx.restore();

        if (p.y > canvas.height) particles.splice(index, 1);
    });
    if (particles.length > 0) requestAnimationFrame(updateConfetti);
}

function startConfetti() {
    createConfetti();
    updateConfetti();
}

// --- Best Score Logic ---
function getBestScore() {
    const saved = localStorage.getItem('vocabGameBest');
    return saved ? JSON.parse(saved) : null;
}

function saveBestScore(time, moves) {
    const current = getBestScore();
    const timeInSeconds = parseTimeToSeconds(time);

    if (!current || timeInSeconds < current.timeSeconds ||
        (timeInSeconds === current.timeSeconds && moves < current.moves)) {
        localStorage.setItem('vocabGameBest', JSON.stringify({
            time: time,
            timeSeconds: timeInSeconds,
            moves: moves
        }));
        return true;
    }
    return false;
}

function parseTimeToSeconds(timeStr) {
    const [min, sec] = timeStr.split(':').map(Number);
    return min * 60 + sec;
}

// --- Star Rating Logic ---
function calculateStars(moves, timeSeconds) {
    const totalPairs = vocabData.length;
    // Perfect game: totalPairs moves minimum (one try per pair)
    // 3 stars: <= 1.5x minimum moves and <= 6 seconds per pair
    // 2 stars: <= 2.5x minimum moves and <= 12 seconds per pair
    // 1 star: completed

    const threeStarMoves = Math.floor(totalPairs * 1.5);
    const threeStarTime = totalPairs * 6;
    const twoStarMoves = Math.floor(totalPairs * 2.5);
    const twoStarTime = totalPairs * 12;

    if (moves <= threeStarMoves && timeSeconds <= threeStarTime) return 3;
    if (moves <= twoStarMoves && timeSeconds <= twoStarTime) return 2;
    return 1;
}

function displayStars(stars) {
    starRatingEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const star = document.createElement('span');
        star.className = i < stars ? 'star filled' : 'star empty';
        star.textContent = '★';
        starRatingEl.appendChild(star);
    }
}

// --- Hint Logic ---
function useHint() {
    if (hintsLeft <= 0 || lockBoard || pairsFound === vocabData.length) return;

    const unmatchedCards = Array.from(document.querySelectorAll('.card:not(.matched)'));
    if (unmatchedCards.length < 2) return;

    // Find a matching pair
    const cardMap = {};
    unmatchedCards.forEach(card => {
        const id = card.dataset.id;
        if (!cardMap[id]) cardMap[id] = [];
        cardMap[id].push(card);
    });

    const pairId = Object.keys(cardMap).find(id => cardMap[id].length === 2);
    if (!pairId) return;

    hintsLeft--;
    hintsLeftEl.textContent = hintsLeft;
    playSound('hint');

    lockBoard = true;
    const pair = cardMap[pairId];

    pair.forEach(card => card.classList.add('hint-reveal'));

    setTimeout(() => {
        pair.forEach(card => card.classList.remove('hint-reveal'));
        lockBoard = false;
    }, 1500);
}

// --- Sound Toggle ---
function toggleSound() {
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// --- Game Logic ---

function startGame() {
    startScreen.classList.add('hidden');
    gameStarted = true;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    initGame();
}

function initGame() {
    // Reset state
    gameBoard.innerHTML = '';
    pairsFound = 0;
    moves = 0;
    streak = 0;
    maxStreak = 0;
    hintsLeft = 5;
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update UI
    pairsCountEl.textContent = `0/${vocabData.length}`;
    movesEl.textContent = '0';
    timerEl.textContent = '00:00';
    streakEl.textContent = '0';
    hintsLeftEl.textContent = '5';
    modal.classList.add('hidden');

    // Create card pairs
    const tempCards = [];
    vocabData.forEach((item, index) => {
        tempCards.push({ id: index, type: 'word', content: item.word });
        tempCards.push({ id: index, type: 'def', content: item.def });
    });

    // Shuffle
    tempCards.sort(() => Math.random() - 0.5);

    // Render with 3D structure
    tempCards.forEach((cardData, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.id = cardData.id;
        card.style.animationDelay = `${index * 0.05}s`;

        if (cardData.type === 'def') card.classList.add('definition');

        const front = document.createElement('div');
        front.classList.add('card-front');
        front.textContent = cardData.content;

        card.appendChild(front);
        gameBoard.appendChild(card);
        card.addEventListener('click', flipCard);
    });

    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timerEl.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;
    if (this.classList.contains('matched')) return;

    playSound('flip');
    this.classList.add('selected');

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    incrementMoves();
    checkForMatch();
}

function incrementMoves() {
    moves++;
    movesEl.textContent = moves;
}

function checkForMatch() {
    let isMatch = firstCard.dataset.id === secondCard.dataset.id;
    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    lockBoard = true;
    setTimeout(() => {
        playSound('match');
        firstCard.classList.add('matched');
        secondCard.classList.add('matched');
        firstCard.classList.remove('selected');
        secondCard.classList.remove('selected');

        // Update streak
        streak++;
        if (streak > maxStreak) maxStreak = streak;
        streakEl.textContent = streak;
        streakEl.parentElement.classList.add('streak-pulse');
        setTimeout(() => streakEl.parentElement.classList.remove('streak-pulse'), 300);

        resetBoard();
        updateScore();
    }, 600);
}

function unflipCards() {
    lockBoard = true;

    // Reset streak
    streak = 0;
    streakEl.textContent = streak;

    setTimeout(() => {
        playSound('wrong');
        firstCard.classList.add('wrong');
        secondCard.classList.add('wrong');
    }, 600);

    setTimeout(() => {
        firstCard.classList.remove('selected', 'wrong');
        secondCard.classList.remove('selected', 'wrong');
        resetBoard();
    }, 1200);
}

function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

function updateScore() {
    pairsFound++;
    pairsCountEl.textContent = `${pairsFound}/${vocabData.length}`;
    if (pairsFound === vocabData.length) endGame();
}

function endGame() {
    clearInterval(timerInterval);
    playSound('victory');
    startConfetti();

    const timeStr = timerEl.textContent;
    const timeSeconds = parseTimeToSeconds(timeStr);
    const stars = calculateStars(moves, timeSeconds);
    const isNewBest = saveBestScore(timeStr, moves);

    setTimeout(() => {
        finalTimeEl.textContent = timeStr;
        finalMovesEl.textContent = moves;
        finalStreakEl.textContent = maxStreak;
        displayStars(stars);

        const best = getBestScore();
        if (best) {
            bestScoreEl.innerHTML = isNewBest
                ? '<span class="new-record">New Record!</span>'
                : `<span class="best-label">Best: ${best.time} / ${best.moves} moves</span>`;
        }

        modal.classList.remove('hidden');
    }, 1000);
}

// --- Review Logic ---
function openReview() {
    renderVocabList(vocabData);
    reviewModal.classList.remove('hidden');
    searchInput.value = '';
    searchInput.focus();
}

function closeReview() {
    reviewModal.classList.add('hidden');
}

function renderVocabList(data) {
    vocabListEl.innerHTML = '';

    // Sort alphabetically
    const sorted = [...data].sort((a, b) => a.word.localeCompare(b.word));

    sorted.forEach((item, index) => {
        const vocabItem = document.createElement('div');
        vocabItem.className = 'vocab-item';
        vocabItem.style.animationDelay = `${index * 0.03}s`;

        vocabItem.innerHTML = `
            <div class="vocab-word">${item.word}</div>
            <div class="vocab-def">${item.def}</div>
        `;

        vocabListEl.appendChild(vocabItem);
    });

    if (data.length === 0) {
        vocabListEl.innerHTML = '<div class="no-results">No words found</div>';
    }
}

function filterVocab(searchTerm) {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
        renderVocabList(vocabData);
        return;
    }

    const filtered = vocabData.filter(item =>
        item.word.toLowerCase().includes(term) ||
        item.def.toLowerCase().includes(term)
    );

    renderVocabList(filtered);
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', initGame);
hintBtn.addEventListener('click', useHint);
soundBtn.addEventListener('click', toggleSound);
reviewBtn.addEventListener('click', openReview);
closeReviewBtn.addEventListener('click', closeReview);
searchInput.addEventListener('input', (e) => filterVocab(e.target.value));

// Close review modal on outside click
reviewModal.addEventListener('click', (e) => {
    if (e.target === reviewModal) closeReview();
});

// Auto-start game
startGame();
