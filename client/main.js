let arrow1; // this client's arrow
let arrow2; // player 2's arrow
let socket; // arrow's socket

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
  
  drawArrow(arrow1, '#4dc3ff', false);
  drawArrow(arrow2, '#ff4d4d', true);
  requestAnimationFrame(draw); // continue to draw updates
};

// linear interpolation to jump percentages to new position
let lerp = (v0, v1, alpha) => {
  return (1 - alpha) * v0 + alpha * v1;
};

// function to update position of initial arrow draw
const mouseDownHandler = (e) => {
  mouse.down = true;
  if(arrow1.state === arrowState.READY) arrow1.state = arrowState.DRAWN;
  mouse.start.x = e.pageX;
  mouse.start.y = e.pageY;
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

  socket.on('connect', () => {
    socket.emit('join', { width: canvas.width, height: canvas.height})
  });

  socket.on('joined', setArrow); // set arrow on server 'joined' event
  socket.on('updateArrows', updateArrows); // update on server 'updateClient' event
  socket.on('left', removeArrow); // remove arrow on server 'removeArrow event
  
  document.body.addEventListener('mouseDown', mouseDownHandler);
  document.body.addEventListener('mouseMove', mouseMoveHandler);
  document.body.addEventListener('mouseUp', mouseUpHandler);
  
};

window.onload = init;