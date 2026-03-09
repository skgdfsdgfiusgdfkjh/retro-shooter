// ============================================================
// enemy.js — Enemy entity + factory
// ============================================================

class Enemy {
    /**
     * @param {string} type  'basic' | 'fast' | 'tank'
     * @param {number} x     world x
     * @param {number} y     world y
     */
    constructor(type, x, y) {
        const cfg    = ENEMY_CONFIGS[type];
        this.type    = type;
        this.x       = x;
        this.y       = y;
        this.speed   = cfg.speed;
        this.hp      = cfg.hp;
        this.maxHp   = cfg.hp;
        this.score   = cfg.score;
        this.radius  = cfg.radius;
        this.damage  = cfg.damage;
        this.color   = cfg.color;
        this.dead    = false;
        this.angle   = 0;   // facing direction
        this.anim    = new Animator(2, 6);

        // Zigzag / strafe state (fast + sniper)
        this.zigzagTimer = 0;
        this.zigzagDir   = (Math.random() < 0.5) ? 1 : -1;

        // Ranged attack (sniper only)
        this.shootTimer    = Math.random() * SNIPER_SHOOT_RATE; // stagger first shot
        this.pendingBullet = null;

        // Knockback
        this.kbVx = 0;
        this.kbVy = 0;

        // Hit flash
        this.hitFlashTimer = 0;
    }

    update(dt, playerX, playerY) {
        this.anim.update(dt);

        const dx   = playerX - this.x;
        const dy   = playerY - this.y;
        const dist = Math.hypot(dx, dy) || 1;

        // Always face the player
        this.angle = Math.atan2(dy, dx);

        // Movement: use flow field when far enough away to need wall navigation;
        // switch to direct chase when almost adjacent (avoids jitter up close).
        let moveX, moveY;
        const closeRange = GRID_SIZE * 2.5;
        if (dist < closeRange) {
            moveX = (dx / dist) * this.speed;
            moveY = (dy / dist) * this.speed;
        } else {
            const fd = getFlowDir(this.x, this.y);
            if (fd) {
                moveX = fd.dx * this.speed;
                moveY = fd.dy * this.speed;
            } else {
                // Fallback: direct chase (e.g. isolated area, flow field not ready)
                moveX = (dx / dist) * this.speed;
                moveY = (dy / dist) * this.speed;
            }
        }

        // Fast enemy zigzag perpendicular to current movement direction
        if (this.type === 'fast') {
            this.zigzagTimer += dt;
            if (this.zigzagTimer > 0.4) {
                this.zigzagTimer = 0;
                this.zigzagDir  *= -1;
            }
            const moveAngle = Math.atan2(moveY, moveX);
            const perp      = moveAngle + Math.PI / 2;
            moveX += Math.cos(perp) * this.speed * 0.6 * this.zigzagDir;
            moveY += Math.sin(perp) * this.speed * 0.6 * this.zigzagDir;
        }

        // Sniper: keep distance + shoot
        if (this.type === 'sniper') {
            this.pendingBullet = null;

            if (dist < SNIPER_FLEE_RANGE) {
                // Too close — retreat directly away from player
                moveX = -(dx / dist) * this.speed;
                moveY = -(dy / dist) * this.speed;
            } else if (dist <= SNIPER_SHOOT_RANGE) {
                // In range — strafe sideways slowly instead of charging
                this.zigzagTimer += dt;
                if (this.zigzagTimer > 1.2) {
                    this.zigzagTimer = 0;
                    this.zigzagDir  *= -1;
                }
                const perp = this.angle + Math.PI / 2;
                moveX = Math.cos(perp) * this.speed * 0.3 * this.zigzagDir;
                moveY = Math.sin(perp) * this.speed * 0.3 * this.zigzagDir;
            }
            // Beyond shoot range: keep the flow-field approach direction unchanged

            // Shooting
            this.shootTimer -= dt;
            if (this.shootTimer <= 0 && dist < SNIPER_SHOOT_RANGE) {
                this.shootTimer = SNIPER_SHOOT_RATE;
                const gunLen = this.radius + PIXEL * 5;
                const bx     = this.x + Math.cos(this.angle) * gunLen;
                const by     = this.y + Math.sin(this.angle) * gunLen;
                this.pendingBullet = new Bullet(
                    bx, by, this.angle,
                    ENEMY_BULLET_DAMAGE, ENEMY_BULLET_SPEED,
                    '#ff6600', '#aa3300'
                );
            }
        }

        this.x += moveX * dt;
        this.y += moveY * dt;

        // Apply + decay knockback
        this.x    += this.kbVx * dt;
        this.y    += this.kbVy * dt;
        this.kbVx *= 0.85;
        this.kbVy *= 0.85;

        // Clamp to world
        this.x = Math.max(this.radius, Math.min(WORLD_WIDTH  - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(WORLD_HEIGHT - this.radius, this.y));

        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlashTimer = 0.1;
        if (this.hp <= 0) this.dead = true;
    }

    applyKnockback(dx, dy, force = 200) {
        const dist = Math.hypot(dx, dy) || 1;
        this.kbVx = (dx / dist) * force;
        this.kbVy = (dy / dist) * force;
    }

    draw(ctx, camX, camY) {
        const sx = this.x - camX;
        const sy = this.y - camY;

        // Hit flash overlay
        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.7;
        }

        drawEnemy(ctx, sx, sy, this.angle, this.anim.frame, this.type);

        if (this.hitFlashTimer > 0) {
            ctx.restore();
            // White flash
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Health bar (only if damaged)
        if (this.hp < this.maxHp) {
            const bw = this.radius * 2.5;
            const bh = 4;
            const bx = sx - bw / 2;
            const by = sy - this.radius - 10;
            ctx.fillStyle = '#440000';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = '#ff2222';
            ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
        }
    }
}

/** Factory shorthand */
function createEnemy(type, x, y) {
    return new Enemy(type, x, y);
}
