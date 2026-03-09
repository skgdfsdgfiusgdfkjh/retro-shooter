// ============================================================
// hud.js — In-game HUD
// ============================================================

const HUD = {
    draw(ctx, player, score, levelName, waveIndex, waveTotal) {
        ctx.save();

        // ---- Health Bar (top-left) ----
        const hbx = 16, hby = 16, hbw = 200, hbh = 18;
        ctx.fillStyle = COLORS.HUD_BG;
        ctx.fillRect(hbx - 2, hby - 2, hbw + 4, hbh + 4);
        ctx.fillStyle = COLORS.HUD_HEALTH_BG;
        ctx.fillRect(hbx, hby, hbw, hbh);
        ctx.fillStyle = COLORS.HUD_HEALTH;
        ctx.fillRect(hbx, hby, hbw * (player.hp / player.maxHp), hbh);
        // Border
        ctx.strokeStyle = '#880000';
        ctx.lineWidth   = 2;
        ctx.strokeRect(hbx, hby, hbw, hbh);

        // HP text
        ctx.fillStyle = '#ffffff';
        ctx.font      = HUD_FONT_SMALL;
        ctx.textAlign = 'left';
        ctx.fillText(`HP  ${player.hp}`, hbx + 4, hby + hbh - 4);

        // ---- Ammo (bottom-left) ----
        const ax = 16, ay = CANVAS_HEIGHT - 16;
        ctx.textAlign = 'left';
        ctx.font      = HUD_FONT_MED;
        if (player.reloading) {
            const pct = 1 - (player.reloadTimer / PLAYER_RELOAD_TIME);
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('RELOADING', ax, ay);
            // Reload bar
            const rw = 160;
            ctx.fillStyle = '#333';
            ctx.fillRect(ax, ay + 6, rw, 6);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(ax, ay + 6, rw * pct, 6);
        } else {
            ctx.fillStyle = player.ammo > 5 ? COLORS.HUD_AMMO : '#ff4444';
            ctx.fillText(`${player.ammo} / ${player.magSize}`, ax, ay);
        }

        // Ammo label
        ctx.font      = HUD_FONT_SMALL;
        ctx.fillStyle = '#888888';
        ctx.fillText('AMMO', ax, ay - 18);

        // ---- Score (top-right) ----
        ctx.textAlign = 'right';
        ctx.font      = HUD_FONT_MED;
        ctx.fillStyle = COLORS.HUD_TEXT;
        ctx.fillText(`SCORE  ${score.get()}`, CANVAS_WIDTH - 16, 32);
        ctx.font      = HUD_FONT_SMALL;
        ctx.fillStyle = '#888888';
        ctx.fillText(`BEST  ${score.getHigh()}`, CANVAS_WIDTH - 16, 50);

        // ---- Level + Wave (top-center) ----
        ctx.textAlign = 'center';
        ctx.font      = HUD_FONT_SMALL;
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(levelName, CANVAS_WIDTH / 2, 24);
        ctx.fillStyle = COLORS.HUD_TEXT;
        ctx.fillText(`WAVE  ${waveIndex} / ${waveTotal}`, CANVAS_WIDTH / 2, 42);

        ctx.restore();
    },
};
