// Variables del juego
let player = document.getElementById('player');
let gameContainer = document.getElementById('gameContainer');
let enemies = [];
let zoomLevel = 1;
let paused = false;
let gameOver = false;

// Variables de vidas y marcador
let playerHP = 100;
let killCount = 0;
let maxPlayerHP = 100;
let hudLeft = document.getElementById('hudLeft');
let hudRight = document.getElementById('hudRight');

// Variables para los temporizadores de disparo
let autoFireTimer;
let fireBallContinuousTimer;

// --- Overlay de PAUSA ---
let pauseOverlay = document.createElement("div");
pauseOverlay.innerText = "⏸ PAUSE";
pauseOverlay.style.position = "absolute";
pauseOverlay.style.top = "50%";
pauseOverlay.style.left = "50%";
pauseOverlay.style.transform = "translate(-50%, -50%)";
pauseOverlay.style.fontSize = "64px";
pauseOverlay.style.fontWeight = "bold";
pauseOverlay.style.color = "gold";
pauseOverlay.style.textShadow = "2px 2px 8px black";
pauseOverlay.style.background = "rgba(0, 0, 0, 0.6)";
pauseOverlay.style.padding = "20px 50px";
pauseOverlay.style.border = "3px solid gold";
pauseOverlay.style.borderRadius = "15px";
pauseOverlay.style.zIndex = "3000";
pauseOverlay.style.display = "none";
document.body.appendChild(pauseOverlay);

window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
        paused = !paused;
        pauseOverlay.style.display = paused ? "block" : "none";

        if (paused) {
            clearTimeout(autoFireTimer);
            clearTimeout(fireBallContinuousTimer);
        } else {
            autoFireMobile();
            if (mouseDown) {
                fireBallContinuous();
            }
        }
    }
});

// Actualiza el HUD al iniciar
updateHUD();

// Posición inicial
let playerPosition = { x: 200, y: 200 };
player.style.left = `${playerPosition.x}px`;
player.style.top = `${playerPosition.y}px`;

let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// --- Configuración del tablero fijo ---
const CELL_SIZE = 50;
const GRID_COLS = 50;
const GRID_ROWS = 50;
const BOARD_WIDTH = CELL_SIZE * GRID_COLS;
const BOARD_HEIGHT = CELL_SIZE * GRID_ROWS;

gameContainer.style.width = BOARD_WIDTH + "px";
gameContainer.style.height = BOARD_HEIGHT + "px";
gameContainer.style.position = "relative";
gameContainer.style.backgroundColor = "#222";
gameContainer.style.overflow = "hidden";

// --- Movimiento del jugador limitado al tablero ---
let isFlipped = false;

function movePlayer() {
    if (paused) return;

    let dx = 0, dy = 0;
    const playerSpeed = getPlayerSettings(currentPlayerLevel).speed;

    if (keys['ArrowUp'] || keys['w']) dy -= playerSpeed;
    if (keys['ArrowDown'] || keys['s']) dy += playerSpeed;
    if (keys['ArrowLeft'] || keys['a']) dx -= playerSpeed;
    if (keys['ArrowRight'] || keys['d']) dx += playerSpeed;

    dx += joystickVector.x * playerSpeed;
    dy += joystickVector.y * playerSpeed;

    playerPosition.x = Math.max(0, Math.min(BOARD_WIDTH - 50, playerPosition.x + dx));
    playerPosition.y = Math.max(0, Math.min(BOARD_HEIGHT - 50, playerPosition.y + dy));

    player.style.left = `${playerPosition.x}px`;
    player.style.top = `${playerPosition.y}px`;

    if (dx < 0 && !isFlipped) {
        player.classList.add('flip');
        isFlipped = true;
    } else if (dx > 0 && isFlipped) {
        player.classList.remove('flip');
        isFlipped = false;
    }

    spawnEnemy();
    moveEnemies();
}

// --- Enemigos (Lógica de escalado infinito) ---
let currentMonsterLevel = 1;
const monsterLevelDisplay = document.getElementById('monsterLevelDisplay');
const monsterLevelUpButton = document.getElementById('monsterLevelUp');
const monsterLevelDownButton = document.getElementById('monsterLevelDown');

function getMonsterSettings(level) {
    const baseSpeed = 2;
    const baseHp = 50;
    const baseSpawnChance = 0.80;
    const baseDistanceThreshold = 500;
    const baseMaxEnemies = 100;

    const speed = baseSpeed + (level - 1) * 0.005;
    const hp = baseHp * (1 + (level - 1) * 0.50);
    const spawnChance = Math.min(0.5, baseSpawnChance + (level - 1) * 0.05);
    const distanceThreshold = baseDistanceThreshold + (level - 1) * 50;

    return { speed, hp, spawnChance, distanceThreshold, maxEnemies: baseMaxEnemies };
}

function updateMonsterLevelDisplay() {
    monsterLevelDisplay.innerText = `mLevel: ${currentMonsterLevel}`;
}

monsterLevelUpButton.addEventListener('click', () => {
    currentMonsterLevel++;
    updateMonsterLevelDisplay();
});

monsterLevelDownButton.addEventListener('click', () => {
    if (currentMonsterLevel > 1) {
        currentMonsterLevel--;
        updateMonsterLevelDisplay();
    }
});

updateMonsterLevelDisplay();

function spawnEnemy() {
    if (paused) return;

    const settings = getMonsterSettings(currentMonsterLevel);

if (enemies.length < settings.maxEnemies && Math.random() < settings.spawnChance) {
        const spawnDist = 200;
        let ex, ey;
        do {
            ex = Math.random() * (BOARD_WIDTH - 50);
            ey = Math.random() * (BOARD_HEIGHT - 50);
        } while (Math.abs(ex - playerPosition.x) < spawnDist && Math.abs(ey - playerPosition.y) < spawnDist);

        let enemy = document.createElement('div');
        enemy.classList.add('enemy');
        enemy.style.backgroundImage = 'url("monstruo.svg")';
        enemy.style.backgroundSize = 'cover';
        enemy.style.left = ex + "px";
        enemy.style.top = ey + "px";
        gameContainer.appendChild(enemy);

        enemies.push({ element: enemy, position: { x: ex, y: ey }, hp: settings.hp });
    }
}

function moveEnemies() {
    if (paused) return;

    const settings = getMonsterSettings(currentMonsterLevel);

    enemies.forEach(enemy => {
        let enemyPosition = enemy.position;
        let deltaX = playerPosition.x - enemyPosition.x;
        let deltaY = playerPosition.y - enemyPosition.y;
        let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > settings.distanceThreshold) {
            enemy.element.remove();
            enemies = enemies.filter(e => e !== enemy);
        } else {
            let angle = Math.atan2(deltaY, deltaX);
            enemyPosition.x += Math.cos(angle) * settings.speed;
            enemyPosition.y += Math.sin(angle) * settings.speed;

            enemyPosition.x = Math.max(0, Math.min(BOARD_WIDTH - 50, enemyPosition.x));
            enemyPosition.y = Math.max(0, Math.min(BOARD_HEIGHT - 50, enemyPosition.y));

            enemy.element.style.left = `${enemyPosition.x}px`;
            enemy.element.style.top = `${enemyPosition.y}px`;

            if (distance < 40) takeDamage(5);
        }
    });
}

// --- Jugador (Lógica de escalado infinito) ---
let currentPlayerLevel = 1;
const playerLevelDisplay = document.getElementById('playerLevelDisplay');
const playerLevelUpButton = document.getElementById('playerLevelUp');
const playerLevelDownButton = document.getElementById('playerLevelDown');

function getPlayerSettings(level) {
    const baseSpeed = 5;
    const baseHp = 100;
    const baseFireballDamage = 40;
    const baseFireballSpeed = 10;
    const baseFireballRange = 500;
    const baseFireRate = 150;

    const speed = baseSpeed + (level - 1) * 0.005;
    const maxHp = Math.round(baseHp + (level - 1) * 20);
    const damage = Math.round(baseFireballDamage + (level - 1) * 50);
    const fireballSpeed = baseFireballSpeed + (level - 1) * 0.05;
    const fireballRange = baseFireballRange + (level - 1) * 50;
    const fireRate = Math.max(50, baseFireRate - (level - 1) * 0.5);

    return { speed, maxHp, damage, fireballSpeed, fireballRange, fireRate };
}

function updatePlayerLevelDisplay() {
    const settings = getPlayerSettings(currentPlayerLevel);
    maxPlayerHP = settings.maxHp;
    playerLevelDisplay.innerText = `pLevel: ${currentPlayerLevel}`;
    updateHUD();
}

playerLevelUpButton.addEventListener('click', () => {
    currentPlayerLevel++;
    const settings = getPlayerSettings(currentPlayerLevel);
    maxPlayerHP = settings.maxHp;
    playerHP = maxPlayerHP; // Cura la vida al 100%
    updatePlayerLevelDisplay();
});

playerLevelDownButton.addEventListener('click', () => {
    if (currentPlayerLevel > 1) {
        currentPlayerLevel--;
        const settings = getPlayerSettings(currentPlayerLevel);
        maxPlayerHP = settings.maxHp;
        playerHP = maxPlayerHP; // Cura la vida al 100%
        updatePlayerLevelDisplay();
    }
});

updatePlayerLevelDisplay();

// --- Disparo hacia el puntero (PC) ---
let mouseDown = false;
let lastMouseX = 0, lastMouseY = 0;

window.addEventListener("mousemove", (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

window.addEventListener("mousedown", (e) => {
    if (paused) return;
    if (e.button === 0 || e.button === 2) {
        e.preventDefault();
        mouseDown = true;
        fireBallContinuous();
    }
});

window.addEventListener("mouseup", (e) => {
    if (e.button === 0 || e.button === 2) {
        mouseDown = false;
    }
});

function fireBallContinuous() {
    if (paused || gameOver || !mouseDown) return;
    fireBall({ button: 0, clientX: lastMouseX, clientY: lastMouseY });
    const settings = getPlayerSettings(currentPlayerLevel);
    fireBallContinuousTimer = setTimeout(fireBallContinuous, settings.fireRate);
}

function fireBall(event) {
    if (paused) return;

    const settings = getPlayerSettings(currentPlayerLevel);

    const fireBall = document.createElement('div');
    fireBall.classList.add('fireball');
    fireBall.style.left = `${playerPosition.x + 15}px`;
    fireBall.style.top = `${playerPosition.y + 15}px`;
    gameContainer.appendChild(fireBall);

    const rect = gameContainer.getBoundingClientRect();
    const mouseX_world = (event.clientX - rect.left) / zoomLevel;
    const mouseY_world = (event.clientY - rect.top) / zoomLevel;

    const dx = mouseX_world - (playerPosition.x + 25);
    const dy = mouseY_world - (playerPosition.y + 25);
    const angle = Math.atan2(dy, dx);

    const speed = settings.fireballSpeed;
    const damage = settings.damage;
    const range = settings.fireballRange;
    let traveled = 0;

    const fireInterval = setInterval(() => {
        if (paused) return;

        const x = parseInt(fireBall.style.left) + Math.cos(angle) * speed;
        const y = parseInt(fireBall.style.top) + Math.sin(angle) * speed;
        fireBall.style.left = `${x}px`;
        fireBall.style.top = `${y}px`;
        traveled += speed;

        for (let enemy of enemies) {
            const dx = x - enemy.position.x;
            const dy = y - enemy.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 40) {
                explode(fireBall, enemy, damage);
                clearInterval(fireInterval);
                return;
            }
        }

        if (traveled > range) {
            fireBall.remove();
            clearInterval(fireInterval);
        }
    }, 30);
}

function explode(fireBall, enemy, damage) {
    if (paused) return;

    const explosion = document.createElement("div");
    explosion.classList.add("explosion");
    explosion.style.left = fireBall.style.left;
    explosion.style.top = fireBall.style.top;
    gameContainer.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);

    enemy.hp -= damage;
    showDamage(enemy, damage);
    if (enemy.hp <= 0) {
        enemy.element.remove();
        enemies = enemies.filter(e => e !== enemy);
        killCount++;
        updateHUD();
    }

    fireBall.remove();
}

// --- Numeritos flotantes ---
function showDamage(enemy, amount) {
    if (paused) return;

    const dmg = document.createElement("div");
    dmg.classList.add("damage-text");
    dmg.innerText = `-${amount}`;
    gameContainer.appendChild(dmg);

    dmg.style.left = `${enemy.position.x + 10}px`;
    dmg.style.top = `${enemy.position.y - 10}px`;

    setTimeout(() => dmg.remove(), 800);
}

// --- Daño al jugador ---
function takeDamage(amount) {
    if (paused || gameOver) return;

    playerHP -= amount;
    if (playerHP <= 0) {
        gameOver = true;
        paused = true;
        alert("You have been defeated!");
        window.location.reload();
        return;
    }
    player.classList.add("hit");
    setTimeout(() => player.classList.remove("hit"), 200);
    updateHUD();
}

function updateHUD() {
    hudLeft.innerText = `❤️ ${playerHP} / ${maxPlayerHP}`;
    hudRight.innerText = `Monsters Slain: ${killCount}`;
}

// --- Cámara centrada ---
let cameraX = 0;
let cameraY = 0;

function updateCamera() {
    cameraX = -playerPosition.x * zoomLevel + window.innerWidth / 2 - 25 * zoomLevel;
    cameraY = -playerPosition.y * zoomLevel + window.innerHeight / 2 - 25 * zoomLevel;

    gameContainer.style.transform = `translate(${cameraX}px, ${cameraY}px) scale(${zoomLevel})`;
}

// --- Zoom ---
gameContainer.addEventListener('wheel', (e) => {
    if (paused) return;
    e.preventDefault();

    zoomLevel += (e.deltaY > 0 ? -0.1 : 0.1);
    zoomLevel = Math.max(0.5, Math.min(zoomLevel, 10));

    updateCamera();
});

// --- Joystick móvil dinámico ---
let joystickContainer = document.createElement("div");
let joystick = document.createElement("div");
joystickContainer.id = "joystickContainer";
joystick.id = "joystick";
joystickContainer.appendChild(joystick);
document.body.appendChild(joystickContainer);

// estilo inicial oculto
joystickContainer.style.position = "fixed";
joystickContainer.style.width = "140px";
joystickContainer.style.height = "140px";
joystickContainer.style.background = "rgba(0,0,0,0.3)";
joystickContainer.style.border = "2px solid gold";
joystickContainer.style.borderRadius = "50%";
joystickContainer.style.display = "none";
joystickContainer.style.alignItems = "center";
joystickContainer.style.justifyContent = "center";
joystickContainer.style.touchAction = "none";
joystickContainer.style.zIndex = "5000";

joystick.style.width = "60px";
joystick.style.height = "60px";
joystick.style.background = "gold";
joystick.style.borderRadius = "50%";
joystick.style.position = "absolute";
joystick.style.left = "50%";
joystick.style.top = "50%";
joystick.style.transform = "translate(-50%, -50%)";
joystick.style.touchAction = "none";

let joystickVector = { x: 0, y: 0 };
let touchId = null;

// Aparece joystick donde toques
window.addEventListener("touchstart", (e) => {
    if (touchId !== null) return;
    let t = e.changedTouches[0];
    touchId = t.identifier;

    let x = Math.min(window.innerWidth - 70, Math.max(70, t.clientX));
    let y = Math.min(window.innerHeight - 70, Math.max(70, t.clientY));

    joystickContainer.style.left = `${x - 70}px`;
    joystickContainer.style.top = `${y - 70}px`;
    joystickContainer.style.display = "flex";

    updateJoystickVector(t);
});

window.addEventListener("touchmove", (e) => {
    for (let t of e.changedTouches) {
        if (t.identifier === touchId) updateJoystickVector(t);
    }
});

window.addEventListener("touchend", (e) => {
    for (let t of e.changedTouches) {
        if (t.identifier === touchId) {
            joystickVector = { x: 0, y: 0 };
            touchId = null;
            joystickContainer.style.display = "none";
        }
    }
});

function updateJoystickVector(touch) {
    let rect = joystickContainer.getBoundingClientRect();
    let centerX = rect.left + rect.width / 2;
    let centerY = rect.top + rect.height / 2;
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    let maxDist = rect.width / 2;
    joystickVector.x = Math.max(-1, Math.min(1, dx / maxDist));
    joystickVector.y = Math.max(-1, Math.min(1, dy / maxDist));
}

// --- Disparo automático en móvil ---
function autoFireMobile() {
    if (paused || gameOver) return;
    const settings = getPlayerSettings(currentPlayerLevel);
    if (enemies.length > 0 && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
        let nearest = null;
        let minDist = Infinity;
        for (let enemy of enemies) {
            let dx = enemy.position.x - playerPosition.x;
            let dy = enemy.position.y - playerPosition.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        if (nearest && minDist < 400) {
            const enemyX_screen = (nearest.position.x * zoomLevel) + cameraX;
            const enemyY_screen = (nearest.position.y * zoomLevel) + cameraY;

            fireBall({
                clientX: enemyX_screen,
                clientY: enemyY_screen
            });
        }
    }
    autoFireTimer = setTimeout(autoFireMobile, settings.fireRate);
}
autoFireMobile();

// --- Lógica para el cambio de personaje ---
const characterSelector = document.getElementById('characterSelector');
const playerSprite = document.querySelector('#player img');
let isMago = true;

characterSelector.addEventListener('click', () => {
  if (isMago) {
    playerSprite.src = "char_mago_f.svg";
    characterSelector.innerText = "Sorceress";
  } else {
    playerSprite.src = "char_mago_m.svg";
    characterSelector.innerText = "Mage";
  }
  isMago = !isMago;
});

// --- Bucle principal ---
function gameLoop() {
    if (!paused && !gameOver) {
        movePlayer();
        updateCamera();
    }
    requestAnimationFrame(gameLoop);
}
gameLoop();

gameContainer.addEventListener('contextmenu', (e) => e.preventDefault());