# 🐍 Snake Deluxe 🕹️

Welcome to Snake Deluxe! This is a classic snake game rebuilt with modern web technologies (HTML, CSS, JavaScript) as a fun, personal project. It features multiple styles, AI opponents, and an unlockable endless mode.

## ✨ Features

*   **Classic Snake Gameplay:** Eat apples to grow your snake. Don't crash into yourself!
*   **AI Opponents:** Compete against AI-controlled snakes that can also eat apples and be "killed" for points.
*   **Multiple Game Styles:**
    *   Retro (Classic pixelated look)
    *   Modern (Sleek, rounded look)
    *   Sci-Fi (Futuristic neon theme)
*   **Adjustable Game Speed:** Choose from Slow, Normal, Fast, or Ludicrous!
*   **Scoreboard & High Score:** Track your current score and compete against your personal best (saved locally).
*   **Unlockable Endless Mode:** Reach 100 points in the standard game to unlock a challenging endless mode without AI.
*   **Mobile Friendly:** On-screen arrow controls for playing on touch devices.
*   **Keyboard Controls:** Use Arrow Keys or WASD for desktop play.
*   **Pause Functionality:** Pause and resume the game at any time.
*   **Sound Effects:** Basic SFX for key game events (can be customized).

## 🎮 How to Play

**Objective:** Control your snake to eat apples 🍎. Each apple makes your snake longer. Avoid crashing into walls (in some modes, though this version wraps around), your own body, or (usually) other snakes.

**Controls:**

*   **Desktop:**
    *   `Arrow Keys` or `W, A, S, D`: Control snake direction.
    *   `Spacebar` or `P` or `Escape`: Pause/Resume game.
    *   `Spacebar` (on Game Over screen): Restart game.
*   **Mobile:**
    *   Use the on-screen `↑, ↓, ←, →` buttons to control the snake.

**Scoring:**

*   Eating an apple: +1 point
*   "Killing" an AI snake (by having it crash into your body, or by a head-on collision if your snake is longer): +2 points

**Endless Mode:**
Unlock by scoring 100 points in the regular game mode. In Endless Mode, there are no AI snakes, and the challenge is purely self-survival and high-score chasing.

## 🛠️ Setup & Running Locally

1.  **Download/Clone:** Get the `index.html`, `style.css`, and `script.js` files.
2.  **(Optional but Recommended for SFX) Sound Files:**
    *   Create a folder named `sfx` in the same directory as `index.html`.
    *   Find your own `.mp3` or `.wav` sound files for:
        *   `eat.mp3` (eating an apple)
        *   `gameOver.mp3` (game over)
        *   `kill.mp3` (killing an AI)
        *   `ui_click.mp3` (pause/menu interactions)
    *   Place these files into the `sfx` folder. The `script.js` is pre-configured to look for them there. If you use different names or locations, update the `sfxPaths` object in `script.js`.
3.  **Open in Browser:** Simply open the `index.html` file in your web browser.

For the best experience, especially if you encounter issues with sound effects loading directly from the file system, you might consider running it through a simple local web server. Many code editors (like VS Code with the "Live Server" extension) offer this functionality easily.

## 🖼️ Screenshots (Add your own!)

*(Placeholder: Consider adding a screenshot of the main menu and gameplay here.)*
