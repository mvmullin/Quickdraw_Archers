'use strict';

var arrow1 = void 0; // this client's arrow
var arrow2 = void 0; // player 2's arrow
var socket = void 0; // arrow's socket

var mouse = {
  down: false,
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 }
};

var mouseStartX = 0;
var mouseStartY = 0;
var mouseEndX = 0;
var mouseEndY = 0;

var canvas = void 0;
var ctx = void 0;

//redraw canvas
var draw = function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear screen

  drawArrow(arrow1, '#4dc3ff', false);
  drawArrow(arrow2, '#ff4d4d', true);
  requestAnimationFrame(draw); // continue to draw updates
};

// linear interpolation to jump percentages to new position
var lerp = function lerp(v0, v1, alpha) {
  return (1 - alpha) * v0 + alpha * v1;
};

// function to update position of initial arrow draw
var mouseDownHandler = function mouseDownHandler(e) {
  mouse.down = true;
  if (arrow1.state === arrowState.READY) arrow1.state = arrowState.DRAWN;
  mouse.start.x = e.pageX;
  mouse.start.y = e.pageY;
};

// function to track arrow draw power
var mouseMoveHandler = function mouseMoveHandler(e) {
  if (mouse.down) {
    mouse.end.x = e.pageX;
    mouse.end.y = e.pageY;
  }
};

// function to fire a drawn arrow
var mouseUpHandler = function mouseUpHandler(e) {
  mouse.down = false;
  if (arrow1.state === arrowState.DRAWN) {
    arrow1.state = arrowState.FIRED;
    socket.emit('fireArrow', mouse);
  }
};

// initialize scripts
var init = function init() {

  socket = io.connect();
  canvas = document.querySelector('#myCanvas');
  ctx = canvas.getContext('2d');

  socket.on('connect', function () {
    socket.emit('join', { width: canvas.width, height: canvas.height });
  });

  socket.on('joined', setArrow); // set arrow on server 'joined' event
  socket.on('updateArrows', updateArrows); // update on server 'updateClient' event
  socket.on('left', removeArrow); // remove arrow on server 'removeArrow event

  document.body.addEventListener('mouseDown', mouseDownHandler);
  document.body.addEventListener('mouseMove', mouseMoveHandler);
  document.body.addEventListener('mouseUp', mouseUpHandler);
};

window.onload = init;
"use strict";

var arrowState = {
  READY: 1,
  DRAWN: 2,
  FIRED: 3
};

var drawArrow = function drawArrow(arrow, color, player2) {
  // keep animation running smoothly
  if (arrow.alpha < 1) arrow.alpha += 0.05;

  // set draw color to unique arrow color
  ctx.fillStyle = color;

  arrow.x = arrow.state != arrowState.FIRED ? arrow.destX : lerp(arrow.prevX, arrow.destX, arrow.alpha); // smooth transition with lerp
  arrow.y = arrow.state != arrowState.FIRED ? arrow.destY : lerp(arrow.prevY, arrow.destY, arrow.alpha);

  var path = new Path2D();
  path.moveTo(arrow.x, arrow.y);
  path.lineTo(arrow.x - 10, arrow.y - 1);
  path.lineTo(arrow.x - 10, arrow.y + 1);
  ctx.fill(path);
};

var lastUpdate = 0;
// update a arrow from server
var updateArrows = function updateArrows(data) {
  if (data.lastUpdate > lastUpdate) {
    var curX = arrow1.x;
    var curY = arrow1.y;

    arrow1 = data.arrows[arrow1.id];
    arrow1.x = curX;
    arrow1.y = curY;

    // reset lerp percentage
    arrow.alpha = 0.05;
  }
};

// remove arrow based on id
var setArrow = function setArrow(data) {
  arrow1 = data;
  arrow1.id = data.id;
};
