const $ = (id) => document.getElementById(id);

const screens = {
  menu: $("menuScreen"),
  characters: $("characterScreen"),
  game: $("gameScreen"),
  result: $("resultScreen")
};

let selectedCharacter = characters[0];
let playerScore = 0;
let enemyScore = 0;
let round = 1;
let energy = 0;
let gameRunning = false;
let defending = false;
let playerX = 14;
let playerY = 50;
let enemyX = 86;
let enemyY = 50;
let ballX = 50;
let ballY = 50;
let ballVX = 0;
let ballVY = 0;
let ballOwner = "none";
let keys = {};
// ===============================
// CONFIGURAÇÃO DA PARTIDA
// ===============================

const TEAM_SIZE = 3;

let playerTeam = [];
let enemyTeam = [];

let eliminatedPlayer = [];
let eliminatedEnemy = [];

let playerCross = [];
let enemyCross = [];

let matchWinner = null;

// ===============================
// JOGADORES DAS EQUIPES
// ===============================

function createTeams() {
  playerTeam = [
    {
      id: "A1",
      team: "A",
      x: 15,
      y: 30,
      alive: true,
      inCross: false,
      isHuman: true
    },
    {
      id: "A2",
      team: "A",
      x: 15,
      y: 50,
      alive: true,
      inCross: false,
      isHuman: false
    },
    {
      id: "A3",
      team: "A",
      x: 15,
      y: 70,
      alive: true,
      inCross: false,
      isHuman: false
    }
  ];

  enemyTeam = [
    {
      id: "B1",
      team: "B",
      x: 85,
      y: 30,
      alive: true,
      inCross: false,
      isHuman: false
    },
    {
      id: "B2",
      team: "B",
      x: 85,
      y: 50,
      alive: true,
      inCross: false,
      isHuman: false
    },
    {
      id: "B3",
      team: "B",
      x: 85,
      y: 70,
      alive: true,
      inCross: false,
      isHuman: false
    }
  ];
}
  playerCross = [];
  enemyCross = [];

  eliminatedPlayer = [];
  eliminatedEnemy = [];

  matchWinner = null;
  function resetTeams() {
    playerTeam.forEach((player, index) => {
        player.alive = true;
        player.inCross = false;

        player.x = 15;
        player.y = 30 + (index * 20);
    });

    enemyTeam.forEach((player, index) => {
        player.alive = true;
        player.inCross = false;

        player.x = 85;
        player.y = 30 + (index * 20);
    });

    playerCross = [];
    enemyCross = [];

    matchWinner = null;

function showScreen(screen) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function renderCharacters() {
  $("characterGrid").innerHTML = characters.map(c => `
    <article class="character-card ${c.id === selectedCharacter.id ? "selected" : ""}" data-id="${c.id}">
      <div class="avatar">${c.icon}</div>
      <h3>${c.name}</h3>
      <p>${c.desc}</p>
      ${stat("Velocidade", c.speed)}
      ${stat("Força", c.strength)}
      ${stat("Defesa", c.defense)}
      <button>Escolher</button>
    </article>
  `).join("");

  document.querySelectorAll(".character-card").forEach(card => {
    card.addEventListener("click", () => {
      selectedCharacter = characters.find(c => c.id === card.dataset.id);
      renderCharacters();
    });
  });
}

function stat(name, value) {
  return `<div class="stat"><span>${name}</span><b>${value}/10</b></div>
          <div class="bar"><i style="width:${value * 10}%"></i></div>`;
}

function startGame() {
  playerScore = 0;
  enemyScore = 0;
  round = 1;
  energy = 0;
  resetPositions();
  gameRunning = true;
  updateHUD();
  showScreen(screens.game);
}

function resetPositions() {
    resetTeams();

    ballX = 50;
    ballY = 50;
    ballVX = 0;
    ballVY = 0;
    ballOwner = "none";
    defending = false;

    renderPositions();
}

function renderPositions() {
  $("player").style.left = `${playerX}%`;
  $("player").style.top = `${playerY}%`;
  $("enemy").style.left = `${enemyX}%`;
  $("enemy").style.top = `${enemyY}%`;
  $("ball").style.left = `${ballX}%`;
  $("ball").style.top = `${ballY}%`;
}

function updateHUD() {
  $("playerScore").textContent = playerScore;
  $("enemyScore").textContent = enemyScore;
  $("roundNumber").textContent = round;
}

function movePlayer(dx, dy) {
  if (!gameRunning) return;
  const speed = selectedCharacter.speed * 0.13;
  playerX = Math.max(5, Math.min(45, playerX + dx * speed));
  playerY = Math.max(10, Math.min(90, playerY + dy * speed));
  renderPositions();
}

function throwBall() {
  if (!gameRunning || ballOwner === "flying") return;
  ballOwner = "flying";
  ballX = playerX + 2;
  ballY = playerY;
  const angle = Math.atan2(enemyY - playerY, enemyX - playerX);
  const power = 0.8 + selectedCharacter.strength * 0.08;
  ballVX = Math.cos(angle) * power;
  ballVY = Math.sin(angle) * power;
  $("powerText").textContent = "ARREMESSO!";
  setTimeout(() => $("powerText").textContent = "", 400);
}

function defend() {
  if (!gameRunning) return;
  defending = true;
  $("player").style.boxShadow = "0 0 25px #7ed6ff";
  setTimeout(() => {
    defending = false;
    $("player").style.boxShadow = "";
  }, 550);
}

function usePower() {
  if (!gameRunning || energy < 100) return;
  energy = 0;
  const p = selectedCharacter.power;
  const messages = {
    fire:"🔥 BOLA DE FOGO!",
    electric:"⚡ RAIO RÁPIDO!",
    ice:"❄️ CONGELAMENTO!",
    wind:"🌪️ TORNADO!",
    shield:"🛡️ ESCUDO!",
    ghost:"👻 BOLA FANTASMA!"
  };
  $("powerText").textContent = messages[p] || "⚡ PODER!";
  setTimeout(() => $("powerText").textContent = "", 900);

  if (p === "fire" || p === "ghost") throwBall();
  if (p === "electric") { enemyY = playerY; throwBall(); }
  if (p === "ice") { enemySpeedBoost = 0.4; throwBall(); }
  if (p === "wind") { playerX = Math.max(8, playerX - 8); renderPositions(); }
  if (p === "shield") defend();
}

let enemySpeedBoost = 1;

function enemyAI() {
  if (!gameRunning) return;

  // O rival acompanha lentamente a posição do jogador.
  const speed = 0.06 * enemySpeedBoost;
  if (enemyY < playerY - 1) enemyY += speed;
  if (enemyY > playerY + 1) enemyY -= speed;

  // Arremessa periodicamente.
  if (ballOwner === "none" && Math.random() < 0.012) {
    enemyThrow();
  }

  renderPositions();
}

function enemyThrow() {
  ballOwner = "flying";
  ballX = enemyX - 4;
  ballY = enemyY;
  const angle = Math.atan2(playerY - enemyY, playerX - enemyX);
  ballVX = Math.cos(angle) * 0.95;
  ballVY = Math.sin(angle) * 0.95;
}

function updateBall() {
    if (ballOwner !== "flying") return;

    ballX += ballVX;
    ballY += ballVY;

    // Bola saiu da quadra
    if (ballX < 4 || ballX > 96 || ballY < 5 || ballY > 95) {
        ballOwner = "none";
        ballX = 50;
        ballY = 50;
        ballVX = 0;
        ballVY = 0;
        return;
    }

    // Distância até o jogador
    const dxP = ballX - playerX;
    const dyP = ballY - playerY;
    const playerDistance = Math.hypot(dxP, dyP);

    // Distância até o adversário
    const dxE = ballX - enemyX;
    const dyE = ballY - enemyY;
    const enemyDistance = Math.hypot(dxE, dyE);

    // ==========================================
    // BOLA INDO DO JOGADOR PARA O ADVERSÁRIO
    // ==========================================
    if (ballVX > 0 && enemyDistance < 12) {

        // Adversário consegue desviar
        if (Math.random() < 0.25) {
            enemyY += (Math.random() > 0.5 ? 8 : -8);

            ballOwner = "none";
            resetBall();

        } else {
            // ACERTOU O ADVERSÁRIO
            playerScore++;
            gainEnergy(18);
            round++;

            checkWinner();

            if (gameRunning) {
                resetBall();
            }
        }

        return;
    }

    // ==========================================
    // BOLA INDO DO ADVERSÁRIO PARA O JOGADOR
    // ==========================================
    if (ballVX < 0 && playerDistance < 12) {

        // Jogador conseguiu defender
        if (defending) {

            gainEnergy(25);

            ballOwner = "none";

            $("#powerText").textContent = "🛡️ DEFESA PERFEITA!";

            setTimeout(() => {
                $("#powerText").textContent = "";
            }, 600);

            resetBall();

        } else {

            // JOGADOR FOI ATINGIDO
            enemyScore++;
            round++;

            checkWinner();

            if (gameRunning) {
                resetBall();
            }
        }

        return;
    }
}

function resetBall() {
  ballX = 50; ballY = 50;
  ballVX = 0; ballVY = 0;
  ballOwner = "none";
}

function gainEnergy(amount) {
  energy = Math.min(100, energy + amount);
  $("powerBtn").style.boxShadow = energy >= 100 ? "0 0 20px #c58cff" : "";
}

function checkWinner() {
  updateHUD();
  if (playerScore >= 5 || enemyScore >= 5) {
    gameRunning = false;
    const win = playerScore > enemyScore;
    $("resultIcon").textContent = win ? "🏆" : "💥";
    $("resultTitle").textContent = win ? "VITÓRIA!" : "DERROTA!";
    $("resultMessage").textContent = win
      ? `Você venceu por ${playerScore} a ${enemyScore}!`
      : `O rival venceu por ${enemyScore} a ${playerScore}.`;
    showScreen(screens.result);
  }
}

function loop() {
  if (gameRunning) {
    const dx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
    const dy = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
    if (dx || dy) movePlayer(dx, dy);
    enemyAI();
    updateBall();
  }
  requestAnimationFrame(loop);
}

$("playBtn").addEventListener("click", startGame);
$("charactersBtn").addEventListener("click", () => { renderCharacters(); showScreen(screens.characters); });
$("championshipBtn").addEventListener("click", () => alert("🏆 Campeonato será liberado na próxima versão!"));
$("optionsBtn").addEventListener("click", () => alert("⚙️ Opções: em desenvolvimento."));
document.querySelector(".backBtn").addEventListener("click", () => showScreen(screens.menu));
$("againBtn").addEventListener("click", startGame);
$("menuBtn").addEventListener("click", () => showScreen(screens.menu));

$("throwBtn").addEventListener("click", throwBall);
$("defendBtn").addEventListener("pointerdown", defend);
$("powerBtn").addEventListener("click", usePower);

const controls = {
  upBtn:[0,-1], downBtn:[0,1], leftBtn:[-1,0], rightBtn:[1,0]
};
Object.entries(controls).forEach(([id,dir]) => {
  $(id).addEventListener("pointerdown", e => { e.preventDefault(); movePlayer(...dir); });
});

window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.code === "Space") { e.preventDefault(); throwBall(); }
  if (e.key.toLowerCase() === "d") defend();
  if (e.key.toLowerCase() === "e") usePower();
});
window.addEventListener("keyup", e => keys[e.key] = false);

renderCharacters();
loop();
