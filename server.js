const express = require('express');
const app = express();
const http = require('http').createServer(app);
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ server: http });
const clients = [];

app.use(express.static('public'));

wss.on('connection', (ws) => {
    console.log("🔌 Новое подключение WebSocket");
    const player = clients.length === 0 ? "X" : "O";
    ws.player = player;
    clients.push(ws);
    console.log("🎮 Назначен игрок:", player);

    ws.send(JSON.stringify({ type: "init", symbol: player }));

    ws.on('message', (msg) => {
        console.log("📩 Сообщение:", msg);
        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        }
    });

    ws.on('close', () => {
        console.log("❌ Игрок отключился:", player);
        const index = clients.indexOf(ws);
        if (index !== -1) clients.splice(index, 1);
    });
});

http.listen(PORT, () => {
    console.log("✅ Сервер запущен на порту " + PORT);
});
