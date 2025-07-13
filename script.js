// Pause functionality
let isPaused = false;
let pausedDrops = [];

function pauseGame() {
  if (!gameRunning || isPaused) return;
  isPaused = true;
  clearInterval(dropMaker);
  // Pause timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  // Pause all drop animations
  document.querySelectorAll('.water-drop').forEach(drop => {
    drop.style.animationPlayState = 'paused';
    if (drop._collisionCheck) {
      pausedDrops.push(drop._collisionCheck);
      clearInterval(drop._collisionCheck);
    }
  });
  // Hide confetti if present
  clearConfetti();
  // Show pause overlay and block game interaction
  document.getElementById('pause-overlay').style.display = 'flex';
  document.getElementById('game-container').classList.add('paused');
}

function resumeGame() {
  if (!gameRunning || !isPaused) return;
  isPaused = false;
  dropMaker = setInterval(createDrop, 1000);
  // Resume timer
  timerInterval = setInterval(() => {
    timer--;
    updateTimerDisplay();
    if (timer <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
  document.querySelectorAll('.water-drop').forEach(drop => {
    drop.style.animationPlayState = 'running';
    if (!drop._collisionCheck) {
      drop._collisionCheck = setInterval(() => checkDropCollision(drop), 16);
    }
  });
  pausedDrops = [];
  // Hide confetti if present
  clearConfetti();
  // Hide pause overlay and unblock game interaction
  document.getElementById('pause-overlay').style.display = 'none';
  document.getElementById('game-container').classList.remove('paused');
}

// Pause overlay button logic

document.addEventListener('DOMContentLoaded', () => {
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const restartBtn = document.getElementById('restart-btn');
  const startAnotherBtn = document.getElementById('start-another-btn');
  const gameOverlay = document.getElementById('game-overlay');
  const startBtn = document.getElementById('start-btn');
  const settingsBtn = document.getElementById('settings-btn');
  window.gameMode = 'normal'; // default, make global

  // Settings popup logic
  function showSettingsPopup() {
    let popup = document.getElementById('settings-popup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'settings-popup';
      popup.style.position = 'fixed';
      popup.style.top = '0';
      popup.style.left = '0';
      popup.style.width = '100vw';
      popup.style.height = '100vh';
      popup.style.background = 'rgba(0,0,0,0.5)';
      popup.style.display = 'flex';
      popup.style.alignItems = 'center';
      popup.style.justifyContent = 'center';
      popup.style.zIndex = '999';
      // Use pause-menu style for inner box
      popup.innerHTML = `
        <div class="pause-menu" style="background: #fff; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.18); min-width: 280px; text-align: center;">
          <div class="pause-title" style="margin-bottom: 18px; font-size: 1.3em;">Select Game Mode</div>
          <div style="margin-bottom: 12px; color: #F5402C; font-size: 1em; font-weight: 500;">
            Restart your game after changing game mode!
          </div>
          <div class="pause-btn-row" style="display: flex; flex-direction: column; gap: 10px;">
            <button id="easy-mode-btn" style="margin: 0; width: 100%; padding: 12px; font-size: 1em; border-radius: 8px; border: none; background: #8BD1CB; color: #222; cursor: pointer;">Easy</button>
            <button id="normal-mode-btn" style="margin: 0; width: 100%; padding: 12px; font-size: 1em; border-radius: 8px; border: none; background: #2E9DF7; color: #fff; cursor: pointer;">Normal</button>
            <button id="hard-mode-btn" style="margin: 0; width: 100%; padding: 12px; font-size: 1em; border-radius: 8px; border: none; background: #F5402C; color: #fff; cursor: pointer;">Hard</button>
          </div>
          <button id="close-settings-btn" class="pause-menu-btn" style="margin-top: 18px;">Cancel</button>
        </div>
      `;
      document.body.appendChild(popup);
    } else {
      popup.style.display = 'flex';
    }
    // Button logic
    popup.querySelector('#easy-mode-btn').onclick = () => selectMode('easy');
    popup.querySelector('#normal-mode-btn').onclick = () => selectMode('normal');
    popup.querySelector('#hard-mode-btn').onclick = () => selectMode('hard');
    popup.querySelector('#close-settings-btn').onclick = () => {
      popup.style.display = 'none';
    };
  }

  function selectMode(mode) {
    window.gameMode = mode;
    // Close popup
    const popup = document.getElementById('settings-popup');
    if (popup) popup.style.display = 'none';
    // End any running game and restart with new mode
    if (window.gameRunning) {
      restartGame();
    } else {
      startGame();
    }
    // Optional: show feedback
    setTimeout(() => {
      alert('Game mode set to ' + mode.charAt(0).toUpperCase() + mode.slice(1));
    }, 200);
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', showSettingsPopup);
  }
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (!isPaused) {
        pauseGame();
        pauseBtn.title = 'Resume Game';
      } else {
        resumeGame();
        pauseBtn.title = 'Pause Game';
      }
    });
  }
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      resumeGame();
      if (pauseBtn) pauseBtn.title = 'Pause Game';
    });
  }
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      document.getElementById('pause-overlay').style.display = 'none';
      document.getElementById('game-container').classList.remove('paused');
      isPaused = false;
      restartGame();
    });
  }
  if (startAnotherBtn) {
    startAnotherBtn.addEventListener('click', () => {
      restartGame();
    });
  }
  if (gameOverlay && startBtn) {
    startBtn.onclick = function() {
      gameOverlay.style.display = 'none';
      startGame();
    };
  }
  // Avatar button and menu already handled elsewhere
});

// Helper for collision detection on resume
let score = 0;
function checkDropCollision(drop) {
  if (!document.body.contains(drop)) return;
  // Only collect if colliding with the TOP of the character image
  const dropRect = drop.getBoundingClientRect();
  const charRect = character.getBoundingClientRect();
  // Use the top 30% of the character image as the collection area
  const canHeight = charRect.height * 0.3;
  const canRect = {
    left: charRect.left + charRect.width * 0.25,
    right: charRect.left + charRect.width * 0.75,
    top: charRect.top,
    bottom: charRect.top + canHeight
  };
  // Check overlap with the top of the character image only
  if (
    dropRect.right > canRect.left &&
    dropRect.left < canRect.right &&
    dropRect.bottom > canRect.top &&
    dropRect.top < canRect.bottom
  ) {
    // Remove drop and clear interval
    drop.remove();
    clearInterval(drop._collisionCheck);
    drop._collisionCheck = null;
    // Score logic:
    if (drop.classList.contains('clean-drop')) {
      score++;
      playChime();
    } else if (drop.classList.contains('dirty-drop')) {
      if (score > 0) score--;
    }
    document.getElementById('score').textContent = score;
    return;
  }
}
// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly

// Character drag logic
let character = document.getElementById("character");
let gameContainer = document.getElementById("game-container");
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

function setCharacterPosition(x, y) {
  // Clamp character within game container
  const minX = 0;
  const maxX = gameContainer.offsetWidth - character.offsetWidth;
  // Always keep character at the default vertical position
  const defaultY = gameContainer.offsetHeight - character.offsetHeight - 10;
  character.style.left = Math.max(minX, Math.min(x, maxX)) + "px";
  character.style.top = defaultY + "px";
}

function onPointerDown(e) {
  isDragging = true;
  character.style.cursor = "grabbing";
  let pointerX, pointerY;
  if (e.touches) {
    pointerX = e.touches[0].clientX;
    pointerY = e.touches[0].clientY;
  } else {
    pointerX = e.clientX;
    pointerY = e.clientY;
  }
  const charRect = character.getBoundingClientRect();
  dragOffsetX = pointerX - charRect.left;
  dragOffsetY = pointerY - charRect.top;
  document.addEventListener("mousemove", onPointerMove);
  document.addEventListener("mouseup", onPointerUp);
  document.addEventListener("touchmove", onPointerMove, {passive: false});
  document.addEventListener("touchend", onPointerUp);
}

function onPointerMove(e) {
  if (!isDragging) return;
  let pointerX;
  if (e.touches) {
    pointerX = e.touches[0].clientX;
    e.preventDefault();
  } else {
    pointerX = e.clientX;
  }
  const containerRect = gameContainer.getBoundingClientRect();
  // Only update x position, y is fixed
  setCharacterPosition(pointerX - containerRect.left - dragOffsetX, 0);
  // After moving character, check for collisions with all drops
  document.querySelectorAll('.water-drop').forEach(drop => {
    checkDropCollision(drop);
  });
}

function onPointerUp() {
  isDragging = false;
  character.style.cursor = "grab";
  document.removeEventListener("mousemove", onPointerMove);
  document.removeEventListener("mouseup", onPointerUp);
  document.removeEventListener("touchmove", onPointerMove);
  document.removeEventListener("touchend", onPointerUp);
}

character.addEventListener("mousedown", onPointerDown);
character.addEventListener("touchstart", onPointerDown, {passive: false});

// Initialize character position
window.addEventListener("DOMContentLoaded", () => {
  setCharacterPosition(gameContainer.offsetWidth/2 - character.offsetWidth/2, gameContainer.offsetHeight - character.offsetHeight - 10);
});


let timer = 45;
let timerInterval;
function getModeTimer() {
  if (window.gameMode === 'easy') return 60;
  if (window.gameMode === 'normal') return 45;
  if (window.gameMode === 'hard') return 35;
  return 45;
}

function updateTimerDisplay() {
  document.getElementById('time').textContent = timer;
}

function startTimer() {
  timer = getModeTimer();
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timer--;
    updateTimerDisplay();
    if (timer <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function showConfetti() {
  let confettiCanvas = document.getElementById('confetti-canvas');
  if (!confettiCanvas) {
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'confetti-canvas';
    confettiCanvas.style.position = 'absolute';
    confettiCanvas.style.top = '0';
    confettiCanvas.style.left = '0';
    confettiCanvas.style.width = '100%';
    confettiCanvas.style.height = '100%';
    confettiCanvas.style.pointerEvents = 'none';
    confettiCanvas.style.zIndex = '300';
    document.getElementById('game-container').appendChild(confettiCanvas);
  }
  confettiCanvas.width = confettiCanvas.offsetWidth;
  confettiCanvas.height = confettiCanvas.offsetHeight;
  const ctx = confettiCanvas.getContext('2d');
  const colors = ['#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53', '#FF902A', '#F5402C', '#F16061'];
  const confettiPieces = [];
  for (let i = 0; i < 80; i++) {
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height,
      w: 8 + Math.random() * 8,
      h: 12 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2 + Math.random() * 3,
      angle: Math.random() * 2 * Math.PI,
      spin: (Math.random() - 0.5) * 0.2
    });
  }
  let frame = 0;
  function drawConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiPieces.forEach(piece => {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.angle);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.w/2, -piece.h/2, piece.w, piece.h);
      ctx.restore();
      piece.y += piece.speed;
      piece.angle += piece.spin;
      if (piece.y > confettiCanvas.height + 20) {
        piece.y = -20;
        piece.x = Math.random() * confettiCanvas.width;
      }
    });
    frame++;
    if (frame < 120) {
      confettiCanvas._confettiAnim = requestAnimationFrame(drawConfetti);
    }
  }
  drawConfetti();
}

function clearConfetti() {
  const confettiCanvas = document.getElementById('confetti-canvas');
  if (confettiCanvas) {
    if (confettiCanvas._confettiAnim) cancelAnimationFrame(confettiCanvas._confettiAnim);
    confettiCanvas.remove();
  }
}

// End game popups config
const endGamePopups = [
  {
    minScore: 20,
    message: 'Mission Complete!',
    showConfetti: true
  },
  {
    minScore: 0,
    message: 'Try Again',
    showConfetti: false
  }
];

function endGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  if (timerInterval) clearInterval(timerInterval);
  // Remove all drop collision intervals and pause drop animations
  document.querySelectorAll('.water-drop').forEach(drop => {
    if (drop._collisionCheck) {
      clearInterval(drop._collisionCheck);
      drop._collisionCheck = null;
    }
    drop.style.animationPlayState = 'paused';
  });
  // Disable character drag
  character.removeEventListener("mousedown", onPointerDown);
  character.removeEventListener("touchstart", onPointerDown);

  // Determine which popup to show
  let popupConfig = endGamePopups.find(p => score >= p.minScore && (p.minScore === 20 || score < 20));
  if (!popupConfig) popupConfig = endGamePopups[1];

  // Show popup and blur/block game content
  const popup = document.getElementById('mission-complete-popup');
  const popupContent = popup ? popup.querySelector('.mission-complete-content') : null;
  const startAnotherBtn = document.getElementById('start-another-btn');
  const gameContainer = document.getElementById('game-container');
  if (popup) popup.style.display = 'flex';
  if (gameContainer) gameContainer.classList.add('mission-complete');

  // Render message and restart button for Try Again
  if (popupContent) {
    // Always show Mission Completed text and Start Another Mission button
    popupContent.innerHTML = '';
    const msg = document.createElement('div');
    msg.style.fontSize = '1.3em';
    msg.style.fontWeight = 'bold';
    msg.style.marginBottom = '12px';
    msg.textContent = popupConfig.message;
    popupContent.appendChild(msg);
    // Show Start Another Mission button for Mission Complete
    if (startAnotherBtn) {
      startAnotherBtn.style.display = popupConfig.showConfetti ? '' : 'none';
      popupContent.appendChild(startAnotherBtn);
    }
    // Show Restart Mission button for Try Again
    const restartBtn = document.getElementById('restart-mission-btn');
    if (restartBtn) {
      restartBtn.style.display = popupConfig.showConfetti ? 'none' : '';
      if (!popupConfig.showConfetti) popupContent.appendChild(restartBtn);
    }
  }
  // Show confetti only for 20+
  if (popupConfig.showConfetti) {
    showConfetti();
  } else {
    clearConfetti();
  }
}

// Add event listener for Restart Mission button
// Moved this logic into the main DOMContentLoaded listener above for consistency and to avoid duplicate listeners.
// In the main DOMContentLoaded block (near line 41), add:
const restartMissionBtn = document.getElementById('restart-mission-btn');
if (restartMissionBtn) {
  restartMissionBtn.addEventListener('click', () => {
    restartGame();
  });
}

function startGame() {
  if (gameRunning) return;
  score = 0;
  document.getElementById('score').textContent = score;
  gameRunning = true;
  // Hide confetti if present
  clearConfetti();
  dropMaker = setInterval(createDrop, 1000);
  startTimer();
}

function restartGame() {
  // Stop the current game if running
  if (dropMaker) clearInterval(dropMaker);
  if (timerInterval) clearInterval(timerInterval);
  gameRunning = false;

  // Remove all existing drops and their collision intervals
  const gameContainer = document.getElementById("game-container");
  const drops = gameContainer.querySelectorAll(".water-drop");
  drops.forEach(drop => {
    if (drop._collisionCheck) {
      clearInterval(drop._collisionCheck);
      drop._collisionCheck = null;
    }
    drop.remove();
  });

  // Hide mission complete popup and remove blur/block
  const popup = document.getElementById('mission-complete-popup');
  
  if (popup) popup.style.display = 'none';
  if (gameContainer) gameContainer.classList.remove('mission-complete');

  // Hide confetti if present
  clearConfetti();

  // Re-enable character drag
  character.addEventListener("mousedown", onPointerDown);
  character.addEventListener("touchstart", onPointerDown, {passive: false});

  // Restart the game
  startGame();
}

function createDrop() {
  // Decide drop type: 70% clean (green), 30% dirty (obstacle)
  const isClean = Math.random() < 0.7;
  const drop = document.createElement("div");
  drop.className = "water-drop" + (isClean ? " clean-drop" : " dirty-drop");
  drop.style.position = "absolute";
  drop.style.zIndex = "1";
  drop.style.pointerEvents = 'none';

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Use image for clean/dirty drop
  if (isClean) {
    drop.style.background = 'none';
    const img = document.createElement('img');
    img.src = 'img/CLEAN water drop.png';
    img.alt = 'Clean Water Drop';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.draggable = false;
    drop.appendChild(img);
  } else {
    drop.style.background = 'none';
    const img = document.createElement('img');
    img.src = 'img/DIRTY water drop.png';
    img.alt = 'Dirty Water Drop';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.draggable = false;
    drop.appendChild(img);
  }

  // Position the drop randomly across the game width, keeping it inside the container
  const gameContainer = document.getElementById("game-container");
  const dropSize = size;
  const maxLeft = gameContainer.offsetWidth - dropSize;
  const xPosition = Math.random() * maxLeft;
  drop.style.left = xPosition + "px";
  drop.style.top = "-" + dropSize + "px";

  if (getComputedStyle(gameContainer).position === "static") {
    gameContainer.style.position = "relative";
  }

  drop.style.animationName = "dropFallWithin";
  if (window.gameMode === 'easy') {
    drop.style.animationDuration = "6s";
  } else if (window.gameMode === 'normal') {
    drop.style.animationDuration = "5s";
  } else if (window.gameMode === 'hard') {
    drop.style.animationDuration = "4s";
  } else {
    drop.style.animationDuration = "5s";
  }

  gameContainer.appendChild(drop);

  // Collision detection with character (can/collision area)
  function checkCollision() {
    checkDropCollision(drop);
  }
  drop._collisionCheck = setInterval(checkCollision, 16);

  // Remove drops that reach the bottom (weren't caught)
  drop.addEventListener("animationend", () => {
    drop.remove();
    if (drop._collisionCheck) {
      clearInterval(drop._collisionCheck);
      drop._collisionCheck = null;
    }
  });
}

function playChime() {
  const chime = document.getElementById('chime-sound');
  if (chime) {
    chime.currentTime = 0;
    chime.onplay = null;
    chime.ontimeupdate = function() {
      if (chime.currentTime >= 1) {
        chime.pause();
        chime.currentTime = 0;
        chime.ontimeupdate = null;
      }
    };
    chime.play().catch(err => console.error('Error playing chime:', err));
  }
}
  

function checkAchievements() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    if (score >= 20) unlockAchievement("canFull");
    if (score >= 35 && elapsed <= 45) unlockAchievement("speedCollector");
    if (score >= 35 && obstaclesHit === 0) unlockAchievement("perfectRun");
  }

  function unlockAchievement(id) {
    const el = document.getElementById(id);
    if (!el.classList.contains("unlocked")) {
      el.classList.add("unlocked");
      // Show achievement popup
      showAchievementPopup(id);
      console.log(`Achievement unlocked: ${el.textContent}`);
    }
}

// Achievement popup logic
function showAchievementPopup(id) {
  // Achievement info
  const achievementInfo = {
    canFull: {
      title: "Can Full",
      summary: "Collect 20 clean water drops in a single run.",
      img: "img/CLEAN water drop.png"
    },
    speedCollector: {
      title: "Speed Collector",
      summary: "Collect 35 drops in under 45 seconds.",
      img: "img/water-can.png"
    },
    perfectRun: {
      title: "Perfect Run",
      summary: "Complete a run without hitting any obstacles.",
      img: "img/Charity Water GIRL RUNNING.png"
    }
  };
  const info = achievementInfo[id];
  if (!info) return;
  let popup = document.getElementById('achievement-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'achievement-popup';
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100vw';
    popup.style.height = '100vh';
    popup.style.background = 'rgba(0,0,0,0.5)';
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';
    popup.style.zIndex = '1001';
    popup.innerHTML = `
      <div style="background: #fff; border-radius: 16px; padding: 32px 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.18); min-width: 280px; text-align: center;">
        <img src="${info.img}" alt="${info.title}" style="width:64px; height:64px; margin-bottom:12px;" />
        <h2 style="margin-bottom: 8px; font-size: 1.2em; color:#2E9DF7;">Achievement Unlocked!</h2>
        <div style="font-weight:bold; margin-bottom:6px;">${info.title}</div>
        <div style="margin-bottom:12px;">${info.summary}</div>
        <button id="close-achievement-popup" style="margin-top: 8px; padding: 8px 24px; border-radius: 8px; border: none; background: #2E9DF7; color: #fff; cursor: pointer;">Close</button>
      </div>
    `;
    document.body.appendChild(popup);
  } else {
    popup.style.display = 'flex';
    // Update content if needed
    popup.querySelector('img').src = info.img;
    popup.querySelector('img').alt = info.title;
    popup.querySelector('h2').textContent = 'Achievement Unlocked!';
    popup.querySelector('div').textContent = info.title;
    popup.querySelectorAll('div')[1].textContent = info.summary;
  }
  // Close button logic
  popup.querySelector('#close-achievement-popup').onclick = () => {
    popup.style.display = 'none';
  };
}
  document.getElementById('start-another-btn').onclick = function() {
              document.getElementById('mission-complete-popup').style.display = 'none';
              document.getElementById('try-again-popup').style.display = 'flex';
              };

              const musicBtn = document.getElementById('music-btn');
    const musicMuteSvg = document.getElementById('music-mute-svg');
    const gameMusic = document.getElementById('game-music');
    const chimeSound = document.getElementById('chime-sound');
    let musicMuted = false;

    // Start music when game starts
    document.getElementById('start-btn').addEventListener('click', function() {
      gameMusic.volume = 0.5;
      gameMusic.play();
    });

    musicBtn.addEventListener('click', function() {
      musicMuted = !musicMuted;
      gameMusic.muted = musicMuted;
      musicMuteSvg.style.display = musicMuted ? 'inline' : 'none';
    });

    // Call this function when a clean water drop is collected
    function playChime() {
      chimeSound.currentTime = 0;
      chimeSound.play();
    }
    // Example usage: playChime();