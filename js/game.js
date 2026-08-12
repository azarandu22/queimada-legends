// ============================================================
// QUEIMADA LEGENDS
// game.js - versão nova e independente
// ============================================================

"use strict";

// ============================================================
// ELEMENTOS
// ============================================================

const $ = (id) => document.getElementById(id);

// ============================================================
// PERSONAGENS
// ============================================================
// Os personagens ficam aqui de propósito.
// NÃO precisamos carregar characters.js para o jogo funcionar.

const characters = [
    {
        id: "fire",
        name: "🔥 Fênix",
        icon: "🔥",
        power: "fire",
        description: "Especialista em ataques de fogo.",
        speed: 6,
        strength: 9,
        defense: 5
    },
    {
        id: "electric",
        name: "⚡ Raio",
        icon: "⚡",
        power: "electric",
        description: "Velocidade e ataques elétricos.",
        speed: 9,
        strength: 7,
        defense: 5
    },
    {
        id: "ice",
        name: "❄️ Glacial",
        icon: "❄️",
        power: "ice",
        description: "Congela o adversário.",
        speed: 5,
        strength: 6,
        defense: 9
    },
    {
        id: "wind",
        name: "🌪️ Vendaval",
        icon: "🌪️",
        power: "wind",
        description: "Movimentação rápida.",
        speed: 10,
        strength: 5,
        defense: 6
    },
    {
        id: "shield",
        name: "🛡️ Guardião",
        icon: "🛡️",
        power: "shield",
        description: "Especialista em defesa.",
        speed: 4,
        strength: 8,
        defense: 10
    },
    {
        id: "ghost",
        name: "👻 Fantasma",
        icon: "👻",
        power: "ghost",
        description: "Ataques imprevisíveis.",
        speed: 8,
        strength: 8,
        defense: 7
    }
];

// ============================================================
// TELAS
// ============================================================

const screens = {
    menu: $("menuScreen"),
    characters: $("characterScreen"),
    game: $("gameScreen"),
    result: $("resultScreen")
};

// ============================================================
// ESTADO DO JOGO
// ============================================================

let selectedCharacter = characters[0];

let playerScore = 0;
let enemyScore = 0;

let round = 1;

let energy = 0;
const MAX_ENERGY = 100;

let gameRunning = false;
let defending = false;

let playerX = 18;
let playerY = 50;

let enemyX = 82;
let enemyY = 50;

let ballX = 50;
let ballY = 50;

let ballVX = 0;
let ballVY = 0;

let ballOwner = "none";

let enemySpeed = 0.06;

let animationId = null;

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function setText(id, text) {
    const element = $(id);

    if (element) {
        element.textContent = text;
    }
}

function setStyle(id, property, value) {
    const element = $(id);

    if (element) {
        element.style[property] = value;
    }
}

function showScreen(screen) {
    if (!screen) {
        return;
    }

    Object.values(screens).forEach((item) => {
        if (!item) return;

        item.classList.remove("active");
        item.style.display = "none";
    });

    screen.classList.add("active");
    screen.style.display = "block";
}

// ============================================================
// POSIÇÕES
// ============================================================

function renderPositions() {
    setStyle("player", "left", `${playerX}%`);
    setStyle("player", "top", `${playerY}%`);

    setStyle("enemy", "left", `${enemyX}%`);
    setStyle("enemy", "top", `${enemyY}%`);

    setStyle("ball", "left", `${ballX}%`);
    setStyle("ball", "top", `${ballY}%`);
}

// ============================================================
// PLACAR
// ============================================================

function renderScore() {
    setText("playerScore", playerScore);
    setText("enemyScore", enemyScore);

    setText("roundNumber", round);
}

// ============================================================
// PERSONAGEM SELECIONADO
// ============================================================

function renderSelectedCharacter() {
    const player = $("player");

    if (player) {
        player.textContent = selectedCharacter.icon;
    }

    setText(
        "powerText",
        ""
    );
}

// ============================================================
// TELA DE PERSONAGENS
// ============================================================

function renderCharacters() {
    const grid = $("characterGrid");

    if (!grid) {
        console.error("characterGrid não foi encontrado.");
        return;
    }

    grid.innerHTML = "";

    characters.forEach((character) => {
        const card = document.createElement("button");

        card.type = "button";
        card.className = "character-card";

        if (selectedCharacter.id === character.id) {
            card.classList.add("selected");
        }

        card.innerHTML = `
            <strong>${character.icon} ${character.name.replace(
                /^.*? /,
                ""
            )}</strong>
            <span>${character.description}</span>
        `;

        card.addEventListener("click", () => {
            selectedCharacter = character;

            renderCharacters();
            renderSelectedCharacter();

            showPowerMessage(
                `${character.icon} ${character.name} selecionado!`
            );
        });

        grid.appendChild(card);
    });
}

// ============================================================
// MENSAGENS
// ============================================================

let messageTimer = null;

function showPowerMessage(message) {
    const element = $("powerText");

    if (!element) {
        return;
    }

    element.textContent = message;

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        if (gameRunning) {
            element.textContent = "";
        }
    }, 1200);
}

// ============================================================
// INICIAR JOGO
// ============================================================

function startGame() {
    console.log("QUEIMADA LEGENDS: iniciando partida...");

    playerScore = 0;
    enemyScore = 0;

    round = 1;

    energy = 0;

    defending = false;
    gameRunning = true;

    playerX = 18;
    playerY = 50;

    enemyX = 82;
    enemyY = 50;

    ballX = 50;
    ballY = 50;

    ballVX = 0;
    ballVY = 0;

    ballOwner = "none";

    enemySpeed = 0.06;

    renderScore();
    renderPositions();
    renderSelectedCharacter();

    showScreen(screens.game);

    startLoop();

    showPowerMessage("🔥 A partida começou!");
}

// ============================================================
// PARAR JOGO
// ============================================================

function stopGame() {
    gameRunning = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// ============================================================
// MOVIMENTO DO JOGADOR
// ============================================================

function movePlayer(dx, dy) {
    if (!gameRunning) {
        return;
    }

    const speed = selectedCharacter.speed >= 8 ? 2.2 : 1.8;

    playerX += dx * speed;
    playerY += dy * speed;

    // O jogador fica no lado azul da quadra.
    playerX = Math.max(5, Math.min(45, playerX));
    playerY = Math.max(8, Math.min(92, playerY));

    renderPositions();
}

// ============================================================
// ARREMESSAR
// ============================================================

function throwBall() {
    if (!gameRunning) {
        return;
    }

    // Não deixa jogar uma nova bola enquanto a bola do inimigo
    // estiver em movimento.
    if (ballOwner === "enemy") {
        return;
    }

    ballX = playerX + 4;
    ballY = playerY;

    const dx = enemyX - ballX;
    const dy = enemyY - ballY;

    const distance = Math.hypot(dx, dy) || 1;

    let speed = 2.6;

    if (selectedCharacter.strength >= 8) {
        speed = 3.0;
    }

    ballVX = (dx / distance) * speed;
    ballVY = (dy / distance) * speed;

    ballOwner = "player";

    showPowerMessage("🏐 ARREMESSO!");
}

// ============================================================
// DEFENDER
// ============================================================

function defend() {
    if (!gameRunning) {
        return;
    }

    defending = true;

    showPowerMessage("🛡️ DEFENDENDO!");

    setTimeout(() => {
        defending = false;
    }, 600);
}

// ============================================================
// PODER ESPECIAL
// ============================================================

function usePower() {
    if (!gameRunning) {
        return;
    }

    if (energy < 25) {
        showPowerMessage("⚡ Energia insuficiente!");

        return;
    }

    energy -= 25;

    renderScore();

    switch (selectedCharacter.power) {

        case "fire":
            showPowerMessage("🔥 BOLA DE FOGO!");

            ballX = playerX + 4;
            ballY = playerY;

            ballVX = 3.5;
            ballVY = (enemyY - playerY) * 0.04;

            ballOwner = "player";
            break;

        case "electric":
            showPowerMessage("⚡ RAIO RÁPIDO!");

            enemyY = playerY;

            ballX = playerX + 4;
            ballY = playerY;

            ballVX = 4;
            ballVY = 0;

            ballOwner = "player";
            break;

        case "ice":
            showPowerMessage("❄️ CONGELAMENTO!");

            enemySpeed = 0.02;

            setTimeout(() => {
                enemySpeed = 0.06;
            }, 1800);

            throwBall();
            break;

        case "wind":
            showPowerMessage("🌪️ TORNADO!");

            playerX = Math.max(6, playerX - 10);

            renderPositions();
            break;

        case "shield":
            showPowerMessage("🛡️ ESCUDO!");

            defend();
            break;

        case "ghost":
            showPowerMessage("👻 BOLA FANTASMA!");

            ballX = playerX + 4;
            ballY = playerY;

            ballVX = 3.2;
            ballVY = (enemyY - playerY) * 0.06;

            ballOwner = "player";
            break;

        default:
            throwBall();
            break;
    }
}

// ============================================================
// IA DO INIMIGO
// ============================================================

function enemyAI() {
    if (!gameRunning) {
        return;
    }

    // Movimento vertical do rival.
    if (enemyY < playerY - 2) {
        enemyY += enemySpeed;
    }

    if (enemyY > playerY + 2) {
        enemyY -= enemySpeed;
    }

    // O rival joga ocasionalmente.
    if (
        ballOwner === "none" &&
        Math.random() < 0.008
    ) {
        enemyThrow();
    }
}

// ============================================================
// ARREMESSO DO INIMIGO
// ============================================================

function enemyThrow() {
    if (!gameRunning) {
        return;
    }

    ballX = enemyX - 4;
    ballY = enemyY;

    const dx = playerX - ballX;
    const dy = playerY - ballY;

    const distance = Math.hypot(dx, dy) || 1;

    ballVX = (dx / distance) * 2.2;
    ballVY = (dy / distance) * 2.2;

    ballOwner = "enemy";
}

// ============================================================
// MOVIMENTO DA BOLA
// ============================================================

function updateBall() {
    if (!gameRunning) {
        return;
    }

    if (ballOwner === "none") {
        renderPositions();
        return;
    }

    ballX += ballVX;
    ballY += ballVY;

    // Rebater em cima/baixo.
    if (ballY <= 5 || ballY >= 95) {
        ballVY *= -1;

        ballY = Math.max(
            5,
            Math.min(95, ballY)
        );
    }

    // ========================================================
    // BOLA DO JOGADOR ATINGIU O RIVAL
    // ========================================================

    if (
        ballOwner === "player" &&
        Math.abs(ballX - enemyX) < 6 &&
        Math.abs(ballY - enemyY) < 9
    ) {
        hitEnemy();
        return;
    }

    // ========================================================
    // BOLA DO INIMIGO ATINGIU O JOGADOR
    // ========================================================

    if (
        ballOwner === "enemy" &&
        Math.abs(ballX - playerX) < 6 &&
        Math.abs(ballY - playerY) < 9
    ) {
        hitPlayer();
        return;
    }

    // ========================================================
    // BOLA SAIU DA QUADRA
    // ========================================================

    if (
        ballX < 0 ||
        ballX > 100
    ) {
        resetBall();
        return;
    }

    renderPositions();
}

// ============================================================
// RESETAR BOLA
// ============================================================

function resetBall() {
    ballX = 50;
    ballY = 50;

    ballVX = 0;
    ballVY = 0;

    ballOwner = "none";

    renderPositions();
}

// ============================================================
// ATINGIU O RIVAL
// ============================================================

function hitEnemy() {
    resetBall();

    playerScore++;

    energy = Math.min(
        MAX_ENERGY,
        energy + 20
    );

    renderScore();

    showPowerMessage("🔥 RIVAL ATINGIDO!");

    if (playerScore >= 3) {
        finishGame(true);
    }
}

// ============================================================
// ATINGIU O JOGADOR
// ============================================================

function hitPlayer() {

    if (defending) {
        resetBall();

        energy = Math.min(
            MAX_ENERGY,
            energy + 10
        );

        renderScore();

        showPowerMessage("🛡️ DEFESA PERFEITA!");

        return;
    }

    resetBall();

    enemyScore++;

    renderScore();

    showPowerMessage("💥 VOCÊ FOI ATINGIDO!");

    if (enemyScore >= 3) {
        finishGame(false);
    }
}

// ============================================================
// FINALIZAR PARTIDA
// ============================================================

function finishGame(playerWon) {
    stopGame();

    const resultIcon = $("resultIcon");

    if (playerWon) {

        if (resultIcon) {
            resultIcon.textContent = "🏆";
        }

        setText(
            "resultTitle",
            "VITÓRIA!"
        );

        setText(
            "resultMessage",
            `Você venceu por ${playerScore} a ${enemyScore}!`
        );

    } else {

        if (resultIcon) {
            resultIcon.textContent = "💥";
        }

        setText(
            "resultTitle",
            "VOCÊ PERDEU!"
        );

        setText(
            "resultMessage",
            `O rival venceu por ${enemyScore} a ${playerScore}.`
        );
    }

    showScreen(screens.result);
}

// ============================================================
// LOOP PRINCIPAL
// ============================================================

function gameLoop() {

    if (!gameRunning) {
        return;
    }

    updateBall();
    enemyAI();

    animationId = requestAnimationFrame(gameLoop);
}

function startLoop() {

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }

    animationId = requestAnimationFrame(gameLoop);
}

// ============================================================
// CONTROLES DE TECLADO
// ============================================================

window.addEventListener("keydown", (event) => {

    if (!gameRunning) {
        return;
    }

    const key = event.key.toLowerCase();

    // Movimento
    if (
        key === "w" ||
        event.key === "ArrowUp"
    ) {
        event.preventDefault();
        movePlayer(0, -1);
    }

    if (
        key === "s" ||
        event.key === "ArrowDown"
    ) {
        event.preventDefault();
        movePlayer(0, 1);
    }

    if (
        key === "a" ||
        event.key === "ArrowLeft"
    ) {
        event.preventDefault();
        movePlayer(-1, 0);
    }

    if (
        key === "d" ||
        event.key === "ArrowRight"
    ) {
        event.preventDefault();
        movePlayer(1, 0);
    }

    // Espaço = arremessar
    if (event.code === "Space") {
        event.preventDefault();
        throwBall();
    }

    // D = defender
    // OBS: usamos "d" somente se não for seta.
    if (key === "d" && event.key.length === 1) {
        defend();
    }

    // E = poder
    if (key === "e") {
        event.preventDefault();
        usePower();
    }
});

// ============================================================
// CONTROLES MOBILE
// ============================================================

function connectMobileButton(id, dx, dy) {

    const button = $(id);

    if (!button) {
        return;
    }

    button.addEventListener(
        "pointerdown",
        (event) => {

            event.preventDefault();

            movePlayer(dx, dy);
        }
    );
}

connectMobileButton(
    "upBtn",
    0,
    -1
);

connectMobileButton(
    "downBtn",
    0,
    1
);

connectMobileButton(
    "leftBtn",
    -1,
    0
);

connectMobileButton(
    "rightBtn",
    1,
    0
);

// ============================================================
// BOTÃO ARREMESSAR
// ============================================================

const throwButton = $("throwBtn");

if (throwButton) {
    throwButton.addEventListener(
        "click",
        throwBall
    );
}

// ============================================================
// BOTÃO DEFENDER
// ============================================================

const defendButton = $("defendBtn");

if (defendButton) {

    defendButton.addEventListener(
        "pointerdown",
        (event) => {

            event.preventDefault();

            defend();
        }
    );
}

// ============================================================
// BOTÃO PODER
// ============================================================

const powerButton = $("powerBtn");

if (powerButton) {

    powerButton.addEventListener(
        "click",
        usePower
    );
}

// ============================================================
// BOTÃO JOGAR
// ============================================================

const playButton = $("playBtn");

if (playButton) {

    playButton.addEventListener(
        "click",
        () => {

            console.log(
                "Botão JOGAR clicado."
            );

            startGame();
        }
    );
} else {

    console.error(
        "ERRO: playBtn não encontrado."
    );
}

// ============================================================
// BOTÃO PERSONAGENS
// ============================================================

const charactersButton = $("charactersBtn");

if (charactersButton) {

    charactersButton.addEventListener(
        "click",
        () => {

            console.log(
                "Botão PERSONAGENS clicado."
            );

            stopGame();

            renderCharacters();

            showScreen(
                screens.characters
            );
        }
    );
} else {

    console.error(
        "ERRO: charactersBtn não encontrado."
    );
}

// ============================================================
// BOTÃO VOLTAR
// ============================================================

const backButton =
    document.querySelector(".backBtn");

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            stopGame();

            showScreen(
                screens.menu
            );
        }
    );
}

// ============================================================
// CAMPEONATO
// ============================================================

const championshipButton =
    $("championshipBtn");

if (championshipButton) {

    championshipButton.addEventListener(
        "click",
        () => {

            alert(
                "🏆 Campeonato será liberado em uma próxima versão!"
            );
        }
    );
}

// ============================================================
// OPÇÕES
// ============================================================

const optionsButton =
    $("optionsBtn");

if (optionsButton) {

    optionsButton.addEventListener(
        "click",
        () => {

            alert(
                "⚙️ Opções serão liberadas em uma próxima versão!"
            );
        }
    );
}

// ============================================================
// JOGAR NOVAMENTE
// ============================================================

const againButton = $("againBtn");

if (againButton) {

    againButton.addEventListener(
        "click",
        () => {

            startGame();
        }
    );
}

// ============================================================
// MENU PRINCIPAL
// ============================================================

const menuButton = $("menuBtn");

if (menuButton) {

    menuButton.addEventListener(
        "click",
        () => {

            stopGame();

            showScreen(
                screens.menu
            );
        }
    );
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

function initGame() {

    console.log(
        "================================="
    );

    console.log(
        "QUEIMADA LEGENDS"
    );

    console.log(
        "game.js carregado corretamente."
    );

    console.log(
        "Personagens:",
        characters.length
    );

    console.log(
        "================================="
    );

    renderCharacters();

    renderSelectedCharacter();

    renderScore();

    renderPositions();

    showScreen(
        screens.menu
    );
}

// ============================================================
// INICIAR
// ============================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initGame
    );

} else {

    initGame();
}