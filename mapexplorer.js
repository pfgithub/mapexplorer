let el = el => document.createElement(el);
let ctn = txt => document.createTextNode(txt);

let board = el("canvas");
board.classList.add("explorerboard");
let ctx = board.getContext("2d");
ctx.save();

let WIDTH = 0;
let HEIGHT = 0;
let PIXELRATIO = 1;

let characterWidth = 30;
let characterHeight = 30;
let drawOffsetX = -150;
let drawOffsetY = -150;

let gmxCoord = 0;
let gmyCoord = 0;

let rerenderTriggered = false;
function rerender() {
  if (rerenderTriggered) return;
  rerenderTriggered = true;
  window.requestAnimationFrame(rerenderNow);
}
function rerenderNow() {
  rerenderTriggered = false;
  let xst = Math.floor(drawOffsetX / characterWidth);
  let yst = Math.floor(drawOffsetY / characterHeight);

  let cx = Math.ceil(WIDTH / characterWidth) + xst;
  let cy = Math.ceil(HEIGHT / characterHeight) + yst;

  ctx.restore();
  ctx.save();
  ctx.scale(PIXELRATIO, PIXELRATIO);

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.textBaseline = "top";
  ctx.font = characterWidth + "px monospace";

  for (let y = yst; y <= cy; y++) {
    for (let x = xst; x <= cx; x++) {
      ctx.fillStyle = "black"; // replace this with the real color
      let xUL = x * characterWidth - drawOffsetX;
      let yUL = y * characterHeight - drawOffsetY;
      if (x === gmxCoord && y === gmyCoord) {
        // console.log(xUL, yUL);
        ctx.fillRect(xUL, yUL, characterWidth, characterHeight);
        ctx.fillStyle = "white";
      }
      ctx.fillText(generateWorldTileAt(x, y), xUL, yUL);
    }
  }
  ctx.font = "12pt sans-serif";
  ctx.textBaseline = "top";
  let targetTile = generateWorldTileAt(gmxCoord, gmyCoord);
  let text = `Coords: ${gmxCoord}x/${gmyCoord}y. Selected Tile: ${window.inverseTiles[targetTile]}`;
  let textSize = ctx.measureText(text);
  let textHeight = ctx.measureText("@").width; // approx. see https://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
  ctx.fillStyle = "white";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  ctx.fillRect(10, 10, textSize.width + 20, textHeight + 20);
  ctx.shadowColor = "";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "black";
  ctx.fillText(text, 20, 20);
}

function updateBoardSize() {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
  PIXELRATIO = 2 || window.devicePixelRatio || 1;
  board.width = WIDTH * PIXELRATIO;
  board.height = HEIGHT * PIXELRATIO;
  rerender();
}

updateBoardSize();

window.addEventListener("resize", () => {
  console.log("resize");
  updateBoardSize();
});
document.body.appendChild(board);

let pointers = {};
let touchPointers = [];
let scalev = undefined;

function cursorPosToBoardCoordExact(x, y) {
  let mouseXCoord = (x + drawOffsetX) / characterWidth;
  let mouseYCoord = (y + drawOffsetY) / characterHeight;
  return [mouseXCoord, mouseYCoord];
}

function cursorPosToBoardCoord(x, y) {
  let [mouseXCoord, mouseYCoord] = cursorPosToBoardCoordExact(x, y);
  return [Math.floor(mouseXCoord), Math.floor(mouseYCoord)];
}

document.addEventListener("pointerdown", e => {
  pointers[e.pointerId] = {
    mousedown: true,
    pinx: e.clientX,
    piny: e.clientY,
    event: e,
    id: e.pointerId
  };
  if (e.pointerType === "touch") {
    scalev = undefined;
    touchPointers.push(pointers[e.pointerId]);
  }
});

document.addEventListener("pointermove", e => {
  let pt = pointers[e.pointerId];
  if (pt && pt.mousedown) {
    pt.didMove = true;
    if (touchPointers.length === 2) {
      pt.pinx = e.clientX;
      pt.piny = e.clientY;
      let [p1, p2] = touchPointers;
      let d = Math.sqrt((p2.pinx - p1.pinx) ** 2 + (p2.piny - p1.piny) ** 2);
      if (!scalev) scalev = d;
      let offset = d - scalev;
      scalev = d;
      let factor = -(offset / 10);
      let [cx, cy] = [
        (p1.pinx - p2.pinx) / 2 + p2.pinx,
        (p1.piny - p2.piny) / 2 + p2.piny
      ];
      let [centerX, centerY] = cursorPosToBoardCoordExact(cx, cy);
      scale(factor, centerX, centerY);
      // alert(factor);
    } else {
      drawOffsetX += pt.pinx - e.clientX;
      pt.pinx = e.clientX;
      drawOffsetY += pt.piny - e.clientY;
      pt.piny = e.clientY;
    }

    rerender();
  }
});

document.addEventListener("pointerup", e => {
  let pt = pointers[e.pointerId];
  if (pt) pt.mousedown = false;
  delete pointers[e.pointerId];
  touchPointers = touchPointers.filter(tp => tp.id !== e.pointerId);

  if (pt && !pt.didMove) {
    [gmxCoord, gmyCoord] = cursorPosToBoardCoord(e.clientX, e.clientY);
    rerender();
  }
});

function scale(factor, centerX, centerY) {
  let ow = characterWidth;
  let oh = characterHeight;
  characterWidth -= factor;
  characterHeight -= factor;
  if (characterWidth < 10) {
    characterWidth = 10;
    characterHeight = 10;
  }

  drawOffsetX -=
    centerX * ow - drawOffsetX - (centerX * characterWidth - drawOffsetX);
  drawOffsetY -=
    centerY * oh - drawOffsetY - (centerY * characterHeight - drawOffsetY);

  rerender();
}

document.addEventListener("wheel", e => {
  let [centerX, centerY] = cursorPosToBoardCoordExact(e.clientX, e.clientY);

  let dy = e.deltaY;

  scale(dy, centerX, centerY);
});
