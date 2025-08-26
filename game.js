body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background-color: #2C2F33;
}

#gameContainer {
  position: absolute;
  width: 100vw;
  height: 100vh;
  background: url('tile_gris.svg');
  background-size: 50px 50px;
  background-repeat: repeat;
  overflow: hidden;
  transform-origin: top left; /* NECESARIO para cámara + zoom */
}

#player {
  position: absolute;
  width: 50px;       /* tamaño base del jugador */
  height: 50px;      /* se ajusta según proporción del SVG */
  overflow: visible;  /* importante para que no se corte */
  transition: transform 0.1s ease-out;
}

#player img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* mantiene proporciones completas */
  display: block;
}

/* Animación de flip cuando se cambia de dirección */
.flip {
  transform: scaleX(-1);
}

/* Estilo para los enemigos */
.enemy {
  position: absolute;
  width: 50px;
  height: 50px;
  background-size: cover;
  transition: left 0.1s, top 0.1s;
}

/* HUD centrado y visible */
#hud {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 15px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid gold;
  border-radius: 10px;
  color: gold;
  font-size: 22px;
  font-weight: bold;
  z-index: 1000;
}

/* Bola de fuego y explosión */
.fireball {
  position: absolute;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, orange 60%, red);
  border-radius: 50%;
}

.explosion {
  position: absolute;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, yellow, red, transparent);
  border-radius: 50%;
  animation: boom 0.5s ease-out forwards;
}

@keyframes boom {
  from { transform: scale(0.2); opacity: 1; }
  to { transform: scale(1.5); opacity: 0; }
}

/* Daño flotante */
.damage-text {
  position: absolute;
  color: red;
  font-weight: bold;
  font-size: 18px;
  animation: floatUp 0.8s ease-out forwards;
  pointer-events: none;
}

@keyframes floatUp {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-30px); opacity: 0; }
}

/* Efecto de golpe al jugador */
.hit {
  filter: brightness(0.5) saturate(2) hue-rotate(-20deg);
}

  #joystickContainer {
    position: fixed;
    bottom: 80px;
    right: 80px;
    width: 140px;
    height: 140px;
    background: rgba(0,0,0,0.3);
    border: 2px solid gold;
    border-radius: 50%;
    z-index: 5000;
    touch-action: none;
  }
  #joystick {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 60px;
    height: 60px;
    background: gold;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    touch-action: none;
  }
