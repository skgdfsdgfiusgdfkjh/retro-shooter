// ============================================================
// powerup.js — Powerup / health-pack entity
// Types: 'speed' | 'strength' | 'health'
// ============================================================

class Powerup {
    /**
     * @param {string} type  'speed' | 'strength' | 'health'
     * @param {number} x     world x
     * @param {number} y     world y
     */
    constructor(type, x, y) {
        this.type   = type;
        this.x      = x;
        this.y      = y;
        this.radius = 16;
        this.dead   = false;

        // Idle bob animation — start at random phase so pickups don't sync
        this.bobTimer  = Math.random() * Math.PI * 2;
        this.bobOffset = 0;
        this.pulseTimer = 0;

        // Pickup animation state
        this.pickedUp    = false;
        this.pickupTimer = 0;
        this.PICKUP_ANIM = 0.55; // seconds for the ring + label animation
    }

    update(dt) {
        this.bobTimer   += dt * 2.5;
        this.bobOffset   = Math.sin(this.bobTimer) * 5;
        this.pulseTimer += dt;

        if (this.pickedUp) {
            this.pickupTimer += dt;
            if (this.pickupTimer >= this.PICKUP_ANIM) this.dead = true;
        }
    }

    /**
     * Trigger pickup animation. Returns true the first time (false if already collected).
     */
    collect() {
        if (this.pickedUp) return false;
        this.pickedUp    = true;
        this.pickupTimer = 0;
        return true;
    }

    draw(ctx, camX, camY) {
        const sx = this.x - camX;
        const sy = this.y - camY;

        if (this.pickedUp) {
            this._drawCollectAnim(ctx, sx, sy);
            return;
        }

        drawPowerup(ctx, sx, sy + this.bobOffset, this.type, this.pulseTimer);
    }

    _drawCollectAnim(ctx, sx, sy) {
        const color    = POWERUP_COLORS[this.type];
        const progress = this.pickupTimer / this.PICKUP_ANIM;

        // Three expanding rings staggered in time
        for (let i = 0; i < 3; i++) {
            const p     = Math.min(1, progress * 3 - i * 0.4);
            if (p <= 0) continue;
            const r     = 14 + p * 44;
            const alpha = (1 - p) * 0.9;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth   = 3 - p * 2;
            ctx.shadowColor = color;
            ctx.shadowBlur  = 10;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Label floats upward and fades out
        const labels = { speed: 'SPEED UP!', strength: 'POWER UP!', health: `+${HEALTH_PACK_RESTORE} HP` };
        const rise   = progress * 36;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress * 1.4);
        ctx.fillStyle   = color;
        ctx.shadowColor = color;
        ctx.shadowBlur  = 12;
        ctx.font        = '9px "Press Start 2P", monospace';
        ctx.textAlign   = 'center';
        ctx.fillText(labels[this.type], sx, sy - 16 - rise);
        ctx.restore();
    }
}
