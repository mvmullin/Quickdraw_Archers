let arrow1; // this client's arrow
let arrow2; // player 2's arrow
let socket; // arrow's socket
let arrowWidth = 15;
let arrowHeight = 3;

const playerWidth = 30;

const playerSegs = {};

let healthWidth = 100;
let healthHeight = 10;
let healthPos = 30;

let mouse = {
  down : false,
  start : {x:0, y:0},
  end : {x:0, y:0},
};

let mouseStartX = 0;
let mouseStartY = 0;
let mouseEndX = 0;
let mouseEndY = 0;

let canvas;
let ctx;

//redraw canvas
const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear screen
  
  if(arrow1.targHealth <= 0) {
    ctx.font = '100px Comic Sans MS';
    ctx.fillStyle = '#4dc3ff';
    ctx.textAlign = 'center';
    ctx.fillText('WIN', canvas.width/2, canvas.height/2);
  } else if (arrow2 && arrow2.targHealth <= 0) {
    ctx.font = '100px Comic Sans MS';
    ctx.fillStyle = '#ff4d4d';
    ctx.textAlign = 'center';
    ctx.fillText('LOSE', canvas.width/2, canvas.height/2);
  } else {
    drawArrow(arrow1, '#4dc3ff', false);
    if(arrow2) drawArrow(arrow2, '#ff4d4d', true);
    if(arrow2) drawUI();
    requestAnimationFrame(draw); // continue to draw updates
  }
};

// draw UI
const drawUI = () => {
  // draw health bars
  ctx.beginPath();
  ctx.fillStyle = '#1a1a1a';
  ctx.rect(healthPos, healthPos, healthWidth, healthHeight);
  ctx.rect(canvas.width - healthPos - healthWidth, healthPos, healthWidth, healthHeight);
  ctx.fill();
  
  // draw remaining health
  ctx.beginPath();
  ctx.fillStyle = '#cc0000';
  ctx.rect(healthPos, healthPos, arrow2.targHealth, healthHeight);
  ctx.rect(canvas.width - healthPos - arrow1.targHealth, healthPos, arrow1.targHealth, healthHeight);
  ctx.fill();
  
  // draw "players"
  
  let ySegs = Object.keys(playerSegs);
  
  for(let i = 0; i < ySegs.length; i++) {
    // "player" 1
    ctx.beginPath();
    ctx.fillStyle = '#4dc3ff';
    ctx.strokeStyle = '#1a1a1a';
    ctx.rect(0, playerSegs[ySegs[i]], playerWidth, playerWidth);
    ctx.fill();
    ctx.stroke();
    
    // "player" 2
    ctx.beginPath();
    ctx.fillStyle = '#ff4d4d';
    ctx.strokeStyle = '#1a1a1a';
    ctx.rect(canvas.width - playerWidth, playerSegs[ySegs[i]], playerWidth, playerWidth);
    ctx.fill();
    ctx.stroke();
  }
  
};

// linear interpolation to jump percentages to new position
let lerp = (v0, v1, alpha) => {
  return (1 - alpha) * v0 + alpha * v1;
};

// function to update position of initial arrow draw
const mouseDownHandler = (e) => {
  console.log("mouseDown");
  mouse.down = true;
  if(arrow1.state === arrowState.READY && arrow2) {
    arrow1.state = arrowState.DRAWN;
    mouse.start.x = e.pageX;
    mouse.start.y = e.pageY;
    socket.emit('drawArrow');
  }
};

// function to track arrow draw power
const mouseMoveHandler =(e) => {
  if(mouse.down) {
    mouse.end.x = e.pageX;
    mouse.end.y = e.pageY;
  }
};

// function to fire a drawn arrow
const mouseUpHandler =(e) => {
  console.log("mouseUp");
  mouse.down = false;
  if(arrow1.state === arrowState.DRAWN) {
    arrow1.state = arrowState.FIRED;
    socket.emit('fireArrow', mouse);
  }
};

// initialize scripts
const init = () => { 

  socket = io.connect();
  canvas = document.querySelector('#myCanvas');
  ctx = canvas.getContext('2d');
  
  playerSegs.y1 = canvas.height - 30,
  playerSegs.y2 = canvas.height - 60,
  playerSegs.y3 = canvas.height - 90,

  socket.on('connect', () => {
    socket.emit('join', { width: canvas.width, height: canvas.height})
  });

  socket.on('joined', setArrow); // set arrow on server 'joined' event
  socket.on('updateArrows', updateArrows); // update on server 'updateClient' event
  socket.on('left', removeArrow); // remove arrow on server 'removeArrow event
  
  document.body.addEventListener('mousedown', mouseDownHandler);
  document.body.addEventListener('mousemove', mouseMoveHandler);
  document.body.addEventListener('mouseup', mouseUpHandler);
  
};

window.onload = init;