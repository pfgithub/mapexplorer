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

  ctx.restore();
  ctx.save();
  ctx.scale(PIXELRATIO, PIXELRATIO);

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  let fastMode = false;
  let gridMode = 1;
  let skipDraw = false;
  // if (characterWidth < 10) fastMode = true;

  let farScaleFactor = 1;

  let xst = 0;
  let yst = 0;

  let cx = 0;
  let cy = 0;

  let expectedRenderCount = 0;

  let updateXYST = () => {
    xst = Math.floor(drawOffsetX / (characterWidth * farScaleFactor));
    yst = Math.floor(drawOffsetY / (characterHeight * farScaleFactor));

    cx = Math.ceil(WIDTH / (characterWidth * farScaleFactor)) + xst;
    cy = Math.ceil(HEIGHT / (characterHeight * farScaleFactor)) + yst;

    expectedRenderCount = (xst - cx) * (yst - cy);
  };

  updateXYST();
  while (expectedRenderCount > 40000) {
    farScaleFactor *= 10;
    gridMode++;
    updateXYST();
  }
  if (expectedRenderCount > 5000) {
    fastMode = true;
  }
  if (expectedRenderCount > 1000) {
    gridMode = 1;
  }

  ctx.textBaseline = "top";
  ctx.font = characterWidth * farScaleFactor + "px monospace";

  for (let y = yst; y <= cy; y++) {
    for (let x = xst; x <= cx; x++) {
      let tile = generateWorldTileAt(x * farScaleFactor, y * farScaleFactor);
      let special = window.tileColors[window.inverseTiles[tile]];
      ctx.fillStyle = special || "black";

      let xUL = x * (characterWidth * farScaleFactor) - drawOffsetX;
      let yUL = y * (characterHeight * farScaleFactor) - drawOffsetY;
      if (
        (x === Math.floor(gmxCoord / farScaleFactor) &&
          y === Math.floor(gmyCoord / farScaleFactor)) ||
        special
      ) {
        // console.log(xUL, yUL);
        if (x === gmxCoord && y === gmyCoord) {
          ctx.fillStyle = "black";
        }
        ctx.fillRect(
          xUL,
          yUL,
          characterWidth * farScaleFactor,
          characterHeight * farScaleFactor
        );
        ctx.fillStyle = "white";
      }
      if (fastMode) {
        ctx.fillRect(
          xUL,
          yUL,
          (characterWidth * farScaleFactor) / 3,
          (characterHeight * farScaleFactor) / 3
        );
      } else {
        ctx.fillText(tile, xUL, yUL);
        if (gridMode > 1) {
          ctx.beginPath();
          ctx.rect(
            xUL,
            yUL,
            characterWidth * farScaleFactor,
            characterHeight * farScaleFactor
          );
          ctx.stroke();
        }
      }
    }
  }

  ctx.font = "12pt sans-serif";
  ctx.textBaseline = "top";
  let targetTile = generateWorldTileAt(gmxCoord, gmyCoord);
  let text = `Coords: ${gmxCoord}x/${-gmyCoord}y. Selected Tile: ${
    window.inverseTiles[targetTile]
  }`;
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

function scale(userFactor, centerX, centerY) {
  let factor = userFactor * (characterWidth ** 1.1 / 12.589);

  let ow = characterWidth;
  let oh = characterHeight;
  characterWidth -= factor;
  characterHeight -= factor;
  if (characterWidth < 0.0005) {
    characterWidth = 0.0005;
    characterHeight = 0.0005;
  }

  drawOffsetX -=
    centerX * ow - drawOffsetX - (centerX * characterWidth - drawOffsetX);
  drawOffsetY -=
    centerY * oh - drawOffsetY - (centerY * characterHeight - drawOffsetY);

  rerender();
  console.log(characterHeight);
}

document.addEventListener("wheel", e => {
  let [centerX, centerY] = cursorPosToBoardCoordExact(e.clientX, e.clientY);

  let dy = e.deltaY;

  scale(dy, centerX, centerY);
});
