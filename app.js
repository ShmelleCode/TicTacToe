const container = document.querySelector(".container");
const overlayStart = document.querySelector(".start");
const overlayEnd = document.querySelector(".end");
const resetButton = document.querySelector("#reset");
const startForm = document.querySelector("#players-form");
const radioOptions = document.querySelectorAll("input[type='radio']");
const turnDisplay = document.querySelectorAll('.turn');
const markers = ["X", "O"];

const gameBoard = (() => {
    let _boardState = new Array(9).fill("");
    
    function _renderBoard() {
        container.innerHTML = "";
        _boardState.forEach((tile, i) => {
            const tileElement = document.createElement("div");
            tileElement.classList.add("tile");
            tileElement.dataset.index = i;
            const tileMarker = document.createElement("p");
            tileMarker.textContent = tile;
            tileElement.appendChild(tileMarker);
            container.appendChild(tileElement);
        })
    }

    const getState = () => _boardState;

    function setState(index, marker) {
        _boardState[index] = marker;
        _renderBoard();
    }

    function resetState() {
        _boardState = new Array(9).fill("");
        _renderBoard();
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

    return {setState, getState, resetState, restart, switchOptions};
})();

const Player = (name, marker, isAi, aiLevel) => {
    const getName = () => name;
    const getMarker = () => marker;
    const checkIsAi = () => isAi;
    const getAiLevel = () => aiLevel;
    return {getName, getMarker, checkIsAi, getAiLevel};
}

const gameFlow = (() => {
    let _players = [];
    let _activePlayer;
    let _activePlayerFlag;
    let _winComb = [];
    
    function gameStart(event) {
        gameBoard.resetState();
        _turnCount = 0;
        _players = [];
        _setPlayers();
        _activePlayer = _players[0];
        _activePlayerFlag = true;
        overlayStart.classList.remove("active");
        turnDisplay[0].classList.toggle('active');
        (_players[0].checkIsAi()) ? setTimeout(_aiTurn, 1000, 'easy')
                                 : container.addEventListener("click", _placeMarker);
        event.preventDefault();
    }

    function _setPlayers() {
        const playerFields = document.querySelectorAll("fieldset div.active");
        let aiCount = 1;
        playerFields.forEach((playerField, index) => {
            if (playerField.classList.contains("player-name")) {
                let playerName = playerField.querySelector("input[type='text']").value;
                _players.push(Player(playerName, markers[index], false));
            } else {
                let aiLevel = playerField.querySelector("select").value;
                _players.push(Player(`${aiLevel}AI${aiCount}`, markers[index], true, aiLevel));
                aiCount++;
            }
        });
    }

    function _placeMarker(event) {
        if (event.target.textContent) return;
        
        const marker = _activePlayer.getMarker();
        const index = event.target.dataset.index;
        gameBoard.setState(index, marker);
        
        if (_checkGameEnd()) return;
        container.removeEventListener("click", _placeMarker);
        _switchActivePlayer();
    }

    function _evaluateBoard(state, playerMarker, opponentMarker) {
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
            if (comb.every((cell) => state[cell] === playerMarker)) {
                _winComb = comb;
                return 10;
            }
            if (comb.every((cell) => state[cell] === opponentMarker)) return -10;
        }
        return 0;
    }
    
    function _checkTie(state) {
        if (state.every((cell) => cell)) return true;
        return false;
    }

    function _checkGameEnd() {
        const currState = gameBoard.getState();
        const activeMarker = _activePlayer.getMarker();
        if (_evaluateBoard(currState, activeMarker) > 0) {
            _gameEnd("win", _activePlayer);
            return true;
        }
        if (_checkTie(currState)) {
            _gameEnd("tie");
            return true;
        }
        return false;
    }
    
    function _gameEnd(outcome, player = {}) {
        container.removeEventListener("click", _placeMarker);
        const endMessage = document.querySelector("#end-message");
        switch (outcome) {
            case "win": 
                endMessage.textContent = `${player.getName()} wins!`;
                _winComb.forEach((index) => document.querySelector(`div[data-index="${index}"]`).classList.add('win'));
                break;
            case "tie": 
                endMessage.textContent = `It's a tie!`;
                break;
        }
        turnDisplay.forEach((node) => node.classList.remove('active'));
        overlayEnd.classList.add("active");
    }

    function _switchActivePlayer() {
        _activePlayer = (_activePlayerFlag) ? _players[1] : _players[0];
        _activePlayerFlag = !_activePlayerFlag;
        turnDisplay.forEach((node) => node.classList.toggle('active'));
        (_activePlayer.checkIsAi()) 
            ? setTimeout(_aiTurn, 500, _activePlayer.getAiLevel())
            : container.addEventListener("click", _placeMarker);
        
    }

    function _aiTurn(level) {
        const gameState = gameBoard.getState();
        let index = 0;
        switch (level) {
            case 'easy': 
                index = _aiTurnEasy(gameState);
                break;
            case 'medium':
                const randomAi = Math.random();
                index = (randomAi >= 0.3) ? _aiTurnMinimax(gameState) : _aiTurnEasy(gameState);
                break;
            case 'hard':
                index = _aiTurnMinimax(gameState);
                break;
            default: return;
        }
        gameBoard.setState(index, _activePlayer.getMarker());
        if (_checkGameEnd()) return;
        _switchActivePlayer();
    }

    function _aiTurnEasy(state) {
        let index = Math.floor(Math.random()*9);
        while (state[index]) {
            index = Math.floor(Math.random()*9);
        }
        return index;
    }

    function _aiTurnMinimax(state) {
        const playerMarker = _activePlayer.getMarker();
        const opponentMarker = (playerMarker == 'X' ? 'O' : 'X');
        return _findBestMove(state, playerMarker, opponentMarker);
    }

    function _minimax(state, depth, isPlayerTurn, playerMarker, opponentMarker, memo={}) {
        const stateName = state.join(',');
        if (stateName in memo) return memo[stateName];
    
        let score = _evaluateBoard(state, playerMarker, opponentMarker);
    
        if (score === 10) return score;
    
        if (score === -10) return score;
    
        if (_checkTie(state)) return 0;
    
        let bestScore = isPlayerTurn ? -1000 : 1000;
    
        state.forEach((cell, index) => {
            if (cell) return;
            state[index] = isPlayerTurn ? playerMarker : opponentMarker;
            bestScore = isPlayerTurn
                        ? Math.max(bestScore, _minimax(state, depth + 1, !isPlayerTurn, playerMarker, opponentMarker, memo))
                        : Math.min(bestScore, _minimax(state, depth + 1, !isPlayerTurn, playerMarker, opponentMarker, memo));
            state[index] = "";
        });
        memo[stateName] = (isPlayerTurn ? bestScore - depth : bestScore + depth);
        return memo[stateName];
    }
    
    function _findBestMove(state, playerMarker, opponentMarker) {
        let bestMove = -1;
        let bestScore = -1000;
        state.forEach((cell, index) => {
            if (cell) return;
            state[index] = playerMarker;
            let moveScore = _minimax(state, 0, false, playerMarker, opponentMarker);
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