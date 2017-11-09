'use strict';

var arrow1 = void 0; // this client's arrow
var arrow2 = void 0; // player 2's arrow
var socket = void 0; // arrow's socket
var arrowWidth = 15;
var arrowHeight = 3;

var playerWidth = 30;

var playerSegs = {};

var healthWidth = 100;
var healthHeight = 10;
var healthPos = 30;

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

  if (arrow1.targHealth <= 0) {
    ctx.font = '100px Comic Sans MS';
    ctx.fillStyle = '#4dc3ff';
    ctx.textAlign = 'center';
    ctx.fillText('WIN', canvas.width / 2, canvas.height / 2);
  } else if (arrow2 && arrow2.targHealth <= 0) {
    ctx.font = '100px Comic Sans MS';
    ctx.fillStyle = '#ff4d4d';
    ctx.textAlign = 'center';
    ctx.fillText('LOSE', canvas.width / 2, canvas.height / 2);
  } else {
    drawArrow(arrow1, '#4dc3ff', false);
    if (arrow2) drawArrow(arrow2, '#ff4d4d', true);
    if (arrow2) drawUI();
    requestAnimationFrame(draw); // continue to draw updates
  }
};

// draw UI
var drawUI = function drawUI() {
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

  var ySegs = Object.keys(playerSegs);

  for (var i = 0; i < ySegs.length; i++) {
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
var lerp = function lerp(v0, v1, alpha) {
  return (1 - alpha) * v0 + alpha * v1;
};

// function to update position of initial arrow draw
var mouseDownHandler = function mouseDownHandler(e) {
  console.log("mouseDown");
  mouse.down = true;
  if (arrow1.state === arrowState.READY && arrow2) {
    arrow1.state = arrowState.DRAWN;
    mouse.start.x = e.pageX;
    mouse.start.y = e.pageY;
    socket.emit('drawArrow');
  }
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
  console.log("mouseUp");
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

  playerSegs.y1 = canvas.height - 30, playerSegs.y2 = canvas.height - 60, playerSegs.y3 = canvas.height - 90, socket.on('connect', function () {
    socket.emit('join', { width: canvas.width, height: canvas.height });
  });

  socket.on('joined', setArrow); // set arrow on server 'joined' event
  socket.on('updateArrows', updateArrows); // update on server 'updateClient' event
  socket.on('left', removeArrow); // remove arrow on server 'removeArrow event

  document.body.addEventListener('mousedown', mouseDownHandler);
  document.body.addEventListener('mousemove', mouseMoveHandler);
  document.body.addEventListener('mouseup', mouseUpHandler);
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
  console.log(arrow.x);

  var path = new Path2D();
  if (player2) {
    arrow.x = canvas.width - arrow.x;
    path.moveTo(arrow.x, arrow.y);
    path.lineTo(arrow.x + arrowWidth, arrow.y - arrowHeight);
    path.lineTo(arrow.x + arrowWidth, arrow.y + arrowHeight);
  } else {
    path.moveTo(arrow.x, arrow.y);
    path.lineTo(arrow.x - arrowWidth, arrow.y - arrowHeight);
    path.lineTo(arrow.x - arrowWidth, arrow.y + arrowHeight);
  }
  ctx.fill(path);
};

var lastUpdate = 0;
// update a arrow from server
var updateArrows = function updateArrows(data) {
  if (data.lastUpdate > lastUpdate) {
    var arrowKeys = Object.keys(data.arrows);

    for (var i = 0; i < arrowKeys.length; i++) {
      if (data.arrows[arrowKeys[i]].id == arrow1.id) {
        var _curX = arrow1.x;
        var _curY = arrow1.y;

        arrow1 = data.arrows[arrow1.id];
        arrow1.x = _curX;
        arrow1.y = _curY;

        // reset lerp percentage
        arrow1.alpha = 0.05;
      } else {
        // player 2 arrow since only 2 arrows exist
        if (!arrow2) arrow2 = data.arrows[arrowKeys[i]];else {
          var _curX2 = arrow2.x;
          var _curY2 = arrow2.y;

          arrow2 = data.arrows[arrow2.id];
          arrow2.x = _curX2;
          arrow2.y = _curY2;

          // reset lerp percentage
          arrow2.alpha = 0.05;
        }
      }
    }
    var curX = arrow1.x;
    var curY = arrow1.y;

    arrow1 = data.arrows[arrow1.id];
    arrow1.x = curX;
    arrow1.y = curY;

    // reset lerp percentage
    arrow1.alpha = 0.05;

    lastUpdate = data.lastUpdate;
  }
};

// set arrow based on id
var setArrow = function setArrow(data) {
  arrow1 = data;
  requestAnimationFrame(draw);
};

var removeArrow = function removeArrow() {
  arrow2 = null;
};
