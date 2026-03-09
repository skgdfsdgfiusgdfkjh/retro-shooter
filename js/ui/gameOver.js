// ============================================================
// gameOver.js — Game over + victory screen
// ============================================================

const GameOverScreen = (() => {
    let timer     = 0;
    let scoreVal  = 0;
    let highVal   = 0;
    let newRecord = false;
    let victory   = false;

    function enter(score, high, isNewRecord, isVictory) {
        scoreVal  = score;
        highVal   = high;
        newRecord = isNewRecord;
        victory   = isVictory;
        timer     = 0;
    }

    function update(dt) {
        timer += dt;
    }

    function draw(ctx, mouseX, mouseY) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const cx = CANVAS_WIDTH / 2;

        if (victory) {
            ctx.save();
            ctx.shadowColor = '#ffdd00';
            ctx.shadowBlur  = 16;
            ctx.fillStyle   = '#ffdd00';
            ctx.font        = '28px ' + HUD_FONT;
            ctx.textAlign   = 'center';
            ctx.fillText('VICTORY!', cx, 160);
            ctx.restore();

            ctx.fillStyle = '#00ff88';
            ctx.font      = HUD_FONT_SMALL;
            ctx.textAlign = 'center';
            ctx.fillText('YOU BEAT ALL 5 LEVELS', cx, 210);
        } else {
            ctx.save();
            ctx.shadowColor = '#ff2222';
            ctx.shadowBlur  = 16;
            ctx.fillStyle   = '#ff2222';
            ctx.font        = '28px ' + HUD_FONT;
            ctx.textAlign   = 'center';
            ctx.fillText('GAME OVER', cx, 160);
            ctx.restore();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font      = HUD_FONT_MED;
        ctx.textAlign = 'center';
        ctx.fillText(`SCORE  ${scoreVal}`, cx, 260);

        ctx.fillStyle = '#888888';
        ctx.font      = HUD_FONT_SMALL;
        ctx.fillText(`BEST  ${highVal}`, cx, 295);

        if (newRecord) {
            ctx.save();
            ctx.fillStyle  = '#ffdd00';
            ctx.font       = HUD_FONT_MED;
            ctx.shadowColor = '#ffdd00';
            ctx.shadowBlur  = 10;
            ctx.fillText('NEW HIGH SCORE!', cx, 340);
            ctx.restore();
        }

        // Main menu button
        const bw = 240, bh = 44, bx = cx - 120, by = 390;
        const hovered = mouseX >= bx && mouseX <= bx + bw &&
                        mouseY >= by && mouseY <= by + bh;

        ctx.fillStyle   = hovered ? (victory ? '#ffdd00' : '#ff2222') : '#1a0000';
        ctx.strokeStyle = victory ? '#ffdd00' : '#ff2222';
        ctx.lineWidth   = 2;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = hovered ? '#000000' : (victory ? '#ffdd00' : '#ff2222');
        ctx.font      = HUD_FONT_MED;
        ctx.textAlign = 'center';
        ctx.fillText('MAIN MENU', cx, by + 29);

        if (Math.sin(timer * 3) > 0) {
            ctx.fillStyle = '#664444';
            ctx.font      = HUD_FONT_SMALL;
            ctx.fillText('PRESS ENTER OR CLICK', cx, CANVAS_HEIGHT - 40);
        }

        drawCursor(ctx, mouseX, mouseY);
    }

    function shouldReturn(mouseClicked, enterPressed) {
        return (mouseClicked || enterPressed) && timer > 0.8;
    }

    return { enter, update, draw, shouldReturn };
})();
