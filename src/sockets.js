const xxh = require('xxhashjs');

let io;

// canvas
const canvasWidth = 800;
const canvasHeight = 400;

// key: room, value: count in room
const roomCounts = {};

// key: socket.name, value: room of socket
const rooms = {};

// key: socket.name, value: arrow object of socket
const arrows = {};

const arrowState = {
  READY: 1,
  DRAWN: 2,
  FIRED: 3,
};

const playerWidth = 30;

const playerSegs = {
  y1: canvasHeight - 30,
  y2: canvasHeight - 60,
  y3: canvasHeight - 90,
};

// max gravity speed
const gravityMax = 9.8;

const powerMax = 10;
const powerMin = 1;
const powerScale = 10;

// function to handle new sockets and create new arrows
const createArrow = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    socket.name = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xBADD00D5).toString(16);
    if (Object.keys(roomCounts).length === 0) {
      const room = 'room0';
      socket.join(room);
      rooms[socket.name] = room;
      roomCounts[room] = 1;
    } else {
      const roomKeys = Object.keys(roomCounts); // get each room
      let foundRoom = false; // remains false if all rooms are full
      for (let i = 0; i < roomKeys.length; i++) {
        if (roomCounts[roomKeys[i]] < 2) {
          const room = `room${i}`;
          socket.join(room);
          rooms[socket.name] = room;
          roomCounts[room]++;
          foundRoom = true;
          break;
        }
      }
      if (!foundRoom) {
        const room = `room${roomKeys.length}`;
        socket.join(room);
        rooms[socket.name] = room;
        roomCounts[room] = 1;
      }
    }

    // create a new arrow object and add it to list keyed with socket name
    arrows[socket.name] = {
      id: socket.name, // unique id
      lastUpdate: new Date().getTime(), // last time arrow was updated
      targHealth: 100, // keep track of target's health (player 2 health)
      x: 50, // default x coord of arrow
      y: data.height - 30, // default y coord of arrow
      xSpeed: 0,
      ySpeed: 0,
      prevX: 0, // default last known x coord
      prevY: 0, // default last known y coord
      destX: 50, // default desired x coord
      destY: data.height - 30, // default desired y coord
      alpha: 0, // default % from prev to dest
      state: 1,
    };

    socket.emit('joined', arrows[socket.name]);
  });
};

// function to update arrowState to fired
const onFire = (sock) => {
  const socket = sock;

  socket.on('fireArrow', (data) => {
    console.log('ArrowFire');
    arrows[socket.name].state = arrowState.FIRED;
    const dirX = Math.abs(data.start.x - data.end.x);
    const dirY = Math.abs(data.start.y - data.end.y);

    const dist = Math.sqrt((dirX * dirX) + (dirY * dirY));

    let power = dist / powerScale;

    if (power > powerMax) power = powerMax;
    if (power < powerMin) power = powerMin;

    const normX = dirX / dist;
    const normY = dirY / dist;

    arrows[socket.name].xSpeed = power * normX;
    arrows[socket.name].ySpeed = power * normY * (-1);
  });
};

// function to update arrowState to drawn
const onDraw = (sock) => {
  const socket = sock;

  socket.on('drawArrow', () => {
    console.log('ArrowDraw');
    arrows[socket.name].state = arrowState.DRAWN;
  });
};

// reset arrow
const resetArrow = (arrowKey) => {
  console.log('Reset');
  arrows[arrowKey].lastUpdate = new Date().getTime();
  arrows[arrowKey].xSpeed = 0;
  arrows[arrowKey].ySpeed = 0;
  arrows[arrowKey].prevX = 0;
  arrows[arrowKey].prevY = 0;
  arrows[arrowKey].x = 50;
  arrows[arrowKey].y = canvasHeight - 30;
  arrows[arrowKey].destX = 50;
  arrows[arrowKey].destY = canvasHeight - 30;
  arrows[arrowKey].alpha = 0;
  arrows[arrowKey].state = arrowState.READY;
};

// function to check arrow collisions
const checkCollisions = () => {
  const arrowKeys = Object.keys(arrows);

  for (let i = 0; i < arrowKeys.length; i++) {
    if (arrows[arrowKeys[i]].state === arrowState.FIRED) {
      const arrow = arrows[arrowKeys[i]];

      if (arrow.destX > (canvasWidth - playerWidth) && arrow.destX < canvasWidth) {
        if (arrow.destY < canvasHeight && arrow.destY > playerSegs.y1) {
          console.log('hit');
          arrows[arrowKeys[i]].targHealth -= 10;
          resetArrow(arrowKeys[i]);
        } else if (arrow.destY < playerSegs.y1 && arrow.destY > playerSegs.y2) {
          console.log('hit');
          arrows[arrowKeys[i]].targHealth -= 20;
          resetArrow(arrowKeys[i]);
        } else if (arrow.destY < playerSegs.y2 && arrow.destY > playerSegs.y3) {
          console.log('hit');
          arrows[arrowKeys[i]].targHealth -= 30;
          resetArrow(arrowKeys[i]);
        }
      } else if (arrow.destX >= canvasWidth || arrow.destY >= canvasHeight) {
        console.log('offPage');
        resetArrow(arrowKeys[i]);
      }
    }
  }
};

// function to update fired arrows
const updateArrows = () => {
  checkCollisions();

  // move fired arrows
  const arrowKeys = Object.keys(arrows);

  for (let i = 0; i < arrowKeys.length; i++) {
    if (arrows[arrowKeys[i]].state === arrowState.FIRED) {
      const arrow = arrows[arrowKeys[i]];

      // Update previous position before changing
      arrow.prevX = arrow.destX;
      arrow.prevY = arrow.destY;

      // Apply gavity
      if (!(arrow.ySpeed > gravityMax)) {
        arrow.ySpeed += 0.1;
      }

      // Update destination
      arrow.destY += arrow.ySpeed;
      arrow.destX += arrow.xSpeed;

      arrows[arrowKeys[i]] = arrow;
      arrows[arrowKeys[i]].lastUpdate = new Date().getTime();
    }
  }

  // send arrows to each room
  const roomKeys = Object.keys(roomCounts);

  for (let i = 0; i < roomKeys.length; i++) {
    const arrowsToSend = {};

    // add arrows that match room to sending object
    for (let j = 0; j < arrowKeys.length; j++) {
      if (rooms[arrows[arrowKeys[j]].id] === roomKeys[i]) {
        arrowsToSend[arrows[arrowKeys[j]].id] = arrows[arrowKeys[j]];
      }
    }
    const lastUpdate = new Date().getTime();
    // send arrows
    io.sockets.in(roomKeys[i]).emit('updateArrows', { arrows: arrowsToSend, lastUpdate });
  }
};

// delete arrows that disconnect
const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    io.sockets.in(rooms[socket.name]).emit('left'); // notify clients
    socket.leave(rooms[socket.name]); // remove socket from room
    roomCounts[rooms[socket.name]]--;
    if (roomCounts[rooms[socket.name]] <= 0) delete roomCounts[rooms[socket.name]];
    delete rooms[socket.name];
  });
};

const configure = (ioServer) => {
  io = ioServer;

  setInterval(updateArrows, 20);

  io.sockets.on('connection', (socket) => {
    createArrow(socket);
    onFire(socket);
    onDraw(socket);
    onDisconnect(socket);
  });
};

module.exports.configure = configure;
