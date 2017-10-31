const arrowState = {
  READY: 1,
  DRAWN: 2,
  FIRED: 3,
};

const drawArrow = (arrow, color, player2) => {
  // keep animation running smoothly
  if(arrow.alpha < 1) arrow.alpha += 0.05;

  // set draw color to unique arrow color
  ctx.fillStyle = color;

  arrow.x = arrow.state != arrowState.FIRED ? arrow.destX : lerp(arrow.prevX, arrow.destX, arrow.alpha); // smooth transition with lerp
  arrow.y = arrow.state != arrowState.FIRED ? arrow.destY : lerp(arrow.prevY, arrow.destY, arrow.alpha);
  
  let path = new Path2D();
  path.moveTo(arrow.x, arrow.y);
  path.lineTo(arrow.x - 10, arrow.y - 1);
  path.lineTo(arrow.x - 10, arrow.y + 1);
  ctx.fill(path);
};

let lastUpdate = 0;
// update a arrow from server
const updateArrows = (data) => {
  if(data.lastUpdate > lastUpdate) {
    let curX = arrow1.x;
    let curY = arrow1.y;
    
    arrow1 = data.arrows[arrow1.id];
    arrow1.x = curX;
    arrow1.y = curY;
    
    // reset lerp percentage
    arrow.alpha = 0.05;
  }
};

// remove arrow based on id
const setArrow = (data) => {
  arrow1 = data;
  arrow1.id = data.id;
};