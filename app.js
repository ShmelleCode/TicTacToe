const container = document.querySelector(".container");
const overlayStart = document.querySelector(".start");
const overlayEnd = document.querySelector(".end");
const resetButton = document.querySelector("#reset");
const startForm = document.querySelector("#players");
const radioOptions = document.querySelectorAll("input[type='radio']");
const markers = ["x", "o"];

const gameBoard = (() => {
    let _boardState = new Array(9).fill("");
    
    function renderBoard() {
        container.innerHTML = "";
        _boardState.forEach((tile, i) => {
            const tileElement = document.createElement("div");
            tileElement.classList.add("tile");
            tileElement.dataset.index = i;
            tileElement.textContent = tile;
            container.appendChild(tileElement);
        })
    }

    const getState = () => _boardState;

    function setState(index, marker) {
        _boardState[index] = marker;
        renderBoard();
    }

    function resetState() {
        _boardState = new Array(9).fill("");
    }

    function restart() {
        overlayEnd.classList.remove("active");
        overlayStart.classList.add("active");
    }

    function switchOptions() {
        const radioName = this.name;
        const radios = document.querySelectorAll(`input[name=${radioName}]`);
        radios.forEach((radio) => {
            document.getElementById(`${radio.id}-options`).classList.toggle("active");
        })
    }

    return {renderBoard, setState, getState, resetState, restart, switchOptions};
})();

const Player = (name, marker, isAi, aiLevel) => {
    const getName = () => name;
    const getMarker = () => marker;
    const checkIsAi = () => isAi;
    const getAiLevel = () => aiLevel;
    return {getName, getMarker, checkIsAi, getAiLevel};
}

const gameFlow = (() => {
    let players = [];
    let activePlayer;
    let activePlayerNumber;
    let turnCount;
    
    function gameStart(event) {
        gameBoard.resetState();
        turnCount = 0;
        players = [];
        setPlayers();
        activePlayer = players[0];
        activePlayerNumber = 1;
        overlayStart.classList.remove("active");
        gameBoard.renderBoard();
        (players[0].checkIsAi()) ? setTimeout(aiTurn, 1000, 'easy')
                                 : container.addEventListener("click", placeMarker);
        event.preventDefault();
    }

    function setPlayers() {
        const playerFields = document.querySelectorAll("fieldset div.active");
        let aiCount = 1;
        playerFields.forEach((playerField, index) => {
            if (playerField.classList.contains("player-name")) {
                let playerName = playerField.querySelector("input[type='text']").value;
                players.push(Player(playerName, markers[index], false));
            } else {
                let aiLevel = playerField.querySelector("select").value;
                players.push(Player(`${aiLevel}AI${aiCount}`, markers[index], true, aiLevel));
                aiCount++;
            }
        });
    }

    function placeMarker(event) {
        if (event.target.textContent) return;
        
        const marker = activePlayer.getMarker();
        const index = event.target.dataset.index;
        gameBoard.setState(index, marker);
        
        if (checkGameEnd()) return;
        container.removeEventListener("click", gameFlow.placeMarker);
        switchActivePlayer();
    }

    function checkTie(state) {
        if (state.every((cell) => cell)) return true;
        return false;
    }

    function checkGameEnd() {
        const currState = gameBoard.getState();
        const activeMarker = activePlayer.getMarker();
        if (evaluateBoard(currState, activeMarker) > 0) {
            gameEnd("win", activePlayer);
            return true;
        }
        if (checkTie(currState)) {
            gameEnd("tie");
            return true;
        }
        return false;
    }
    
    function gameEnd(outcome, player = {}) {
        container.removeEventListener("click", gameFlow.placeMarker);
        const endMessage = document.querySelector("#end-message");
        switch (outcome) {
            case "win": 
                endMessage.textContent = `${player.getName()} wins!`;
                break;
            case "tie": 
                endMessage.textContent = `It's a tie!`;
                break;
        }
        overlayEnd.classList.add("active");
    }

    function switchActivePlayer() {
        if (activePlayerNumber == 1) {
            activePlayer = players[1];
            activePlayerNumber = 2;
        } else {
            activePlayer = players[0];
            activePlayerNumber = 1;
        }
        turnCount++;
        (activePlayer.checkIsAi()) 
            ? setTimeout(aiTurn, 500, (activePlayer.getAiLevel() == 'medium' && turnCount <= 1) ? 'easy' : activePlayer.getAiLevel())
            : container.addEventListener("click", placeMarker);
        
    }

    function aiTurn(level) {
        const gameState = gameBoard.getState();
        let index = 0;
        switch (level) {
            case 'easy': 
                index = aiTurnEasy(gameState);
                break;
            case 'medium':
                index = aiTurnMinimax(gameState);
                break;
            case 'hard':
                index = aiTurnMinimax(gameState);
                break;
            default: return;
        }
        gameBoard.setState(index, activePlayer.getMarker());
        if (checkGameEnd()) return;
        switchActivePlayer();
    }

    function aiTurnEasy(state) {
        let index = Math.floor(Math.random()*9);
        while (state[index]) {
            index = Math.floor(Math.random()*9);
        }
        return index;
    }

    function aiTurnMinimax(state) {
        const playerMarker = activePlayer.getMarker();
        const opponentMarker = (playerMarker == 'x' ? 'o' : 'x');
        return findBestMove(state, playerMarker, opponentMarker);
    }

    function evaluateBoard(state, playerMarker, opponentMarker) {
        const winCombs = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5 ,8],
            [0, 4, 8],
            [2, 4, 6]
        ];
        for (let comb of winCombs) {
            if (comb.every((cell) => state[cell] === playerMarker)) return 10;
            if (comb.every((cell) => state[cell] === opponentMarker)) return -10;
        }
        return 0;
    }

    function minimax(state, depth, isPlayerTurn, playerMarker, opponentMarker, memo={}) {
        const stateName = state.join(',');
        if (stateName in memo) return memo[stateName];
    
        let score = evaluateBoard(state, playerMarker, opponentMarker);

        if (score === 10) return score;
    
        if (score === -10) return score;
    
        if (checkTie(state)) return 0;
    
        let bestScore = isPlayerTurn ? -1000 : 1000;
    
        state.forEach((cell, index) => {
            if (cell) return;
            state[index] = isPlayerTurn ? playerMarker : opponentMarker;
            bestScore = isPlayerTurn
                        ? Math.max(bestScore, minimax(state, depth + 1, !isPlayerTurn, playerMarker, opponentMarker, memo))
                        : Math.min(bestScore, minimax(state, depth + 1, !isPlayerTurn, playerMarker, opponentMarker, memo));
            state[index] = "";
        });
        memo[stateName] = (isPlayerTurn ? bestScore - depth : bestScore + depth);
        return memo[stateName];
    }

    function findBestMove(state, playerMarker, opponentMarker) {
        let bestMove = -1;
        let bestScore = -1000;
        state.forEach((cell, index) => {
            if (cell) return;
            state[index] = playerMarker;
            let moveScore = minimax(state, 0, false, playerMarker, opponentMarker);
            state[index] = '';
            if (moveScore > bestScore) {
                bestScore = moveScore;
                bestMove = index;
            }
        })
        return bestMove;
    }

    return {gameStart};
})();

startForm.addEventListener("submit", gameFlow.gameStart);
resetButton.addEventListener("click", gameBoard.restart);
radioOptions.forEach((radio) => {
    radio.addEventListener('change', gameBoard.switchOptions);
});