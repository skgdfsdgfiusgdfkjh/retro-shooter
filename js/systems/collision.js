// ============================================================
// collision.js — Circle-circle collision detection
// ============================================================

/**
 * Returns true if two circles overlap.
 */
function circleCollide(a, b) {
    const dx   = a.x - b.x;
    const dy   = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < (a.radius + b.radius);
}

/**
 * Check enemy bullets against the player.
 * @returns {{ screenFlash: boolean }}
 */
function processEnemyBulletCollisions(enemyBullets, player, particles) {
    let screenFlash = false;
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        if (b.dead) continue;
        if (circleCollide(b, player)) {
            b.dead = true;
            player.takeDamage(b.damage);
            spawnDeathParticles(b.x, b.y, '#ff6600', 4)
                .forEach(p => particles.push(p));
            if (player.hitFlashTimer > 0) screenFlash = true;
        }
    }
    return { screenFlash };
}

/**
 * Apply melee damage to all enemies within the player's swing arc.
 * Call this once at the moment the swing is triggered (not each frame).
 *
 * @param {Player}     player
 * @param {Enemy[]}    enemies
 * @param {Particle[]} particles
 * @param {ScoreSystem} score
 */
function processMeleeHits(player, enemies, particles, score) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (enemy.dead) continue;

        const dx   = enemy.x - player.x;
        const dy   = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);

        // Must be within reach (allow for enemy radius)
        if (dist > MELEE_RANGE + enemy.radius) continue;

        // Must be inside the swing arc
        let angleDiff = Math.atan2(dy, dx) - player.meleeAngle;
        while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) > MELEE_ARC + 0.2) continue;

        enemy.takeDamage(MELEE_DAMAGE);

        // Strong knockback away from player
        enemy.applyKnockback(dx, dy, 500);

        // Sparks
        const color = enemy.dead ? enemy.color : '#ffffaa';
        const count = enemy.dead ? 10 : 5;
        spawnDeathParticles(enemy.x, enemy.y, color, count)
            .forEach(p => particles.push(p));

        if (enemy.dead && score) score.add(enemy.score);
    }
}

/**
 * Process all bullet↔enemy and enemy↔player collisions.
 *
 * @param {Bullet[]}   bullets
 * @param {Enemy[]}    enemies
 * @param {Player}     player
 * @param {Particle[]} particles  — array to push death/hit particles into
 * @param {ScoreSystem} score
 * @returns {{ screenFlash: boolean }}
 */
function processCollisions(bullets, enemies, player, particles, score) {
    let screenFlash = false;

    // ---- Bullets vs Enemies ----
    for (let b = bullets.length - 1; b >= 0; b--) {
        const bullet = bullets[b];
        if (bullet.dead) continue;

        for (let e = enemies.length - 1; e >= 0; e--) {
            const enemy = enemies[e];
            if (enemy.dead) continue;

            if (circleCollide(bullet, enemy)) {
                bullet.dead = true;
                enemy.takeDamage(bullet.damage);

                // Hit sparks
                const count = enemy.dead ? 8 : 3;
                const color = enemy.dead ? enemy.color : '#ffffff';
                spawnDeathParticles(bullet.x, bullet.y, color, count)
                    .forEach(p => particles.push(p));

                if (enemy.dead && score) {
                    score.add(enemy.score);
                }
                break; // bullet only hits one enemy
            }
        }
    }

    // ---- Enemies vs Player ----
    for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (circleCollide(enemy, player)) {
            player.takeDamage(enemy.damage);
            // Knockback enemy away from player
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            enemy.applyKnockback(dx, dy, 300);
            if (player.hitFlashTimer > 0) screenFlash = true;
        }
    }

    return { screenFlash };
}
