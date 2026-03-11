// ============================================================
// boss.js — Boss entity "Seraph"
// ============================================================

class Boss {
    constructor(x, y) {
        this.x      = x;
        this.y      = y;
        this.radius = BOSS_RADIUS;
        this.hp     = BOSS_MAX_HP;
        this.maxHp  = BOSS_MAX_HP;
        this.dead   = false;
        this.angle  = 0;
        this.score  = BOSS_SCORE;
        this.color  = '#cc44ff'; // used by processMeleeHits for particles

        this.anim = new Animator(2, 18); // slow idle sway

        this.hitFlashTimer  = 0;
        this.pendingBullets = []; // filled during update(), drained by main.js

        // ---- Attack cooldown timers (staggered so first attacks feel natural) ----
        this.burstTimer  = 1.0;
        this.spreadTimer = 3.5;
        this.ringTimer   = 5.5;
        this.chargeTimer = 7.0;

        // Burst queue — fires bullets one at a time with small delays
        this.burstQueue = [];
        this.burstDelay = 0;

        // Charge state
        this.charging   = false;
        this.chargeVx   = 0;
        this.chargeVy   = 0;
        this.chargeTtl  = 0;

        // Knockback (boss barely moves)
        this.kbVx = 0;
        this.kbVy = 0;
    }

    /** Current phase: 1 = >66% HP, 2 = 33–66%, 3 = <33% */
    get phase() {
        const pct = this.hp / this.maxHp;
        if (pct > 0.66) return 1;
        if (pct > 0.33) return 2;
        return 3;
    }

    update(dt, playerX, playerY) {
        this.anim.update(dt);
        this.pendingBullets = [];

        const dx   = playerX - this.x;
        const dy   = playerY - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        const ph    = this.phase;
        const speed = ph === 1 ? 55 : ph === 2 ? 82 : 120;

        // ---- Movement ----
        let moveX = 0, moveY = 0;
        if (!this.charging) {
            if (dist > BOSS_RADIUS + 20) {
                const fd = getFlowDir(this.x, this.y);
                if (fd) {
                    moveX = fd.dx * speed;
                    moveY = fd.dy * speed;
                } else {
                    moveX = (dx / dist) * speed;
                    moveY = (dy / dist) * speed;
                }
            }
        }

        // ============================================================
        // Attack 1 — Burst fire  (all phases)
        // Fires 3–5 aimed shots in quick succession
        // ============================================================
        if (this.burstQueue.length > 0) {
            this.burstDelay -= dt;
            if (this.burstDelay <= 0) {
                this._fire(this.burstQueue.shift(), 365);
                this.burstDelay = 0.16;
            }
        }
        this.burstTimer -= dt;
        if (this.burstTimer <= 0 && this.burstQueue.length === 0) {
            this.burstTimer = ph === 1 ? 2.6 : ph === 2 ? 1.9 : 1.3;
            const shots = ph >= 3 ? 5 : 3;
            for (let i = 0; i < shots; i++) {
                this.burstQueue.push(this.angle + (Math.random() - 0.5) * 0.14);
            }
            this.burstDelay = 0;
        }

        // ============================================================
        // Attack 2 — Spread shot  (phase 2+)
        // Wide fan of bullets toward the player
        // ============================================================
        if (ph >= 2) {
            this.spreadTimer -= dt;
            if (this.spreadTimer <= 0) {
                this.spreadTimer = ph === 2 ? 3.5 : 2.4;
                const count   = ph === 3 ? 9 : 7;
                const half    = Math.PI * 0.38;
                for (let i = 0; i < count; i++) {
                    const a = this.angle - half + (half * 2 / (count - 1)) * i;
                    this._fire(a, 315);
                }
            }
        }

        // ============================================================
        // Attack 3 — Ring burst  (phase 2+)
        // Fires bullets in all directions simultaneously
        // Phase 3 fires a second staggered ring on top
        // ============================================================
        if (ph >= 2) {
            this.ringTimer -= dt;
            if (this.ringTimer <= 0) {
                this.ringTimer    = ph === 2 ? 5.0 : 3.4;
                const count = ph === 3 ? 16 : 12;
                for (let i = 0; i < count; i++) {
                    this._fire((Math.PI * 2 / count) * i, 265);
                }
                if (ph === 3) {
                    const off = Math.PI / count;
                    for (let i = 0; i < count; i++) {
                        this._fire((Math.PI * 2 / count) * i + off, 220);
                    }
                }
            }
        }

        // ============================================================
        // Attack 4 — Charge  (phase 2+)
        // Dashes at the player — deals heavy contact damage on impact
        // ============================================================
        if (ph >= 2) {
            this.chargeTimer -= dt;
            if (this.chargeTimer <= 0 && !this.charging) {
                this.chargeTimer = ph === 2 ? 6.2 : 4.0;
                this.charging    = true;
                this.chargeTtl   = 0.46;
                const cspd       = 590;
                this.chargeVx    = (dx / dist) * cspd;
                this.chargeVy    = (dy / dist) * cspd;
            }
        }
        if (this.charging) {
            moveX = this.chargeVx;
            moveY = this.chargeVy;
            this.chargeTtl -= dt;
            if (this.chargeTtl <= 0) this.charging = false;
        }

        // ---- Apply movement + knockback ----
        this.x    += (moveX + this.kbVx) * dt;
        this.y    += (moveY + this.kbVy) * dt;
        this.kbVx *= 0.80;
        this.kbVy *= 0.80;

        this.x = Math.max(this.radius, Math.min(WORLD_WIDTH  - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(WORLD_HEIGHT - this.radius, this.y));

        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    }

    _fire(angle, speed) {
        const tip = this.radius + PIXEL * 2;
        this.pendingBullets.push(new Bullet(
            this.x + Math.cos(angle) * tip,
            this.y + Math.sin(angle) * tip,
            angle,
            BOSS_BULLET_DAMAGE,
            speed,
            '#ff44ff',   // magenta bullets
            '#880088'
        ));
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlashTimer = 0.12;
        if (this.hp <= 0) { this.hp = 0; this.dead = true; }
    }

    applyKnockback(dx, dy, force) {
        const dist = Math.hypot(dx, dy) || 1;
        // Boss barely reacts to knockback
        this.kbVx += (dx / dist) * force * 0.07;
        this.kbVy += (dy / dist) * force * 0.07;
    }

    draw(ctx, camX, camY) {
        const sx = this.x - camX;
        const sy = this.y - camY;

        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.62;
        }

        drawBoss(ctx, sx, sy, this.angle, this.anim.frame, this.phase);

        if (this.hitFlashTimer > 0) {
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle   = '#ffffff';
            ctx.beginPath();
            ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
