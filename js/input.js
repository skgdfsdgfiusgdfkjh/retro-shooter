// ============================================================
// input.js — Keyboard + mouse singleton
// ============================================================

const Input = (() => {
    const keys   = {};
    const mouse  = { x: 0, y: 0, down: false, clicked: false, rightClicked: false };

    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        // Prevent default scroll for arrow keys / space
        if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', e => {
        keys[e.code] = false;
    });

    window.addEventListener('mousemove', e => {
        const canvas = document.getElementById('gameCanvas');
        const rect   = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mousedown', e => {
        if (e.button === 0) {
            mouse.down    = true;
            mouse.clicked = true;
        }
        if (e.button === 2) {
            mouse.rightClicked = true;
        }
    });

    window.addEventListener('mouseup', e => {
        if (e.button === 0) mouse.down = false;
    });

    window.addEventListener('contextmenu', e => e.preventDefault());

    return {
        keys,
        mouse,
        /** Call once per frame after processing to clear single-frame flags */
        flush() {
            mouse.clicked      = false;
            mouse.rightClicked = false;
        },
        isDown(code)    { return !!keys[code]; },
        isPressed(code) { return !!keys[code]; },
    };
})();
