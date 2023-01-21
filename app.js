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

const Player = (name, marker, isAi) => {
    const getName = () => name;
    const getMarker = () => marker;
    const checkIsAi = () => isAi;
    return {getName, getMarker, checkIsAi};
}

const gameFlow = (() => {
    let players = [];
    let activePlayer;
    let activePlayerNumber;
    
    function gameStart(event) {
        gameBoard.resetState();
        players = [];
        setPlayers();
        activePlayer = players[0];
        activePlayerNumber = 1;
        overlayStart.classList.remove("active");
        gameBoard.renderBoard();
        (players[0].checkIsAi()) ? setTimeout(aiTurnEasy, 1000)
                                    : container.addEventListener("click", gameFlow.placeMarker);
        event.preventDefault();
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

    function checkWin(state, marker) {
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
            if (comb.every((cell) => state[cell] === marker)) return true;
        }
        return false;
    }
    
    function setPlayers() {
        const playerFields = document.querySelectorAll("fieldset div.active");
        let aiCount = 1;
        playerFields.forEach((playerField, index) => {
            if (playerField.classList.contains("player-name")) {
                let playerName = playerField.querySelector("input[type='text']").value;
                players.push(Player(playerName, markers[index], false));
            } else {
                players.push(Player(`AI${aiCount}`, markers[index], true));
                aiCount++;
            }
        });
    }

    function checkGameEnd() {
        const currState = gameBoard.getState();
        const marker = activePlayer.getMarker();
        if (checkWin(currState, marker)) {
            gameEnd("win", activePlayer);
            return true;
        }
        if (currState.every((tile) => tile)) {
            gameEnd("tie");
            return true;
        }
        return false;
    }

    function switchActivePlayer() {
        if (activePlayerNumber == 1) {
            activePlayer = players[1];
            activePlayerNumber = 2;
        } else {
            activePlayer = players[0];
            activePlayerNumber = 1;
        }
        (activePlayer.checkIsAi()) ? setTimeout(aiTurnEasy, 500)
                                         : container.addEventListener("click", gameFlow.placeMarker);
        
    }

    function aiTurnEasy() {
        const gameState = gameBoard.getState();
        let index = Math.floor(Math.random()*9);
        while (gameState[index]) {
            index = Math.floor(Math.random()*9);
        }
        gameBoard.setState(index, activePlayer.getMarker());
        if (checkGameEnd()) return;
        switchActivePlayer();
    }

    function gameEnd(outcome, player = {}) {
        container.removeEventListener("click", gameFlow.placeMarker);
        const endMessage = document.querySelector(".end-message");
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

    return {placeMarker, gameStart};
})();

startForm.addEventListener("submit", gameFlow.gameStart);
resetButton.addEventListener("click", gameBoard.restart);
radioOptions.forEach((radio) => {
    radio.addEventListener('change', gameBoard.switchOptions);
});