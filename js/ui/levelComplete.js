// ============================================================
// levelComplete.js — Level complete screen
// ============================================================

const LevelCompleteScreen = (() => {
    let timer    = 0;
    let levelName = '';
    let scoreVal  = 0;

    function enter(name, score) {
        levelName = name;
        scoreVal  = score;
        timer     = 0;
    }

    function update(dt) {
        timer += dt;
    }

    function draw(ctx, mouseX, mouseY) {
        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const cx = CANVAS_WIDTH / 2;

        ctx.save();
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur  = 12;
        ctx.fillStyle   = '#00ff88';
        ctx.font        = '24px ' + HUD_FONT;
        ctx.textAlign   = 'center';
        ctx.fillText('LEVEL COMPLETE!', cx, 180);
        ctx.restore();

        ctx.fillStyle = '#888888';
        ctx.font      = HUD_FONT_SMALL;
        ctx.textAlign = 'center';
        ctx.fillText(levelName, cx, 220);

        ctx.fillStyle = '#ffffff';
        ctx.font      = HUD_FONT_MED;
        ctx.fillText(`SCORE  ${scoreVal}`, cx, 280);

        // Continue button
        const bw = 240, bh = 44, bx = cx - 120, by = 360;
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
        ctx.fillText('NEXT LEVEL', cx, by + 29);

        // Prompt
        if (Math.sin(timer * 3) > 0) {
            ctx.fillStyle = '#446644';
            ctx.font      = HUD_FONT_SMALL;
            ctx.fillText('PRESS ENTER OR CLICK', cx, CANVAS_HEIGHT - 40);
        }

        drawCursor(ctx, mouseX, mouseY);
    }

    function shouldAdvance(mouseClicked, enterPressed) {
        return (mouseClicked || enterPressed) && timer > 0.5;
    }

    return { enter, update, draw, shouldAdvance };
})();
