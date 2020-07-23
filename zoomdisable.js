document.addEventListener(
    "touchmove",
    function(event) {
        if (event.scale !== 1) {
            event.preventDefault();
        }
    },
    false
);

document.addEventListener(
    "touchstart",
    event => {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    },
    { passive: false, capture: true }
);
