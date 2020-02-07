let el = el => document.createElement(el);
let ctn = txt => document.createTextNode(txt);

let board = el("canvas");
board.classList.add("explorerboard");
let ctx = board.getContext("2d");

let WIDTH = 0;
let HEIGHT = 0;

let characterWidth = 30;
let characterHeight = 30;
let drawOffsetX = 25;
let drawOffsetY = 25;

let gmxCoord = 0;
let gmyCoord = 0;

function rerender() {
  let xst = Math.floor(drawOffsetX / characterWidth);
  let yst = Math.floor(drawOffsetY / characterHeight);

  let cx = Math.ceil(WIDTH / characterWidth) + xst;
  let cy = Math.ceil(HEIGHT / characterHeight) + yst;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

		ctx.textBaseline = "top";
	ctx.font = characterWidth+"px monospace";

  for (let y = yst; y <= cy; y++) {
    for (let x = xst; x <= cx; x++) {
	    ctx.fillStyle = "black"; // replace this with the real color
	    let xUL = x * characterWidth - drawOffsetX;
	    let yUL = y * characterHeight - drawOffsetY;
	    if(x === gmxCoord && y === gmyCoord){
		   // console.log(xUL, yUL);
ctx.fillRect(xUL, yUL, characterWidth, characterHeight);
		    ctx.fillStyle = "white";
	    }
      ctx.fillText(
        generateWorldTileAt(x, y),
        xUL,
        yUL,
      );
    }
  }
	ctx.fillText(`Coords: ${gmxCoord}/${gmyCoord}`, 10, 10);
}

function updateBoardSize() {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
  board.width = WIDTH;
  board.height = HEIGHT;
  rerender();
}

updateBoardSize();

window.addEventListener("resize", () => {
  console.log("resize");
  updateBoardSize();
});
document.body.appendChild(board);

let pinx = 0;
let piny = 0;
let mousedown = false;
document.addEventListener("mousedown", (e) => {
	mousedown = true;
	pinx = e.clientX;
	piny = e.clientY;
});

document.addEventListener("mousemove", (e) => {
	if(mousedown){
		drawOffsetX += pinx - e.clientX;
		pinx = e.clientX;
		drawOffsetY += piny - e.clientY;
		piny = e.clientY;
		rerender();
	}

	let mouseXCoord = Math.round((e.clientX + drawOffsetX) / characterWidth);
	let mouseYCoord = Math.round((e.clientY + drawOffsetY) / characterHeight);

		gmxCoord = mouseXCoord;
		gmyCoord = mouseYCoord;
		rerender();
});

document.addEventListener("mouseup", e => {
	mousedown = false;

});
document.addEventListener("wheel", e => {
	let dy = e.deltaY;
	let ow = characterWidth;
	let oh = characterHeight;
	let mx = e.clientX;
	let my = e.clientY;
	characterWidth -= dy;
	characterHeight -= dy;
	if(characterWidth < 10){
	characterWidth = 10; characterHeight = 10;}


drawOffsetX -= (gmxCoord * ow - drawOffsetX) - (gmxCoord * characterWidth - drawOffsetX);
	drawOffsetY -= (gmyCoord * oh - drawOffsetY) - (gmyCoord * characterHeight - drawOffsetY);

	rerender();
});
