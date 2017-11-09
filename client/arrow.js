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
  console.log(arrow.x);
  
  let path = new Path2D();
  if(player2) {
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

let lastUpdate = 0;
// update a arrow from server
const updateArrows = (data) => {
  if(data.lastUpdate > lastUpdate) {
    let arrowKeys = Object.keys(data.arrows);
    
    for(let i = 0; i < arrowKeys.length; i++) {
      if(data.arrows[arrowKeys[i]].id == arrow1.id) {
        let curX = arrow1.x;
        let curY = arrow1.y;

        arrow1 = data.arrows[arrow1.id];
        arrow1.x = curX;
        arrow1.y = curY;

        // reset lerp percentage
        arrow1.alpha = 0.05;
      } else { // player 2 arrow since only 2 arrows exist
        if(!arrow2) arrow2 = data.arrows[arrowKeys[i]];
        else {
          let curX = arrow2.x;
          let curY = arrow2.y;

          arrow2 = data.arrows[arrow2.id];
          arrow2.x = curX;
          arrow2.y = curY;

          // reset lerp percentage
          arrow2.alpha = 0.05;
        }
      }
    }
    let curX = arrow1.x;
    let curY = arrow1.y;
    
    arrow1 = data.arrows[arrow1.id];
    arrow1.x = curX;
    arrow1.y = curY;
    
    // reset lerp percentage
    arrow1.alpha = 0.05;
    
    lastUpdate = data.lastUpdate;
  }
};

// set arrow based on id
const setArrow = (data) => {
  arrow1 = data;
  requestAnimationFrame(draw);
};

const removeArrow = () => {
  arrow2 = null;
};