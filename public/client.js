const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);
const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const restartBtn = document.getElementById("restart");

let board = Array(9).fill("");
let mySymbol = "";
let myTurn = false;

function drawBoard(highlight = []) {
    boardDiv.innerHTML = "";
    board.forEach((cell, i) => {
        const btn = document.createElement("button");
        btn.textContent = cell;
        btn.className = "cell";
        if (highlight.includes(i)) {
            btn.classList.add("win");
        }
        btn.disabled = cell !== "" || !myTurn;
        btn.onclick = () => makeMove(i);
        boardDiv.appendChild(btn);
    });
}

function makeMove(index) {
    if (board[index] === "") {
        board[index] = mySymbol;
        drawBoard();
        socket.send(JSON.stringify({ type: "move", index, symbol: mySymbol }));
        myTurn = false;
        statusDiv.textContent = "Ход соперника...";
    }
}

function checkWinner() {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    for (const line of wins) {
        const [a,b,c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], line };
        }
    }
    return board.includes("") ? null : { winner: "draw" };
}

socket.onmessage = async (event) => {
    let text;
    if (event.data instanceof Blob) {
        text = await event.data.text();
    } else {
        text = event.data;
    }

    const msg = JSON.parse(text);

    if (msg.type === "init") {
        mySymbol = msg.symbol;
        myTurn = mySymbol === "X";
        statusDiv.textContent = `Вы играете за ${mySymbol}`;
        drawBoard();
    }

    if (msg.type === "move") {
        board[msg.index] = msg.symbol;
        const result = checkWinner();
        if (result) {
            if (result.winner === "draw") {
                statusDiv.textContent = "Ничья!";
            } else {
                drawBoard(result.line);
                if (result.winner === mySymbol) {
                    statusDiv.textContent = "🎉 Победа! Отличная игра!";
                } else {
                    statusDiv.textContent = "😢 Вы проиграли. Реванш?";
                }
            }
            boardDiv.querySelectorAll("button").forEach(btn => btn.disabled = true);
        } else {
            myTurn = msg.symbol !== mySymbol;
            statusDiv.textContent = myTurn ? "Ваш ход" : "Ход соперника...";
            drawBoard();
        }
    }

    if (msg.type === "chat") {
        const p = document.createElement("p");
        p.innerHTML = `<strong>${msg.symbol}:</strong> ${msg.text}`;
        chatBox.appendChild(p);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    if (msg.type === "restart") {
        board = Array(9).fill("");
        myTurn = mySymbol === "X";
        statusDiv.textContent = `Игра перезапущена. Вы играете за ${mySymbol}`;
        drawBoard();
    }
};

chatForm.onsubmit = (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) {
        socket.send(JSON.stringify({ type: "chat", text, symbol: mySymbol }));
        chatInput.value = "";
    }
};

restartBtn.onclick = () => {
    socket.send(JSON.stringify({ type: "restart" }));
};
