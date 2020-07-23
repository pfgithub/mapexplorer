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

function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = document.createElement("img");
        img.src = src;
        img.onload = () => {
            console.log("Loaded " + src);
            resolve(img);
        };
        img.onerror = e => {
            console.log("Error loading " + src, e);
            reject(new Error("error loading " + src));
        };
    });
}

let minecraft = false;
let mcBak;
let mcColors = {
    "\u00a0": "#dbcfa3",
    ",": "#417243",
    t: "#747236",
    w: "#385290",
    "~": "#2f3f2a",
    M: "#7d7d7d",
    T: "#48452c",
    " ": "#0f0a18",
    ".": "#be6621",
    "\u2591": "#555555"
};
async function startMinecraft() {
    minecraft = undefined;

    if (mcBak) {
        minecraft = mcBak;
        rerender();
        return;
    }
    minecraft = {
        "\u00a0": await loadImage("images/sand.png"),
        ",": await loadImage("images/grass.png"),
        t: await loadImage("images/tree.png"),
        w: await loadImage("images/water.gif"),
        "~": await loadImage("images/swamp.png"),
        M: await loadImage("images/mountain.png"),
        T: await loadImage("images/forest.png"),
        " ": await loadImage("images/monument.png"),
        ".": await loadImage("images/island.png"),
        "\u2591": await loadImage("images/worldedge.png")
    };
    rerender();
}

function renderChar(tile, x, y, w, h, fastMode, selected, gridMode) {
    if (minecraft === undefined || (minecraft && minecraft[tile])) {
        if (!fastMode && minecraft !== undefined) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(minecraft[tile], x, y, w, h);
        } else {
            ctx.fillStyle = mcColors[tile];
            ctx.fillRect(x, y, w, h);
        }
        if (selected) {
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        }
        return;
    }
    let special = window.tileColors[window.inverseTiles[tile]];
    ctx.fillStyle = special || "black";
    if (selected || special) {
        if (selected) ctx.fillStyle = "black";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "white";
    }
    if (fastMode) {
        if (tile === "\u00a0") {
            w = 0;
            h = 0;
        } else if (tile === ",") {
            w *= 0.333;
            h *= 0.333;
        } else if (tile === "~") {
            w *= 0.7;
            h *= 0.2;
        } else {
            w *= 0.333;
            h *= 0.7;
        }
        ctx.fillRect(x, y, w, h);
    } else {
        ctx.fillText(tile, x, y);
    }
}

let rerenderTriggered = false;
function rerender() {
    if (rerenderTriggered) return;
    rerenderTriggered = true;
    window.requestAnimationFrame(rerenderNow);
    sethash();
}
let longDistanceRender = "false"; // tri-state boolean between false, true, and "false". you know, very resonable.
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
    let maxRenderCount = longDistanceRender === true ? 4000000 : 40000;
    while (expectedRenderCount > maxRenderCount) {
        farScaleFactor *= 10;
        gridMode++;
        updateXYST();
    }
    longDistanceRender = longDistanceRender === true ? "false" : false;
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
            let tile = generateWorldTileAt(
                x * farScaleFactor,
                y * farScaleFactor
            );

            let xUL = x * (characterWidth * farScaleFactor) - drawOffsetX;
            let yUL = y * (characterHeight * farScaleFactor) - drawOffsetY;

            renderChar(
                tile,
                Math.floor(xUL),
                Math.floor(yUL),
                Math.ceil(characterWidth * farScaleFactor),
                Math.ceil(characterHeight * farScaleFactor),
                fastMode,
                x === Math.floor(gmxCoord / farScaleFactor) &&
                    y === Math.floor(gmyCoord / farScaleFactor),
                gridMode
            );
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
            let d = Math.sqrt(
                (p2.pinx - p1.pinx) ** 2 + (p2.piny - p1.piny) ** 2
            );
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
    if (characterWidth > 1024) {
        characterWidth = 1024;
        characterHeight = 1024;
    }

    drawOffsetX -=
        centerX * ow - drawOffsetX - (centerX * characterWidth - drawOffsetX);
    drawOffsetY -=
        centerY * oh - drawOffsetY - (centerY * characterHeight - drawOffsetY);

    rerender();
}

document.addEventListener("wheel", e => {
    let [centerX, centerY] = cursorPosToBoardCoordExact(e.clientX, e.clientY);
    let whl = normalizeWheel(e);
    console.log(whl);
    let scrollDist = whl.pixelY * 0.02666;
    console.log(scrollDist);

    scale(scrollDist, centerX, centerY);
});

async function showLongDistanceRenderText() {
    //WIDTH, HEIGHT
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.font = "12pt sans-serif";
    ctx.textBaseline = "top";
    let targetTile = generateWorldTileAt(gmxCoord, gmyCoord);
    let text = `Rendering...`;
    let textSize = ctx.measureText(text);
    let textHeight = ctx.measureText("@").width; // approx. see https://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    let wX = textSize.width + 20;
    let wY = textHeight + 20;
    let rX = WIDTH / 2 - wX;
    let rY = HEIGHT / 2 - wY;
    ctx.fillRect(rX, rY, wX, wY);
    ctx.shadowColor = "";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "black";
    ctx.fillText(text, rX + 10, rY + 10);
    await new Promise(r => window.requestAnimationFrame(r));
}

window.onkeydown = async k => {
    if (k.code === "ArrowLeft") {
        gmxCoord -= 1;
    } else if (k.code === "ArrowRight") {
        gmxCoord += 1;
    } else if (k.code === "ArrowUp") {
        gmyCoord -= 1;
    } else if (k.code === "ArrowDown") {
        gmyCoord += 1;
    } else if (k.code === "KeyW") {
        drawOffsetY -= 100;
    } else if (k.code === "KeyS") {
        drawOffsetY += 100;
    } else if (k.code === "KeyA") {
        drawOffsetX -= 100;
    } else if (k.code === "KeyD") {
        drawOffsetX += 100;
    } else if (k.code === "KeyM") {
        if (minecraft === false) startmc();
        else endmc();
    } else if (k.code === "KeyK") {
        await showLongDistanceRenderText();
        longDistanceRender = !longDistanceRender;
    } else if (k.code === "KeyG") {
        const loc = prompt("x,y", gmxCoord + "," + -gmyCoord);
        const [xc, yc] = loc.split(",");
        if (!xc || !yc) return alert("expected x,y");
        if (isNaN(+xc) || isNaN(+yc)) return alert("expected x,y");
        gmxCoord = xc;
        gmyCoord = -yc;
    } else {
        return;
    }
    rerender();
};

let startmc = () => {
    if (minecraft !== false) return;
    startMinecraft().catch(e => alert("error: " + e.toString()));
};
let endmc = () => {
    if (minecraft === false) return;
    if (!mcBak) mcBak = minecraft;
    minecraft = false;
    rerender();
};

let mych = false;
let sethash = () => {};
let sethash2 = () => {
    let nv =
        location.href.replace(/#.+?$/, "") +
        "#," +
        [drawOffsetX, drawOffsetY, gmxCoord, gmyCoord, characterWidth].join(
            ","
        );
    if (nv !== location.href) {
        mych = true;
        location.replace(nv);
    }
};

setInterval(() => sethash2(), 200);

let dohash = () => {
    if (mych) {
        mych = false;
        return;
    }
    console.log("hash changed");
    if (!window.location.hash) return;
    let [, dox, doy, selx, sely, cw] = window.location.hash.split(",");
    drawOffsetX = +dox;
    drawOffsetY = +doy;
    gmxCoord = +selx;
    gmyCoord = +sely;
    characterWidth = +cw;
    characterHeight = +cw;
    rerender();
};

window.onhashchange = () => dohash();
dohash();
updateBoardSize();
endmc();
