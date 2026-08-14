"use strict";

/*
============================================================
QUEIMADA LEGENDS
GAME.JS
============================================================

CONTROLES

WASD / SETAS = mover
SHIFT        = defender / agarrar
R            = passar
ESPAÇO       = arremessar
E            = poder

REGRAS

- Você escolhe começar como CRUZA ou LINHA.
- Seu time possui você + 2 IA.
- O time vermelho possui 3 IA.
- Cada equipe possui um cruza.
- Jogador de linha não entra na meia-lua.
- Cruza só pode permanecer na sua meia-lua.
- Primeira queimada troca o cruza pelo jogador queimado.
- Se você era cruza, passa para linha após a primeira queimada.
- 20 segundos iniciais sem cobrança de posse.
- Depois disso, cada posse começa com 5 segundos.
- Se a bola voltar para alguém que já participou da sequência,
  começa a contagem coletiva de 15 segundos.
- Dentro dos 15 segundos podem existir passes.
- Ao acabar o tempo, a posse vai para o adversário.
============================================================
*/


/* =========================================================
   UTILIDADES
========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const byId = (id) =>
    document.getElementById(id);


function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}


function distance(a, b) {
    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}


function randomItem(array) {

    if (
        !array ||
        array.length === 0
    ) {
        return null;
    }

    return array[
        Math.floor(
            Math.random() *
            array.length
        )
    ];
}


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const TEAM_SIZE = 3;

const FIELD_TOP = 0;
const MIDLINE = 50;
const FIELD_BOTTOM = 100;

const PLAYER_RADIUS = 3.2;

const CRUZA_RADIUS = 18;


/*
VELOCIDADE MANTIDA
CONFORME O AJUSTE APROVADO
*/

const MOVE_SPEED = 0.85;

const BALL_SPEED = 1.85;

const PASS_SPEED = 1.55;


const STARTUP_TIME = 20;

const NORMAL_POSSESSION_TIME = 5;

const COLLECTIVE_SHOT_TIME = 15;

const BALL_HIT_DISTANCE = 4.3;

const SAVE_TIME = 0.55;


/* =========================================================
   TELAS
========================================================= */

const screens = {

    menu:
        byId("menuScreen"),

    characters:
        byId("characterScreen"),

    game:
        byId("gameScreen"),

    result:
        byId("resultScreen")

};


/* =========================================================
   PERSONAGENS
========================================================= */

const characters = [

    {
        id: "fire",
        name: "🔥 Fênix",
        power: "fire",
        description:
            "Especialista em arremessos fortes.",
        speed: 1.00,
        throwPower: 1.18,
        catch: 1.00,
        defense: 1.00
    },

    {
        id: "electric",
        name: "⚡ Raio",
        power: "electric",
        description:
            "Muito rápido e ágil.",
        speed: 1.18,
        throwPower: 1.00,
        catch: 1.00,
        defense: 1.00
    },

    {
        id: "ice",
        name: "❄️ Glacial",
        power: "ice",
        description:
            "Controla o ritmo da partida.",
        speed: 0.95,
        throwPower: 1.05,
        catch: 1.08,
        defense: 1.05
    },

    {
        id: "wind",
        name: "🌪️ Vendaval",
        power: "wind",
        description:
            "Extremamente ágil.",
        speed: 1.25,
        throwPower: 0.95,
        catch: 1.05,
        defense: 1.08
    },

    {
        id: "shield",
        name: "🛡️ Guardião",
        power: "shield",
        description:
            "Excelente defensor.",
        speed: 0.92,
        throwPower: 0.95,
        catch: 1.25,
        defense: 1.30
    },

    {
        id: "ghost",
        name: "👻 Fantasma",
        power: "ghost",
        description:
            "Rápido e imprevisível.",
        speed: 1.08,
        throwPower: 1.05,
        catch: 1.15,
        defense: 1.10
    }

];


/* =========================================================
   ESTADO
========================================================= */

let selectedCharacter =
    characters[0];

let blueTeam = [];

let redTeam = [];

let blueCruzaId = null;

let redCruzaId = null;

let blueInitialCruzaId = null;

let redInitialCruzaId = null;

let selectedBlueCruza = null;

let selectedRedCruza = null;

let playerStartingRole = null;

let firstBlueBurned = false;

let firstRedBurned = false;

let playerId = "blue-1";

let ball = null;

let gameRunning = false;

let gameLoopId = null;

let lastFrame =
    performance.now();

let keys = {};

let defending = false;

let energy = 0;

let maxEnergy = 100;

let throwCharge = 0;

let startupRemaining =
    STARTUP_TIME;

let round = 1;

let playerScore = 0;

let enemyScore = 0;

let messageTimer = null;


/* =========================================================
   CRIAÇÃO DOS TIMES
========================================================= */

function createTeam(color) {

    const bluePositions = [

        {
            x: 25,
            y: 70
        },

        {
            x: 50,
            y: 82
        },

        {
            x: 75,
            y: 68
        }

    ];


    const redPositions = [

        {
            x: 25,
            y: 30
        },

        {
            x: 50,
            y: 18
        },

        {
            x: 75,
            y: 32
        }

    ];


    const positions =
        color === "blue"
            ? bluePositions
            : redPositions;


    return positions.map(
        (pos, index) => {

            const id =
                `${color}-${index + 1}`;


            return {

                id,

                team: color,

                name:
                    color === "blue"
                        ? `Azul ${index + 1}`
                        : `Vermelho ${index + 1}`,

                x: pos.x,

                y: pos.y,

                homeX: pos.x,

                homeY: pos.y,

                alive: true,

                burned: false,

                inCruza: false,

                initialCruza: false,

                controlled:
                    color === "blue" &&
                    id === playerId,

                defending: false,

                speed: 1,

                level: 1,

                attributes: {

                    speed: 1,

                    throwPower: 1,

                    catch: 1,

                    defense: 1

                },

                aiThink: 0,

                aiTargetX: pos.x,

                aiTargetY: pos.y,

                firstCruzaTouch: true

            };

        }
    );
}


/* =========================================================
   RESET
========================================================= */

function resetTeams() {

    blueTeam =
        createTeam("blue");

    redTeam =
        createTeam("red");


    blueCruzaId =
        null;

    redCruzaId =
        null;


    blueInitialCruzaId =
        null;

    redInitialCruzaId =
        null;


    selectedBlueCruza =
        null;

    selectedRedCruza =
        null;


    playerStartingRole =
        null;


    firstBlueBurned =
        false;

    firstRedBurned =
        false;


    playerId =
        "blue-1";

}


/* =========================================================
   ACESSO A JOGADORES
========================================================= */

function allPlayers() {

    return [

        ...blueTeam,

        ...redTeam

    ];

}


function getPlayer(id) {

    if (!id) {
        return null;
    }


    return (
        allPlayers().find(
            player =>
                player.id === id
        ) || null
    );

}


function getControlledPlayer() {

    const player =
        getPlayer(playerId);


    if (
        player &&
        player.alive
    ) {

        return player;

    }


    return null;

}


function getAlivePlayers(team) {

    const list =
        team === "blue"
            ? blueTeam
            : redTeam;


    return list.filter(
        player =>
            player.alive
    );

}


function getLinePlayers(team) {

    return getAlivePlayers(team)
        .filter(
            player =>
                !player.inCruza
        );

}


function getCruzaPlayers(team) {

    return getAlivePlayers(team)
        .filter(
            player =>
                player.inCruza
        );

}


/* =========================================================
   TELAS
========================================================= */

function showScreen(screen) {

    if (!screen) {
        return;
    }


    document
        .querySelectorAll(".screen")
        .forEach(
            element => {

                element.classList.remove(
                    "active"
                );

                element.style.display =
                    "none";

            }
        );


    screen.classList.add(
        "active"
    );


    screen.style.display =
        "block";

}


/* =========================================================
   MENSAGEM
========================================================= */

function showPowerMessage(
    message,
    duration = 800
) {

    const element =
        byId("message") ||
        byId("powerText");


    if (!element) {
        return;
    }


    element.textContent =
        message;


    clearTimeout(
        messageTimer
    );


    messageTimer =
        setTimeout(
            () => {

                if (gameRunning) {

                    element.textContent =
                        "";

                }

            },
            duration
        );

}


/* =========================================================
   ESCOLHA DO JOGADOR
========================================================= */

function createPlayerRoleSelection() {

    const old =
        byId(
            "playerRoleSelection"
        );


    if (old) {
        old.remove();
    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "playerRoleSelection";


    overlay.style.cssText = `
        position:fixed;
        inset:0;
        z-index:10000;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        background:rgba(2,8,18,.97);
        color:white;
        font-family:Arial,sans-serif;
    `;


    const box =
        document.createElement(
            "div"
        );


    box.style.cssText = `
        width:min(700px,95vw);
        padding:30px;
        background:#071423;
        border:2px solid #315b7d;
        border-radius:20px;
        text-align:center;
    `;


    box.innerHTML = `

        <h1>
            🏐 ESCOLHA SUA POSIÇÃO
        </h1>

        <p style="
            color:#b9c9d8;
            line-height:1.5;
        ">

            Você será o jogador controlado.

            <br>

            Os outros dois jogadores azuis
            serão IA.

        </p>


        <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:18px;
            margin-top:25px;
        ">

            <button
                id="chooseLineBtn"
                style="
                    padding:25px;
                    border-radius:15px;
                    border:2px solid #2e9bd0;
                    background:#0b263c;
                    color:white;
                    cursor:pointer;
                    font-size:18px;
                    font-weight:bold;
                "
            >

                🏃

                <br>

                JOGADOR DE LINHA

                <br>

                <small>
                    Você começa na quadra
                </small>

            </button>


            <button
                id="chooseCruzaBtn"
                style="
                    padding:25px;
                    border-radius:15px;
                    border:2px solid #ffd34d;
                    background:#392d0b;
                    color:white;
                    cursor:pointer;
                    font-size:18px;
                    font-weight:bold;
                "
            >

                🏐

                <br>

                CRUZA

                <br>

                <small>
                    Você começa na meia-lua
                </small>

            </button>

        </div>

    `;


    overlay.appendChild(box);


    document.body.appendChild(
        overlay
    );


    byId("chooseLineBtn")
        .addEventListener(
            "click",
            () => {

                playerStartingRole =
                    "line";

                createCruzaSelectionScreen();

                overlay.remove();

            }
        );


    byId("chooseCruzaBtn")
        .addEventListener(
            "click",
            () => {

                playerStartingRole =
                    "cruza";

                selectedBlueCruza =
                    playerId;

                createCruzaSelectionScreen();

                overlay.remove();

            }
        );

}


/* =========================================================
   ESCOLHA DOS CRUZAS
========================================================= */

function createCruzaSelectionScreen() {

    removeCruzaSelectionScreen();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "cruzaSelectionScreen";


    overlay.style.cssText = `
        position:fixed;
        inset:0;
        z-index:9999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        background:rgba(2,8,18,.97);
        color:white;
        font-family:Arial,sans-serif;
    `;


    const box =
        document.createElement(
            "div"
        );


    box.style.cssText = `
        width:min(900px,96vw);
        background:#071423;
        border:2px solid #315b7d;
        border-radius:20px;
        padding:28px;
        box-sizing:border-box;
    `;


    box.innerHTML = `

        <h1 style="
            text-align:center;
        ">
            🏐 ESCOLHA DOS CRUZAS
        </h1>


        <p style="
            text-align:center;
            color:#b9c9d8;
            line-height:1.5;
        ">

            Escolha quem começa no cruza.

            <br>

            Se não escolher,
            o jogo sorteia automaticamente.

        </p>


        <div
            id="cruzaChoices"
            style="
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:20px;
            "
        ></div>


        <button
            id="startMatchAfterCruza"
            style="
                display:block;
                margin:25px auto 0;
                padding:14px 30px;
                border:0;
                border-radius:12px;
                background:#159ee8;
                color:white;
                font-size:17px;
                font-weight:bold;
                cursor:pointer;
            "
        >
            ⚡ COMEÇAR PARTIDA
        </button>


        <p
            id="cruzaStatus"
            style="
                text-align:center;
                color:#8fa6ba;
            "
        ></p>

    `;


    overlay.appendChild(box);


    document.body.appendChild(
        overlay
    );


    const container =
        byId(
            "cruzaChoices"
        );


    renderCruzaChoice(
        container,
        "blue",
        "🔵 EQUIPE AZUL"
    );


    renderCruzaChoice(
        container,
        "red",
        "🔴 EQUIPE VERMELHA"
    );


    byId("startMatchAfterCruza")
        .addEventListener(
            "click",
            () => {

                if (
                    playerStartingRole ===
                    "cruza"
                ) {

                    selectedBlueCruza =
                        playerId;

                }


                if (
                    playerStartingRole ===
                    "line" &&
                    selectedBlueCruza ===
                    playerId
                ) {

                    selectedBlueCruza =
                        null;

                }


                if (
                    selectedBlueCruza ===
                    null
                ) {

                    selectedBlueCruza =
                        randomCruza(
                            "blue",
                            playerStartingRole
                        );

                }


                if (
                    selectedRedCruza ===
                    null
                ) {

                    selectedRedCruza =
                        randomCruza(
                            "red"
                        );

                }


                applyInitialCruzas();


                removeCruzaSelectionScreen();


                startGame();

            }
        );


    updateCruzaStatus();

}


/* =========================================================
   OPÇÕES DE CRUZA
========================================================= */

function renderCruzaChoice(
    container,
    team,
    title
) {

    const panel =
        document.createElement(
            "div"
        );


    panel.style.cssText = `
        padding:16px;
        border-radius:15px;
        background:
            ${
                team === "blue"
                    ? "rgba(0,140,255,.12)"
                    : "rgba(255,65,50,.12)"
            };
        border:
            1px solid
            ${
                team === "blue"
                    ? "#238bd0"
                    : "#b64c45"
            };
    `;


    const heading =
        document.createElement(
            "h2"
        );


    heading.textContent =
        title;


    panel.appendChild(
        heading
    );


    const players =
        team === "blue"
            ? blueTeam
            : redTeam;


    players.forEach(
        player => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            let text =
                player.name;


            if (
                team === "blue" &&
                player.id ===
                playerId
            ) {

                text +=
                    " — VOCÊ";

            } else {

                text +=
                    " — IA";

            }


            if (
                team === "blue" &&
                player.id ===
                playerId &&
                playerStartingRole ===
                "line"
            ) {

                text +=
                    " — LINHA ESCOLHIDA";

                button.style.opacity =
                    "0.45";

            }


            button.textContent =
                text;


            button.style.cssText += `
                display:block;
                width:100%;
                margin:7px 0;
                padding:12px;
                border-radius:10px;
                border:1px solid #49657e;
                background:#0c2033;
                color:white;
                cursor:pointer;
                font-weight:bold;
            `;


            button.addEventListener(
                "click",
                () => {

                    if (
                        team === "blue" &&
                        player.id ===
                        playerId &&
                        playerStartingRole ===
                        "line"
                    ) {

                        showPowerMessage(
                            "🏃 Você escolheu começar como LINHA.",
                            1000
                        );

                        return;

                    }


                    if (
                        team === "blue"
                    ) {

                        selectedBlueCruza =
                            player.id;

                    } else {

                        selectedRedCruza =
                            player.id;

                    }


                    updateCruzaStatus();

                }
            );


            panel.appendChild(
                button
            );

        }
    );


    const randomButton =
        document.createElement(
            "button"
        );


    randomButton.type =
        "button";


    randomButton.textContent =
        "🎲 Não escolher / sortear";


    randomButton.style.cssText = `
        width:100%;
        margin-top:10px;
        padding:10px;
        border-radius:10px;
        border:1px dashed #70889e;
        background:transparent;
        color:#b9c9d8;
        cursor:pointer;
    `;


    randomButton.addEventListener(
        "click",
        () => {

            if (
                team === "blue"
            ) {

                selectedBlueCruza =
                    null;

            } else {

                selectedRedCruza =
                    null;

            }


            updateCruzaStatus();

        }
    );


    panel.appendChild(
        randomButton
    );


    container.appendChild(
        panel
    );

}


/* =========================================================
   STATUS DA ESCOLHA
========================================================= */

function updateCruzaStatus() {

    const status =
        byId(
            "cruzaStatus"
        );


    if (!status) {
        return;
    }


    let blueText =
        "será sorteado";


    let redText =
        "será sorteado";


    if (
        playerStartingRole ===
        "cruza"
    ) {

        blueText =
            "VOCÊ — CRUZA";

    } else if (
        selectedBlueCruza
    ) {

        const p =
            getPlayer(
                selectedBlueCruza
            );


        if (p) {

            blueText =
                p.name;

        }

    }


    if (
        selectedRedCruza
    ) {

        const p =
            getPlayer(
                selectedRedCruza
            );


        if (p) {

            redText =
                p.name;

        }

    }


    status.textContent =
        `Azul: ${blueText} • Vermelho: ${redText}`;

}


/* =========================================================
   SORTEIO
========================================================= */

function randomCruza(
    team,
    role = null
) {

    const players =
        team === "blue"
            ? blueTeam
            : redTeam;


    let available =
        players;


    if (
        team === "blue" &&
        role === "line"
    ) {

        available =
            players.filter(
                player =>
                    player.id !==
                    playerId
            );

    }


    const selected =
        randomItem(
            available
        );


    if (selected) {
        return selected.id;
    }


    return players[0]?.id ||
        null;

}


/* =========================================================
   APLICA CRUZAS
========================================================= */

function applyInitialCruzas() {

    let blue =
        getPlayer(
            selectedBlueCruza
        );


    let red =
        getPlayer(
            selectedRedCruza
        );


    if (!blue) {

        blue =
            blueTeam[1];

    }


    if (!red) {

        red =
            redTeam[1];

    }


    blueTeam.forEach(
        player => {

            player.inCruza =
                false;

            player.initialCruza =
                false;

        }
    );


    redTeam.forEach(
        player => {

            player.inCruza =
                false;

            player.initialCruza =
                false;

        }
    );


    blueCruzaId =
        blue.id;


    blueInitialCruzaId =
        blue.id;


    blue.inCruza =
        true;


    blue.initialCruza =
        true;


    blue.x =
        50;


    blue.y =
        92;


    redCruzaId =
        red.id;


    redInitialCruzaId =
        red.id;


    red.inCruza =
        true;


    red.initialCruza =
        true;


    red.x =
        50;


    red.y =
        8;


    blueTeam.forEach(
        player => {

            player.controlled =
                player.id ===
                playerId;

        }
    );

}


/* =========================================================
   REMOVER TELA DE CRUZA
========================================================= */

function removeCruzaSelectionScreen() {

    const overlay =
        byId(
            "cruzaSelectionScreen"
        );


    if (overlay) {
        overlay.remove();
    }

}


/* =========================================================
   INÍCIO
========================================================= */

function startPreGame() {

    gameRunning =
        false;


    stopGameLoop();


    resetTeams();


    ball =
        null;


    showScreen(
        screens.game
    );


    createPlayerRoleSelection();


    renderTeams();

}


/* =========================================================
   INICIAR PARTIDA
========================================================= */

function startGame() {

    playerScore =
        0;


    enemyScore =
        0;


    round =
        1;


    energy =
        0;


    throwCharge =
        0;


    defending =
        false;


    startupRemaining =
        STARTUP_TIME;


    gameRunning =
        true;


    /*
    A bola começa com Azul.
    */

    const firstOwner =
        getPlayer(
            "blue-2"
        ) ||
        blueTeam[1];


    ball = {

        x:
            firstOwner.x,

        y:
            firstOwner.y,

        vx:
            0,

        vy:
            0,

        state:
            "owned",

        ownerId:
            firstOwner.id,

        targetId:
            null,

        isPass:
            false,

        canBurn:
            true,

        touchId:
            null,

        touchTimer:
            0,

        possessionTime:
            NORMAL_POSSESSION_TIME,

        possessionStarted:
            true,

        sequence:
            [
                firstOwner.id
            ],

        collectiveMode:
            false

    };


    showScreen(
        screens.game
    );


    renderScore();

    renderTeams();

    renderBall();

    ensurePassButton();

    createPowerBar();

    updateHint();

    startGameLoop();


    showPowerMessage(
        "🏐 PREPARE-SE! 20 SEGUNDOS INICIAIS!",
        1800
    );

}


/* =========================================================
   FIM
========================================================= */

function endGame(winner) {

    gameRunning =
        false;


    stopGameLoop();


    const title =
        winner === "blue"
            ? "🏆 AZUL VENCEU!"
            : "🏆 VERMELHO VENCEU!";


    const message =
        winner === "blue"
            ? "Todos os jogadores vermelhos foram queimados."
            : "Todos os jogadores azuis foram queimados.";


    setText(
        "resultTitle",
        title
    );


    setText(
        "resultMessage",
        message
    );


    showScreen(
        screens.result
    );

}


/* =========================================================
   TEXTO
========================================================= */

function setText(
    id,
    value
) {

    const element =
        byId(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   PLACAR
========================================================= */

function blueScore() {

    return blueTeam.filter(
        player =>
            player.burned
    ).length;

}


function redScore() {

    return redTeam.filter(
        player =>
            player.burned
    ).length;

}


function renderScore() {

    setText(
        "playerScore",
        blueScore()
    );


    setText(
        "enemyScore",
        redScore()
    );


    setText(
        "roundNumber",
        round
    );

}


/* =========================================================
   CONTAINER
========================================================= */

function getPlayersContainer() {

    let container =
        byId(
            "players"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "players";


        const court =
            byId("court") ||
            byId("gameArea");


        if (court) {

            court.appendChild(
                container
            );

        }

    }


    return container;

}


/* =========================================================
   RENDER JOGADORES
========================================================= */

function renderTeams() {

    const container =
        getPlayersContainer();


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    allPlayers()
        .forEach(
            player => {

                if (
                    !player.alive
                ) {

                    return;

                }


                const element =
                    document.createElement(
                        "div"
                    );


                element.id =
                    `player-${player.id}`;


                element.className =
                    `
                    game-player
                    ${player.team}
                    ${player.inCruza
                        ? "cruza-player"
                        : ""}
                    ${player.controlled
                        ? "controlled-player"
                        : ""}
                    `;


                /*
                IMPORTANTE:

                ⚡ = jogador humano

                🛡️ = cruza

                ● = jogador de linha

                🏐 = SOMENTE A BOLA
                */

                if (
                    player.controlled
                ) {

                    element.textContent =
                        "⚡";

                } else if (
                    player.inCruza
                ) {

                    element.textContent =
                        "🛡️";

                } else {

                    element.textContent =
                        "●";

                }


                element.style.cssText = `

                    position:absolute;

                    left:${player.x}%;

                    top:${player.y}%;

                    width:42px;

                    height:42px;

                    transform:
                        translate(-50%,-50%);

                    border-radius:50%;

                    display:flex;

                    align-items:center;

                    justify-content:center;

                    box-sizing:border-box;

                    font-size:22px;

                    z-index:20;

                    user-select:none;

                    background:
                        ${
                            player.team === "blue"
                                ? "#126a91"
                                : "#87332f"
                        };

                    border:
                        3px solid
                        ${
                            player.team === "blue"
                                ? "#65d9ff"
                                : "#ff8177"
                        };

                    box-shadow:
                        0 0 16px
                        ${
                            player.team === "blue"
                                ? "rgba(50,190,255,.55)"
                                : "rgba(255,80,70,.5)"
                        };

                `;


                if (
                    player.inCruza
                ) {

                    element.style.borderColor =
                        "#ffd34d";


                    element.style.boxShadow =
                        "0 0 20px rgba(255,211,77,.8)";

                }


                container.appendChild(
                    element
                );

            }
        );


    renderPositions();

}


/* =========================================================
   POSIÇÕES
========================================================= */

function renderPositions() {

    allPlayers()
        .forEach(
            player => {

                const element =
                    byId(
                        `player-${player.id}`
                    );


                if (!element) {

                    return;

                }


                element.style.left =
                    `${player.x}%`;


                element.style.top =
                    `${player.y}%`;

            }
        );

}


/* =========================================================
   BOLA
========================================================= */

function renderBall() {

    const element =
        byId(
            "ball"
        );


    if (
        !element ||
        !ball
    ) {

        return;

    }


    /*
    A bola é sempre renderizada
    separadamente dos jogadores.
    */

    element.style.left =
        `${ball.x}%`;


    element.style.top =
        `${ball.y}%`;


    element.style.transform =
        "translate(-50%,-50%)";


    element.style.zIndex =
        "50";


    element.style.display =
        "block";

}


/* =========================================================
   ÁREA LEGAL
========================================================= */

function keepPlayerInLegalArea(
    player
) {

    if (!player) {
        return;
    }


    /*
    CRUZA
    */

    if (
        player.inCruza
    ) {

        const centerX =
            50;


        const centerY =
            player.team === "blue"
                ? FIELD_BOTTOM
                : FIELD_TOP;


        let dx =
            player.x -
            centerX;


        let dy =
            player.y -
            centerY;


        let d =
            Math.hypot(
                dx,
                dy
            );


        const radius =
            CRUZA_RADIUS - 1;


        if (
            d > radius
        ) {

            const ratio =
                radius / d;


            player.x =
                centerX +
                dx * ratio;


            player.y =
                centerY +
                dy * ratio;

        }


        if (
            player.team === "blue"
        ) {

            player.y =
                clamp(
                    player.y,
                    MIDLINE +
                        PLAYER_RADIUS,
                    FIELD_BOTTOM -
                        PLAYER_RADIUS
                );

        } else {

            player.y =
                clamp(
                    player.y,
                    FIELD_TOP +
                        PLAYER_RADIUS,
                    MIDLINE -
                        PLAYER_RADIUS
                );

        }


        player.x =
            clamp(
                player.x,
                6,
                94
            );


        return;

    }


    /*
    LINHA
    */

    player.x =
        clamp(
            player.x,
            6,
            94
        );


    /*
    AZUL
    */

    if (
        player.team === "blue"
    ) {

        player.y =
            clamp(
                player.y,
                MIDLINE +
                    PLAYER_RADIUS,
                FIELD_BOTTOM -
                    PLAYER_RADIUS
            );


        const dx =
            player.x -
            50;


        const dy =
            player.y -
            FIELD_BOTTOM;


        const d =
            Math.hypot(
                dx,
                dy
            );


        const forbidden =
            CRUZA_RADIUS +
            PLAYER_RADIUS;


        if (
            d < forbidden
        ) {

            if (
                d === 0
            ) {

                player.y =
                    FIELD_BOTTOM -
                    forbidden;

            } else {

                const ratio =
                    forbidden / d;


                player.x =
                    50 +
                    dx * ratio;


                player.y =
                    FIELD_BOTTOM +
                    dy * ratio;

            }

        }


        return;

    }


    /*
    VERMELHO
    */

    player.y =
        clamp(
            player.y,
            FIELD_TOP +
                PLAYER_RADIUS,
            MIDLINE -
                PLAYER_RADIUS
        );


    const dx =
        player.x -
        50;


    const dy =
        player.y -
        FIELD_TOP;


    const d =
        Math.hypot(
            dx,
            dy
        );


    const forbidden =
        CRUZA_RADIUS +
        PLAYER_RADIUS;


    if (
        d < forbidden
    ) {

        if (
            d === 0
        ) {

            player.y =
                FIELD_TOP +
                forbidden;

        } else {

            const ratio =
                forbidden / d;


            player.x =
                50 +
                dx * ratio;


            player.y =
                FIELD_TOP +
                dy * ratio;

        }

    }

}


/* =========================================================
   MOVIMENTO CONTROLADO
========================================================= */

function moveControlledPlayer(
    dx,
    dy
) {

    if (
        !gameRunning
    ) {

        return;

    }


    const player =
        getControlledPlayer();


    if (!player) {

        return;

    }


    const speed =
        MOVE_SPEED *
        player.speed *
        player.attributes.speed;


    player.x +=
        dx *
        speed;


    player.y +=
        dy *
        speed;


    keepPlayerInLegalArea(
        player
    );


    renderPositions();

}


/* =========================================================
   DONO DA BOLA
========================================================= */

function getBallOwner() {

    if (
        !ball ||
        !ball.ownerId
    ) {

        return null;

    }


    return getPlayer(
        ball.ownerId
    );

}


/* =========================================================
   POSSE
========================================================= */

function startPossessionTimer(
    player
) {

    if (
        !player ||
        !ball
    ) {

        return;

    }


    ball.possessionStarted =
        true;


    const alreadyParticipated =
        ball.sequence.filter(
            id =>
                id === player.id
        ).length > 1;


    if (
        alreadyParticipated
    ) {

        ball.collectiveMode =
            true;


        ball.possessionTime =
            COLLECTIVE_SHOT_TIME;

    } else {

        ball.collectiveMode =
            false;


        ball.possessionTime =
            NORMAL_POSSESSION_TIME;

    }

}


/* =========================================================
   ENTREGA DA BOLA
========================================================= */

function giveBallTo(
    player
) {

    if (
        !player ||
        !player.alive ||
        !ball
    ) {

        return;

    }


    ball.state =
        "owned";


    ball.ownerId =
        player.id;


    ball.targetId =
        null;


    ball.touchId =
        null;


    ball.touchTimer =
        0;


    ball.vx =
        0;


    ball.vy =
        0;


    ball.x =
        player.x;


    ball.y =
        player.y;


    ball.canBurn =
        true;


    ball.isPass =
        false;


    ball.sequence.push(
        player.id
    );


    startPossessionTimer(
        player
    );


    renderBall();

}


/* =========================================================
   COMPANHEIROS
========================================================= */

function getTeammates(
    player
) {

    if (!player) {

        return [];

    }


    return getAlivePlayers(
        player.team
    ).filter(
        teammate =>
            teammate.id !==
            player.id
    );

}


function nearestTeammate(
    player
) {

    const teammates =
        getTeammates(
            player
        );


    teammates.sort(
        (a, b) =>
            distance(
                player,
                a
            ) -
            distance(
                player,
                b
            )
    );


    return teammates[0] ||
        null;

}


/* =========================================================
   ADVERSÁRIOS
========================================================= */

function getOpponents(
    player
) {

    if (!player) {

        return [];

    }


    const enemyTeam =
        player.team === "blue"
            ? "red"
            : "blue";


    return getAlivePlayers(
        enemyTeam
    ).filter(
        opponent =>
            !opponent.inCruza
    );

}


function nearestOpponent(
    player
) {

    const opponents =
        getOpponents(
            player
        );


    opponents.sort(
        (a, b) =>
            distance(
                player,
                a
            ) -
            distance(
                player,
                b
            )
    );


    return opponents[0] ||
        null;

}


/* =========================================================
   PASSE
========================================================= */

function passBall() {

    if (
        !gameRunning ||
        !ball
    ) {

        return;

    }


    const player =
        getControlledPlayer();


    if (!player) {

        return;

    }


    if (
        ball.state !== "owned" ||
        ball.ownerId !== player.id
    ) {

        showPowerMessage(
            "❌ Você não está com a bola!",
            700
        );


        return;

    }


    const teammate =
        nearestTeammate(
            player
        );


    if (!teammate) {

        return;

    }


    if (
        player.inCruza &&
        player.firstCruzaTouch
    ) {

        player.firstCruzaTouch =
            false;

    }


    launchPass(
        player,
        teammate
    );


    showPowerMessage(
        "🏐 PASSE!",
        600
    );

}


/* =========================================================
   LANÇAMENTO PASSE
========================================================= */

function launchPass(
    from,
    target
) {

    if (
        !from ||
        !target ||
        !ball
    ) {

        return;

    }


    const dx =
        target.x -
        from.x;


    const dy =
        target.y -
        from.y;


    const length =
        Math.hypot(
            dx,
            dy
        ) || 1;


    ball.x =
        from.x;


    ball.y =
        from.y;


    ball.vx =
        (dx / length) *
        PASS_SPEED;


    ball.vy =
        (dy / length) *
        PASS_SPEED;


    ball.state =
        "flying";


    ball.ownerId =
        from.id;


    ball.targetId =
        target.id;


    ball.isPass =
        true;


    ball.canBurn =
        false;

}


/* =========================================================
   ARREMESSO
========================================================= */

function throwBall() {

    if (
        !gameRunning ||
        !ball
    ) {

        return;

    }


    const player =
        getControlledPlayer();


    if (!player) {

        return;

    }


    if (
        ball.state !== "owned" ||
        ball.ownerId !== player.id
    ) {

        showPowerMessage(
            "❌ Você não está com a bola!",
            700
        );


        return;

    }


    if (
        player.inCruza &&
        player.firstCruzaTouch
    ) {

        passBall();


        return;

    }


    const target =
        nearestOpponent(
            player
        );


    if (!target) {

        return;

    }


    const charge =
        clamp(
            throwCharge / 100,
            0.15,
            1
        );


    const characterPower =
        selectedCharacter.throwPower;


    const levelBonus =
        1 +
        (
            player.level - 1
        ) *
        0.025;


    const speed =
        BALL_SPEED *
        (
            0.65 +
            charge * 0.75
        ) *
        characterPower *
        levelBonus;


    launchThrow(
        player,
        target,
        speed
    );


    throwCharge =
        0;


    updatePowerBar();


    showPowerMessage(
        charge >= 0.95
            ? "🔥 ARREMESSO MÁXIMO!"
            : "🏐 ARREMESSO!",
        700
    );

}


/* =========================================================
   LANÇAMENTO
========================================================= */

function launchThrow(
    from,
    target,
    speed
) {

    const dx =
        target.x -
        from.x;


    const dy =
        target.y -
        from.y;


    const length =
        Math.hypot(
            dx,
            dy
        ) || 1;


    ball.x =
        from.x;


    ball.y =
        from.y;


    ball.vx =
        (dx / length) *
        speed;


    ball.vy =
        (dy / length) *
        speed;


    ball.state =
        "flying";


    ball.ownerId =
        from.id;


    ball.targetId =
        target.id;


    ball.isPass =
        false;


    ball.canBurn =
        true;

}


/* =========================================================
   DEFESA
========================================================= */

function defend() {

    if (!gameRunning) {

        return;

    }


    const player =
        getControlledPlayer();


    if (!player) {

        return;

    }


    defending =
        true;


    player.defending =
        true;


    showPowerMessage(
        "🛡️ DEFENDENDO!",
        550
    );


    setTimeout(
        () => {

            defending =
                false;


            player.defending =
                false;

        },
        650
    );

}


/* =========================================================
   PODER
========================================================= */

function usePower() {

    if (!gameRunning) {

        return;

    }


    if (
        energy < 25
    ) {

        showPowerMessage(
            "⚡ Energia insuficiente!",
            800
        );


        return;

    }


    energy -=
        25;


    const player =
        getControlledPlayer();


    if (!player) {

        return;

    }


    switch (
        selectedCharacter.power
    ) {

        case "fire":

            showPowerMessage(
                "🔥 PODER DE FOGO!",
                900
            );


            throwCharge =
                100;


            updatePowerBar();


            throwBall();


            break;


        case "electric":

            showPowerMessage(
                "⚡ VELOCIDADE!",
                900
            );


            player.speed =
                1.5;


            setTimeout(
                () => {

                    player.speed =
                        1;

                },
                1800
            );


            break;


        case "ice":

            showPowerMessage(
                "❄️ CONGELAMENTO!",
                900
            );


            redTeam.forEach(
                opponent => {

                    opponent.speed =
                        0.45;

                }
            );


            setTimeout(
                () => {

                    redTeam.forEach(
                        opponent => {

                            opponent.speed =
                                1;

                        }
                    );

                },
                1800
            );


            break;


        case "wind":

            showPowerMessage(
                "🌪️ VENDAVAL!",
                900
            );


            player.x -=
                8;


            keepPlayerInLegalArea(
                player
            );


            break;


        case "shield":

            showPowerMessage(
                "🛡️ ESCUDO!",
                900
            );


            defend();


            break;


        case "ghost":

            showPowerMessage(
                "👻 FANTASMA!",
                900
            );


            player.speed =
                1.4;


            setTimeout(
                () => {

                    player.speed =
                        1;

                },
                1500
            );


            break;

    }

}


/* =========================================================
   FÍSICA DA BOLA
========================================================= */

function updateBall(dt) {

    if (!ball) {

        return;

    }


    /*
    BOLA NA MÃO
    */

    if (
        ball.state ===
        "owned"
    ) {

        const owner =
            getBallOwner();


        if (!owner) {

            resetBall();


            return;

        }


        ball.x =
            owner.x;


        ball.y =
            owner.y;


        if (
            startupRemaining <=
            0
        ) {

            ball.possessionTime -=
                dt / 60;


            updatePossessionUI();


            if (
                ball.possessionTime <=
                0
            ) {

                automaticTurnover(
                    owner
                );


                return;

            }

        }


        renderBall();


        return;

    }


    /*
    TOQUE PENDENTE
    */

    if (
        ball.state ===
        "touchPending"
    ) {

        updatePendingTouch(
            dt
        );


        return;

    }


    /*
    BOLA VOANDO
    */

    if (
        ball.state !==
        "flying"
    ) {

        return;

    }


    ball.x +=
        ball.vx *
        dt;


    ball.y +=
        ball.vy *
        dt;


    /*
    LATERAIS
    */

    if (
        ball.x <= 2 ||
        ball.x >= 98
    ) {

        ball.vx *=
            -1;


        ball.x =
            clamp(
                ball.x,
                2,
                98
            );

    }


    /*
    FUNDO
    */

    if (
        ball.y <= 1 ||
        ball.y >= 99
    ) {

        const owner =
            getPlayer(
                ball.ownerId
            );


        if (owner) {

            const enemyTeam =
                owner.team === "blue"
                    ? "red"
                    : "blue";


            const receiver =
                nearestPlayerOnTeam(
                    enemyTeam,
                    ball
                );


            if (receiver) {

                giveBallTo(
                    receiver
                );


                showPowerMessage(
                    "🏐 BOLA RECUPERADA!",
                    900
                );


                return;

            }

        }


        resetBall();


        return;

    }


    const target =
        ball.targetId
            ? getPlayer(
                ball.targetId
            )
            : null;


    /*
    PASSE
    */

    if (
        ball.isPass &&
        target &&
        target.alive &&
        distance(
            ball,
            target
        ) <=
        BALL_HIT_DISTANCE
    ) {

        giveBallTo(
            target
        );


        showPowerMessage(
            "🏐 PASSE RECEBIDO!",
            600
        );


        return;

    }


    /*
    ARREMESSO
    */

    if (
        !ball.isPass &&
        target &&
        target.alive &&
        target.team !==
        getPlayer(
            ball.ownerId
        )?.team &&
        distance(
            ball,
            target
        ) <=
        BALL_HIT_DISTANCE
    ) {

        playerTouchedByBall(
            target
        );


        return;

    }


    /*
    JOGADOR NO CAMINHO
    */

    for (
        const player
        of allPlayers()
    ) {

        if (
            !player.alive ||
            player.id ===
            ball.ownerId
        ) {

            continue;

        }


        if (
            distance(
                ball,
                player
            ) > 3.8
        ) {

            continue;

        }


        const owner =
            getPlayer(
                ball.ownerId
            );


        if (!owner) {

            continue;

        }


        if (
            ball.isPass &&
            player.team ===
            owner.team
        ) {

            giveBallTo(
                player
            );


            return;

        }


        if (
            !ball.isPass &&
            player.team !==
            owner.team
        ) {

            playerTouchedByBall(
                player
            );


            return;

        }

    }


    renderBall();

}


/* =========================================================
   JOGADOR TOCADO
========================================================= */

function playerTouchedByBall(
    player
) {

    if (
        !player ||
        !player.alive
    ) {

        return;

    }


    if (
        player.defending
    ) {

        saveBall(
            player
        );


        return;

    }


    ball.state =
        "touchPending";


    ball.touchId =
        player.id;


    ball.touchTimer =
        0;


    ball.vx =
        0;


    ball.vy =
        1.2;


    ball.x =
        player.x;


    ball.y =
        player.y;

}


/* =========================================================
   BOLA APÓS TOQUE
========================================================= */

function updatePendingTouch(
    dt
) {

    const touched =
        getPlayer(
            ball.touchId
        );


    if (
        !touched ||
        !touched.alive
    ) {

        resetBall();


        return;

    }


    ball.touchTimer +=
        dt / 60;


    ball.y +=
        1.2 *
        dt;


    if (
        touched.defending
    ) {

        saveBall(
            touched
        );


        return;

    }


    const teammates =
        getTeammates(
            touched
        );


    const saver =
        teammates.find(
            teammate =>
                distance(
                    ball,
                    teammate
                ) < 5
        );


    if (saver) {

        saveBall(
            saver
        );


        return;

    }


    if (
        ball.touchTimer >=
        SAVE_TIME
    ) {

        burnPlayer(
            touched
        );


        return;

    }


    renderBall();

}


/* =========================================================
   AGARRAR
========================================================= */

function saveBall(
    player
) {

    energy =
        Math.min(
            maxEnergy,
            energy + 8
        );


    giveBallTo(
        player
    );


    showPowerMessage(
        "🛡️ BOLA AGARRADA!",
        800
    );

}


/* =========================================================
   QUEIMAR
========================================================= */

function burnPlayer(
    player
) {

    if (
        !player ||
        !player.alive ||
        player.burned
    ) {

        return;

    }


    player.burned =
        true;


    player.inCruza =
        true;


    player.initialCruza =
        false;


    player.firstCruzaTouch =
        true;


    const team =
        player.team;


    const isFirstBurn =
        team === "blue"
            ? !firstBlueBurned
            : !firstRedBurned;


    /*
    PRIMEIRO QUEIMADO
    */

    if (
        isFirstBurn
    ) {

        if (
            team === "blue"
        ) {

            const oldCruza =
                getPlayer(
                    blueInitialCruzaId
                );


            if (
                oldCruza &&
                oldCruza.id !==
                player.id
            ) {

                oldCruza.inCruza =
                    false;


                oldCruza.initialCruza =
                    false;


                oldCruza.x =
                    oldCruza.homeX;


                oldCruza.y =
                    oldCruza.homeY;


                keepPlayerInLegalArea(
                    oldCruza
                );

            }


            blueCruzaId =
                player.id;


            firstBlueBurned =
                true;

        } else {

            const oldCruza =
                getPlayer(
                    redInitialCruzaId
                );


            if (
                oldCruza &&
                oldCruza.id !==
                player.id
            ) {

                oldCruza.inCruza =
                    false;


                oldCruza.initialCruza =
                    false;


                oldCruza.x =
                    oldCruza.homeX;


                oldCruza.y =
                    oldCruza.homeY;


                keepPlayerInLegalArea(
                    oldCruza
                );

            }


            redCruzaId =
                player.id;


            firstRedBurned =
                true;

        }

    } else {

        if (
            team === "blue"
        ) {

            blueCruzaId =
                player.id;

        } else {

            redCruzaId =
                player.id;

        }

    }


    player.x =
        50;


    player.y =
        team === "blue"
            ? 92
            : 8;


    const oppositeTeam =
        team === "blue"
            ? "red"
            : "blue";


    const receiver =
        nearestPlayerOnTeam(
            oppositeTeam,
            {
                x: 50,
                y: 50
            }
        );


    if (receiver) {

        giveBallTo(
            receiver
        );

    } else {

        resetBall();

    }


    if (
        team === "red"
    ) {

        playerScore++;


        energy =
            Math.min(
                maxEnergy,
                energy + 20
            );


        showPowerMessage(
            "🔥 VERMELHO QUEIMADO!",
            1100
        );

    } else {

        enemyScore++;


        showPowerMessage(
            "💥 AZUL QUEIMADO!",
            1100
        );

    }


    /*
    Se você for queimado,
    permanece no cruza.
    */

    if (
        player.id === playerId &&
        isFirstBurn
    ) {

        player.inCruza =
            true;

    }


    renderScore();

    renderTeams();


    const remaining =
        getAlivePlayers(
            team
        ).filter(
            p =>
                !p.burned
        );


    if (
        remaining.length === 0
    ) {

        endGame(
            team === "blue"
                ? "red"
                : "blue"
        );

    }

}


/* =========================================================
   JOGADOR MAIS PRÓXIMO
========================================================= */

function nearestPlayerOnTeam(
    team,
    point
) {

    const players =
        getAlivePlayers(
            team
        );


    players.sort(
        (a, b) =>
            distance(
                a,
                point
            ) -
            distance(
                b,
                point
            )
    );


    return players[0] ||
        null;

}


/* =========================================================
   RESET DA BOLA
========================================================= */

function resetBall() {

    if (!ball) {

        return;

    }


    ball.state =
        "free";


    ball.ownerId =
        null;


    ball.targetId =
        null;


    ball.vx =
        0;


    ball.vy =
        0;


    ball.touchId =
        null;


    ball.touchTimer =
        0;


    ball.x =
        50;


    ball.y =
        50;


    ball.canBurn =
        true;


    ball.isPass =
        false;


    ball.sequence =
        [];


    ball.collectiveMode =
        false;


    ball.possessionTime =
        NORMAL_POSSESSION_TIME;


    renderBall();

}


/* =========================================================
   TEMPO ESGOTADO
========================================================= */

function automaticTurnover(
    owner
) {

    if (!owner) {

        return;

    }


    const enemyTeam =
        owner.team === "blue"
            ? "red"
            : "blue";


    const receiver =
        nearestPlayerOnTeam(
            enemyTeam,
            owner
        );


    if (!receiver) {

        resetBall();

        return;

    }


    launchAutomaticPass(
        owner,
        receiver
    );


    showPowerMessage(
        "⏱️ TEMPO ESGOTADO! BOLA PARA O ADVERSÁRIO!",
        1200
    );

}


/* =========================================================
   PASSE AUTOMÁTICO
========================================================= */

function launchAutomaticPass(
    from,
    target
) {

    const dx =
        target.x -
        from.x;


    const dy =
        target.y -
        from.y;


    const length =
        Math.hypot(
            dx,
            dy
        ) || 1;


    ball.x =
        from.x;


    ball.y =
        from.y;


    ball.vx =
        dx /
        length *
        PASS_SPEED;


    ball.vy =
        dy /
        length *
        PASS_SPEED;


    ball.state =
        "flying";


    ball.ownerId =
        from.id;


    ball.targetId =
        target.id;


    ball.isPass =
        true;


    ball.canBurn =
        false;

}


/* =========================================================
   IA
========================================================= */

function updateAI(dt) {

    if (!gameRunning) {

        return;

    }


    allPlayers()
        .forEach(
            bot => {

                /*
                Você não é IA.
                */

                if (
                    bot.id ===
                    playerId
                ) {

                    return;

                }


                if (
                    !bot.alive
                ) {

                    return;

                }


                /*
                CRUZA
                */

                if (
                    bot.inCruza
                ) {

                    updateCruzaAI(
                        bot,
                        dt
                    );


                    return;

                }


                /*
                LINHA
                */

                updateLineAI(
                    bot,
                    dt
                );

            }
        );

}


/* =========================================================
   IA DO CRUZA
   CORRIGIDA
========================================================= */

function updateCruzaAI(
    bot,
    dt
) {

    /*
    ========================================================
    MOVIMENTO DO CRUZA
    ========================================================
    */

    const target =
        getCruzaTarget(
            bot
        );


    if (target) {

        const dx =
            target.x -
            bot.x;


        const dy =
            target.y -
            bot.y;


        const d =
            Math.hypot(
                dx,
                dy
            ) || 1;


        if (
            d > 2
        ) {

            bot.x +=
                (
                    dx / d
                ) *
                0.45 *
                bot.speed *
                dt;


            bot.y +=
                (
                    dy / d
                ) *
                0.45 *
                bot.speed *
                dt;

        }

    }


    keepPlayerInLegalArea(
        bot
    );


    /*
    ========================================================
    CRUZA PEGA BOLA LIVRE
    ========================================================
    */

    if (
        ball &&
        ball.state === "free" &&
        distance(
            bot,
            ball
        ) < 10
    ) {

        giveBallTo(
            bot
        );


        bot.aiThink =
            0.6;


        return;

    }


    /*
    ========================================================
    CRUZA COM A BOLA
    ========================================================
    */

    if (
        !ball ||
        ball.state !== "owned" ||
        ball.ownerId !== bot.id
    ) {

        return;

    }


    if (
        typeof bot.aiThink !==
        "number" ||
        Number.isNaN(
            bot.aiThink
        )
    ) {

        bot.aiThink =
            0.6;

    }


    bot.aiThink -=
        dt / 60;


    if (
        bot.aiThink > 0
    ) {

        return;

    }


    bot.aiThink =
        0.65 +
        Math.random() *
        0.45;


    const teammate =
        nearestTeammate(
            bot
        );


    const opponent =
        nearestOpponent(
            bot
        );


    /*
    ========================================================
    PRIMEIRO TOQUE DO CRUZA
    ========================================================
    */

    if (
        bot.firstCruzaTouch
    ) {

        if (teammate) {

            bot.firstCruzaTouch =
                false;


            launchPass(
                bot,
                teammate
            );


            return;

        }


        /*
        Se por algum motivo não houver
        companheiro, libera a restrição.
        */

        bot.firstCruzaTouch =
            false;

    }


    /*
    ========================================================
    SEGUNDO TOQUE EM DIANTE
    ========================================================
    */

    if (
        opponent &&
        teammate
    ) {

        /*
        75% ARREMESSO
        25% PASSE
        */

        if (
            Math.random() <
            0.75
        ) {

            launchThrow(
                bot,
                opponent,
                BALL_SPEED *
                (
                    0.85 +
                    Math.random() *
                    0.25
                )
            );


            showPowerMessage(
                `${bot.name} ARREMESSOU!`,
                500
            );

        } else {

            launchPass(
                bot,
                teammate
            );


            showPowerMessage(
                `${bot.name} PASSOU!`,
                500
            );

        }


        return;

    }


    /*
    Só existe adversário.
    */

    if (
        opponent
    ) {

        launchThrow(
            bot,
            opponent,
            BALL_SPEED *
            (
                0.85 +
                Math.random() *
                0.25
            )
        );


        return;

    }


    /*
    Só existe companheiro.
    */

    if (
        teammate
    ) {

        launchPass(
            bot,
            teammate
        );


        return;

    }

}


/* =========================================================
   ALVO DO CRUZA
========================================================= */

function getCruzaTarget(
    bot
) {

    const enemy =
        nearestOpponent(
            bot
        );


    if (!enemy) {

        return {

            x: 50,

            y:
                bot.team === "blue"
                    ? 82
                    : 18

        };

    }


    return {

        x:
            clamp(
                enemy.x,
                30,
                70
            ),

        y:
            bot.team === "blue"
                ? 88
                : 12

    };

}


/* =========================================================
   IA DE LINHA
   CORRIGIDA
========================================================= */

function updateLineAI(
    bot,
    dt
) {

    /*
    ========================================================
    PROCURAR BOLA LIVRE
    ========================================================
    */

    if (
        ball &&
        ball.state === "free"
    ) {

        const dx =
            ball.x -
            bot.x;


        const dy =
            ball.y -
            bot.y;


        const d =
            Math.hypot(
                dx,
                dy
            ) || 1;


        if (
            d < 30
        ) {

            if (
                d > 2
            ) {

                bot.x +=
                    (
                        dx / d
                    ) *
                    0.55 *
                    bot.speed *
                    dt;


                bot.y +=
                    (
                        dy / d
                    ) *
                    0.55 *
                    bot.speed *
                    dt;

            }


            keepPlayerInLegalArea(
                bot
            );


            if (
                distance(
                    bot,
                    ball
                ) < 5
            ) {

                giveBallTo(
                    bot
                );


                bot.aiThink =
                    0.8;


                return;

            }

        }

    }


    /*
    ========================================================
    MOVIMENTO DEFENSIVO
    ========================================================
    */

    const owner =
        getBallOwner();


    if (
        owner &&
        owner.team !==
        bot.team
    ) {

        const target =
            nearestOpponent(
                bot
            );


        if (target) {

            const desiredX =
                clamp(
                    target.x +
                    (
                        Math.random() -
                        0.5
                    ) * 12,
                    10,
                    90
                );


            const desiredY =
                bot.team === "blue"
                    ? clamp(
                        target.y + 8,
                        55,
                        88
                    )
                    : clamp(
                        target.y - 8,
                        12,
                        45
                    );


            moveBotTowards(
                bot,
                desiredX,
                desiredY,
                dt
            );

        }

    } else {

        /*
        Movimento normal.
        */

        bot.aiThink -=
            dt / 60;


        if (
            bot.aiThink <=
            0
        ) {

            bot.aiThink =
                1.0 +
                Math.random() *
                1.8;


            bot.aiTargetX =
                clamp(
                    bot.homeX +
                    (
                        Math.random() -
                        0.5
                    ) * 35,
                    10,
                    90
                );


            bot.aiTargetY =
                bot.team === "blue"
                    ? clamp(
                        bot.homeY +
                        (
                            Math.random() -
                            0.5
                        ) * 20,
                        55,
                        90
                    )
                    : clamp(
                        bot.homeY +
                        (
                            Math.random() -
                            0.5
                        ) * 20,
                        10,
                        45
                    );

        }


        moveBotTowards(
            bot,
            bot.aiTargetX,
            bot.aiTargetY,
            dt
        );

    }


    keepPlayerInLegalArea(
        bot
    );


    /*
    ========================================================
    IA COM A BOLA
    ========================================================
    */

    if (
        ball &&
        ball.state === "owned" &&
        ball.ownerId === bot.id
    ) {

        if (
            typeof bot.aiThink !==
            "number"
        ) {

            bot.aiThink =
                0.8;

        }


        bot.aiThink -=
            dt / 60;


        if (
            bot.aiThink > 0
        ) {

            return;

        }


        bot.aiThink =
            0.75 +
            Math.random() *
            1.0;


        const enemy =
            nearestOpponent(
                bot
            );


        const teammate =
            nearestTeammate(
                bot
            );


        /*
        70% ARREMESSAR
        30% PASSAR
        */

        if (
            enemy &&
            teammate
        ) {

            if (
                Math.random() <
                0.70
            ) {

                launchThrow(
                    bot,
                    enemy,
                    BALL_SPEED *
                    (
                        0.80 +
                        Math.random() *
                        0.35
                    )
                );


                showPowerMessage(
                    `${bot.name} ARREMESSOU!`,
                    500
                );

            } else {

                launchPass(
                    bot,
                    teammate
                );


                showPowerMessage(
                    `${bot.name} PASSOU!`,
                    500
                );

            }


            return;

        }


        /*
        Se só houver adversário,
        arremessa.
        */

        if (
            enemy
        ) {

            launchThrow(
                bot,
                enemy,
                BALL_SPEED *
                (
                    0.80 +
                    Math.random() *
                    0.35
                )
            );


            showPowerMessage(
                `${bot.name} ARREMESSOU!`,
                500
            );


            return;

        }


        /*
        Se só houver companheiro,
        passa.
        */

        if (
            teammate
        ) {

            launchPass(
                bot,
                teammate
            );


            showPowerMessage(
                `${bot.name} PASSOU!`,
                500
            );

        }

    }

}


/* =========================================================
   MOVIMENTO DA IA
========================================================= */

function moveBotTowards(
    bot,
    x,
    y,
    dt
) {

    const dx =
        x -
        bot.x;


    const dy =
        y -
        bot.y;


    const d =
        Math.hypot(
            dx,
            dy
        );


    if (
        d < 1
    ) {

        return;

    }


    bot.x +=
        (
            dx / d
        ) *
        0.45 *
        bot.speed *
        dt;


    bot.y +=
        (
            dy / d
        ) *
        0.45 *
        bot.speed *
        dt;

}


/* =========================================================
   MOVIMENTO CONTROLADO
========================================================= */

function updateControlledMovement() {

    if (
        !gameRunning
    ) {

        return;

    }


    let dx = 0;

    let dy = 0;


    if (
        keys.w ||
        keys.ArrowUp
    ) {

        dy -= 1;

    }


    if (
        keys.s ||
        keys.ArrowDown
    ) {

        dy += 1;

    }


    if (
        keys.a ||
        keys.ArrowLeft
    ) {

        dx -= 1;

    }


    if (
        keys.d ||
        keys.ArrowRight
    ) {

        dx += 1;

    }


    if (
        dx !== 0 ||
        dy !== 0
    ) {

        const length =
            Math.hypot(
                dx,
                dy
            ) || 1;


        moveControlledPlayer(
            dx / length,
            dy / length
        );

    }

}


/* =========================================================
   BARRA DE FORÇA
========================================================= */

function updateThrowCharge(
    dt
) {

    if (
        !gameRunning
    ) {

        return;

    }


    const player =
        getControlledPlayer();


    if (!player) {

        return;

    }


    if (
        keys.Space
    ) {

        throwCharge +=
            dt *
            2.5;


        throwCharge =
            clamp(
                throwCharge,
                0,
                100
            );


        updatePowerBar();

    }

}


function updatePowerBar() {

    let bar =
        byId(
            "throwPowerBar"
        );


    if (!bar) {

        createPowerBar();


        bar =
            byId(
                "throwPowerBar"
            );

    }


    if (!bar) {

        return;

    }


    bar.style.width =
        `${throwCharge}%`;


    if (
        throwCharge >=
        90
    ) {

        bar.style.background =
            "#ff3030";

    } else if (
        throwCharge >=
        60
    ) {

        bar.style.background =
            "#ff9f1c";

    } else {

        bar.style.background =
            "#22c55e";

    }

}


/* =========================================================
   CRIA BARRA
========================================================= */

function createPowerBar() {

    const court =
        byId(
            "court"
        );


    if (!court) {

        return;

    }


    if (
        byId(
            "throwPowerContainer"
        )
    ) {

        return;

    }


    const container =
        document.createElement(
            "div"
        );


    container.id =
        "throwPowerContainer";


    container.style.cssText = `
        position:absolute;
        left:50%;
        bottom:10px;
        transform:translateX(-50%);
        width:220px;
        height:16px;
        background:#162233;
        border:2px solid #fff;
        border-radius:10px;
        overflow:hidden;
        z-index:50;
    `;


    const bar =
        document.createElement(
            "div"
        );


    bar.id =
        "throwPowerBar";


    bar.style.cssText = `
        width:0%;
        height:100%;
        background:#22c55e;
        transition:width .04s linear;
    `;


    container.appendChild(
        bar
    );


    court.appendChild(
        container
    );

}


/* =========================================================
   BOTÃO PASSAR
========================================================= */

function ensurePassButton() {

    let button =
        byId(
            "passBtn"
        );


    if (!button) {

        const actionArea =
            document.querySelector(
                ".action-buttons"
            );


        if (actionArea) {

            button =
                document.createElement(
                    "button"
                );


            button.id =
                "passBtn";


            button.className =
                "action pass";


            button.type =
                "button";


            button.textContent =
                "🏐";


            button.title =
                "Passar — tecla R";


            const throwButton =
                byId(
                    "throwBtn"
                );


            if (throwButton) {

                actionArea.insertBefore(
                    button,
                    throwButton
                );

            } else {

                actionArea.appendChild(
                    button
                );

            }

        }

    }


    if (!button) {

        return;

    }


    if (
        !button.dataset.connected
    ) {

        button.dataset.connected =
            "true";


        button.addEventListener(
            "click",
            passBall
        );

    }

}


/* =========================================================
   POSSE NA INTERFACE
========================================================= */

function updatePossessionUI() {

    const owner =
        getBallOwner();


    if (!owner) {

        return;

    }


    if (
        startupRemaining > 0
    ) {

        return;

    }


    const time =
        Math.max(
            0,
            ball.possessionTime
        );


    showPowerMessage(
        `${owner.name} • ${time.toFixed(1)}s`,
        120
    );

}


/* =========================================================
   DICAS
========================================================= */

function updateHint() {

    document
        .querySelectorAll(
            ".desktop-hint"
        )
        .forEach(
            element => {

                element.textContent =
                    "Teclas: WASD/Setas = mover • Espaço = arremessar • Shift = defender • R = passar • E = poder";

            }
        );

}


/* =========================================================
   PERSONAGENS
========================================================= */

function renderCharacters() {

    const grid =
        byId(
            "characterGrid"
        );


    if (!grid) {

        return;

    }


    grid.innerHTML =
        "";


    characters.forEach(
        character => {

            const card =
                document.createElement(
                    "button"
                );


            card.type =
                "button";


            card.className =
                "character-card";


            card.innerHTML = `

                <strong>
                    ${character.name}
                </strong>

                <span>
                    ${character.description}
                </span>

                <small>

                    Velocidade:
                    ${character.speed}

                    <br>

                    Arremesso:
                    ${character.throwPower}

                    <br>

                    Agarrada:
                    ${character.catch}

                    <br>

                    Defesa:
                    ${character.defense}

                </small>

            `;


            card.addEventListener(
                "click",
                () => {

                    selectedCharacter =
                        character;


                    showPowerMessage(
                        `${character.name} selecionado!`,
                        900
                    );


                    renderCharacters();

                }
            );


            grid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   NÍVEL
========================================================= */

function levelUp(
    player
) {

    if (!player) {

        return;

    }


    player.level++;


    player.attributes.speed +=
        0.025;


    player.attributes.throwPower +=
        0.025;


    player.attributes.catch +=
        0.025;


    player.attributes.defense +=
        0.025;

}


/* =========================================================
   LOOP
========================================================= */

function startGameLoop() {

    stopGameLoop();


    lastFrame =
        performance.now();


    gameLoopId =
        requestAnimationFrame(
            gameLoop
        );

}


function stopGameLoop() {

    if (
        gameLoopId !==
        null
    ) {

        cancelAnimationFrame(
            gameLoopId
        );


        gameLoopId =
            null;

    }

}


function gameLoop(
    now
) {

    if (!gameRunning) {

        return;

    }


    const dt =
        Math.min(
            2,
            (
                now -
                lastFrame
            ) / 16.67
        );


    lastFrame =
        now;


    /*
    20 segundos iniciais.
    */

    if (
        startupRemaining > 0
    ) {

        startupRemaining -=
            dt / 60;


        if (
            startupRemaining <=
            0
        ) {

            startupRemaining =
                0;


            showPowerMessage(
                "⚡ AGORA VALE A REGRA DOS 5 SEGUNDOS!",
                1200
            );

        }

    }


    updateControlledMovement();


    updateThrowCharge(
        dt
    );


    updateAI(
        dt
    );


    updateBall(
        dt
    );


    renderPositions();


    renderBall();


    updatePowerBar();


    gameLoopId =
        requestAnimationFrame(
            gameLoop
        );

}


/* =========================================================
   TECLADO
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.length === 1
                ? event.key.toLowerCase()
                : event.key;


        if (
            event.code ===
            "Space"
        ) {

            keys.Space =
                true;

        } else {

            keys[key] =
                true;

        }


        if (
            !gameRunning
        ) {

            return;

        }


        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                " ",
                "Shift"
            ].includes(
                event.key
            ) ||
            event.code ===
            "Space"
        ) {

            event.preventDefault();

        }


        /*
        SHIFT
        */

        if (
            event.key ===
            "Shift" &&
            !event.repeat
        ) {

            defend();

        }


        /*
        R
        */

        if (
            key === "r" &&
            !event.repeat
        ) {

            event.preventDefault();


            passBall();

        }


        /*
        E
        */

        if (
            key === "e" &&
            !event.repeat
        ) {

            event.preventDefault();


            usePower();

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        const key =
            event.key.length === 1
                ? event.key.toLowerCase()
                : event.key;


        if (
            event.code ===
            "Space"
        ) {

            keys.Space =
                false;


            if (
                gameRunning
            ) {

                throwBall();

            }

        } else {

            keys[key] =
                false;

        }

    }
);


/* =========================================================
   BOTÕES
========================================================= */

function bindButton(
    id,
    callback
) {

    const button =
        byId(id);


    if (!button) {

        return;

    }


    if (
        button.dataset.bound
    ) {

        return;

    }


    button.dataset.bound =
        "true";


    button.addEventListener(
        "click",
        callback
    );

}


/* =========================================================
   PERSONAGENS
========================================================= */

bindButton(
    "charactersBtn",
    () => {

        renderCharacters();


        showScreen(
            screens.characters
        );

    }
);


/* =========================================================
   OPÇÕES
========================================================= */

bindButton(
    "optionsBtn",
    () => {

        alert(
            "⚙️ As opções serão desenvolvidas em breve."
        );

    }
);


/* =========================================================
   VOLTAR
========================================================= */

bindButton(
    "backFromCharactersBtn",
    () => {

        showScreen(
            screens.menu
        );

    }
);


/* =========================================================
   MENU
========================================================= */

bindButton(
    "menuBtn",
    () => {

        gameRunning =
            false;


        stopGameLoop();


        removeCruzaSelectionScreen();


        const role =
            byId(
                "playerRoleSelection"
            );


        if (role) {

            role.remove();

        }


        showScreen(
            screens.menu
        );

    }
);


/* =========================================================
   REINICIAR
========================================================= */

bindButton(
    "restartBtn",
    startPreGame
);


/* =========================================================
   BOTÃO JOGAR
========================================================= */

function connectPlayButton() {

    const ids = [

        "playBtn",

        "jogarBtn",

        "startBtn",

        "gameBtn"

    ];


    ids.forEach(
        id => {

            const button =
                byId(id);


            if (
                button &&
                !button.dataset.gameConnected
            ) {

                button.dataset.gameConnected =
                    "true";


                button.addEventListener(
                    "click",
                    startPreGame
                );

            }

        }
    );


    /*
    Procura também botões
    que contenham JOGAR.
    */

    document
        .querySelectorAll(
            "button"
        )
        .forEach(
            button => {

                const text =
                    button.textContent
                        .trim()
                        .toUpperCase();


                if (
                    text.includes(
                        "JOGAR"
                    ) &&
                    !button.dataset.gameConnected
                ) {

                    button.dataset.gameConnected =
                        "true";


                    button.addEventListener(
                        "click",
                        startPreGame
                    );

                }

            }
        );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function initGame() {

    resetTeams();


    renderCharacters();


    renderScore();


    connectPlayButton();


    ensurePassButton();


    createPowerBar();


    updateHint();


    if (
        screens.menu
    ) {

        showScreen(
            screens.menu
        );

    }

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initGame
    );

} else {

    initGame();

}
