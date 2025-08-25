// Variables del juego
let player = document.getElementById('player');
let gameContainer = document.getElementById('gameContainer');
let playerSpeed = 5;
let enemySpeed = 2;
let enemies = [];
let enemyDistanceThreshold = 500;
let zoomLevel = 1;
let paused = false;

// --- Overlay de PAUSA ---
let pauseOverlay = document.createElement("div");
pauseOverlay.innerText = "⏸ PAUSA";
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
  }
});

// Vidas y marcador
let playerHP = 100;
let killCount = 0;
let killCounter = document.createElement('div');
killCounter.id = "hud";
killCounter.innerText = `Enemigos derrotados: 0 | Vida: ${playerHP}`;
document.body.appendChild(killCounter);

// Posición inicial
let playerPosition = { x: 200, y: 200 };
player.style.left = `${playerPosition.x}px`;
player.style.top = `${playerPosition.y}px`;

let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

function movePlayer() {
  if (paused) return;

  // teclado
  if (keys['ArrowUp'] || keys['w']) playerPosition.y -= playerSpeed;
  if (keys['ArrowDown'] || keys['s']) playerPosition.y += playerSpeed;
  if (keys['ArrowLeft'] || keys['a']) playerPosition.x -= playerSpeed;
  if (keys['ArrowRight'] || keys['d']) playerPosition.x += playerSpeed;

  // joystick
  if (joystickVector.x !== 0 || joystickVector.y !== 0) {
    playerPosition.x += joystickVector.x * playerSpeed;
    playerPosition.y += joystickVector.y * playerSpeed;
  }

  player.style.left = `${playerPosition.x}px`;
  player.style.top = `${playerPosition.y}px`;

  if (keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'] || joystickVector.x !== 0 || joystickVector.y !== 0) {
    player.classList.add('bounce');
  } else {
    player.classList.remove('bounce');
  }

  if (keys['ArrowLeft'] || keys['a'] || joystickVector.x < 0) {
    player.classList.add('flip');
  } else {
    player.classList.remove('flip');
  }

  spawnEnemy();
  moveEnemies();
}

// MUCHOS más enemigos
function spawnEnemy() {
  if (paused) return;

  if (Math.random() < 0.12) {  
    let enemy = document.createElement('div');
    enemy.classList.add('enemy');
    enemy.style.backgroundImage = 'url("monstruo.svg")';
    enemy.style.backgroundSize = 'cover';

    let side = Math.floor(Math.random() * 4);
    let enemyPosition = { x: 0, y: 0 };
    if (side === 0) { enemyPosition.x = Math.random() * gameContainer.offsetWidth; enemyPosition.y = -50; }
    else if (side === 1) { enemyPosition.x = Math.random() * gameContainer.offsetWidth; enemyPosition.y = gameContainer.offsetHeight + 50; }
    else if (side === 2) { enemyPosition.x = -50; enemyPosition.y = Math.random() * gameContainer.offsetHeight; }
    else { enemyPosition.x = gameContainer.offsetWidth + 50; enemyPosition.y = Math.random() * gameContainer.offsetHeight; }

    enemy.style.left = `${enemyPosition.x}px`;
    enemy.style.top = `${enemyPosition.y}px`;
    gameContainer.appendChild(enemy);

    enemies.push({ element: enemy, position: enemyPosition, hp: 50 });
  }
}

function moveEnemies() {
  if (paused) return;

  enemies.forEach(enemy => {
    let enemyPosition = enemy.position;
    let deltaX = playerPosition.x - enemyPosition.x;
    let deltaY = playerPosition.y - enemyPosition.y;
    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > enemyDistanceThreshold) {
      enemy.element.remove();
      enemies = enemies.filter(e => e !== enemy);
    } else {
      let angle = Math.atan2(deltaY, deltaX);
      enemyPosition.x += Math.cos(angle) * enemySpeed;
      enemyPosition.y += Math.sin(angle) * enemySpeed;

      enemy.element.style.left = `${enemyPosition.x}px`;
      enemy.element.style.top = `${enemyPosition.y}px`;

      if (distance < 40) {
        takeDamage(5);
      }
    }
  });
}

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

// Disparo continuo (PC)
function fireBallContinuous() {
  if (paused) return;
  if (!mouseDown) return;
  fireBall({ button: 0, clientX: lastMouseX, clientY: lastMouseY });
  setTimeout(fireBallContinuous, 150);
}

function fireBall(event) {
  if (paused) return;

  const fireBall = document.createElement('div');
  fireBall.classList.add('fireball');
  fireBall.style.left = `${playerPosition.x + 15}px`;
  fireBall.style.top = `${playerPosition.y + 15}px`;
  gameContainer.appendChild(fireBall);

  const mouseX_world = (event.clientX - cameraX) / zoomLevel;
  const mouseY_world = (event.clientY - cameraY) / zoomLevel;

  const dx = mouseX_world - playerPosition.x;
  const dy = mouseY_world - playerPosition.y;
  const angle = Math.atan2(dy, dx);

  const speed = 10;
  const maxDamage = 40;
  const range = 500;
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
        explode(fireBall, enemy, maxDamage);
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
  if (paused) return;

  playerHP -= amount;
  if (playerHP <= 0) {
    alert("¡Has sido derrotado!");
    window.location.reload();
  }
  player.classList.add("hit");
  setTimeout(() => player.classList.remove("hit"), 200);
  updateHUD();
}

function updateHUD() {
  killCounter.innerText = `Enemigos derrotados: ${killCount} | Vida: ${playerHP}`;
}

// --- Cámara dinámica ---
let cameraX = 0;
let cameraY = 0;

function updateCamera() {
  if (paused) return;

  let dirX = 0, dirY = 0;
  if (keys['ArrowUp'] || keys['w']) dirY -= 1;
  if (keys['ArrowDown'] || keys['s']) dirY += 1;
  if (keys['ArrowLeft'] || keys['a']) dirX -= 1;
  if (keys['ArrowRight'] || keys['d']) dirX += 1;

  let offsetX = dirX * 100;
  let offsetY = dirY * 60;

  let targetX = -playerPosition.x + window.innerWidth / (2 * zoomLevel) - 25 + offsetX;
  let targetY = -playerPosition.y + window.innerHeight / (2 * zoomLevel) - 25 + offsetY;

  cameraX += (targetX - cameraX) * 0.1;
  cameraY += (targetY - cameraY) * 0.1;

  gameContainer.style.transform = `translate(${cameraX}px, ${cameraY}px) scale(${zoomLevel})`;
}

// --- Zoom ---
gameContainer.addEventListener('wheel', (e) => {
  if (paused) return;
  zoomLevel += (e.deltaY > 0 ? -0.1 : 0.1);
  zoomLevel = Math.max(0.5, Math.min(zoomLevel, 2));
});

// --- Joystick virtual (móvil) ---
let joystickContainer = document.createElement("div");
joystickContainer.id = "joystickContainer";
let joystick = document.createElement("div");
joystick.id = "joystick";
joystickContainer.appendChild(joystick);
document.body.appendChild(joystickContainer);

let joystickVector = { x: 0, y: 0 };
let touchId = null;

joystickContainer.addEventListener("touchstart", (e) => {
  if (touchId !== null) return;
  touchId = e.changedTouches[0].identifier;
});

joystickContainer.addEventListener("touchmove", (e) => {
  for (let t of e.changedTouches) {
    if (t.identifier === touchId) {
      let rect = joystickContainer.getBoundingClientRect();
      let centerX = rect.left + rect.width / 2;
      let centerY = rect.top + rect.height / 2;
      let dx = t.clientX - centerX;
      let dy = t.clientY - centerY;
      let dist = Math.sqrt(dx*dx + dy*dy);
      let maxDist = rect.width/2 - 20;
      if (dist > maxDist) {
        dx = dx / dist * maxDist;
        dy = dy / dist * maxDist;
      }
      joystick.style.transform = `translate(${dx}px, ${dy}px)`;
      joystickVector.x = dx / maxDist;
      joystickVector.y = dy / maxDist;
    }
  }
});

joystickContainer.addEventListener("touchend", (e) => {
  for (let t of e.changedTouches) {
    if (t.identifier === touchId) {
      joystick.style.transform = "translate(-50%, -50%)";
      joystickVector = { x: 0, y: 0 };
      touchId = null;
    }
  }
});

// --- Disparo automático en móvil ---
function autoFireMobile() {
  if (paused) return;
  if (enemies.length > 0 && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    let nearest = null;
    let minDist = Infinity;
    for (let enemy of enemies) {
      let dx = enemy.position.x - playerPosition.x;
      let dy = enemy.position.y - playerPosition.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    if (nearest && minDist < 400) {
      fireBall({
        clientX: nearest.position.x + cameraX,
        clientY: nearest.position.y + cameraY
      });
    }
  }
  setTimeout(autoFireMobile, 150);
}
autoFireMobile();

// --- Bucle ---
function gameLoop() {
  if (!paused) {
    movePlayer();
    updateCamera();
  }
  requestAnimationFrame(gameLoop);
}
gameLoop();

gameContainer.addEventListener('contextmenu', (e) => e.preventDefault());
