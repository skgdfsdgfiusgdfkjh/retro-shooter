// ============================================================
// player.js — Player entity
// ============================================================

class Player {
    constructor(x, y) {
        this.x      = x;
        this.y      = y;
        this.radius = PLAYER_RADIUS;
        this.hp     = PLAYER_MAX_HP;
        this.maxHp  = PLAYER_MAX_HP;
        this.angle  = 0;   // facing toward mouse
        this.dead   = false;

        // Movement
        this.vx = 0;
        this.vy = 0;

        // Ammo
        this.ammo        = PLAYER_MAG_SIZE;
        this.magSize     = PLAYER_MAG_SIZE;
        this.reloading   = false;
        this.reloadTimer = 0;

        // Animation
        this.anim   = new Animator(4, 8);
        this.moving = false;

        // Hit flash
        this.hitFlashTimer    = 0;
        this.damageCooldown   = 0;

        // Shoot cooldown (semi-auto feel)
        this.shootCooldown = 0;
        this.SHOOT_RATE    = 0.12; // seconds between shots (auto-fire)

        // Active powerup boosts
        this.speedBoost    = { active: false, timer: 0 };
        this.strengthBoost = { active: false, timer: 0 };
    }

    // -------------------------------------------------------
    // Update
    // -------------------------------------------------------
    update(dt, mouseScreenX, mouseScreenY, camX, camY) {
        // Rotate toward mouse (screen coords → world)
        const screenCenterX = CANVAS_WIDTH  / 2;
        const screenCenterY = CANVAS_HEIGHT / 2;
        this.angle = Math.atan2(mouseScreenY - screenCenterY, mouseScreenX - screenCenterX);

        // ---- Movement ----
        let mx = 0, my = 0;
        if (Input.isDown('KeyW') || Input.isDown('ArrowUp'))    my -= 1;
        if (Input.isDown('KeyS') || Input.isDown('ArrowDown'))  my += 1;
        if (Input.isDown('KeyA') || Input.isDown('ArrowLeft'))  mx -= 1;
        if (Input.isDown('KeyD') || Input.isDown('ArrowRight')) mx += 1;

        if (mx !== 0 || my !== 0) {
            const len = Math.hypot(mx, my);
            this.vx     = (mx / len) * PLAYER_SPEED;
            this.vy     = (my / len) * PLAYER_SPEED;
            this.moving = true;
            this.anim.play();
        } else {
            this.vx     = 0;
            this.vy     = 0;
            this.moving = false;
            this.anim.pause();
            this.anim.frame = 0;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Clamp to world bounds
        this.x = Math.max(this.radius, Math.min(WORLD_WIDTH  - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(WORLD_HEIGHT - this.radius, this.y));

        // Animation
        if (this.moving) this.anim.update(dt);

        // ---- Reload ----
        if (Input.isDown('KeyR') && !this.reloading && this.ammo < this.magSize) {
            this.reloading   = true;
            this.reloadTimer = PLAYER_RELOAD_TIME;
        }
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.reloading = false;
                this.ammo      = this.magSize;
            }
        }

        // ---- Shoot cooldown ----
        if (this.shootCooldown > 0) this.shootCooldown -= dt;

        // ---- Powerup boost timers ----
        if (this.speedBoost.active) {
            this.speedBoost.timer -= dt;
            if (this.speedBoost.timer <= 0) this.speedBoost.active = false;
        }
        if (this.strengthBoost.active) {
            this.strengthBoost.timer -= dt;
            if (this.strengthBoost.timer <= 0) this.strengthBoost.active = false;
        }

        // ---- Timers ----
        if (this.hitFlashTimer   > 0) this.hitFlashTimer   -= dt;
        if (this.damageCooldown  > 0) this.damageCooldown  -= dt;
    }

    // -------------------------------------------------------
    // Try to fire; returns Bullet or null
    // -------------------------------------------------------
    tryShoot() {
        if (this.reloading)           return null;
        if (this.ammo <= 0)           return null;
        if (this.shootCooldown > 0)   return null;
        if (!Input.mouse.down)        return null;

        this.ammo--;
        // Speed boost: fire ~3.5× faster
        this.shootCooldown = this.speedBoost.active
            ? this.SHOOT_RATE / POWERUP_SPEED_MULTIPLIER
            : this.SHOOT_RATE;

        // Strength boost: bullets deal more damage
        const damage = this.strengthBoost.active
            ? Math.round(BULLET_DAMAGE * POWERUP_DAMAGE_MULTIPLIER)
            : BULLET_DAMAGE;

        // Gun tip position in world coords
        const gunLen = PIXEL * 5;
        const gx = this.x + Math.cos(this.angle) * gunLen;
        const gy = this.y + Math.sin(this.angle) * gunLen;

        return new Bullet(gx, gy, this.angle, damage);
    }

    // -------------------------------------------------------
    // Take damage (with cooldown to avoid rapid hits)
    // -------------------------------------------------------
    takeDamage(amount) {
        if (this.damageCooldown > 0) return;
        this.hp              -= amount;
        this.hitFlashTimer    = 0.2;
        this.damageCooldown   = PLAYER_DAMAGE_COOLDOWN;
        if (this.hp <= 0) {
            this.hp   = 0;
            this.dead = true;
        }
    }

    // -------------------------------------------------------
    // Draw (centered on screen; camera is centered on player)
    // -------------------------------------------------------
    draw(ctx) {
        const sx = CANVAS_WIDTH  / 2;
        const sy = CANVAS_HEIGHT / 2;
        drawPlayer(ctx, sx, sy, this.angle, this.anim.frame);
    }
}
