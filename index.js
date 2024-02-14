const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const users = []

app.use(express.static(__dirname + "/public"))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/users', (req, res) => {
    res.json({ users })
})

io.on('connection', (socket) => {

    socket.on('user login', (data) => {
        users.push({ id: socket.id, name: data.name })
        socket.broadcast.emit('chat message', {
            name: "$admin",
            msg: data.name + " joined the chat."
        });
    });

    socket.on('disconnect', () => {
        let index = users.findIndex(item => item.id == socket.id)
        socket.broadcast.emit('chat message', {
            name: "$admin",
            msg: users[index].name || "unknown" + " left the chat."
        });
        users.splice(index, 1)
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('clear canvas', (usrname) => {
        io.emit('clear canvas', usrname);
        io.emit('chat message', {name: usrname, msg: "i cleared the canvas."});
    });

    // Listen for draw events from clients
    socket.on('draw', (data) => {
        // Broadcast draw events to all clients except the sender
        socket.broadcast.emit('draw', data);
    });

    // Listen for other user cursor
    socket.on('cursorMove', (data) => {
        // Broadcast draw events to all clients except the sender
        socket.broadcast.emit('cursorMove', data);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});