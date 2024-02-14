
var messages = document.getElementById("messages");
var users = document.getElementById("users");
var form = document.getElementById("form");
var input = document.getElementById("input");
var send = document.getElementById("send");
var enter = document.getElementById("enter");
var nameinp = document.getElementById("name");
var login = document.getElementById("login");
var home = document.getElementById("home");

let usrname;

var socket = io();
enter.addEventListener("click", () => {
    usrname = nameinp.value
    socket.emit("user login", {
        name: nameinp.value,
    });
    login.style.display = "none"
    home.style.display = "flex"
})

function fetchUser() {
    fetch("/users")
        .then(response => {
            return response.json()
        })
        .then(data => {
            users.innerHTML = ""
            data.users.forEach(user => {
                users.innerHTML += `
                    <li class="font-semibold">${user.name},</li>
                `
            });
        })
        .catch(err => {
            console.error(err)
        })
}

send.addEventListener("click", () => {
    if (input.value) {
        // send event to server
        socket.emit("chat message", {
            name: usrname,
            msg: input.value,
        });
        input.value = "";
    }
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
        // send event to server
        socket.emit("chat message", {
            name: usrname,
            msg: input.value,
        });
        input.value = "";
    }
});

socket.on("chat message", (msg) => {
    if (msg.name == "$admin") {
        messages.innerHTML += `
        <li class="list-group-item">${msg.msg}</li>
      `;
    } else {
        messages.innerHTML += `
        <li><p class="font-bold inline">${msg.name}</p>: ${msg.msg}</li>
      `;
    }
    fetchUser()
    messages.scrollTo(0, messages.scrollHeight);
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let drawing = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);


function startDrawing(e) {
    drawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!drawing) return;
    const [x, y] = [e.offsetX, e.offsetY];

    // Draw line from last position to current position
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Emit drawing event to server
    socket.emit('draw', { x1: lastX, y1: lastY, x2: x, y2: y });

    [lastX, lastY] = [x, y];
}

document.getElementById("clearcmd").addEventListener("click", () => {
    socket.emit('clear canvas', usrname);
})

function stopDrawing() {
    drawing = false;
}

// Listen for drawing events from other clients
socket.on('draw', ({ x1, y1, x2, y2 }) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
});

let mouseover = false
let mouse = {
    x: 0,
    y: 0
}

canvas.addEventListener('mouseover', (e) => {
    mouseover = true
});

canvas.addEventListener('mouseleave', (e) => {
    mouseover = false
})

canvas.addEventListener('mousemove', function (event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});

window.setInterval(() => {
    if (mouseover) {
        socket.emit('cursorMove', { x: mouse.x, y: mouse.y, name: usrname });
    }
}, 10)


// Listen for cursor position from other clients
socket.on('cursorMove', ({ x, y, name }) => {
    drawCursorOverlay(x, y, name);
});

socket.on('clear canvas', (msg) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Function to draw cursor overlay
function drawCursorOverlay(x, y, name) {
    let overlay = document.createElement("p")
    overlay.classList.add("text-xs", "bg-black", "absolute", "mt-3", "ml-3", "py-1", "px-2", "w-fit", "text-white", "font-semibold", "rounded-md", "opacity-50")
    overlay.innerText = name
    overlay.style.left = x + 'px'
    overlay.style.top = y + 'px'

    let point = document.createElement("span")
    point.classList.add("bg-red-500", "shadow", "shadow-red-600", "flex", "w-1", "h-1", "rounded-full", "absolute")
    point.innerText = ""
    point.style.left = x + 'px'
    point.style.top = y + 'px'
    document.getElementById("cv").appendChild(point)
    document.getElementById("cv").appendChild(overlay)

    window.setTimeout(() => {
        document.getElementById("cv").removeChild(point)
        document.getElementById("cv").removeChild(overlay)
    }, 20)
}


