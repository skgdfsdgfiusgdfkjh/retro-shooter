// ============================================================
// particle.js — Particle entity (death / muzzle flash)
// ============================================================

class Particle {
    /**
     * @param {number} x        world x
     * @param {number} y        world y
     * @param {string} color
     * @param {object} opts     optional overrides
     */
    constructor(x, y, color, opts = {}) {
        const speed = opts.speed !== undefined ? opts.speed : (80 + Math.random() * 120);
        const angle = opts.angle !== undefined ? opts.angle : (Math.random() * Math.PI * 2);

        this.x      = x;
        this.y      = y;
        this.vx     = Math.cos(angle) * speed;
        this.vy     = Math.sin(angle) * speed;
        this.color  = color;
        this.size   = opts.size !== undefined ? opts.size : (3 + Math.random() * 5);
        this.maxLife = opts.life !== undefined ? opts.life : (0.3 + Math.random() * 0.4);
        this.life   = this.maxLife;
        this.dead   = false;
    }

    update(dt) {
        this.x    += this.vx * dt;
        this.y    += this.vy * dt;
        this.vx   *= 0.92;
        this.vy   *= 0.92;
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx, camX, camY) {
        const sx = this.x - camX;
        const sy = this.y - camY;
        const p  = { ...this, x: sx, y: sy };
        drawParticle(ctx, p);
    }
}

// ---------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------

/**
 * Create a burst of death particles at world position (x, y).
 * @returns {Particle[]}
 */
function spawnDeathParticles(x, y, color, count = 8) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
    return particles;
}

/**
 * Create a muzzle flash at world position (x, y) toward angle.
 * @returns {Particle[]}
 */
function spawnMuzzleFlash(x, y, angle) {
    const particles = [];
    const spread    = 0.4;
    for (let i = 0; i < 5; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        particles.push(new Particle(x, y, COLORS.MUZZLE, {
            speed: 120 + Math.random() * 80,
            angle: a,
            size:  2 + Math.random() * 3,
            life:  0.12 + Math.random() * 0.1,
        }));
    }
    return particles;
}
