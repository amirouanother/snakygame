// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Screens
const mainMenu = document.getElementById('mainMenu');
const settingsScreen = document.getElementById('settingsScreen');
const creditsScreen = document.getElementById('creditsScreen');
const gameArea = document.getElementById('gameArea');
const allScreenElements = [mainMenu, settingsScreen, creditsScreen, gameArea];
// Other UI
const scoreBoard = document.getElementById('scoreBoard');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const mainMenuHighScore = document.getElementById('mainMenuHighScore');
const gameOverlayMessage = document.getElementById('gameOverlayMessage');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const mobileControls = document.querySelector('.mobile-controls');
const endlessModeButton = document.getElementById('endlessModeButton');
const pauseButton = document.getElementById('pauseButton');

// Buttons
const startButton = document.getElementById('startButton');
const settingsButton = document.getElementById('settingsButton');
const creditsButton = document.getElementById('creditsButton');
const backToMenuFromSettings = document.getElementById('backToMenuFromSettings');
const backToMenuFromCredits = document.getElementById('backToMenuFromCredits');
const overlayRestartButton = document.getElementById('overlayRestartButton');
const overlayMenuButton = document.getElementById('overlayMenuButton');

// Settings
const gameSpeedSelect = document.getElementById('gameSpeed');
const gameStyleSelect = document.getElementById('gameStyle');
const creditsGithubLink = document.getElementById('creditsGithubLink'); // For the user's link

// --- Game Constants & Variables ---
const GRID_SIZE = 20;
let canvasWidth = 400;
let canvasHeight = 400;
let GRID_WIDTH = canvasWidth / GRID_SIZE;
let GRID_HEIGHT = canvasHeight / GRID_SIZE;

let gameLoopInterval;
let currentSpeed = parseInt(gameSpeedSelect.value);
let currentStyle = gameStyleSelect.value;

let playerSnake;
let aiSnakes = [];
const MAX_AI_SNAKES = 2;
let apple;
let playerDirection;
let nextPlayerDirection;
let score;
let highScore = parseInt(localStorage.getItem('snakeHighScoreDeluxe')) || 0;
let gameRunning = false;
let isPaused = false;
let isEndlessMode = false;
let endlessModeUnlocked = localStorage.getItem('snakeEndlessUnlockedDeluxe') === 'true';

const Directions = {
    UP: { x: 0, y: -1, name: 'UP' }, DOWN: { x: 0, y: 1, name: 'DOWN' },
    LEFT: { x: -1, y: 0, name: 'LEFT' }, RIGHT: { x: 1, y: 0, name: 'RIGHT' },
    STOP: { x: 0, y: 0, name: 'STOP' }
};
let currentPlayerDirectionEnum = Directions.RIGHT;

// --- Sound Effects ---
// IMPORTANT: Replace 'YOUR_SOUND_FILE_PATH_OR_URL_HERE' with actual paths to your sound files!
// For GitHub Pages, if sounds are in an 'sfx' folder at the root: './sfx/eat.mp3'
let sfx = {};
let bgMusic; // ADDED: Variable for background music
const sfxPaths = {
    eat: './sfx/eat.mp3',          // Example placeholder
    gameOver: './sfx/gameOver.mp3',
    kill: './sfx/kill.mp3',
    pause: './sfx/ui_click.mp3',
    backgroundMusic: './sfx/your_background_music_file.mp3' // ADDED: Path for background music (REPLACE THIS FILENAME)
};

try {
    sfx = {
        eat: new Audio(sfxPaths.eat),
        gameOver: new Audio(sfxPaths.gameOver),
        kill: new Audio(sfxPaths.kill),
        pause: new Audio(sfxPaths.pause)
    };
    Object.values(sfx).forEach(sound => {
        if (sound) {
            sound.volume = 0.3;
            sound.preload = 'auto';
        }
    });

    // ADDED: Background Music Initialization
    if (sfxPaths.backgroundMusic &&
        !sfxPaths.backgroundMusic.includes('YOUR_SOUND_FILE_PATH_OR_URL_HERE') && // Original check
        !sfxPaths.backgroundMusic.includes('your_background_music_file.mp3') // Specific placeholder check
       ) {
        bgMusic = new Audio(sfxPaths.backgroundMusic);
        bgMusic.loop = true;
        bgMusic.volume = 0.1; // Set a lower volume for background music
        bgMusic.preload = 'auto';
    } else {
        console.log("Background music path is a placeholder (YOUR_SOUND_FILE_PATH_OR_URL_HERE or your_background_music_file.mp3) or not set. Background music will be disabled.");
        bgMusic = null; // Ensure bgMusic is null if not loaded
    }

} catch (error) {
    console.error("Error initializing Audio objects. Check paths/files. SFX and Music will be disabled.", error);
    sfx = {}; // Disable SFX if initialization fails
    bgMusic = null; // ADDED: Ensure bgMusic is null on error
}


function playSound(soundName) {
    if (sfx[soundName] && sfx[soundName].src && !sfx[soundName].src.includes('YOUR_SOUND_FILE_PATH_OR_URL_HERE') && !sfx[soundName].src.endsWith('/undefined')) {
        sfx[soundName].currentTime = 0;
        sfx[soundName].play().catch(e => console.warn("SFX play error for", soundName, ":", e.message));
    } else if (sfx[soundName] && (sfx[soundName].src.includes('YOUR_SOUND_FILE_PATH_OR_URL_HERE') || sfx[soundName].src.endsWith('/undefined')) ) {
        // console.log(`SFX '${soundName}' placeholder path used or path invalid. Sound not played.`);
    }
}

// ADDED: Background Music Control Functions
function playBackgroundMusic() {
    if (bgMusic && bgMusic.src &&
        !bgMusic.src.includes('YOUR_SOUND_FILE_PATH_OR_URL_HERE') &&
        !bgMusic.src.includes('your_background_music_file.mp3') && // Check specific placeholder
        !bgMusic.src.endsWith('/undefined')) {
        if (bgMusic.paused) {
            let playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Background music play was prevented. User interaction might be needed first or check file path.", error);
                });
            }
        }
    } else if (bgMusic && (bgMusic.src.includes('YOUR_SOUND_FILE_PATH_OR_URL_HERE') || bgMusic.src.includes('your_background_music_file.mp3') || bgMusic.src.endsWith('/undefined'))) {
        // console.log("Background music placeholder path used or path invalid. Music not played.");
    }
}

function pauseBackgroundMusic() {
    if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
    }
}

function stopBackgroundMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0; // Reset track to beginning
    }
}

// --- UI & Screen Management ---
function updatePersistentHighScoreDisplay() {
    const formattedHighScore = `High Score: ${highScore}`;
    if (highScoreDisplay) highScoreDisplay.textContent = formattedHighScore;
    if (mainMenuHighScore) mainMenuHighScore.textContent = formattedHighScore;

    if (endlessModeButton) {
        endlessModeButton.style.display = endlessModeUnlocked ? 'inline-block' : 'none';
    }
}

function updateCurrentScoreDisplay() {
     if (scoreBoard) scoreBoard.textContent = `Score: ${score}`;
}


function showScreen(screenToShow) {
    console.log("Attempting to show screen:", screenToShow ? screenToShow.id : 'undefined screen');
    allScreenElements.forEach(screen => {
        if(screen) screen.classList.remove('active');
    });

    if(screenToShow){
        setTimeout(() => {
            screenToShow.classList.add('active');
            console.log(screenToShow.id + " class 'active' added.");
            // If switching to gameArea, resize canvas after it's visible
            if (screenToShow.id === 'gameArea' && !gameRunning) { // Only if not already running (e.g. initial load)
                 // ResizeCanvas is called within initGame for start, this handles menu navigation
            }
        }, 10);
    }

    if(gameOverlayMessage) gameOverlayMessage.style.display = 'none';
}


function applyStyle(styleName) {
    currentStyle = styleName;
    if(canvas){
        canvas.className = ''; // Clear previous styles from canvas
        canvas.classList.add(`${styleName}-style`);
    }
    // If you had body-level styles: document.body.className = `${styleName}-style-body`;
    if (gameRunning && !isPaused) drawGame();
}

function resizeCanvas() {
    if (!gameArea || !canvas) return; // Ensure elements exist

    const containerStyle = getComputedStyle(document.querySelector('.container'));
    // Use padding of container to calculate available space if gameArea isn't fully rendered.
    const containerPadding = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
    const availableWidth = (document.querySelector('.container').offsetWidth - containerPadding) * 0.98; // Use 98% of container's inner width

    // Use a more reliable height calculation, considering elements above/below canvas
    let availableHeight = window.innerHeight * 0.70; // Default fallback
    if (gameArea.offsetHeight > 0) { // If gameArea has a rendered height
        let otherElementsHeight = 0;
        const scoreBoardContainer = document.getElementById('scoreBoardContainer'); // Assuming you have these containers
        const pauseButtonContainer = document.getElementById('pauseButtonContainer'); // Assuming you have these containers
        if(scoreBoardContainer) otherElementsHeight += scoreBoardContainer.offsetHeight + parseInt(getComputedStyle(scoreBoardContainer).marginTop || '0');
        if(pauseButtonContainer) otherElementsHeight += pauseButtonContainer.offsetHeight + parseInt(getComputedStyle(pauseButtonContainer).marginTop || '0');
        if(mobileControls && mobileControls.style.display !== 'none') otherElementsHeight += mobileControls.offsetHeight + parseInt(getComputedStyle(mobileControls).marginTop || '0');
        availableHeight = gameArea.offsetHeight - otherElementsHeight - 20; // 20px for some breathing room
    }
    availableHeight = Math.max(availableHeight, GRID_SIZE * 10); // Ensure minimum height

    canvasWidth = Math.floor(availableWidth / GRID_SIZE) * GRID_SIZE;
    canvasHeight = Math.floor(availableHeight / GRID_SIZE) * GRID_SIZE;

    canvasWidth = Math.max(canvasWidth, GRID_SIZE * 15);
    canvasHeight = Math.max(canvasHeight, GRID_SIZE * 10);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    GRID_WIDTH = Math.floor(canvas.width / GRID_SIZE); // Use Math.floor for safety
    GRID_HEIGHT = Math.floor(canvas.height / GRID_SIZE);
    console.log(`Canvas resized to: ${canvas.width}x${canvas.height} (Grid: ${GRID_WIDTH}x${GRID_HEIGHT})`);
}


// --- Game Initialization & State ---
function initGame(endless = false) {
    console.log("initGame called. Endless:", endless);
    showScreen(gameArea);

    setTimeout(() => {
        resizeCanvas();
        console.log("Canvas resized in initGame.");

        isEndlessMode = endless;
        isPaused = false;
        if(pauseButton) {
            pauseButton.textContent = "Pause";
            pauseButton.classList.remove('resume');
        }
        score = 0;
        updateCurrentScoreDisplay();
        updatePersistentHighScoreDisplay();
        console.log("Score displays updated.");

        playerSnake = [{ x: Math.floor(GRID_WIDTH / 3), y: Math.floor(GRID_HEIGHT / 2) }];
        if(GRID_WIDTH <=0 || GRID_HEIGHT <=0) { // Safety check
            console.error("Grid dimensions are invalid after resize. Aborting game start.");
            showScreen(mainMenu); // Go back to main menu
            alert("Error: Could not set up game dimensions. Please try refreshing.");
            return;
        }

        playerDirection = Directions.RIGHT;
        currentPlayerDirectionEnum = Directions.RIGHT;
        nextPlayerDirection = Directions.RIGHT;

        aiSnakes = [];
        if (!isEndlessMode) {
            for(let i=0; i<MAX_AI_SNAKES; i++) spawnAISnake();
        }
        console.log("Snakes initialized.");

        spawnApple();
        console.log("Apple spawned.");

        gameRunning = true;
        if(gameOverlayMessage) gameOverlayMessage.style.display = 'none';

        playBackgroundMusic(); // ADDED: Start background music

        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, currentSpeed);
        applyStyle(currentStyle);
        console.log("Game loop started, style applied.");
        drawGame();
    }, 100); // Increased delay slightly for robust layout calculation
}

function togglePause() {
    if (!gameRunning) return;
    isPaused = !isPaused;
    playSound('pause');
    if (isPaused) {
        clearInterval(gameLoopInterval);
        pauseBackgroundMusic(); // ADDED: Pause background music
        if(overlayTitle) overlayTitle.textContent = "PAUSED";
        if(overlayText) overlayText.textContent = "Take a break! Press P, ESC, or Resume.";
        if(overlayRestartButton) overlayRestartButton.style.display = 'none';
        if(overlayMenuButton) overlayMenuButton.textContent = "Back to Menu";
        if(overlayMenuButton) overlayMenuButton.style.display = 'inline-block';
        if(gameOverlayMessage) gameOverlayMessage.style.display = 'block';
        if(pauseButton) {
            pauseButton.textContent = "Resume";
            pauseButton.classList.add('resume');
        }
    } else {
        if(gameOverlayMessage) gameOverlayMessage.style.display = 'none';
        playBackgroundMusic(); // ADDED: Resume background music
        gameLoopInterval = setInterval(gameLoop, currentSpeed);
        if(pauseButton) {
            pauseButton.textContent = "Pause";
            pauseButton.classList.remove('resume');
        }
        drawGame();
    }
}

function spawnApple() {
    if(GRID_WIDTH <=0 || GRID_HEIGHT <=0) return; // Prevent errors if grid not ready
    let validPosition = false;
    let attempts = 0;
    while(!validPosition && attempts < GRID_WIDTH * GRID_HEIGHT) {
        apple = {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT)
        };
        validPosition = true;
        if (playerSnake && playerSnake.some(seg => seg.x === apple.x && seg.y === apple.y)) {
            validPosition = false;
        }
        if(validPosition && aiSnakes){
            for(const ai of aiSnakes){
                if (ai.body && ai.body.some(seg => seg.x === apple.x && seg.y === apple.y)) {
                    validPosition = false;
                    break;
                }
            }
        }
        attempts++;
    }
    if (!validPosition) {
        console.warn("Could not find valid apple position easily.");
        apple = { x: 0, y: 0 }; // Fallback
    }
}

function spawnAISnake() {
    if(GRID_WIDTH <=0 || GRID_HEIGHT <=0) return; // Prevent errors
    if (aiSnakes.length >= MAX_AI_SNAKES && !isEndlessMode) return;
    let startX, startY, validSpawn;
    let attempts = 0;
    do {
        validSpawn = true;
        startX = Math.floor(Math.random() * (GRID_WIDTH - 5)) + 2;
        startY = Math.floor(Math.random() * (GRID_HEIGHT - 5)) + 2;
        if(startX >= GRID_WIDTH) startX = GRID_WIDTH -1; // Boundary checks
        if(startY >= GRID_HEIGHT) startY = GRID_HEIGHT -1;
        if(startX < 0) startX = 0;
        if(startY < 0) startY = 0;

        if (playerSnake && playerSnake.some(seg => Math.abs(seg.x - startX) < 3 && Math.abs(seg.y - startY) < 3)) {
            validSpawn = false; continue;
        }
        if (apple && apple.x === startX && apple.y === startY) {
            validSpawn = false; continue;
        }
        if(aiSnakes){
            for (const otherAI of aiSnakes) {
                if (otherAI.body && otherAI.body.some(seg => seg.x === startX && seg.y === startY)) {
                    validSpawn = false; break;
                }
            }
        }
        attempts++;
    } while (!validSpawn && attempts < 50);
    if (!validSpawn) {
        startX = GRID_WIDTH > 3 ? GRID_WIDTH - 3 : 0;
        startY = GRID_HEIGHT > 3 ? GRID_HEIGHT - 3 : 0;
    }
    const randomDirValues = Object.values(Directions).filter(d => d.name !== 'STOP');
    aiSnakes.push({
        body: [{ x: startX, y: startY }],
        direction: randomDirValues[Math.floor(Math.random() * randomDirValues.length)],
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        isAlive: true,
    });
}

// --- Game Loop & Updates ---
function gameLoop() {
    if (!gameRunning || isPaused) return;
    updatePlayerSnake();
    if (!isEndlessMode) { updateAISnakes(); }
    checkCollisions();
    if (gameRunning) { drawGame(); } // Game might end in checkCollisions
}

function updatePlayerSnake() {
    if(!playerSnake || playerSnake.length === 0 || GRID_WIDTH <=0 || GRID_HEIGHT <=0) return;
    playerDirection = nextPlayerDirection;
    const head = { x: playerSnake[0].x + playerDirection.x, y: playerSnake[0].y + playerDirection.y };

    if (head.x < 0) head.x = GRID_WIDTH - 1;
    else if (head.x >= GRID_WIDTH) head.x = 0;
    if (head.y < 0) head.y = GRID_HEIGHT - 1;
    else if (head.y >= GRID_HEIGHT) head.y = 0;

    playerSnake.unshift(head);
    if (apple && head.x === apple.x && head.y === apple.y) {
        score += 1;
        playSound('eat');
        updateCurrentScoreDisplay();
        spawnApple();
        if (score >= 100 && !endlessModeUnlocked) {
            endlessModeUnlocked = true;
            localStorage.setItem('snakeEndlessUnlockedDeluxe', 'true');
            if(endlessModeButton) endlessModeButton.style.display = 'inline-block';
            setTimeout(() => alert("Congratulations! You've unlocked Endless Mode! Access it from the Main Menu."), 0);
        }
    } else {
        playerSnake.pop();
    }
}

function updateAISnakes() {
    if(GRID_WIDTH <=0 || GRID_HEIGHT <=0) return;
    (aiSnakes || []).forEach(ai => {
        if (!ai.isAlive || !ai.body) return;
        let preferredDirection = ai.direction;
        const head = ai.body[0];
        if (apple && Math.random() < 0.7) {
            let dx = apple.x - head.x; let dy = apple.y - head.y;
            let horizontalPriority = Math.abs(dx) > Math.abs(dy);
            if (horizontalPriority) {
                if (dx > 0 && ai.direction !== Directions.LEFT) preferredDirection = Directions.RIGHT;
                else if (dx < 0 && ai.direction !== Directions.RIGHT) preferredDirection = Directions.LEFT;
                else if (dy > 0 && ai.direction !== Directions.UP) preferredDirection = Directions.DOWN;
                else if (dy < 0 && ai.direction !== Directions.DOWN) preferredDirection = Directions.UP;
            } else {
                if (dy > 0 && ai.direction !== Directions.UP) preferredDirection = Directions.DOWN;
                else if (dy < 0 && ai.direction !== Directions.DOWN) preferredDirection = Directions.UP;
                else if (dx > 0 && ai.direction !== Directions.LEFT) preferredDirection = Directions.RIGHT;
                else if (dx < 0 && ai.direction !== Directions.RIGHT) preferredDirection = Directions.LEFT;
            }
        }
        const nextPotentialHead = {x: head.x + preferredDirection.x, y: head.y + preferredDirection.y};
        let changedDirectionForSafety = false;
        if (ai.body.length > 1 && ai.body[1].x === nextPotentialHead.x && ai.body[1].y === nextPotentialHead.y) {
            const possibleTurns = Object.values(Directions).filter( d => d.name !== 'STOP' && d.name !== preferredDirection.name && d.name !== getOppositeDirection(preferredDirection.name)?.name );
            if(possibleTurns.length > 0) preferredDirection = possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
            changedDirectionForSafety = true;
        }
        if (!changedDirectionForSafety && Math.random() < 0.05) {
            const possibleDirections = Object.values(Directions).filter(d => d.name !== 'STOP');
            const validTurns = possibleDirections.filter(d => d.name !== getOppositeDirection(ai.direction.name)?.name || ai.body.length === 1);
            preferredDirection = validTurns[Math.floor(Math.random() * validTurns.length)] || ai.direction;
        }
        ai.direction = preferredDirection;
        const aiNewHead = { x: head.x + ai.direction.x, y: head.y + ai.direction.y };

        if (aiNewHead.x < 0) aiNewHead.x = GRID_WIDTH - 1;
        else if (aiNewHead.x >= GRID_WIDTH) aiNewHead.x = 0;
        if (aiNewHead.y < 0) aiNewHead.y = GRID_HEIGHT - 1;
        else if (aiNewHead.y >= GRID_HEIGHT) aiNewHead.y = 0;

        ai.body.unshift(aiNewHead);
        if (apple && aiNewHead.x === apple.x && aiNewHead.y === apple.y) {
            playSound('eat'); spawnApple();
        } else {
            ai.body.pop();
        }
        for (let i = 1; i < ai.body.length; i++) {
            if (ai.body[i].x === aiNewHead.x && ai.body[i].y === aiNewHead.y) {
                ai.body = ai.body.slice(0, Math.max(1, Math.floor(ai.body.length / 2))); break;
            }
        }
    });
    const aliveAIs = (aiSnakes || []).filter(ai => ai.isAlive).length;
    if (aliveAIs < MAX_AI_SNAKES && Math.random() < 0.1) { spawnAISnake(); }
    aiSnakes = (aiSnakes || []).filter(ai => ai.isAlive);
}

function getOppositeDirection(dirName) {
    if (dirName === Directions.UP.name) return Directions.DOWN;
    if (dirName === Directions.DOWN.name) return Directions.UP;
    if (dirName === Directions.LEFT.name) return Directions.RIGHT;
    if (dirName === Directions.RIGHT.name) return Directions.LEFT;
    return null;
}

function checkCollisions() {
    if (!gameRunning || !playerSnake || playerSnake.length === 0 || GRID_WIDTH <=0 || GRID_HEIGHT <=0) return;
    const playerHead = playerSnake[0];
    for (let i = 1; i < playerSnake.length; i++) {
        if (playerSnake[i].x === playerHead.x && playerSnake[i].y === playerHead.y) {
            triggerGameOver("Crashed into yourself!"); return;
        }
    }
    if (!isEndlessMode) {
        const AIsToRemove = new Set();
        (aiSnakes || []).forEach((ai, aiIndex) => {
            if (!ai.isAlive || !ai.body) return;
            const aiHead = ai.body[0];
            for (let i = 0; i < ai.body.length; i++) {
                if (ai.body[i].x === playerHead.x && ai.body[i].y === playerHead.y) {
                    if (i === 0) {
                        if (playerSnake.length >= ai.body.length) {
                            score += 2; playSound('kill'); ai.isAlive = false; AIsToRemove.add(ai.id);
                            playerSnake.push({...playerSnake[playerSnake.length - 1]});
                            updateCurrentScoreDisplay();
                        } else { triggerGameOver("Head-on collision with a bigger AI snake!"); return; }
                    } else { triggerGameOver("Crashed into an AI snake's body!"); return; }
                }
            }
            if (!gameRunning) return;
            for(let i = 1; i < playerSnake.length; i++) {
                if (playerSnake[i].x === aiHead.x && playerSnake[i].y === aiHead.y) {
                    score += 2; playSound('kill'); ai.isAlive = false; AIsToRemove.add(ai.id);
                    playerSnake.push({...playerSnake[playerSnake.length - 1]});
                    updateCurrentScoreDisplay(); break;
                }
            }
            for (let otherAiIndex = 0; otherAiIndex < (aiSnakes || []).length; otherAiIndex++) {
                if (aiIndex === otherAiIndex || !aiSnakes[otherAiIndex].isAlive || !aiSnakes[otherAiIndex].body) continue;
                const otherAI = aiSnakes[otherAiIndex];
                for(let segIdx = 0; segIdx < otherAI.body.length; segIdx++){
                    if(otherAI.body[segIdx].x === aiHead.x && otherAI.body[segIdx].y === aiHead.y){
                        if(segIdx === 0) {
                            if(ai.body.length > otherAI.body.length) { otherAI.isAlive = false; AIsToRemove.add(otherAI.id); }
                            else if (otherAI.body.length > ai.body.length) { ai.isAlive = false; AIsToRemove.add(ai.id); }
                            else { if(Math.random() < 0.5) {ai.isAlive = false; AIsToRemove.add(ai.id);} else {otherAI.isAlive = false; AIsToRemove.add(otherAI.id);} }
                        } else { ai.isAlive = false; AIsToRemove.add(ai.id); }
                        break;
                    }
                }
                if(!ai.isAlive) break;
            }
        });
        aiSnakes = (aiSnakes || []).filter(ai => !AIsToRemove.has(ai.id) && ai.isAlive);
    }
}

function triggerGameOver(reason) {
    if (!gameRunning) return;
    gameRunning = false;
    isPaused = false;
    clearInterval(gameLoopInterval);
    playSound('gameOver');
    pauseBackgroundMusic(); // ADDED: Pause background music on game over
    if(overlayTitle) overlayTitle.textContent = "GAME OVER!";
    if(overlayText) overlayText.textContent = `${reason} Your score: ${score}.`;
    if(overlayRestartButton) overlayRestartButton.style.display = 'inline-block';
    if(overlayMenuButton) {
        overlayMenuButton.textContent = "Main Menu";
        overlayMenuButton.style.display = 'inline-block';
    }
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScoreDeluxe', highScore);
        if(overlayText) overlayText.textContent += " New High Score!";
    }
    updatePersistentHighScoreDisplay();
    if(gameOverlayMessage) gameOverlayMessage.style.display = 'block';
}

// --- Drawing ---
function drawGame() {
    if (!gameRunning || isPaused || !canvas || GRID_WIDTH <= 0 || GRID_HEIGHT <= 0) {
        // console.warn("DrawGame called but conditions not met:", {gameRunning, isPaused, canvasExists: !!canvas, GRID_WIDTH, GRID_HEIGHT});
        return;
    }

    const styles = {
        retro: { bg: '#000', grid: '#333', apple: '#f00', playerHead: '#0c0', playerBody: '#0f0', aiOutline: '#000' },
        modern: { bg: '#e0e0e0', apple: '#e74c3c', playerHead: '#2980b9', playerBody: '#3498db', segmentRadius: 5, segmentPadding: 2 },
        scifi: { bg: '#0a0a1a', grid: '#003333', apple: '#00ff00', playerHead: '#ff00ff', playerBody: '#cc00cc', segmentRadius: 3, segmentPadding: 1 }
    };
    const s = styles[currentStyle] || styles.retro;

    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (s.grid && (currentStyle === 'retro' || currentStyle === 'scifi')) {
        ctx.strokeStyle = s.grid;
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                ctx.strokeRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }

    if(apple){
        ctx.fillStyle = s.apple;
        if (currentStyle === 'modern' || currentStyle === 'scifi') {
            ctx.beginPath();
            ctx.arc(apple.x * GRID_SIZE + GRID_SIZE / 2, apple.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2.2 - (s.segmentPadding || 0), 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(apple.x * GRID_SIZE, apple.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    }

    if(playerSnake){
        playerSnake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? s.playerHead : s.playerBody;
            if (currentStyle === 'modern' || currentStyle === 'scifi') {
                const pad = s.segmentPadding || 0; // Ensure pad is defined
                ctx.beginPath();
                ctx.roundRect(segment.x * GRID_SIZE + pad, segment.y * GRID_SIZE + pad, GRID_SIZE - (pad*2), GRID_SIZE - (pad*2), s.segmentRadius);
                ctx.fill();
            } else {
                ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                if (currentStyle === 'retro') { ctx.strokeStyle = s.aiOutline || '#000'; ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE); }
            }
        });
    }

    if (!isEndlessMode && aiSnakes) {
        aiSnakes.forEach(ai => {
            if(!ai.isAlive || !ai.body) return;
            ai.body.forEach((segment, index) => {
                let headColor = ai.color, bodyColor = ai.color;
                if(currentStyle === 'retro') headColor = darkenColor(ai.color, 30);
                else if (currentStyle === 'modern' || currentStyle === 'scifi') headColor = darkenColor(ai.color, (currentStyle === 'modern' ? 20:10));

                ctx.fillStyle = index === 0 ? headColor : bodyColor;

                if (currentStyle === 'modern' || currentStyle === 'scifi') {
                    const pad = s.segmentPadding || 0;
                    ctx.beginPath();
                    ctx.roundRect(segment.x * GRID_SIZE + pad, segment.y * GRID_SIZE + pad, GRID_SIZE - (pad*2), GRID_SIZE - (pad*2), s.segmentRadius);
                    ctx.fill();
                } else {
                    ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
                    if(s.aiOutline) {ctx.strokeStyle = s.aiOutline; ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);}
                }
            });
        });
    }
}

function darkenColor(colorInput, percent) {
    if (typeof colorInput === 'string' && colorInput.startsWith('hsl')) {
        try {
            const parts = colorInput.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
            if (!parts) return colorInput; // Safety for regex non-match
            let h = parseInt(parts[1]); let s = parseFloat(parts[2]); let l = parseFloat(parts[3]);
            l = Math.max(0, l - percent); return `hsl(${h}, ${s}%, ${l}%)`;
        } catch (e) { return colorInput; }
    }
    let hex = String(colorInput).replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if(hex.length !== 6) return colorInput; // Not a valid hex if not 3 or 6
    try {
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        r = Math.max(0, r - Math.floor(r * (percent / 100)));
        g = Math.max(0, g - Math.floor(g * (percent / 100)));
        b = Math.max(0, b - Math.floor(b * (percent / 100)));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch(e) { return colorInput; } // Catch if hex parsing fails
}

// --- Event Listeners ---
if(startButton) startButton.addEventListener('click', () => { console.log("Start Game button clicked"); initGame(false); });
if(endlessModeButton) endlessModeButton.addEventListener('click', () => initGame(true));
if(pauseButton) pauseButton.addEventListener('click', togglePause);

if(settingsButton) settingsButton.addEventListener('click', () => showScreen(settingsScreen));
if(creditsButton) creditsButton.addEventListener('click', () => showScreen(creditsScreen));

if(backToMenuFromSettings) backToMenuFromSettings.addEventListener('click', () => showScreen(mainMenu));
if(backToMenuFromCredits) backToMenuFromCredits.addEventListener('click', () => showScreen(mainMenu));

if(overlayRestartButton) overlayRestartButton.addEventListener('click', () => { if(gameOverlayMessage)gameOverlayMessage.style.display = 'none'; initGame(isEndlessMode); });
if(overlayMenuButton) overlayMenuButton.addEventListener('click', () => {
    if(gameOverlayMessage) gameOverlayMessage.style.display = 'none';
    gameRunning = false;
    isPaused = false;
    clearInterval(gameLoopInterval);
    stopBackgroundMusic(); // ADDED: Stop and reset background music when returning to menu
    showScreen(mainMenu);
});

if(gameSpeedSelect) gameSpeedSelect.addEventListener('change', (e) => { currentSpeed = parseInt(e.target.value); if (gameRunning && !isPaused) { clearInterval(gameLoopInterval); gameLoopInterval = setInterval(gameLoop, currentSpeed); } });
if(gameStyleSelect) gameStyleSelect.addEventListener('change', (e) => applyStyle(e.target.value));

document.addEventListener('keydown', (e) => {
    if (isPaused && e.key !== 'Escape' && e.key !== 'p' && e.key !== 'P' && e.key !== ' ') return;
    let newDirEnum = null;
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': if (currentPlayerDirectionEnum !== Directions.DOWN) newDirEnum = Directions.UP; e.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': if (currentPlayerDirectionEnum !== Directions.UP) newDirEnum = Directions.DOWN; e.preventDefault(); break;
        case 'ArrowLeft': case 'a': case 'A': if (currentPlayerDirectionEnum !== Directions.RIGHT) newDirEnum = Directions.LEFT; e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': if (currentPlayerDirectionEnum !== Directions.LEFT) newDirEnum = Directions.RIGHT; e.preventDefault(); break;
        case ' ': if (gameOverlayMessage && gameOverlayMessage.style.display === 'block' && overlayTitle && overlayTitle.textContent.includes("GAME OVER")) { initGame(isEndlessMode); e.preventDefault(); } else if (gameRunning) { togglePause(); e.preventDefault(); } break;
        case 'p': case 'P': case 'Escape': if (gameRunning) { togglePause(); e.preventDefault(); } break;
    }
    if(newDirEnum && playerDirection !== newDirEnum){ // Only update if it's a valid new direction
        nextPlayerDirection = newDirEnum;
        if(gameRunning && !isPaused) {
            if (playerDirection.x !== -newDirEnum.x || playerDirection.y !== -newDirEnum.y) {
                 currentPlayerDirectionEnum = newDirEnum;
            }
        } else if (!gameRunning || isPaused) {
            currentPlayerDirectionEnum = newDirEnum;
        }
    }
});

// Mobile button controls
const upBtn = document.getElementById('upButton');
const downBtn = document.getElementById('downButton');
const leftBtn = document.getElementById('leftButton');
const rightBtn = document.getElementById('rightButton');

if(upBtn) upBtn.addEventListener('click', () => { if (playerDirection !== Directions.DOWN) {nextPlayerDirection = Directions.UP; currentPlayerDirectionEnum = Directions.UP;} });
if(downBtn) downBtn.addEventListener('click', () => { if (playerDirection !== Directions.UP) {nextPlayerDirection = Directions.DOWN; currentPlayerDirectionEnum = Directions.DOWN;} });
if(leftBtn) leftBtn.addEventListener('click', () => { if (playerDirection !== Directions.RIGHT) {nextPlayerDirection = Directions.LEFT; currentPlayerDirectionEnum = Directions.LEFT;} });
if(rightBtn) rightBtn.addEventListener('click', () => { if (playerDirection !== Directions.LEFT) {nextPlayerDirection = Directions.RIGHT; currentPlayerDirectionEnum = Directions.RIGHT;} });


if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
    if(mobileControls) mobileControls.style.display = 'grid';
}

window.addEventListener('resize', () => {
    if (gameArea && gameArea.classList.contains('active')) { // Only resize if gameArea is visible
        resizeCanvas();
        if (gameRunning && !isPaused) drawGame();
    }
});

// --- Initial Setup ---
function initializeApp() {
    allScreenElements.forEach(screen => {
        if(screen) {
            screen.style.display = ''; // Clear inline style if any
            screen.classList.remove('active');
        }
    });
    if(mainMenu) showScreen(mainMenu); // Use showScreen to activate main menu

    updatePersistentHighScoreDisplay();
    if(gameStyleSelect) applyStyle(gameStyleSelect.value);

    if(creditsGithubLink) creditsGithubLink.href = "https://github.com/amirouanother";

    console.log("Snake Deluxe Initialized. Open browser console (F12) for logs/errors.");
    console.log("IMPORTANT: Update placeholder SFX paths in script.js!");
    console.log("REMINDER: For background music, replace 'your_background_music_file.mp3' in sfxPaths with your actual music file and ensure it's in the './sfx/' folder or update the path accordingly."); // ADDED
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp);
