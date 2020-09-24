{
window.tiles = {
    traveler: "&",
    sand: "\u00a0",
    grass: ",",
    tree: "t",
    water: "w",
    swamp: "~",
    mountain: "M",
    forest: "T",
    house: "H",
    city: "C",
    startbox: "u",
    monument: " ",
    island: ".",
    worldedge: "\u2591"
};

window.tileColors = {
    house: "crimson",
    city: "darkslategray",
    monument: "blueviolet",
    worldedge: "midnightblue",
    water: "aquamarine",
    forest: "#078C1C",
    island: "orange"
};

window.inverseTiles = {};
for (let [key, value] of Object.entries(window.tiles)) {
    window.inverseTiles[value] = key;
}

const WORLD = __WG_WORLD;
WORLD.setInvalids();
WORLD.TILES = tiles;

function generateWorldTileAt(x, y) {
    return WORLD.deriveTile(x, -y);
}
window.generateWorldTileAt = generateWorldTileAt;
}
