// ============================================================
// bullet.js — Bullet entity
// ============================================================

class Bullet {
    /**
     * @param {number} x        world x
     * @param {number} y        world y
     * @param {number} angle    direction in radians
     */
    constructor(x, y, angle, damage = BULLET_DAMAGE) {
        this.x      = x;
        this.y      = y;
        this.vx     = Math.cos(angle) * BULLET_SPEED;
        this.vy     = Math.sin(angle) * BULLET_SPEED;
        this.radius = BULLET_RADIUS;
        this.damage = damage;
        this.life   = BULLET_LIFETIME;
        this.dead   = false;

        // Trail: store last N positions (world coords)
        this.trail = [];
        this.TRAIL_MAX = 6;
    }

    update(dt) {
        // Record trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.TRAIL_MAX) this.trail.shift();

        this.x    += this.vx * dt;
        this.y    += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx, camX, camY) {
        // Convert trail to screen coords
        const screenTrail = this.trail.map(p => ({
            x: p.x - camX,
            y: p.y - camY,
        }));
        drawBullet(ctx, this.x - camX, this.y - camY, screenTrail);
    }
}
