// ============================================================
// hud.js — In-game HUD
// ============================================================

const HUD = {
    draw(ctx, player, score, levelName, waveIndex, waveTotal, boss = null) {
        ctx.save();

        // ---- Active powerup boost bars (bottom-right) ----
        const boosts = [
            { label: 'SPEED',  color: POWERUP_COLORS.speed,    boost: player.speedBoost,    dur: POWERUP_DURATION_SPEED    },
            { label: 'POWER',  color: POWERUP_COLORS.strength,  boost: player.strengthBoost, dur: POWERUP_DURATION_STRENGTH },
        ];
        let boostY = boss ? CANVAS_HEIGHT - 90 : CANVAS_HEIGHT - 16;
        for (const b of boosts) {
            if (!b.boost.active) continue;
            const bw  = 140, bh = 14;
            const bx  = CANVAS_WIDTH - 16 - bw;
            const pct = b.boost.timer / b.dur;

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(bx - 2, boostY - bh - 2, bw + 4, bh + 4);

            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur  = 6;
            ctx.fillRect(bx, boostY - bh, bw * pct, bh);
            ctx.shadowBlur = 0;

            ctx.strokeStyle = b.color;
            ctx.lineWidth   = 1;
            ctx.strokeRect(bx, boostY - bh, bw, bh);

            ctx.fillStyle = b.color;
            ctx.font      = HUD_FONT_SMALL;
            ctx.textAlign = 'right';
            ctx.fillText(b.label, bx - 6, boostY - 2);

            boostY -= bh + 10;
        }

        // ---- Health Bar (top-left) ----
        const hbx = 16, hby = 16, hbw = 200, hbh = 18;
        ctx.fillStyle = COLORS.HUD_BG;
        ctx.fillRect(hbx - 2, hby - 2, hbw + 4, hbh + 4);
        ctx.fillStyle = COLORS.HUD_HEALTH_BG;
        ctx.fillRect(hbx, hby, hbw, hbh);
        ctx.fillStyle = COLORS.HUD_HEALTH;
        ctx.fillRect(hbx, hby, hbw * (player.hp / player.maxHp), hbh);
        ctx.strokeStyle = '#880000';
        ctx.lineWidth   = 2;
        ctx.strokeRect(hbx, hby, hbw, hbh);

        ctx.fillStyle = '#ffffff';
        ctx.font      = HUD_FONT_SMALL;
        ctx.textAlign = 'left';
        ctx.fillText(`HP  ${player.hp}`, hbx + 4, hby + hbh - 4);

        // ---- Ammo (bottom-left) ----
        const ax = 16, ay = boss ? CANVAS_HEIGHT - 90 : CANVAS_HEIGHT - 16;
        ctx.textAlign = 'left';
        ctx.font      = HUD_FONT_MED;
        if (player.reloading) {
            const pct = 1 - (player.reloadTimer / PLAYER_RELOAD_TIME);
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('RELOADING', ax, ay);
            const rw = 160;
            ctx.fillStyle = '#333';
            ctx.fillRect(ax, ay + 6, rw, 6);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(ax, ay + 6, rw * pct, 6);
        } else {
            ctx.fillStyle = player.ammo > 5 ? COLORS.HUD_AMMO : '#ff4444';
            ctx.fillText(`${player.ammo} / ${player.magSize}`, ax, ay);
        }

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

        // ---- Level + Wave (top-center) — hidden during boss fight ----
        if (!boss) {
            ctx.textAlign = 'center';
            ctx.font      = HUD_FONT_SMALL;
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText(levelName, CANVAS_WIDTH / 2, 24);
            ctx.fillStyle = COLORS.HUD_TEXT;
            ctx.fillText(`WAVE  ${waveIndex} / ${waveTotal}`, CANVAS_WIDTH / 2, 42);
        }

        // ---- Boss Health Bar (bottom-center, large golden) ----
        if (boss && !boss.dead) {
            const bw  = 520, bh = 28;
            const bx  = (CANVAS_WIDTH - bw) / 2;
            const by  = CANVAS_HEIGHT - 54;
            const pct = boss.hp / boss.maxHp;

            // Panel background
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(bx - 8, by - 26, bw + 16, bh + 34);

            // Boss name label
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur  = 10;
            ctx.fillStyle   = '#ffcc00';
            ctx.font        = HUD_FONT_MED;
            ctx.textAlign   = 'center';
            ctx.fillText('\u2726 YUKI \u2726', CANVAS_WIDTH / 2, by - 8);

            ctx.shadowBlur = 0;

            // Dark gold track
            ctx.fillStyle = '#221100';
            ctx.fillRect(bx, by, bw, bh);

            // Gold gradient fill
            const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
            grad.addColorStop(0,   '#ffe066');
            grad.addColorStop(0.4, '#ffcc00');
            grad.addColorStop(1,   '#cc8800');
            ctx.fillStyle = grad;
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur  = 8;
            ctx.fillRect(bx, by, bw * pct, bh);
            ctx.shadowBlur = 0;

            // Phase dividers at 66% and 33%
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx + bw * 0.66, by);
            ctx.lineTo(bx + bw * 0.66, by + bh);
            ctx.moveTo(bx + bw * 0.33, by);
            ctx.lineTo(bx + bw * 0.33, by + bh);
            ctx.stroke();

            // Phase diamond markers
            const diamonds = [bx + bw * 0.66, bx + bw * 0.33];
            ctx.fillStyle = '#ffcc00';
            diamonds.forEach(dx => {
                ctx.beginPath();
                ctx.moveTo(dx,     by - 4);
                ctx.lineTo(dx + 4, by);
                ctx.lineTo(dx,     by + 4);
                ctx.lineTo(dx - 4, by);
                ctx.closePath();
                ctx.fill();
            });

            // Gold border
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur  = 12;
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth   = 2;
            ctx.strokeRect(bx, by, bw, bh);
            ctx.shadowBlur = 0;

            // HP numbers centered in bar
            ctx.fillStyle  = '#ffffff';
            ctx.font       = HUD_FONT_SMALL;
            ctx.textAlign  = 'center';
            ctx.fillText(`${boss.hp} / ${boss.maxHp}`, CANVAS_WIDTH / 2, by + bh - 7);
        }

        ctx.restore();
    },
};
