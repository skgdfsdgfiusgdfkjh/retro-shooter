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
