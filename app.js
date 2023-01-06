const container = document.querySelector(".container");
const overlayStart = document.querySelector(".start");
const overlayEnd = document.querySelector(".end");
const resetButton = document.querySelector("#reset");
const startButton = document.querySelector("#start");

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

    return {renderBoard, setState, getState, resetState, restart};
})();

const Player = (name, marker) => {
    const getName = () => name;
    const getMarker = () => marker;
    return {getName, getMarker};
}

const player1 = Player("player1", "x");
const player2 = Player("player2", "o");

const gameFlow = (() => {
    let activePlayer = player1;
    let activePlayerNumber = 1;

    function placeMarker(event) {
        if (event.target.textContent) return;
        
        const marker = activePlayer.getMarker();
        const index = event.target.dataset.index;
        gameBoard.setState(index, marker);
        
        const currState = gameBoard.getState();
        
        if (checkWin(currState, marker)) {
            gameEnd("win", activePlayer);
            return;
        }
        if (currState.every((tile) => tile)) {
            gameEnd("tie");
            return;
        }

        if (activePlayerNumber == 1) {
            activePlayer = player2;
            activePlayerNumber = 2;
        } else {
            activePlayer = player1;
            activePlayerNumber = 1;
        }
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

    function gameStart() {
        gameBoard.resetState();
        activePlayer = player1;
        overlayStart.classList.remove("active");
        gameBoard.renderBoard();
    }

    function gameEnd(outcome, player = {}) {
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

container.addEventListener("click", gameFlow.placeMarker);
startButton.addEventListener("click", gameFlow.gameStart);
resetButton.addEventListener("click", gameBoard.restart);