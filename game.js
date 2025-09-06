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

// ⭐ Nuevas variables para el sistema de hechizos
let currentSpell = 'fireball';
const spellSelector = document.getElementById('spellSelector');

// ⭐ Variables para el personaje y el flip
const playerSprite = document.querySelector('#player img');
let isMago = true;

// ⭐ Variables para el sistema de loot y contador
let droppedLoot = [];
const lootPickupDistance = 80; // Distancia en píxeles para recoger el botín
let treasureCounts = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0
};
const treasureHUD = document.getElementById('treasureHUD');

// --- Overlay de PAUSA ---
let pauseOverlay = document.createElement("div");
pauseOverlay.innerText = "⏸ PAUSE";
pauseOverlay.style.position = "absolute";
pauseOverlay.style.top = "90%";
pauseOverlay.style.left = "50%";
pauseOverlay.style.transform = "translate(-50%, -50%)";
pauseOverlay.style.fontSize = "18px";
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
        } else {
            autoFire();
        }
    }
});

// Actualiza el HUD al iniciar
updateHUD();

// Posición inicial
let playerPosition = { x: 1250, y: 1250 };
let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// ⭐ NUEVA LÓGICA: Array de personajes y un índice para ciclar
const characters = [
    { name: 'Mage', src: 'char_mage.svg' },
    { name: 'Sorceress', src: 'char_sorceress.svg' },
    { name: 'Cleric', src: 'char_cleric.svg' },
    { name: 'Witch', src: 'char_witch.svg' },
    { name: 'Ranger', src: 'char_ranger.svg' },
    { name: 'Forestlord', src: 'char_forestlord.svg' }
];

let characterIndex = 0;

function changeCharacterAndSpell() {
    characterIndex = (characterIndex + 1) % characters.length;
    const newCharacter = characters[characterIndex];
    playerSprite.src = newCharacter.src;
    characterSelector.innerText = newCharacter.name;

    switch (newCharacter.name) {
        case 'Mage':
            currentSpell = 'fireball';
            spellSelector.innerText = "Spell: 🔥";
            break;
        case 'Sorceress':
            currentSpell = 'frostball';
            spellSelector.innerText = "Spell: ❄️";
            break;
        case 'Cleric':
            currentSpell = 'lightball';
            spellSelector.innerText = "Spell: ✨";
            break;
        case 'Witch':
            currentSpell = 'shadowball';
            spellSelector.innerText = "Spell: 🔮";
            break;
        case 'Ranger':
            currentSpell = 'windshot';
            spellSelector.innerText = "Spell: 🌬️";
            break;
        case 'Forestlord':
            currentSpell = 'natureball';
            spellSelector.innerText = "Spell: 🌿";
            break;
    }
}

characterSelector.addEventListener('click', changeCharacterAndSpell);



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

// --- Movimiento del jugador, cámara y flip ---
let isFlipped = false;
let followMouseMode = false;
let mousePosition = { x: 0, y: 0 };
let lastMouseClientX = window.innerWidth / 2;
let lastMouseClientY = window.innerHeight / 2;

window.addEventListener('mousemove', (e) => {
    lastMouseClientX = e.clientX;
    lastMouseClientY = e.clientY;
});

gameContainer.addEventListener('click', (e) => {
    if ('ontouchstart' in window) return; // ignorar en móvil
    if (paused) return;
    if (e.target.tagName === 'BUTTON') return; // ignorar clicks en botones
    
    // ⭐ Lanza el hechizo si el modo de seguir el ratón está desactivado
    if (!followMouseMode) {
        castSpell({
            clientX: e.clientX,
            clientY: e.clientY,
            spellType: currentSpell
        });
    }

    // ⭐ Alterna el modo de seguir al ratón
    followMouseMode = !followMouseMode;
});

function updateMouseWorldPosition() {
    const rect = gameContainer.getBoundingClientRect();
    mousePosition.x = (lastMouseClientX - rect.left) / zoomLevel;
    mousePosition.y = (lastMouseClientY - rect.top) / zoomLevel;
}

// --- Joystick ---
let joystickVector = { x: 0, y: 0 };

function movePlayer() {
    if (paused) return;

    let dx = 0, dy = 0;
    const settings = getPlayerSettings(currentPlayerLevel);
    const playerSpeed = settings.speed;
    const playerWidth = player.offsetWidth;
    const playerHeight = player.offsetHeight;
    const playerCenterX = playerPosition.x + playerWidth / 2;
    const playerCenterY = playerPosition.y + playerHeight / 2;

    // Teclado
    if (keys['ArrowUp'] || keys['w']) dy -= playerSpeed;
    if (keys['ArrowDown'] || keys['s']) dy += playerSpeed;
    if (keys['ArrowLeft'] || keys['a']) dx -= playerSpeed;
    if (keys['ArrowRight'] || keys['d']) dx += playerSpeed;

    // Mouse
    if (followMouseMode) {
        const deltaX = mousePosition.x - playerCenterX;
        const deltaY = mousePosition.y - playerCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > playerSpeed) {
            dx = (deltaX / distance) * playerSpeed;
            dy = (deltaY / distance) * playerSpeed;
        } else {
            dx = deltaX;
            dy = deltaY;
        }
    }
    // Joystick
    else if (joystickVector.x !== 0 || joystickVector.y !== 0) {
        dx = joystickVector.x * playerSpeed;
        dy = joystickVector.y * playerSpeed;
    }

    // Limitar al tablero
    playerPosition.x = Math.max(0, Math.min(BOARD_WIDTH - playerWidth, playerPosition.x + dx));
    playerPosition.y = Math.max(0, Math.min(BOARD_HEIGHT - playerHeight, playerPosition.y + dy));

    // Determinar flip
    if (followMouseMode) isFlipped = mousePosition.x < playerCenterX;
    else {
        const threshold = 0.5;
        if (dx < -threshold) isFlipped = true;
        else if (dx > threshold) isFlipped = false;
    }

    // Aplica transformaciones por separado para evitar el "desfase"
    player.style.transform = `translate(${playerPosition.x}px, ${playerPosition.y}px)`;
    playerSprite.style.transform = `scaleX(${isFlipped ? -1 : 1})`;
}

// --- Cámara centrada ---
let cameraX = 0, cameraY = 0;
function updateCamera() {
    cameraX = -playerPosition.x * zoomLevel + window.innerWidth / 2 - (player.offsetWidth / 2) * zoomLevel;
    cameraY = -playerPosition.y * zoomLevel + window.innerHeight / 2 - (player.offsetHeight / 2) * zoomLevel;
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

// --- Enemigos (Lógica de escalado infinito) ---
let currentMonsterLevel = 1;
const monsterLevelDisplay = document.getElementById('monsterLevelDisplay');
const monsterLevelUpButton = document.getElementById('monsterLevelUp');
const monsterLevelDownButton = document.getElementById('monsterLevelDown');

// ⭐ NUEVA FUNCIÓN: Calcula el radio de colisión del monstruo
function getMonsterRadius(enemy) {
    const baseSize = 50; // El tamaño base de tu monstruo
    return (baseSize * enemy.gigantismFactor) / 2;
}

function getMonsterSettings(level) {
    const baseSpeed = 2;
    const baseHp = 50;
    const baseSpawnChance = 0.80;
    const baseDistanceThreshold = 600;
    const baseMaxEnemies = 100;

    const speed = baseSpeed + (level - 1) * 0.005;
    const hp = baseHp * (1 + (level - 1) * 0.50);
    const spawnChance = Math.min(0.5, baseSpawnChance + (level - 1) * 0.05);
    const distanceThreshold = baseDistanceThreshold + (level - 1) * 2;

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

// ⭐ NUEVA FUNCIÓN: Calcula el factor de gigantismo
function getGigantismFactor() {
    const minFactor = 1;
    const maxFactor = 10;
    const randomValue = Math.random();

    // Lógica para que los factores más grandes sean más raros
    if (randomValue < 0.9) {
        return minFactor; // 90% de probabilidad de ser tamaño normal
    } else if (randomValue < 0.99) {
        return Math.floor(Math.random() * 3) + 2; // 9% de 2x a 4x
    } else if (randomValue < 0.999) {
        return Math.floor(Math.random() * 3) + 5; // 0.9% de 5x a 7x
    } else {
        return Math.floor(Math.random() * 3) + 8; // 0.1% de 8x a 10x
    }
}

// ⭐ FUNCIÓN CORREGIDA: Ahora los monstruos se posicionan correctamente
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

        const gigantismFactor = getGigantismFactor();
        const isGiant = gigantismFactor > 1;

        let enemy = document.createElement('div');
        enemy.classList.add('enemy');
        enemy.style.backgroundImage = 'url("monstruo.svg")';
        enemy.style.backgroundSize = 'cover';
        enemy.style.position = 'absolute';
        
        // ⭐ Corregido: Usamos left y top para el posicionamiento
        enemy.style.left = `${ex}px`;
        enemy.style.top = `${ey}px`;

        if (isGiant) {
            enemy.classList.add('giant');
            // ⭐ Corregido: Solo aplicamos el scale en el transform
            enemy.style.transform = `scale(${gigantismFactor})`; 
        }

        const finalHp = settings.hp * Math.pow(gigantismFactor, 2);
        gameContainer.appendChild(enemy);

        enemies.push({ 
    element: enemy, 
    position: { x: ex, y: ey }, 
    hp: finalHp, 
    isFrozen: false, 
    isConverted: false, 
    isAfflicted: false,
    isEntangled: false,
    gigantismFactor: gigantismFactor,
    isGiant: isGiant
        });
    }
}

// ⭐ FUNCIÓN CORREGIDA: Ahora los monstruos se mueven correctamente
function moveEnemies() {
    if (paused) return;
    const settings = getMonsterSettings(currentMonsterLevel);
    enemies.forEach(enemy => {
        if (enemy.isFrozen || enemy.isEntangled) return;

        let enemyPosition = enemy.position;
        let target = playerPosition;
        let targetEnemy = null;
        let isFightingOtherEnemy = false;
        
        // ⭐ Si el enemigo está convertido, busca un enemigo no convertido para atacar
        if (enemy.isConverted) {
            let minDist = Infinity;
            for (let otherEnemy of enemies) {
                if (otherEnemy !== enemy && !otherEnemy.isConverted && !otherEnemy.isFrozen) {
                    let dx = otherEnemy.position.x - enemyPosition.x;
                    let dy = otherEnemy.position.y - enemyPosition.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        targetEnemy = otherEnemy;
                    }
                }
            }
        } 
        
        // ⭐ Si el enemigo NO está convertido, busca un enemigo convertido para atacar, si está cerca
        else {
            let minDist = Infinity;
            for (let otherEnemy of enemies) {
                if (otherEnemy !== enemy && otherEnemy.isConverted && !otherEnemy.isFrozen) {
                    let dx = otherEnemy.position.x - enemyPosition.x;
                    let dy = otherEnemy.position.y - enemyPosition.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) { // Distancia para que los enemigos se ataquen entre sí
                        minDist = dist;
                        targetEnemy = otherEnemy;
                    }
                }
            }
        }

        // ⭐ Elige el objetivo final
        if (targetEnemy) {
            target = targetEnemy.position;
            isFightingOtherEnemy = true;
        } else {
            target = playerPosition;
            isFightingOtherEnemy = false;
        }

        let deltaX = target.x - enemyPosition.x;
        let deltaY = target.y - enemyPosition.y;
        let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > settings.distanceThreshold) {
            enemy.element.remove();
            enemies = enemies.filter(e => e !== enemy);
        } else {
            // ⭐ Aplica la ralentización si el enemigo está afligido o es gigante
            let currentEnemySpeed = settings.speed / enemy.gigantismFactor;
            if (enemy.isAfflicted) {
                const playerSettings = getPlayerSettings(currentPlayerLevel);
                currentEnemySpeed *= (1 - playerSettings.slowAmount);
            }

            let angle = Math.atan2(deltaY, deltaX);
            enemyPosition.x += Math.cos(angle) * currentEnemySpeed;
            enemyPosition.y += Math.sin(angle) * currentEnemySpeed;
            
            // ⭐ Limitar al tablero considerando el tamaño escalado del monstruo
            const enemySize = 50 * enemy.gigantismFactor;
            enemyPosition.x = Math.max(0, Math.min(BOARD_WIDTH - enemySize, enemyPosition.x));
            enemyPosition.y = Math.max(0, Math.min(BOARD_HEIGHT - enemySize, enemyPosition.y));
            
            // ⭐ Corregido: Ahora usamos left y top para el movimiento
            enemy.element.style.left = `${enemyPosition.x}px`;
            enemy.element.style.top = `${enemyPosition.y}px`;
            
            // ⭐ Aplica el daño si el enemigo está cerca de su objetivo (jugador o enemigo)
            // ⭐ NUEVA LÓGICA DE COLISIÓN DE ATAQUE DEL MONSTRUO
            const monsterRadius = getMonsterRadius(enemy);
            const attackThreshold = monsterRadius * 0.9;
            if (distance < attackThreshold) {
                if (isFightingOtherEnemy) {
                    const damage = 10 * enemy.gigantismFactor; // Daño fijo que se hacen los enemigos entre ellos
                    targetEnemy.hp -= damage;
                    showDamage(targetEnemy, damage, true); // ⭐ Añade 'true' para indicar que el daño es entre enemigos
                    if (targetEnemy.hp <= 0) {
                        targetEnemy.element.remove();
                        enemies = enemies.filter(e => e !== targetEnemy);
            killCount++;
            updateHUD();
dropLoot(enemy.position.x, enemy.position.y); // ⭐ Añadido: Suelta el botín al morir
                    }
                } else {
                    // ⭐ NUEVO BLOQUE: Escalado de daño del monstruo más suave
                    const gigantismDamageFactor = 0.5;
                    const finalDamage = 5 + (enemy.gigantismFactor - 1) * gigantismDamageFactor;
                    takeDamage(finalDamage);
                }
            }
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

    const baseFrostballDamage = 20; 
    const baseFrostballSpeed = 8; 
    const baseFrostballRange = 600; 
    const baseFreezeDuration = 3000;

    const baseLightballDamage = 10;
    const baseLightballSpeed = 12;
    const baseLightballRange = 700;
    const baseConversionChance = 0.80;
    const baseConversionDuration = 5000;

    // ⭐ Nuevos valores para Shadowball
    const baseShadowballDamage = 5;
    const baseShadowballSpeed = 9;
    const baseShadowballRange = 650;
    const baseDotDamage = 10;
    const baseDotDuration = 4000;
    const baseSlowAmount = 0.6;
    const baseSlowDuration = 4000;

    // ⭐ Nuevos valores para Natureball
    const baseNatureballDamage = 15;
    const baseNatureballSpeed = 10;
    const baseNatureballRange = 600;
    const baseEntangleDuration = 3000;
    const baseEntangleChance = 0.8;
    const baseNatureDotDamage = 5;

const baseWindshotSpeed = 12;
const baseWindshotRange = 750;
const baseWindshotDamage = 10; // Daño por cada impacto
const baseWindshotChains = 3; // Número de cadenas (ramificaciones)
const baseWindshotChainRange = 200; // Rango para encontrar al siguiente objetivo


    const speed = baseSpeed;
    const maxHp = Math.round(baseHp + (level - 1) * 20);
    const fireballDamage = Math.round(baseFireballDamage + (level - 1) * 50);
    const fireballSpeed = baseFireballSpeed + (level - 1) * 0.05;
    const fireballRange = baseFireballRange + (level - 1) * 50;
    const fireRate = Math.max(50, baseFireRate - (level - 1) * 0.5);

    const frostballDamage = Math.round(baseFrostballDamage + (level - 1) * 25);
    const frostballSpeed = baseFrostballSpeed + (level - 1) * 0.03;
    const frostballRange = baseFrostballRange + (level - 1) * 30;
    const freezeDuration = baseFreezeDuration + (level - 1) * 500;

    const lightballDamage = Math.round(baseLightballDamage + (level - 1) * 10);
    const lightballSpeed = baseLightballSpeed + (level - 1) * 0.05;
    const lightballRange = baseLightballRange + (level - 1) * 50;
    const conversionChance = Math.min(0.5, baseConversionChance + (level - 1) * 0.01);
    const conversionDuration = baseConversionDuration + (level - 1) * 500;

    // ⭐ Escalado de los valores de Shadowball
    const shadowballDamage = Math.round(baseShadowballDamage + (level - 1) * 5);
    const shadowballSpeed = baseShadowballSpeed + (level - 1) * 0.04;
    const shadowballRange = baseShadowballRange + (level - 1) * 40;
    const dotDamage = Math.round(baseDotDamage + (level - 1) * 1);
    const dotDuration = baseDotDuration + (level - 1) * 200;
    const slowAmount = Math.min(0.9, baseSlowAmount + (level - 1) * 0.02);
    const slowDuration = baseSlowDuration + (level - 1) * 200;

    const natureballDamage = Math.round(baseNatureballDamage + (level - 1) * 10);
    const natureballSpeed = baseNatureballSpeed + (level - 1) * 0.02;
    const natureballRange = baseNatureballRange + (level - 1) * 40;
    const natureDotDamage = Math.round(baseNatureDotDamage + (level - 1) * 2);
    const entangleDuration = baseEntangleDuration + (level - 1) * 150;
    const entangleChance = Math.min(0.9, baseEntangleChance + (level - 1) * 0.02);

const windshotSpeed = baseWindshotSpeed + (level - 1) * 0.1;
const windshotRange = baseWindshotRange + (level - 1) * 70;
const windshotDamage = Math.round(baseWindshotDamage + (level - 1) * 35);
const windshotChains = baseWindshotChains + Math.floor((level - 1) / 5); // Aumenta una cadena cada 5 niveles
const windshotChainRange = baseWindshotChainRange + (level - 1) * 20;

    return { 
        speed, maxHp, 
        fireballDamage, fireballSpeed, fireballRange, fireRate, 
        frostballDamage, frostballSpeed, frostballRange, freezeDuration, 
        lightballDamage, lightballSpeed, lightballRange, conversionChance, conversionDuration,
        shadowballDamage, shadowballSpeed, shadowballRange, dotDamage, dotDuration, slowAmount, slowDuration,
        natureballDamage, natureballSpeed, natureballRange, entangleDuration, entangleChance, natureDotDamage,
windshotSpeed, windshotRange, windshotDamage, windshotChains, windshotChainRange
    };
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

// --- Disparo automático para PC y móvil ---
function autoFire() {
    if (paused || gameOver) return;
    const settings = getPlayerSettings(currentPlayerLevel);
    let fireRate = settings.fireRate;
    let targetEnemy = null;
    let minDist = Infinity;
    
    if (enemies.length > 0) {
        // ⭐ Busca el enemigo más cercano de forma genérica para todos los hechizos
        let sortedEnemies = [...enemies].sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.position.x - playerPosition.x, 2) + Math.pow(a.position.y - playerPosition.y, 2));
            const distB = Math.sqrt(Math.pow(b.position.x - playerPosition.x, 2) + Math.pow(b.position.y - playerPosition.y, 2));
            return distA - distB;
        });

        // ⭐ Lógica específica de cada hechizo para seleccionar el objetivo
        if (currentSpell === 'fireball' || currentSpell === 'frostball' || currentSpell === 'lightball' || currentSpell === 'shadowball' || currentSpell === 'windshot') {
            targetEnemy = sortedEnemies[0];
        } else if (currentSpell === 'natureball') {
            targetEnemy = sortedEnemies.find(enemy => !enemy.isEntangled);
        }

        if (targetEnemy) {
            minDist = Math.sqrt(Math.pow(targetEnemy.position.x - playerPosition.x, 2) + Math.pow(targetEnemy.position.y - playerPosition.y, 2));
        }

        const spellRange = currentSpell === 'fireball' ? settings.fireballRange : 
                           (currentSpell === 'frostball' ? settings.frostballRange : 
                           (currentSpell === 'lightball' ? settings.lightballRange : 
                           (currentSpell === 'shadowball' ? settings.shadowballRange : 
                           (currentSpell === 'natureball' ? settings.natureballRange : settings.windshotRange)))); // ⭐ Añade Windshot

        if (targetEnemy && minDist < spellRange) {
            const enemyX_screen = (targetEnemy.position.x * zoomLevel) + cameraX;
            const enemyY_screen = (targetEnemy.position.y * zoomLevel) + cameraY;
            castSpell({
                clientX: enemyX_screen,
                clientY: enemyY_screen,
                spellType: currentSpell
            });
        }
    }
    autoFireTimer = setTimeout(autoFire, fireRate);
}

// ⭐ CREACIÓN de una función `castSpell` genérica que gestiona todos los hechizos
function castSpell(event) {
    if (paused) return;

    const settings = getPlayerSettings(currentPlayerLevel);
    const spellType = event.spellType;
    
    // ⭐ Lógica específica para Windshot
    if (spellType === 'windshot') {
        let targetEnemy = null;
        let minDist = Infinity;
        for (let enemy of enemies) {
            const dx = enemy.position.x - playerPosition.x;
            const dy = enemy.position.y - playerPosition.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                targetEnemy = enemy;
            }
        }
        if (targetEnemy) {
            // ⭐ Pasa la posición central del jugador a la función castWindshot
            const centeredPlayerPosition = { 
                x: playerPosition.x + player.offsetWidth / 2, 
                y: playerPosition.y + player.offsetHeight / 2 
            };
            castWindshot(centeredPlayerPosition, targetEnemy);
        }
        return;
    }

    // ⭐ Lógica para el resto de hechizos (Fireball, Frostball, etc.)
    const spellDiv = document.createElement('div');
    if (spellType === 'fireball') {
        spellDiv.classList.add('fireball');
    } else if (spellType === 'frostball') {
        spellDiv.classList.add('frostball');
    } else if (spellType === 'lightball') {
        spellDiv.classList.add('lightball');
    } else if (spellType === 'shadowball') {
        spellDiv.classList.add('shadowball');
    } else { // natureball
        spellDiv.classList.add('natureball');
    }
    
    spellDiv.style.left = `${playerPosition.x + player.offsetWidth / 2 - 10}px`;
    spellDiv.style.top = `${playerPosition.y + player.offsetHeight / 2 - 10}px`;
    gameContainer.appendChild(spellDiv);

    const rect = gameContainer.getBoundingClientRect();
    const mouseX_world = (event.clientX - rect.left) / zoomLevel;
    const mouseY_world = (event.clientY - rect.top) / zoomLevel;

    const dx = mouseX_world - (playerPosition.x + player.offsetWidth / 2);
    const dy = mouseY_world - (playerPosition.y + player.offsetHeight / 2);
    const angle = Math.atan2(dy, dx);

    const speed = spellType === 'fireball' ? settings.fireballSpeed :
                  (spellType === 'frostball' ? settings.frostballSpeed :
                  (spellType === 'lightball' ? settings.lightballSpeed :
                  (spellType === 'shadowball' ? settings.shadowballSpeed : settings.natureballSpeed)));
    const damage = spellType === 'fireball' ? settings.fireballDamage :
                   (spellType === 'frostball' ? settings.frostballDamage :
                   (spellType === 'lightball' ? settings.lightballDamage :
                   (spellType === 'shadowball' ? settings.shadowballDamage : settings.natureballDamage)));
    const range = spellType === 'fireball' ? settings.fireballRange :
                  (spellType === 'frostball' ? settings.frostballRange :
                  (spellType === 'lightball' ? settings.lightballRange :
                  (spellType === 'shadowball' ? settings.shadowballRange : settings.natureballRange)));
    let traveled = 0;

    const spellInterval = setInterval(() => {
        if (paused) {
            return; // ⭐ CÓDIGO CORREGIDO: solo detiene el movimiento, no elimina el hechizo.
        }

        const x = parseInt(spellDiv.style.left) + Math.cos(angle) * speed;
        const y = parseInt(spellDiv.style.top) + Math.sin(angle) * speed;
        spellDiv.style.left = `${x}px`;
        spellDiv.style.top = `${y}px`;
        traveled += speed;

        for (let enemy of enemies) {
            const dx = x - enemy.position.x;
            const dy = y - enemy.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // ⭐ NUEVA LÓGICA DE COLISIÓN DE HECHIZO
            const monsterRadius = getMonsterRadius(enemy);
            const spellThreshold = monsterRadius * 1.1;

            if (dist < spellThreshold) {
                explode(spellDiv, enemy, damage, spellType);
                clearInterval(spellInterval);
                return;
            }
        }

        if (traveled > range) {
            spellDiv.remove();
            clearInterval(spellInterval);
        }
    }, 30);
}

// ⭐ NUEVA FUNCIÓN: Lanza un Windshot que puede ramificarse
function castWindshot(origin, initialTargetEnemy, usedEnemies = new Set(), chainCount = 0) {
    if (paused) return;

    const settings = getPlayerSettings(currentPlayerLevel);
    const spellDiv = document.createElement('div');
    spellDiv.classList.add('windshot');
    gameContainer.appendChild(spellDiv);

    let targetEnemy = initialTargetEnemy;
    let isChainedShot = chainCount > 0;

    // Si es una ramificación, busca el siguiente enemigo más cercano que no se haya usado
    if (isChainedShot) {
        let minDist = Infinity;
        targetEnemy = null;
        for (let enemy of enemies) {
            if (!usedEnemies.has(enemy)) {
                const dx = enemy.position.x - origin.x;
                const dy = enemy.position.y - origin.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist && dist < settings.windshotChainRange) {
                    minDist = dist;
                    targetEnemy = enemy;
                }
            }
        }
    }

    // Si no hay objetivo, el hechizo se disipa
    if (!targetEnemy) {
        spellDiv.remove();
        return;
    }

    // Añade el enemigo actual al set de enemigos usados para no atacarlo de nuevo
    usedEnemies.add(targetEnemy);

    // Posición inicial y ángulo hacia el objetivo
    const startX = origin.x;
    const startY = origin.y;
    spellDiv.style.left = `${startX}px`;
    spellDiv.style.top = `${startY}px`;

    const dx = targetEnemy.position.x - startX;
    const dy = targetEnemy.position.y - startY;
    const angle = Math.atan2(dy, dx);
    const speed = settings.windshotSpeed;

    const spellInterval = setInterval(() => {
        if (paused) {
            //clearInterval(spellInterval);
            return;
        }

        const x = parseFloat(spellDiv.style.left) + Math.cos(angle) * speed;
        const y = parseFloat(spellDiv.style.top) + Math.sin(angle) * speed;
        spellDiv.style.left = `${x}px`;
        spellDiv.style.top = `${y}px`;

        // Verificación de colisión
        const dist = Math.sqrt(Math.pow(x - targetEnemy.position.x, 2) + Math.pow(y - targetEnemy.position.y, 2));
        const monsterRadius = getMonsterRadius(targetEnemy);
        const spellThreshold = monsterRadius;

        if (dist < spellThreshold) {
            // Impacto!
            explode(spellDiv, targetEnemy, settings.windshotDamage, 'windshot');

            // ⭐ Reacción en cadena
            if (chainCount < settings.windshotChains) {
                castWindshot(targetEnemy.position, null, usedEnemies, chainCount + 1);
            }

            clearInterval(spellInterval);
            return;
        }

        // Si se pasa del rango, se elimina
        if (Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2)) > settings.windshotRange) {
            spellDiv.remove();
            clearInterval(spellInterval);
        }
    }, 10);
}

// ⭐ MODIFICA la función 'explode' para manejar Shadowball y sus efectos
function explode(spellDiv, enemy, damage, spellType) {
    if (paused) return;

    // NO MODIFICAR el daño. El daño es el daño base, no se multiplica por gigantismo
    let finalDamage = damage;

    const explosion = document.createElement("div");
    explosion.classList.add("explosion");
    
    // ⭐ Añade el estilo de la explosión para el Windshot
    if (spellType === 'frostball') {
        explosion.classList.add('frost');
    } else if (spellType === 'lightball') {
        explosion.classList.add('light');
    } else if (spellType === 'shadowball') {
        explosion.classList.add('shadow');
    } else if (spellType === 'natureball') {
        explosion.classList.add('nature');
    } else if (spellType === 'windshot') { // ⭐ Lógica para Windshot
        explosion.classList.add('wind');
    }

    explosion.style.left = spellDiv.style.left;
    explosion.style.top = spellDiv.style.top;
    gameContainer.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);

    enemy.hp -= finalDamage;
    showDamage(enemy, finalDamage);

    if (spellType === 'frostball' && !enemy.isFrozen) {
        const settings = getPlayerSettings(currentPlayerLevel);
        freezeEnemy(enemy, settings.freezeDuration);
    } 
    else if (spellType === 'lightball' && !enemy.isConverted) {
        const settings = getPlayerSettings(currentPlayerLevel);
        if (Math.random() < settings.conversionChance) {
            convertEnemy(enemy, settings.conversionDuration);
        }
    } 
    else if (spellType === 'shadowball' && !enemy.isAfflicted) {
        const settings = getPlayerSettings(currentPlayerLevel);
        afflictEnemy(enemy, settings.dotDamage, settings.dotDuration, settings.slowDuration);
    
    } else if (spellType === 'natureball' && !enemy.isEntangled) {
        const settings = getPlayerSettings(currentPlayerLevel);
        if (Math.random() < settings.entangleChance) {
            entangleEnemy(enemy, settings.entangleDuration);
        }
    }

    if (enemy.hp <= 0) {
        enemy.element.remove();
        enemies = enemies.filter(e => e !== enemy);
        killCount++;
        updateHUD();
dropLoot(enemy.position.x, enemy.position.y); // ⭐ Añadido: Suelta el botín al morir
    }
    spellDiv.remove();
}

// ⭐ NUEVA FUNCIÓN: Congela al enemigo por un tiempo
function freezeEnemy(enemy, duration) {
    enemy.isFrozen = true;
    enemy.element.classList.add('frozen');
    // Si el enemigo está convertido, elimina el efecto de conversión
    if (enemy.isConverted) {
        enemy.isConverted = false;
        enemy.element.classList.remove('converted');
    }
    setTimeout(() => {
        enemy.isFrozen = false;
        enemy.element.classList.remove('frozen');
    }, duration);
}

// ⭐ NUEVA FUNCIÓN: Convierte al enemigo por un tiempo
function convertEnemy(enemy, duration) {
    enemy.isConverted = true;
    enemy.element.classList.add('converted');
    // Si el enemigo está congelado, elimina el efecto de congelación
    if (enemy.isFrozen) {
        enemy.isFrozen = false;
        enemy.element.classList.remove('frozen');
    }
    setTimeout(() => {
        enemy.isConverted = false;
        enemy.element.classList.remove('converted');
    }, duration);
}

// ⭐ NUEVA FUNCIÓN: Aflige al enemigo con daño por tiempo y ralentización
function afflictEnemy(enemy, dotDamage, dotDuration, slowDuration) {
    enemy.isAfflicted = true;
    enemy.element.classList.add('afflicted');

    // Limpia otros efectos si aplica (ej. si está congelado o convertido)
    if (enemy.isFrozen) {
        enemy.isFrozen = false;
        enemy.element.classList.remove('frozen');
    }
    if (enemy.isConverted) {
        enemy.isConverted = false;
        enemy.element.classList.remove('converted');
    }

    // ⭐ Daño por tiempo (DoT)
    const tickInterval = 500; // Daño cada 0.5 segundos
    let ticks = dotDuration / tickInterval;
    const dotInterval = setInterval(() => {
        if (paused || enemy.hp <= 0) {
            clearInterval(dotInterval);
            return;
        }

        enemy.hp -= dotDamage;
        showDamage(enemy, dotDamage, false, true);

        // ⭐ Lógica de contagio movida aquí para que se ejecute en cada tick
        const contagionChance = 0.8; // 80% de probabilidad de contagio
        const contagionRadius = 100; // Radio en píxeles para el contagio

        for (const otherEnemy of enemies) {
            if (otherEnemy !== enemy && !otherEnemy.isAfflicted && otherEnemy.hp > 0) {
                const dx = enemy.position.x - otherEnemy.position.x;
                const dy = enemy.position.y - otherEnemy.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < contagionRadius && Math.random() < contagionChance) {
                    afflictEnemy(otherEnemy, dotDamage, dotDuration, slowDuration);
                }
            }
        }
        
        if (enemy.hp <= 0) {
            enemy.element.remove();
            enemies = enemies.filter(e => e !== enemy);
            killCount++;
            updateHUD();
dropLoot(enemy.position.x, enemy.position.y); // ⭐ Añadido: Suelta el botín al morir
            clearInterval(dotInterval);
        }
        ticks--;
        if (ticks <= 0) {
            clearInterval(dotInterval);
        }
    }, tickInterval);

    // ⭐ Duración total de la aflicción (incluye ralentización y efecto visual)
    setTimeout(() => {
        enemy.isAfflicted = false;
        enemy.element.classList.remove('afflicted');
    }, slowDuration);
}

// ⭐ NUEVA FUNCIÓN: Enreda al enemigo por un tiempo
function entangleEnemy(enemy, duration) {
    enemy.isEntangled = true;
    enemy.element.classList.add('entangled');

    // Limpia otros efectos si aplica (ej. si está congelado o convertido)
    if (enemy.isFrozen) {
        enemy.isFrozen = false;
        enemy.element.classList.remove('frozen');
    }
    if (enemy.isConverted) {
        enemy.isConverted = false;
        enemy.element.classList.remove('converted');
    }

    // ⭐ Lógica de contagio de enredado - ¡MOVEMOS ESTO!
    // const contagionChance = 0.5;
    // const contagionRadius = 50;
    // for (const otherEnemy of enemies) {
    //     if (otherEnemy !== enemy && !otherEnemy.isEntangled && otherEnemy.hp > 0) {
    //         const dx = enemy.position.x - otherEnemy.position.x;
    //         const dy = enemy.position.y - otherEnemy.position.y;
    //         const dist = Math.sqrt(dx * dx + dy * dy);

    //         if (dist < contagionRadius && Math.random() < contagionChance) {
    //             entangleEnemy(otherEnemy, duration);
    //         }
    //     }
    // }

    // Agrega la lógica de daño por tiempo aquí
    const settings = getPlayerSettings(currentPlayerLevel);
    const dotDamage = settings.natureDotDamage;
    const tickInterval = 500; 
    let ticks = duration / tickInterval;

    const dotInterval = setInterval(() => {
        if (paused || enemy.hp <= 0) {
            clearInterval(dotInterval);
            return;
        }

        enemy.hp -= dotDamage;
        // Llama a showDamage con el nuevo parámetro
        showDamage(enemy, dotDamage, false, false, true); 
        
        // ⭐ NUEVA LÓGICA: Contagio de enredado movido aquí
        const contagionChance = 0.6;
        const contagionRadius = 80;
        for (const otherEnemy of enemies) {
            if (otherEnemy !== enemy && !otherEnemy.isEntangled && otherEnemy.hp > 0) {
                const dx = enemy.position.x - otherEnemy.position.x;
                const dy = enemy.position.y - otherEnemy.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < contagionRadius && Math.random() < contagionChance) {
                    entangleEnemy(otherEnemy, duration);
                }
            }
        }

        if (enemy.hp <= 0) {
            enemy.element.remove();
            enemies = enemies.filter(e => e !== enemy);
            killCount++;
            updateHUD();
dropLoot(enemy.position.x, enemy.position.y); // ⭐ Añadido: Suelta el botín al morir
            clearInterval(dotInterval);
        }
        ticks--;
        if (ticks <= 0) {
            clearInterval(dotInterval);
        }
    }, tickInterval);

    setTimeout(() => {
        enemy.isEntangled = false;
        enemy.element.classList.remove('entangled');
    }, duration);
}

// --- Numeritos flotantes ---
function showDamage(enemy, amount, isConvertedDamage = false, isDotDamage = false, isNatureDot = false) {
    if (paused) return;

    const dmg = document.createElement("div");
    dmg.classList.add("damage-text");
    dmg.innerText = `-${Math.round(amount)}`;
    if (isConvertedDamage) {
        dmg.classList.add('converted');
    } else if (isDotDamage) {
        dmg.classList.add('dot'); // Esta clase es para el Shadowball
    } else if (isNatureDot) {
        dmg.classList.add('dot-nature'); // ¡Esta es la nueva clase para el Natureball!
    }
    gameContainer.appendChild(dmg);

    const enemySize = 50 * enemy.gigantismFactor;
    dmg.style.left = `${enemy.position.x + (enemySize / 2) - 10}px`;
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

// ⭐ Lógica de la caída de botín
const lootChances = [
    { type: 'mythic', chance: 0.0005, image: 'treasure_mythic.svg' },
    { type: 'legendary', chance: 0.005, image: 'treasure_legendary.svg' },
    { type: 'epic', chance: 0.05, image: 'treasure_epic.svg' },
    { type: 'rare', chance: 0.5, image: 'treasure_rare.svg' },
    { type: 'uncommon', chance: 5, image: 'treasure_uncommon.svg' },
    { type: 'common', chance: 50, image: 'treasure_common.svg' }
];

function dropLoot(x, y, gigantismFactor) { 
    const randomValue = Math.random() * 100;
    let lootDropped = false;

    // ⭐ Hacemos el código robusto: usamos 1 si no se define el gigantismFactor
    const effectiveGigantismFactor = gigantismFactor || 1;

    for (let loot of lootChances) {
        const adjustedChance = loot.chance * effectiveGigantismFactor; 
        if (randomValue <= adjustedChance) {
            let lootDiv = document.createElement('div');
            lootDiv.classList.add('dropped-loot');
            lootDiv.style.left = `${x}px`;
            lootDiv.style.top = `${y}px`;
            
            let lootImg = document.createElement('img');
            lootImg.src = loot.image;
            lootDiv.appendChild(lootImg);

            gameContainer.appendChild(lootDiv);
            
            droppedLoot.push({
                element: lootDiv,
                position: { x: x, y: y },
                type: loot.type,
spawnTime: Date.now()
            });
            lootDropped = true;
            break; // Salimos del bucle para no soltar varios objetos
        }
    }
}

// ⭐ Lógica de recolección de botín
function checkLootPickup() {
    if (paused) return;

    // Filtra el botín que ha sido recogido
    droppedLoot = droppedLoot.filter(loot => {
        const dx = (playerPosition.x + player.offsetWidth / 2) - loot.position.x;
        const dy = (playerPosition.y + player.offsetHeight / 2) - loot.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < lootPickupDistance) {
            // Lógica para recoger el botín
            loot.element.remove();
            treasureCounts[loot.type]++;
            updateTreasureHUD();
            return false; // Retorna falso para que el elemento sea eliminado del array
        }
        return true; // Retorna verdadero para mantener el elemento en el array
    });
}

// ⭐ NUEVA VARIABLE: Tiempos de desaparición por tipo de botín
const lootDespawnTimes = {
    common: 10000,     // 10 segundos
    uncommon: 60000,   // 1 minuto
    rare: 90000,       // 1.5 minutos
    epic: 300000,      // 5 minutos
    legendary: 600000, // 10 minutos
    mythic: 900000     // 15 minutos
};

// ⭐ NUEVA FUNCIÓN: Elimina el botín según su rareza
function despawnLoot() {
    if (paused) return;

    const currentTime = Date.now();

    // Filtra el array de botín para eliminar los elementos caducados
    droppedLoot = droppedLoot.filter(loot => {
        // Obtiene el tiempo de desaparición específico para este tipo de botín
        const specificDespawnTime = lootDespawnTimes[loot.type] || 60000; // Valor por defecto de 1 minuto

        if (currentTime - loot.spawnTime > specificDespawnTime) {
            loot.element.remove();
            return false;
        }
        return true;
    });
}

// ⭐ Actualiza el contador de tesoros en la pantalla
function updateTreasureHUD() {
    // Obtenemos todos los contadores de loot
    const counters = treasureHUD.querySelectorAll('.loot-counter span');

    // Actualizamos el texto de cada contador con la cantidad de cada tesoro
    counters[0].innerText = treasureCounts.common;
    counters[1].innerText = treasureCounts.uncommon;
    counters[2].innerText = treasureCounts.rare;
    counters[3].innerText = treasureCounts.epic;
    counters[4].innerText = treasureCounts.legendary;
    counters[5].innerText = treasureCounts.mythic;
}

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

    // (Opcional) mover el "stick" visual:
    joystick.style.left = `${50 + joystickVector.x * 40}%`;
    joystick.style.top = `${50 + joystickVector.y * 40}%`;
    joystick.style.transform = "translate(-50%, -50%)";
}

// --- Pinch-to-zoom móvil ---
let lastTouchDistance = null;

gameContainer.addEventListener('touchmove', (e) => {
    if (paused) return;

    if (e.touches.length === 2) {
        e.preventDefault(); // evita que la página haga zoom

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (lastTouchDistance !== null) {
            const delta = distance - lastTouchDistance;
            zoomLevel += delta * 0.005; // sensibilidad del zoom
            zoomLevel = Math.max(0.5, Math.min(zoomLevel, 10));
            updateCamera();
        }

        lastTouchDistance = distance;
    }
});

gameContainer.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        lastTouchDistance = null;
    }
});



// --- Bucle principal ---
function gameLoop() {
    if (!paused && !gameOver) {
        updateMouseWorldPosition();
        movePlayer();
        spawnEnemy();
        moveEnemies();
checkLootPickup();
despawnLoot();
        updateCamera();
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();
autoFire();
gameContainer.addEventListener('contextmenu', (e) => e.preventDefault());

// ⭐ Cambia de personaje con la barra espaciadora
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        changeCharacterAndSpell();
    }
});

// ⭐ Cambia de personaje con el clic derecho del ratón
document.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Evita que se muestre el menú contextual del navegador
    changeCharacterAndSpell();

});
