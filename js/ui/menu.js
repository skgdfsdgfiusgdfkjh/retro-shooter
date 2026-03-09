// ============================================================
// menu.js — Main menu renderer
// ============================================================

const MainMenu = (() => {
    let titlePulse = 0;

    const buttons = [
        { label: 'PLAY',     id: 'play'     },
        { label: 'CONTROLS', id: 'controls' },
    ];

    let showControls = false;

    function update(dt) {
        titlePulse += dt * 2;
    }

    function draw(ctx, mouseX, mouseY) {
        // Background
        ctx.fillStyle = COLORS.BG;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Grid
        drawBackground(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Scanlines
        drawScanlines(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (showControls) {
            _drawControls(ctx);
        } else {
            _drawMain(ctx, mouseX, mouseY);
        }

        drawCursor(ctx, mouseX, mouseY);
    }

    function _drawMain(ctx, mouseX, mouseY) {
        const cx = CANVAS_WIDTH / 2;

        // Glow title
        const glow = 6 + Math.sin(titlePulse) * 4;
        ctx.save();
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur  = glow;
        ctx.fillStyle   = '#00ff88';
        ctx.font        = '32px ' + HUD_FONT;
        ctx.textAlign   = 'center';
        ctx.fillText('RETRO', cx, 160);
        ctx.fillText('SHOOTER', cx, 210);
        ctx.restore();

        // Subtitle
        ctx.fillStyle   = '#445544';
        ctx.font        = HUD_FONT_SMALL;
        ctx.textAlign   = 'center';
        ctx.fillText('TOP-DOWN ARCADE', cx, 250);

        // Score display
        ctx.fillStyle = '#888888';
        ctx.font      = HUD_FONT_SMALL;
        ctx.fillText(`HIGH SCORE  ${ScoreSystem.getHigh()}`, cx, 285);

        // Buttons
        buttons.forEach((btn, i) => {
            const bw = 200, bh = 44;
            const bx = cx - bw / 2;
            const by = 330 + i * 70;

            const hovered = mouseX >= bx && mouseX <= bx + bw &&
                            mouseY >= by && mouseY <= by + bh;

            ctx.fillStyle   = hovered ? '#00ff88' : '#001a00';
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth   = 2;
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeRect(bx, by, bw, bh);

            ctx.fillStyle = hovered ? '#000000' : '#00ff88';
            ctx.font      = HUD_FONT_MED;
            ctx.textAlign = 'center';
            ctx.fillText(btn.label, cx, by + 29);
        });

        // Blinking prompt
        if (Math.sin(titlePulse * 1.5) > 0) {
            ctx.fillStyle = '#446644';
            ctx.font      = HUD_FONT_SMALL;
            ctx.fillText('CLICK TO START', cx, CANVAS_HEIGHT - 40);
        }
    }

    function _drawControls(ctx) {
        const cx = CANVAS_WIDTH / 2;
        ctx.fillStyle = '#00ff88';
        ctx.font      = HUD_FONT_MED;
        ctx.textAlign = 'center';
        ctx.fillText('CONTROLS', cx, 80);

        const lines = [
            ['WASD / ARROWS', 'Move'],
            ['MOUSE',         'Aim'],
            ['LEFT CLICK',    'Shoot'],
            ['R',             'Reload'],
            ['ESC',           'Menu'],
        ];

        ctx.font      = HUD_FONT_SMALL;
        ctx.textAlign = 'left';
        lines.forEach(([key, desc], i) => {
            const y = 140 + i * 50;
            ctx.fillStyle = '#00ffff';
            ctx.fillText(key, cx - 180, y);
            ctx.fillStyle = '#888888';
            ctx.fillText(desc, cx + 20, y);
        });

        // Back button
        const bw = 160, bh = 40, bx = cx - 80, by = CANVAS_HEIGHT - 100;
        const hovered = false; // simplified; click anywhere goes back
        ctx.fillStyle   = '#001a00';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth   = 2;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = '#00ff88';
        ctx.font      = HUD_FONT_SMALL;
        ctx.textAlign = 'center';
        ctx.fillText('BACK', cx, by + 27);
    }

    function handleClick(mx, my) {
        if (showControls) {
            showControls = false;
            return null;
        }
        const cx = CANVAS_WIDTH / 2;
        buttons.forEach(btn => {
            const bw = 200, bh = 44;
            const bx = cx - bw / 2;
            if (btn.id === 'play')     { const by = 330; if (mx>=bx&&mx<=bx+bw&&my>=by&&my<=by+bh) { _action = 'play'; } }
            if (btn.id === 'controls') { const by = 400; if (mx>=bx&&mx<=bx+bw&&my>=by&&my<=by+bh) { showControls = true; } }
        });
    }

    let _action = null;

    function pollAction() {
        const a = _action;
        _action  = null;
        return a;
    }

    return { update, draw, handleClick, pollAction };
})();
