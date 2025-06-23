// --- DOM ELEMENTS AND VARIABLES ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('mainMenu');
const settingsScreen = document.getElementById('settingsScreen');
const creditsScreen = document.getElementById('creditsScreen');
const gameArea = document.getElementById('gameArea');
const scoreBoard = document.getElementById('scoreBoard');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const mainMenuHighScore = document.getElementById('mainMenuHighScore');
const gameOverlayMessage = document.getElementById('gameOverlayMessage');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const mobileControls = document.querySelector('.mobile-controls');
const endlessModeButton = document.getElementById('endlessModeButton');
const pauseButton = document.getElementById('pauseButton');
const startButton = document.getElementById('startButton');
const settingsButton = document.getElementById('settingsButton');
const creditsButton = document.getElementById('creditsButton');
const backToMenuFromSettings = document.getElementById('backToMenuFromSettings');
const backToMenuFromCredits = document.getElementById('backToMenuFromCredits');
const overlayRestartButton = document.getElementById('overlayRestartButton');
const overlayMenuButton = document.getElementById('overlayMenuButton');
const gameSpeedSelect = document.getElementById('gameSpeed');
const gameStyleSelect = document.getElementById('gameStyle');
const creditsGithubLink = document.getElementById('creditsGithubLink');

// Game Constants & Variables
const GRID_SIZE = 20;
let canvasWidth = 400;
let canvasHeight = 400;
let GRID_WIDTH = 400 / GRID_SIZE;
let GRID_HEIGHT = 400 / GRID_SIZE;
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
let isMultiplayer = false; // Flag for multiplayer mode

const Directions = {
    UP: { x: 0, y: -1, name: 'UP' }, DOWN: { x: 0, y: 1, name: 'DOWN' },
    LEFT: { x: -1, y: 0, name: 'LEFT' }, RIGHT: { x: 1, y: 0, name: 'RIGHT' },
    STOP: { x: 0, y: 0, name: 'STOP' }
};
let currentPlayerDirectionEnum = Directions.RIGHT;

// Sound Effects
let sfx = {};
let bgMusic;
const sfxPaths = {
    eat: './sfx/eat.mp3', gameOver: './sfx/gameOver.mp3',
    kill: './sfx/kill.mp3', pause: './sfx/ui_click.mp3',
    backgroundMusic: './sfx/backgroundmusic.mp3' // Replace with your music file
};
try {
    sfx = {
        eat: new Audio(sfxPaths.eat), gameOver: new Audio(sfxPaths.gameOver),
        kill: new Audio(sfxPaths.kill), pause: new Audio(sfxPaths.pause)
    };
    Object.values(sfx).forEach(sound => { if (sound) { sound.volume = 0.3; sound.preload = 'auto'; } });
    if (sfxPaths.backgroundMusic && !sfxPaths.backgroundMusic.includes('YOUR_SOUND_FILE_PATH_OR_URL_HERE') && !sfxPaths.backgroundMusic.includes('backgroundmusic.mp3')) {
        bgMusic = new Audio(sfxPaths.backgroundMusic); bgMusic.loop = true; bgMusic.volume = 0.1; bgMusic.preload = 'auto';
    } else { bgMusic = null; }
} catch (error) { console.error("Error initializing Audio objects:", error); sfx = {}; bgMusic = null; }

function playSound(soundName) { if (sfx[soundName] && sfx[soundName].src && !sfx[soundName].src.includes('YOUR_SOUND_FILE_PATH_OR_URL_HERE') && !sfx[soundName].src.endsWith('/undefined')) { sfx[soundName].currentTime = 0; sfx[soundName].play().catch(e => console.warn("SFX play error:", e.message)); } }
function playBackgroundMusic() { if (bgMusic && bgMusic.src && !bgMusic.src.includes('YOUR_SOUND_FILE_PATH_OR_URL_HERE') && !bgMusic.src.includes('backgroundmusic.mp3') && !bgMusic.src.endsWith('/undefined') && bgMusic.paused) { bgMusic.play().catch(e => console.warn("Music play prevented:", e.message)); } }
function pauseBackgroundMusic() { if (bgMusic && !bgMusic.paused) bgMusic.pause(); }
function stopBackgroundMusic() { if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; } }

// --- FIREBASE CONFIGURATION AND INITIALIZATION ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // <<< REPLACE WITH YOUR ACTUAL FIREBASE API KEY
  authDomain: "YOUR_AUTH_DOMAIN", // <<< REPLACE
  projectId: "YOUR_PROJECT_ID",   // <<< REPLACE
  storageBucket: "YOUR_STORAGE_BUCKET", // <<< REPLACE
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // <<< REPLACE
  appId: "YOUR_APP_ID"              // <<< REPLACE
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let currentLobbyId = null;
let lobbyListener = null; // Listener for lobby document changes
let lobbiesSnapshotListener = null; // Listener for the list of lobbies
let leaderboardListener = null; // Listener for the leaderboard
let currentMapType = 'normal'; // Default map type
let gameTimerValue = 0;
let timerInterval = null;
let lobbySettingsParsed = null; // Store lobby settings when game starts

// --- UI AND SCREEN MANAGEMENT ---
const lobbyBrowser = document.getElementById('lobbyBrowser');
const lobbyScreen = document.getElementById('lobbyScreen');
const leaderboardDisplayContainer = document.getElementById('leaderboardDisplayContainer');
const multiplayerButton = document.getElementById('multiplayerButton');
const createLobbyButton = document.getElementById('createLobbyButton');
const lobbyList = document.getElementById('lobbyList');
const lobbyNameDisplay = document.getElementById('lobbyNameDisplay');
const lobbyPlayers = document.getElementById('lobbyPlayers');
const lobbySpeedDisplay = document.getElementById('lobbySpeedDisplay');
const lobbyStyleDisplay = document.getElementById('lobbyStyleDisplay');
const lobbyPasswordDisplay = document.getElementById('lobbyPasswordDisplay');
const lobbyTeamModeDisplay = document.getElementById('lobbyTeamModeDisplay');
const mapTypeDisplay = document.getElementById('mapTypeDisplay'); // NEW
const gameDurationDisplay = document.getElementById('gameDurationDisplay'); // NEW
const readyButton = document.getElementById('readyButton');
const startGameButton = document.getElementById('startGameButton');
const leaveLobbyButton = document.getElementById('leaveLobbyButton');
const backToMenuFromLobbies = document.getElementById('backToMenuFromLobbies');
const backToMenuFromLeaderboard = document.getElementById('backToMenuFromLeaderboard');
const leaderboardList = document.getElementById('leaderboardList');
const teamSelectionDiv = document.getElementById('teamSelection');
const joinBlueTeamBtn = document.getElementById('joinBlueTeamBtn');
const joinRedTeamBtn = document.getElementById('joinRedTeamBtn');
const teamScoreDisplayDiv = document.getElementById('teamScoreDisplay');
const blueTeamScoreSpan = document.getElementById('blueTeamScore');
const redTeamScoreSpan = document.getElementById('redTeamScore');
const gameTimerDisplayDiv = document.getElementById('gameTimerDisplay');
const timerSpan = document.getElementById('timer');
const inviteLobbyIdInput = document.getElementById('inviteLobbyIdInput');
const joinLobbyByIdBtn = document.getElementById('joinLobbyByIdBtn');

// Ensure new screens are added to the list for transitions
allScreenElements.push(lobbyBrowser, lobbyScreen, leaderboardDisplayContainer);

function showScreen(screenToShow) {
    allScreenElements.forEach(screen => { if(screen) screen.classList.remove('active'); });
    if(screenToShow){ setTimeout(() => { screenToShow.classList.add('active'); }, 10); }
    if(gameOverlayMessage) gameOverlayMessage.style.display = 'none';
}

function updatePersistentHighScoreDisplay() {
    const formattedHighScore = `High Score: ${highScore}`;
    if (highScoreDisplay) highScoreDisplay.textContent = formattedHighScore;
    if (mainMenuHighScore) mainMenuHighScore.textContent = formattedHighScore;
    if (endlessModeButton) endlessModeButton.style.display = endlessModeUnlocked ? 'inline-block' : 'none';
}

function updateCurrentScoreDisplay() {
     if (scoreBoard) scoreBoard.textContent = `Score: ${score}`;
}

function applyStyle(styleName) {
    currentStyle = styleName;
    if(canvas){ canvas.className = ''; canvas.classList.add(`${styleName}-style`); }
    if (gameRunning && !isPaused) drawGame();
}

function resizeCanvas() {
    if (!gameArea || !canvas) return;
    const containerStyle = getComputedStyle(document.querySelector('.container'));
    const containerPadding = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
    const availableWidth = (document.querySelector('.container').offsetWidth - containerPadding) * 0.98;
    let availableHeight = window.innerHeight * 0.70;
    if (gameArea.offsetHeight > 0) {
        let otherElementsHeight = 0;
        const scoreBoardContainer = document.getElementById('scoreBoardContainer');
        const pauseButtonContainer = document.getElementById('pauseButtonContainer');
        if(scoreBoardContainer) otherElementsHeight += scoreBoardContainer.offsetHeight + parseInt(getComputedStyle(scoreBoardContainer).marginTop || '0');
        if(pauseButtonContainer) otherElementsHeight += pauseButtonContainer.offsetHeight + parseInt(getComputedStyle(pauseButtonContainer).marginTop || '0');
        if(mobileControls && mobileControls.style.display !== 'none') otherElementsHeight += mobileControls.offsetHeight + parseInt(getComputedStyle(mobileControls).marginTop || '0');
        availableHeight = gameArea.offsetHeight - otherElementsHeight - 20;
    }
    availableHeight = Math.max(availableHeight, GRID_SIZE * 10);
    canvasWidth = Math.floor(availableWidth / GRID_SIZE) * GRID_SIZE;
    canvasHeight = Math.floor(availableHeight / GRID_SIZE) * GRID_SIZE;
    if (currentMapType === 'large') {
        canvasWidth = Math.max(canvasWidth, GRID_SIZE * 25);
        canvasHeight = Math.max(canvasHeight, GRID_SIZE * 20);
    } else {
        canvasWidth = Math.max(canvasWidth, GRID_SIZE * 15);
        canvasHeight = Math.max(canvasHeight, GRID_SIZE * 10);
    }
    canvas.width = canvasWidth; canvas.height = canvasHeight;
    GRID_WIDTH = Math.floor(canvas.width / GRID_SIZE); GRID_HEIGHT = Math.floor(canvas.height / GRID_SIZE);
    console.log(`Canvas resized to: ${canvas.width}x${canvas.height} (Grid: ${GRID_WIDTH}x${GRID_HEIGHT})`);
}

// --- FIREBASE AUTHENTICATION AND UTILITY FUNCTIONS ---
function handleAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log("User signed in:", user.uid);
            if (currentLobbyId) syncLobbyState(currentLobbyId);
        } else {
            console.log("No user signed in. Signing in anonymously...");
            auth.signInAnonymously().catch((error) => {
                console.error("Anonymous sign-in error:", error);
                alert("Failed to sign in. Please check your network or try again later.");
            });
        }
    });
}

// --- LOBBY MANAGEMENT FUNCTIONS ---
async function createLobby() {
    if (!currentUser) return alert("Please wait for authentication.");
    const lobbyId = `lobby_${Date.now()}`;
    const isTeamMode = confirm("Enable Team Mode? (Requires larger map and timer)");
    const mapType = isTeamMode ? 'large' : 'normal';
    const gameDuration = isTeamMode ? parseInt(prompt("Enter game duration in seconds (e.g., 180 for 3 minutes):", "120")) || 120 : 0;

    const lobbyData = {
        hostId: currentUser.uid,
        players: [{ id: currentUser.uid, name: "You", ready: false, team: "blue", score: 0 }],
        settings: {
            speed: currentSpeed, style: currentStyle, password: null,
            teamMode: isTeamMode, mapType: mapType, gameDuration: gameDuration
        },
        teams: { blue: [{ id: currentUser.uid, name: "You", score: 0 }], red: [] },
        gameState: isTeamMode ? "team_setup" : "waiting",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        await db.collection("lobbies").doc(lobbyId).set(lobbyData);
        console.log("Lobby created:", lobbyId);
        joinLobby(lobbyId);
    } catch (error) { console.error("Error creating lobby:", error); alert("Failed to create lobby."); }
}

async function joinLobby(lobbyIdToJoin, lobbyData = null) {
    if (!currentUser) return alert("Please wait for authentication.");
    if (lobbyListener) { lobbyListener(); lobbyListener = null; }
    currentLobbyId = lobbyIdToJoin;
    const lobbyRef = db.collection("lobbies").doc(lobbyIdToJoin);
    try {
        if (!lobbyData) {
            const lobbyDoc = await lobbyRef.get();
            if (!lobbyDoc.exists()) { alert("Lobby not found!"); currentLobbyId = null; return; }
            lobbyData = lobbyDoc.data();
        }
        let playerTeam = "blue"; // Default team
        const playerAlreadyExists = lobbyData.players && lobbyData.players.some(p => p.id === currentUser.uid);
        if (!playerAlreadyExists) {
            if (lobbyData.settings.teamMode) {
                const choice = prompt("Choose your team: 'blue' or 'red'?", "blue").toLowerCase();
                playerTeam = (choice === 'red') ? 'red' : 'blue';
                lobbyData.players.push({ id: currentUser.uid, name: `Player_${currentUser.uid.substring(0, 4)}`, ready: false, team: playerTeam, score: 0 });
                if (lobbyData.teams && lobbyData.teams[playerTeam]) {
                    lobbyData.teams[playerTeam].push({ id: currentUser.uid, name: `Player_${currentUser.uid.substring(0, 4)}`, score: 0 });
                }
                await lobbyRef.update({ players: lobbyData.players, teams: lobbyData.teams });
            } else {
                lobbyData.players.push({ id: currentUser.uid, name: `Player_${currentUser.uid.substring(0, 4)}`, ready: false, score: 0 });
                await lobbyRef.update({ players: lobbyData.players });
            }
        }

        lobbyListener = lobbyRef.onSnapshot((doc) => {
            if (doc.exists()) {
                const updatedLobbyData = doc.data();
                renderLobbyScreen(updatedLobbyData);
                if (updatedLobbyData.gameState === "team_setup") { showScreen(lobbyScreen); }
                else if (updatedLobbyData.gameState === "in_progress") {
                    console.log("Game starting in lobby:", lobbyIdToJoin);
                    initGame(false, updatedLobbyData.settings);
                    if (lobbyListener) lobbyListener(); lobbyListener = null;
                    currentLobbyId = null;
                }
            } else { alert("Lobby closed."); leaveLobby(); }
        }, (error) => { console.error("Error listening to lobby:", error); alert("Failed to get lobby updates."); leaveLobby(); });
        showScreen(lobbyScreen);
    } catch (error) { console.error("Error joining lobby:", error); alert("Failed to join lobby."); currentLobbyId = null; }
}

function displayLobbies() {
    if (!lobbyList) return;
    lobbyList.innerHTML = '<li>Loading lobbies...</li>';
    if (lobbiesSnapshotListener) { lobbiesSnapshotListener(); lobbiesSnapshotListener = null; }
    const lobbiesRef = db.collection("lobbies").orderBy("createdAt");
    lobbiesSnapshotListener = lobbiesRef.onSnapshot((snapshot) => {
        lobbyList.innerHTML = '';
        if (snapshot.empty) {
            lobbyList.innerHTML = '<li>No active lobbies found.</li>';
        } else {
            snapshot.forEach((doc) => {
                const lobby = doc.data();
                if (lobby.gameState === "waiting") {
                    const lobbyEl = document.createElement('li');
                    lobbyEl.innerHTML = `
                        Lobby: ${doc.id.substring(7)} (${lobby.players.length} players)
                        <button class="menu-button" style="font-size: 0.8em; padding: 5px 10px;" onclick="joinLobby('${doc.id}', ${JSON.stringify(lobby)})">Join</button>
                    `;
                    lobbyList.appendChild(lobbyEl);
                }
            });
        }
    }, (error) => { console.error("Error fetching lobbies:", error); lobbyList.innerHTML = '<li>Error loading lobbies.</li>'; });
    if (inviteLobbyIdInput) inviteLobbyIdInput.value = window.location.origin + window.location.pathname + '#lobby=';
}

function renderLobbyScreen(lobbyData) {
    if (!lobbyData) return;
    lobbyNameDisplay.textContent = lobbyData.id.substring(7);
    lobbyPlayers.innerHTML = '<h3>Players:</h3>';
    if (lobbyData.players && lobbyData.players.length > 0) {
        lobbyData.players.forEach(player => {
            const playerEl = document.createElement('p');
            playerEl.textContent = `${player.name} ${player.id === lobbyData.hostId ? '(Host)' : ''} ${player.ready ? '[Ready]' : ''} [Team: ${player.team || 'N/A'}]`;
            lobbyPlayers.appendChild(playerEl);
        });
    } else { lobbyPlayers.innerHTML = '<h3>Players:</h3><p>No players in this lobby.</p>'; }

    lobbySpeedDisplay.textContent = lobbyData.settings.speed;
    lobbyStyleDisplay.textContent = lobbyData.settings.style;
    lobbyPasswordDisplay.textContent = lobbyData.settings.password ? 'Set' : 'None';
    lobbyTeamModeDisplay.textContent = lobbyData.settings.teamMode ? 'Enabled' : 'Disabled';
    if (mapTypeDisplay) mapTypeDisplay.textContent = lobbyData.settings.mapType || 'N/A';
    if (gameDurationDisplay) gameDurationDisplay.textContent = lobbyData.settings.gameDuration ? `${lobbyData.settings.gameDuration}s` : 'N/A';

    if (teamSelectionDiv) {
        teamSelectionDiv.style.display = lobbyData.settings.teamMode ? 'flex' : 'none';
        const player = lobbyData.players.find(p => p.id === currentUser.uid);
        if (player && !player.ready && lobbyData.gameState === "team_setup") {
            joinBlueTeamBtn.onclick = () => switchTeam(lobbyData.id, 'blue');
            joinRedTeamBtn.onclick = () => switchTeam(lobbyData.id, 'red');
        } else { joinBlueTeamBtn.onclick = null; joinRedTeamBtn.onclick = null; }
    }

    if (startGameButton) {
        startGameButton.style.display = (currentUser && lobbyData.hostId === currentUser.uid) ? 'inline-block' : 'none';
        if (lobbyData.gameState === "team_setup") {
            startGameButton.disabled = !lobbyData.players.every(p => p.ready);
            startGameButton.textContent = "Start Game";
        } else { startGameButton.disabled = true; }
    }

    if (readyButton) {
        const player = lobbyData.players.find(p => p.id === currentUser.uid);
        readyButton.textContent = player && player.ready ? "Unready" : "Ready Up";
        readyButton.onclick = () => togglePlayerReadyStatus(lobbyData.id);
    }
     if (inviteLobbyIdInput) inviteLobbyIdInput.value = window.location.origin + window.location.pathname + `#lobby=${lobbyData.id}`;
}

async function togglePlayerReadyStatus(lobbyId) {
    if (!currentUser || !lobbyId) return;
    const lobbyRef = db.collection("lobbies").doc(lobbyId);
    try {
        const lobbyDoc = await lobbyRef.get();
        if (lobbyDoc.exists()) {
            const lobbyData = lobbyDoc.data();
            const playerIndex = lobbyData.players.findIndex(p => p.id === currentUser.uid);
            if (playerIndex > -1) {
                lobbyData.players[playerIndex].ready = !lobbyData.players[playerIndex].ready;
                await lobbyRef.update({ players: lobbyData.players });
            }
        }
    } catch (error) { console.error("Error toggling ready status:", error); }
}

async function startGameFromLobby(lobbyId) {
    if (!currentUser || !lobbyId) return;
    const lobbyRef = db.collection("lobbies").doc(lobbyId);
    try {
        const lobbyDoc = await lobbyRef.get();
        if (lobbyDoc.exists()) {
            const lobbyData = lobbyDoc.data();
            if (lobbyData.hostId !== currentUser.uid) { alert("Only the host can start the game."); return; }
            if (lobbyData.players.every(p => p.ready)) {
                await lobbyRef.update({ gameState: "in_progress" });
                console.log("Game starting!");
            } else { alert("All players must be ready to start the game."); }
        }
    } catch (error) { console.error("Error starting game:", error); }
}

function leaveLobby() {
    if (lobbyListener) { lobbyListener(); lobbyListener = null; }
    if (currentLobbyId && currentUser) {
        const lobbyRef = db.collection("lobbies").doc(currentLobbyId);
        lobbyRef.get().then(doc => {
            if (doc.exists()) {
                const lobbyData = doc.data();
                const updatedPlayers = lobbyData.players.filter(p => p.id !== currentUser.uid);
                if (updatedPlayers.length !== lobbyData.players.length) {
                    if (lobbyData.hostId === currentUser.uid) {
                        if (updatedPlayers.length > 0) { lobbyRef.update({ players: updatedPlayers, hostId: updatedPlayers[0].id }); }
                        else { lobbyRef.delete(); }
                    } else { lobbyRef.update({ players: updatedPlayers }); }
                }
            }
        }).catch(error => console.error("Error cleaning up lobby on leave:", error));
    }
    currentLobbyId = null;
    showScreen(mainMenu);
}

// --- LEADERBOARD FUNCTIONS ---
async function addLeaderboardScore(playerName, score) {
    try {
        await db.collection("leaderboard").add({
            playerName: playerName, score: score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Score added to leaderboard.");
    } catch (error) { console.error("Error adding score:", error); }
}

function displayLeaderboard() {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '<li>Loading scores...</li>';
    if (leaderboardListener) { leaderboardListener(); leaderboardListener = null; }
    const leaderboardRef = db.collection("leaderboard").orderBy("score", "desc");
    leaderboardListener = leaderboardRef.onSnapshot((snapshot) => {
        leaderboardList.innerHTML = '';
        if (snapshot.empty) {
            leaderboardList.innerHTML = '<li>No scores yet. Be the first!</li>';
        } else {
            snapshot.forEach((doc, index) => {
                const scoreEntry = doc.data();
                const scoreEl = document.createElement('li');
                scoreEl.textContent = `${index + 1}. ${scoreEntry.playerName}: ${scoreEntry.score}`;
                leaderboardList.appendChild(scoreEl);
            });
        }
    }, (error) => { console.error("Error fetching leaderboard:", error); leaderboardList.innerHTML = '<li>Error loading leaderboard.</li>'; });
}

// --- NEW FUNCTION: Switch Team ---
async function switchTeam(lobbyId, teamToJoin) {
    if (!currentUser || !lobbyId) return;
    const lobbyRef = db.collection("lobbies").doc(lobbyId);
    try {
        const lobbyDoc = await lobbyRef.get();
        if (lobbyDoc.exists()) {
            const lobbyData = lobbyDoc.data();
            const playerIndex = lobbyData.players.findIndex(p => p.id === currentUser.uid);
            if (playerIndex > -1) {
                const currentPlayer = lobbyData.players[playerIndex];
                if (currentPlayer.team && lobbyData.teams[currentPlayer.team]) {
                    lobbyData.teams[currentPlayer.team] = lobbyData.teams[currentPlayer.team].filter(p => p.id !== currentUser.uid);
                }
                if (lobbyData.teams[teamToJoin]) {
                    lobbyData.teams[teamToJoin].push({ ...currentPlayer, team: teamToJoin });
                    lobbyData.players[playerIndex] = { ...currentPlayer, team: teamToJoin };
                    await lobbyRef.update({ players: lobbyData.players, teams: lobbyData.teams });
                } else { alert("Invalid team specified."); }
            }
        }
    } catch (error) { console.error("Error switching team:", error); }
}

// --- NEW FUNCTION: Start Timer ---
function startTimer(durationInSeconds) {
    if (timerInterval) clearInterval(timerInterval);
    let timeLeft = durationInSeconds;
    const updateTimerDisplay = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerSpan.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        if (--timeLeft < 0) {
            clearInterval(timerInterval); timerInterval = null;
            handleTeamModeEnd();
        }
    };
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

// --- NEW FUNCTION: Update Team Scores ---
function updateTeamScores(teamsData) {
    if (!teamsData) return;
    let blueScore = 0; let redScore = 0;
    if (teamsData.blue) blueScore = teamsData.blue.reduce((sum, player) => sum + player.score, 0);
    if (teamsData.red) redScore = teamsData.red.reduce((sum, player) => sum + player.score, 0);
    if (blueTeamScoreSpan) blueTeamScoreSpan.textContent = blueScore;
    if (redTeamScoreSpan) redTeamScoreSpan.textContent = redScore;
}

// --- NEW FUNCTION: Handle Team Mode Game End ---
function handleTeamModeEnd() {
    if (!gameRunning || !currentLobbyId || !lobbySettingsParsed || !lobbySettingsParsed.teamMode) return;
    gameRunning = false; isPaused = false; clearInterval(gameLoopInterval); stopBackgroundMusic();
    const lobbyRef = db.collection("lobbies").doc(currentLobbyId);
    lobbyRef.get().then(doc => {
        if (doc.exists()) {
            const lobbyData = doc.data();
            const blueScore = lobbyData.teams.blue.reduce((sum, p) => sum + p.score, 0);
            const redScore = lobbyData.teams.red.reduce((sum, p) => sum + p.score, 0);
            let winner = "Tie";
            if (blueScore > redScore) winner = "Blue Team";
            else if (redScore > blueScore) winner = "Red Team";

            if (overlayTitle) overlayTitle.textContent = "Team Mode Over!";
            if (overlayText) overlayText.textContent = `${winner} Wins! Blue: ${blueScore}, Red: ${redScore}`;
            if (overlayRestartButton) overlayRestartButton.style.display = 'inline-block';
            if (overlayMenuButton) { overlayMenuButton.textContent = "Back to Lobby"; overlayMenuButton.style.display = 'inline-block'; }
            if (gameOverlayMessage) gameOverlayMessage.style.display = 'block';
            lobbyRef.update({ gameState: "ended", winner: winner });
        }
    });
}

// --- MODIFIED EXISTING FUNCTIONS FOR INTEGRATION ---
function initGame(endless = false, lobbySettings = null) {
    console.log("initGame called. Endless:", endless, "Lobby Settings:", lobbySettings);
    lobbySettingsParsed = null; // Reset

    if (lobbySettings) {
        currentSpeed = lobbySettings.speed;
        currentStyle = lobbySettings.style;
        currentMapType = lobbySettings.mapType || 'normal';
        gameTimerValue = lobbySettings.gameDuration || 0;
        isMultiplayer = true;
        lobbySettingsParsed = lobbySettings;

        gameSpeedSelect.value = currentSpeed;
        gameStyleSelect.value = currentStyle;
        applyStyle(currentStyle);
    } else {
        currentSpeed = parseInt(gameSpeedSelect.value);
        currentStyle = gameStyleSelect.value;
        currentMapType = 'normal';
        gameTimerValue = 0;
        isMultiplayer = false;
    }
    resizeCanvas();

    showScreen(gameArea);
    setTimeout(() => {
        score = 0; updateCurrentScoreDisplay(); updatePersistentHighScoreDisplay();
        playerSnake = [{ x: Math.floor(GRID_WIDTH / 3), y: Math.floor(GRID_HEIGHT / 2) }];
        if (GRID_WIDTH <= 0 || GRID_HEIGHT <= 0) { console.error("Invalid grid dimensions."); showScreen(mainMenu); alert("Error: Game setup failed."); return; }
        playerDirection = Directions.RIGHT; currentPlayerDirectionEnum = Directions.RIGHT; nextPlayerDirection = Directions.RIGHT;
        aiSnakes = [];
        if (!isEndlessMode && !lobbySettings) { for (let i = 0; i < MAX_AI_SNAKES; i++) spawnAISnake(); }

        if (lobbySettingsParsed && lobbySettingsParsed.teamMode) {
            aiSnakes = [];
            updateTeamScores(lobbySettingsParsed.teams);
            startTimer(lobbySettingsParsed.gameDuration);
            if (scoreBoard) scoreBoard.style.display = 'none'; if (highScoreDisplay) highScoreDisplay.style.display = 'none';
            if (teamScoreDisplayDiv) teamScoreDisplayDiv.style.display = 'block';
            if (gameTimerDisplayDiv) gameTimerDisplayDiv.style.display = 'block';
        } else {
            if (teamScoreDisplayDiv) teamScoreDisplayDiv.style.display = 'none';
            if (gameTimerDisplayDiv) gameTimerDisplayDiv.style.display = 'none';
            if (scoreBoard) scoreBoard.style.display = 'block';
            if (highScoreDisplay) highScoreDisplay.style.display = 'block';
        }

        spawnApple();
        gameRunning = true;
        if (gameOverlayMessage) gameOverlayMessage.style.display = 'none';
        playBackgroundMusic();
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, currentSpeed);
        drawGame();
    }, 100);
}

function triggerGameOver(reason) {
    if (!gameRunning) return;
    gameRunning = false; isPaused = false; clearInterval(gameLoopInterval);
    playSound('gameOver'); pauseBackgroundMusic();

    if (overlayTitle) overlayTitle.textContent = "GAME OVER!";
    if (overlayText) overlayText.textContent = `${reason} Your score: ${score}.`;
    if (overlayRestartButton) overlayRestartButton.style.display = 'inline-block';
    if (overlayMenuButton) { overlayMenuButton.textContent = "Main Menu"; overlayMenuButton.style.display = 'inline-block'; }

    if (score > highScore) {
        highScore = score; localStorage.setItem('snakeHighScoreDeluxe', highScore);
        if (overlayText) overlayText.textContent += " New High Score!";
    }
    updatePersistentHighScoreDisplay();

    if (currentLobbyId && lobbySettingsParsed && lobbySettingsParsed.teamMode) {
        handleTeamModeEnd();
        return;
    } else if (currentLobbyId) {
        const lobbyRef = db.collection("lobbies").doc(currentLobbyId);
        lobbyRef.get().then(doc => {
            if (doc.exists()) {
                const lobbyData = doc.data();
                const playerIndex = lobbyData.players.findIndex(p => p.id === currentUser.uid);
                if (playerIndex > -1) {
                    lobbyData.players[playerIndex].score = score;
                    lobbyRef.update({ players: lobbyData.players });
                }
            }
        }).catch(error => console.error("Error updating score in lobby:", error));
        setTimeout(() => {
            showScreen(lobbyScreen); if (currentLobbyId) syncLobbyState(currentLobbyId);
        }, 2000);
    } else {
        addLeaderboardScore(currentUser.displayName || `Player_${currentUser.uid.substring(0, 4)}`, score);
    }
    if (gameOverlayMessage) gameOverlayMessage.style.display = 'block';
}

function syncLobbyState(lobbyIdToSync) {
    if (!lobbyIdToSync) return;
    const lobbyRef = db.collection("lobbies").doc(lobbyIdToSync);
    lobbyRef.get().then(doc => {
        if (doc.exists()) { renderLobbyScreen(doc.data()); }
        else { alert("Lobby no longer exists."); leaveLobby(); }
    }).catch(error => { console.error("Error syncing lobby state:", error); alert("Failed to sync lobby state."); leaveLobby(); });
}

// --- GAME LOGIC (Keep all original functions) ---
function spawnApple() { if(GRID_WIDTH <=0 || GRID_HEIGHT <=0) return; let validPosition = false; let attempts = 0; while(!validPosition && attempts < GRID_WIDTH * GRID_HEIGHT) { apple = { x: Math.floor(Math.random() * GRID_WIDTH), y: Math.floor(Math.random() * GRID_HEIGHT) }; validPosition = true; if (playerSnake && playerSnake.some(seg => seg.x === apple.x && seg.y === apple.y)) { validPosition = false; } if(validPosition && aiSnakes){ for(const ai of aiSnakes){ if (ai.body && ai.body.some(seg => seg.x === apple.x && seg.y === apple.y)) { validPosition = false; break; } } } attempts++; } if (!validPosition) { console.warn("Could not find valid apple position easily."); apple = { x: 0, y: 0 }; } }
function spawnAISnake() { if(GRID_WIDTH <=0 || GRID_HEIGHT <=0) return; if (aiSnakes.length >= MAX_AI_SNAKES && !isEndlessMode) return; let startX, startY, validSpawn; let attempts = 0; do { validSpawn = true; startX = Math.floor(Math.random() * (GRID_WIDTH - 5)) + 2; startY = Math.floor(Math.random() * (GRID_HEIGHT - 5)) + 2; if(startX >= GRID_WIDTH) startX = GRID_WIDTH -1; if(startY >= GRID_HEIGHT) startY = GRID_HEIGHT -1; if(startX < 0) startX = 0; if(startY < 0) startY = 0; if (playerSnake && playerSnake.some(seg => Math.abs(seg.x - startX) < 3 && Math.abs(seg.y - startY) < 3)) { validSpawn = false; continue; } if (apple && apple.x === startX && apple.y === startY) { validSpawn = false; continue; } if(aiSnakes){ for (const otherAI of aiSnakes) { if (otherAI.body && otherAI.body.some(seg => seg.x === startX && seg.y === startY)) { validSpawn = false; break; } } } attempts++; } while (!validSpawn && attempts < 50); if (!validSpawn) { startX = GRID_WIDTH > 3 ? GRID_WIDTH - 3 : 0; startY = GRID_HEIGHT > 3 ? GRID_HEIGHT - 3 : 0; } aiSnakes.push({ body: [{ x: startX, y: startY }], direction: Object.values(Directions).filter(d => d.name !== 'STOP')[Math.floor(Math.random() * Object.values(Directions).filter(d => d.name !== 'STOP').length)], color: `hsl(${Math.random() * 360}, 80%, 60%)`, id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, isAlive: true, }); }
function gameLoop() { if (!gameRunning || isPaused) return; updatePlayerSnake(); if (!isMultiplayer) { updateAISnakes(); } checkCollisions(); if (gameRunning) { drawGame(); } }
function updatePlayerSnake() { if(!playerSnake || playerSnake.length === 0 || GRID_WIDTH <=0 || GRID_HEIGHT <=0) return; playerDirection = nextPlayerDirection; const head = { x: playerSnake[0].x + playerDirection.x, y: playerSnake[0].y + playerDirection.y }; if (head.x < 0) head.x = GRID_WIDTH - 1; else if (head.x >= GRID_WIDTH) head.x = 0; if (head.y < 0) head.y = GRID_HEIGHT - 1; else if (head.y >= GRID_HEIGHT) head.y = 0; playerSnake.unshift(head); if (apple && head.x === apple.x && head.y === apple.y) { score += 1; updateCurrentScoreDisplay(); playSound('eat'); spawnApple(); if (score >= 100 && !endlessModeUnlocked) { endlessModeUnlocked = true; localStorage.setItem('snakeEndlessUnlockedDeluxe', 'true'); if(endlessModeButton) endlessModeButton.style.display = 'inline-block'; setTimeout(() => alert("Congratulations! You've unlocked Endless Mode!"), 0); } } else { playerSnake.pop(); } }
function updateAISnakes() { if(GRID_WIDTH <=0 || GRID_HEIGHT <=0) return; (aiSnakes || []).forEach(ai => { if (!ai.isAlive || !ai.body) return; let preferredDirection = ai.direction; const head = ai.body[0]; if (apple && Math.random() < 0.7) { let dx = apple.x - head.x; let dy = apple.y - head.y; let horizontalPriority = Math.abs(dx) > Math.abs(dy); if (horizontalPriority) { if (dx > 0 && ai.direction !== Directions.LEFT) preferredDirection = Directions.RIGHT; else if (dx < 0 && ai.direction !== Directions.RIGHT) preferredDirection = Directions.LEFT; else if (dy > 0 && ai.direction !== Directions.UP) preferredDirection = Directions.DOWN; else if (dy < 0 && ai.direction !== Directions.DOWN) preferredDirection = Directions.UP; } else { if (dy > 0 && ai.direction !== Directions.UP) preferredDirection = Directions.DOWN; else if (dy < 0 && ai.direction !== Directions.DOWN) preferredDirection = Directions.UP; else if (dx > 0 && ai.direction !== Directions.LEFT) preferredDirection = Directions.RIGHT; else if (dx < 0 && ai.direction !== Directions.RIGHT) preferredDirection = Directions.LEFT; } } const nextPotentialHead = {x: head.x + preferredDirection.x, y: head.y + preferredDirection.y}; let changedDirectionForSafety = false; if (ai.body.length > 1 && ai.body[1].x === nextPotentialHead.x && ai.body[1].y === nextPotentialHead.y) { const possibleTurns = Object.values(Directions).filter( d => d.name !== 'STOP' && d.name !== preferredDirection.name && d.name !== getOppositeDirection(preferredDirection.name)?.name ); if(possibleTurns.length > 0) preferredDirection = possibleTurns[Math.floor(Math.random() * possibleTurns.length)]; changedDirectionForSafety = true; } if (!changedDirectionForSafety && Math.random() < 0.05) { const possibleDirections = Object.values(Directions).filter(d => d.name !== 'STOP'); const validTurns = possibleDirections.filter(d => d.name !== getOppositeDirection(ai.direction.name)?.name || ai.body.length === 1); preferredDirection = validTurns[Math.floor(Math.random() * validTurns.length)] || ai.direction; } ai.direction = preferredDirection; const aiNewHead = { x: head.x + ai.direction.x, y: head.y + ai.direction.y }; if (aiNewHead.x < 0) aiNewHead.x = GRID_WIDTH - 1; else if (aiNewHead.x >= GRID_WIDTH) aiNewHead.x = 0; if (aiNewHead.y < 0) aiNewHead.y = GRID_HEIGHT - 1; else if (aiNewHead.y >= GRID_HEIGHT) aiNewHead.y = 0; ai.body.unshift(aiNewHead); if (apple && aiNewHead.x === apple.x && aiNewHead.y === apple.y) { playSound('eat'); spawnApple(); } else { ai.body.pop(); } for (let i = 1; i < ai.body.length; i++) { if (ai.body[i].x === aiNewHead.x && ai.body[i].y === aiNewHead.y) { ai.body = ai.body.slice(0, Math.max(1, Math.floor(ai.body.length / 2))); break; } } }); const aliveAIs = (aiSnakes || []).filter(ai => ai.isAlive).length; if (aliveAIs < MAX_AI_SNAKES && Math.random() < 0.1) { spawnAISnake(); } aiSnakes = (aiSnakes || []).filter(ai => ai.isAlive); }
function getOppositeDirection(dirName) { if (dirName === Directions.UP.name) return Directions.DOWN; if (dirName === Directions.DOWN.name) return Directions.UP; if (dirName === Directions.LEFT.name) return Directions.RIGHT; if (dirName === Directions.RIGHT.name) return Directions.LEFT; return null; }
function checkCollisions() { if (!gameRunning || !playerSnake || playerSnake.length === 0 || GRID_WIDTH <=0 || GRID_HEIGHT <=0) return; const playerHead = playerSnake[0]; for (let i = 1; i < playerSnake.length; i++) { if (playerSnake[i].x === playerHead.x && playerSnake[i].y === playerHead.y) { triggerGameOver("Crashed into yourself!"); return; } } if (!isMultiplayer) {
    const AIsToRemove = new Set(); (aiSnakes || []).forEach((ai, aiIndex) => { if (!ai.isAlive || !ai.body) return; const aiHead = ai.body[0]; for (let i = 0; i < ai.body.length; i++) { if (ai.body[i].x === playerHead.x && ai.body[i].y === playerHead.y) { if (i === 0) { if (playerSnake.length >= ai.body.length) { score += 2; playSound('kill'); ai.isAlive = false; AIsToRemove.add(ai.id); playerSnake.push({...playerSnake[playerSnake.length - 1]}); updateCurrentScoreDisplay(); } else { triggerGameOver("Head-on collision with a bigger AI snake!"); return; } } else { triggerGameOver("Crashed into an AI snake's body!"); return; } } } if (!gameRunning) return; for(let i = 1; i < playerSnake.length; i++) { if (playerSnake[i].x === aiHead.x && playerSnake[i].y === aiHead.y) { score += 2; playSound('kill'); ai.isAlive = false; AIsToRemove.add(ai.id); playerSnake.push({...playerSnake[playerSnake.length - 1]}); updateCurrentScoreDisplay(); break; } } for (let otherAiIndex = 0; otherAiIndex < (aiSnakes || []).length; otherAiIndex++) { if (aiIndex === otherAiIndex || !aiSnakes[otherAiIndex].isAlive || !aiSnakes[otherAiIndex].body) continue; const otherAI = aiSnakes[otherAiIndex]; for(let segIdx = 0; segIdx < otherAI.body.length; segIdx++){ if(otherAI.body[segIdx].x === aiHead.x && otherAI.body[segIdx].y === aiHead.y){ if(segIdx === 0) { if(ai.body.length > otherAI.body.length) { otherAI.isAlive = false; AIsToRemove.add(otherAI.id); } else if (otherAI.body.length > ai.body.length) { ai.isAlive = false; AIsToRemove.add(ai.id); } else { if(Math.random() < 0.5) {ai.isAlive = false; AIsToRemove.add(ai.id);} else {otherAI.isAlive = false; AIsToRemove.add(ai.id);} } } else { ai.isAlive = false; AIsToRemove.add(ai.id); } break; } } if(!ai.isAlive) break; } }); aiSnakes = (aiSnakes || []).filter(ai => !AIsToRemove.has(ai.id) && ai.isAlive); } }
else {
    if (apple && playerSnake[0].x === apple.x && playerSnake[0].y === apple.y) {
        const lobbyRef = db.collection("lobbies").doc(currentLobbyId);
        lobbyRef.get().then(doc => {
            if (doc.exists()) {
                const lobbyData = doc.data();
                const playerIndex = lobbyData.players.findIndex(p => p.id === currentUser.uid);
                if (playerIndex > -1) {
                    lobbyData.players[playerIndex].score += 1;
                    const playerTeam = lobbyData.players[playerIndex].team;
                    if (playerTeam && lobbyData.teams[playerTeam]) {
                        const teamPlayerIndex = lobbyData.teams[playerTeam].findIndex(p => p.id === currentUser.uid);
                        if (teamPlayerIndex > -1) {
                            lobbyData.teams[playerTeam][teamPlayerIndex].score += 1;
                        }
                    }
                    updateDoc(lobbyRef, { players: lobbyData.players, teams: lobbyData.teams });
                    updateTeamScores(lobbyData.teams);
                    playSound('eat');
                    spawnApple();
                }
            }
        }).catch(error => console.error("Error handling apple eat in multiplayer:", error));
    }
    if (aiSnakes) {
        const aiHit = aiSnakes.some(ai => ai.isAlive && ai.body.some(seg => seg.x === playerSnake[0].x && seg.y === playerSnake[0].y));
        if (aiHit) { console.log("Player collided with AI obstacle."); }
    }
}
}

function drawGame() {
    if (!gameRunning || isPaused || !canvas || GRID_WIDTH <= 0 || GRID_HEIGHT <= 0) return;
    const styles = {
        retro: { bg: '#000', grid: '#333', apple: '#f00', playerHead: '#0c0', playerBody: '#0f0', aiOutline: '#000' },
        modern: { bg: '#e0e0e0', apple: '#e74c3c', playerHead: '#2980b9', playerBody: '#3498db', segmentRadius: 5, segmentPadding: 2 },
        scifi: { bg: '#0a0a1a', grid: '#003333', apple: '#00ff00', playerHead: '#ff00ff', playerBody: '#cc00cc', segmentRadius: 3, segmentPadding: 1 }
    };
    const s = styles[currentStyle] || styles.retro;
    ctx.fillStyle = s.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (s.grid && (currentStyle === 'retro' || currentStyle === 'scifi')) {
        ctx.strokeStyle = s.grid;
        for (let x = 0; x < GRID_WIDTH; x++) { for (let y = 0; y < GRID_HEIGHT; y++) { ctx.strokeRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE); } }
    }
    if(apple){ ctx.fillStyle = s.apple; if (currentStyle === 'modern' || currentStyle === 'scifi') { ctx.beginPath(); ctx.arc(apple.x * GRID_SIZE + GRID_SIZE / 2, apple.y * GRID_SIZE + GRID_SIZE / 2, GRID_SIZE / 2.2 - (s.segmentPadding || 0), 0, Math.PI * 2); ctx.fill(); } else { ctx.fillRect(apple.x * GRID_SIZE, apple.y * GRID_SIZE, GRID_SIZE, GRID_SIZE); } }
    if(playerSnake){ playerSnake.forEach((segment, index) => { ctx.fillStyle = index === 0 ? s.playerHead : s.playerBody; if (currentStyle === 'modern' || currentStyle === 'scifi') { const pad = s.segmentPadding || 0; ctx.beginPath(); ctx.roundRect(segment.x * GRID_SIZE + pad, segment.y * GRID_SIZE + pad, GRID_SIZE - (pad*2), GRID_SIZE - (pad*2), s.segmentRadius); ctx.fill(); } else { ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE); if (currentStyle === 'retro') { ctx.strokeStyle = s.aiOutline || '#000'; ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE); } } }); }
    if (!isMultiplayer && aiSnakes) {
        aiSnakes.forEach(ai => { if(!ai.isAlive || !ai.body) return; ai.body.forEach((segment, index) => { let headColor = ai.color, bodyColor = ai.color; if(currentStyle === 'retro') headColor = darkenColor(ai.color, 30); else if (currentStyle === 'modern' || currentStyle === 'scifi') headColor = darkenColor(ai.color, (currentStyle === 'modern' ? 20:10)); ctx.fillStyle = index === 0 ? headColor : bodyColor; if (currentStyle === 'modern' || currentStyle === 'scifi') { const pad = s.segmentPadding || 0; ctx.beginPath(); ctx.roundRect(segment.x * GRID_SIZE + pad, segment.y * GRID_SIZE + pad, GRID_SIZE - (pad*2), GRID_SIZE - (pad*2), s.segmentRadius); ctx.fill(); } else { ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE); if(s.aiOutline) {ctx.strokeStyle = s.aiOutline; ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);} } }); });
    }
    if (lobbySettingsParsed && lobbySettingsParsed.teamMode && teamScoreDisplayDiv.style.display === 'block') {
        updateTeamScores(lobbySettingsParsed.teams);
    }
}
function darkenColor(colorInput, percent) { if (typeof colorInput === 'string' && colorInput.startsWith('hsl')) { try { const parts = colorInput.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/); if (!parts) return colorInput; let h = parseInt(parts[1]); let s = parseFloat(parts[2]); let l = parseFloat(parts[3]); l = Math.max(0, l - percent); return `hsl(${h}, ${s}%, ${l}%)`; } catch (e) { return colorInput; } } let hex = String(colorInput).replace(/^#/, ''); if (hex.length === 3) hex = hex.split('').map(c => c + c).join(''); if(hex.length !== 6) return colorInput; try { let r = parseInt(hex.substring(0, 2), 16); let g = parseInt(hex.substring(2, 4), 16); let b = parseInt(hex.substring(4, 6), 16); r = Math.max(0, r - Math.floor(r * (percent / 100))); g = Math.max(0, g - Math.floor(g * (percent / 100))); b = Math.max(0, b - Math.floor(b * (percent / 100))); return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`; } catch(e) { return colorInput; } }

// --- INITIALIZATION AND EVENT LISTENERS ---
function initializeApp() {
    showScreen(mainMenu);
    updatePersistentHighScoreDisplay();
    if (gameStyleSelect) applyStyle(gameStyleSelect.value);
    if (creditsGithubLink) creditsGithubLink.href = "https://github.com/amirouanother";
    handleAuth();
    console.log("Snake Deluxe Initialized. Open browser console (F12) for logs/errors.");
    console.log("IMPORTANT: Update placeholder SFX paths in script.js!");
    console.log("REMINDER: For background music, replace 'your_background_music_file.mp3' in sfxPaths with your actual music file.");
}

// --- EVENT LISTENERS ---
if (startButton) startButton.addEventListener('click', () => initGame(false));
if (endlessModeButton) endlessModeButton.addEventListener('click', () => initGame(true));
if (pauseButton) pauseButton.addEventListener('click', togglePause);
if (settingsButton) settingsButton.addEventListener('click', () => showScreen(settingsScreen));
if (creditsButton) creditsButton.addEventListener('click', () => showScreen(creditsScreen));
if (backToMenuFromSettings) backToMenuFromSettings.addEventListener('click', () => showScreen(mainMenu));
if (backToMenuFromCredits) backToMenuFromCredits.addEventListener('click', () => showScreen(mainMenu));

if (overlayRestartButton) overlayRestartButton.addEventListener('click', () => {
    if (gameOverlayMessage) gameOverlayMessage.style.display = 'none';
    initGame(isEndlessMode); // Restart local game
});
if (overlayMenuButton) {
    overlayMenuButton.addEventListener('click', () => {
        if (gameOverlayMessage) gameOverlayMessage.style.display = 'none';
        gameRunning = false; isPaused = false; clearInterval(gameLoopInterval);
        stopBackgroundMusic();
        if (lobbyListener) lobbyListener(); lobbyListener = null;
        currentLobbyId = null;
        if (leaderboardListener) leaderboardListener();
        showScreen(mainMenu);
    });
}

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
    if(newDirEnum && playerDirection !== newDirEnum){
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

const upBtn = document.getElementById('upButton'); const downBtn = document.getElementById('downButton');
const leftBtn = document.getElementById('leftButton'); const rightBtn = document.getElementById('rightButton');
if(upBtn) upBtn.addEventListener('click', () => { if (playerDirection !== Directions.DOWN) {nextPlayerDirection = Directions.UP; currentPlayerDirectionEnum = Directions.UP;} });
if(downBtn) downBtn.addEventListener('click', () => { if (playerDirection !== Directions.UP) {nextPlayerDirection = Directions.DOWN; currentPlayerDirectionEnum = Directions.DOWN;} });
if(leftBtn) leftBtn.addEventListener('click', () => { if (playerDirection !== Directions.RIGHT) {nextPlayerDirection = Directions.LEFT; currentPlayerDirectionEnum = Directions.LEFT;} });
if(rightBtn) rightBtn.addEventListener('click', () => { if (playerDirection !== Directions.LEFT) {nextPlayerDirection = Directions.RIGHT; currentPlayerDirectionEnum = Directions.RIGHT;} });

if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
    if(mobileControls) mobileControls.style.display = 'grid';
}

window.addEventListener('resize', () => {
    if (gameArea && gameArea.classList.contains('active')) {
        resizeCanvas();
        if (gameRunning && !isPaused) drawGame();
    }
});

// --- NEW EVENT LISTENERS FOR FIREBASE FEATURES ---
if (multiplayerButton) {
    multiplayerButton.addEventListener('click', () => {
        showScreen(lobbyBrowser);
        displayLobbies();
    });
}
if (createLobbyButton) { createLobbyButton.addEventListener('click', createLobby); }
if (readyButton) { readyButton.addEventListener('click', () => { if (currentLobbyId) togglePlayerReadyStatus(currentLobbyId); }); }
if (startGameButton) { startGameButton.addEventListener('click', () => { if (currentLobbyId) startGameFromLobby(currentLobbyId); }); }
if (leaveLobbyButton) { leaveLobbyButton.addEventListener('click', leaveLobby); }
if (backToMenuFromLobbies) {
    backToMenuFromLobbies.addEventListener('click', () => {
        if (lobbiesSnapshotListener) lobbiesSnapshotListener();
        showScreen(mainMenu);
    });
}
if (backToMenuFromLeaderboard) {
    backToMenuFromLeaderboard.addEventListener('click', () => {
        if (leaderboardListener) leaderboardListener();
        showScreen(mainMenu);
    });
}
if (joinLobbyByIdBtn) {
    joinLobbyByIdBtn.addEventListener('click', () => {
        const lobbyIdFromInput = inviteLobbyIdInput.value.split('#lobby=')[1] || inviteLobbyIdInput.value;
        if (lobbyIdFromInput && lobbyIdFromInput.startsWith('lobby_')) {
            joinLobby(lobbyIdFromInput);
        } else { alert("Please enter a valid Lobby ID."); }
    });
}

// --- PAUSE FUNCTION ---
function togglePause() {
    if (!gameRunning) return;
    isPaused = !isPaused;
    playSound('pause');
    if (isPaused) {
        clearInterval(gameLoopInterval);
        pauseBackgroundMusic();
        if(overlayTitle) overlayTitle.textContent = "PAUSED";
        if(overlayText) overlayText.textContent = "Take a break! Press P, ESC, or Resume.";
        if(overlayRestartButton) overlayRestartButton.style.display = 'none';
        if(overlayMenuButton) { overlayMenuButton.textContent = "Back to Menu"; overlayMenuButton.style.display = 'inline-block'; }
        if(gameOverlayMessage) gameOverlayMessage.style.display = 'block';
        if(pauseButton) { pauseButton.textContent = "Resume"; pauseButton.classList.add('resume'); }
    } else {
        if(gameOverlayMessage) gameOverlayMessage.style.display = 'none';
        playBackgroundMusic();
        gameLoopInterval = setInterval(gameLoop, currentSpeed);
        if(pauseButton) { pauseButton.textContent = "Pause"; pauseButton.classList.remove('resume'); }
        drawGame();
    }
}

// --- INITIAL APP SETUP ---
document.addEventListener('DOMContentLoaded', initializeApp);
