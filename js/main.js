// ============================================================
// main.js — Canvas init, game loop, state machine
// ============================================================

// ---- Canvas setup ----
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ---- Game state ----
// States: 'MENU' | 'PLAYING' | 'LEVEL_COMPLETE' | 'GAME_OVER'
let gameState = 'MENU';

// ---- Game object (live session data) ----
const game = {
    player:       null,
    enemies:      [],
    bullets:      [],
    enemyBullets: [],
    particles:    [],
    powerups:     [],
    boss:         null,
    bossDropTimer:  5,   // seconds until next boss-fight powerup drop
    bossDeathTimer: 0,   // countdown after boss dies before level complete
    camera:    { x: 0, y: 0 },
    spawner:   new Spawner(),
    levelIndex: 0,
    waveIndex:  0,   // 0-based within current level
    screenFlash: 0,  // seconds remaining
    powerupTimer: 15,  // seconds until next combat powerup drops
};

// ---- Helpers ----
function startLevel(levelIndex) {
    const level = LEVELS[levelIndex];
    game.levelIndex = levelIndex;
    game.waveIndex  = 0;
    game.enemies      = [];
    game.bullets      = [];
    game.enemyBullets = [];
    game.particles    = [];
    game.powerups     = [];
    game.boss         = null;
    game.bossDropTimer  = BOSS_POWERUP_INTERVAL;
    game.bossDeathTimer = 0;
    game.spawner.reset();

    if (!game.player) {
        game.player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    } else {
        // Carry HP over — intentionally not reset between levels
        game.player.ammo      = game.player.magSize;
        game.player.dead      = false;
        game.player.reloading = false;
    }

    // Centre camera on player
    updateCamera();

    if (level.isBoss) {
        // Spawn boss at center of world
        game.boss = new Boss(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    } else {
        startWave(0);
    }
}

function startNewGame() {
    ScoreSystem.reset();
    game.player      = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    game.powerupTimer = 15;
    updateCamera();
    startLevel(0);
    gameState = 'PLAYING';
}

function startWave(waveIdx) {
    const level = LEVELS[game.levelIndex];
    game.waveIndex = waveIdx;
    game.enemies      = [];
    game.bullets      = [];
    game.enemyBullets = [];
    game.powerups     = [];
    game.spawner.reset();
    game.spawner.loadWave(level.waves[waveIdx], game.camera.x, game.camera.y);

    // Health pack: first wave of every even-numbered level (levels 2, 4, 6…)
    if (game.waveIndex === 0 && (game.levelIndex + 1) % 2 === 0) {
        const p = _randomPowerupPos(game.camera.x, game.camera.y);
        game.powerups.push(new Powerup('health', p.x, p.y));
    }
}

function _randomPowerupPos(camX, camY) {
    const margin = 100;
    const x = camX + margin + Math.random() * (CANVAS_WIDTH  - margin * 2);
    const y = camY + margin + Math.random() * (CANVAS_HEIGHT - margin * 2);
    return {
        x: Math.max(60, Math.min(WORLD_WIDTH  - 60, x)),
        y: Math.max(60, Math.min(WORLD_HEIGHT - 60, y)),
    };
}

function applyPowerup(type, player) {
    switch (type) {
        case 'speed':
            player.speedBoost.active = true;
            player.speedBoost.timer  = POWERUP_DURATION_SPEED;
            break;
        case 'strength':
            player.strengthBoost.active = true;
            player.strengthBoost.timer  = POWERUP_DURATION_STRENGTH;
            break;
        case 'health':
            player.hp = Math.min(player.maxHp, player.hp + HEALTH_PACK_RESTORE);
            break;
    }
}

function updateCamera() {
    if (!game.player) return;
    game.camera.x = game.player.x - CANVAS_WIDTH  / 2;
    game.camera.y = game.player.y - CANVAS_HEIGHT / 2;
}

// ---- Main Update ----
function update(dt) {
    const mx = Input.mouse.x;
    const my = Input.mouse.y;

    switch (gameState) {
        // --------------------------------------------------
        case 'MENU': {
            MainMenu.update(dt);
            if (Input.mouse.clicked) {
                MainMenu.handleClick(mx, my);
            }
            const action = MainMenu.pollAction();
            if (action === 'play') startNewGame();
            break;
        }

        // --------------------------------------------------
        case 'PLAYING':
            updatePlaying(dt, mx, my);
            break;

        // --------------------------------------------------
        case 'LEVEL_COMPLETE': {
            LevelCompleteScreen.update(dt);
            const enterPressed = Input.isDown('Enter');
            if (LevelCompleteScreen.shouldAdvance(Input.mouse.clicked, enterPressed)) {
                const nextIdx = game.levelIndex + 1;
                if (nextIdx >= LEVELS.length) {
                    const rec = ScoreSystem.saveHigh();
                    GameOverScreen.enter(ScoreSystem.get(), ScoreSystem.getHigh(), rec, true);
                    gameState = 'GAME_OVER';
                } else {
                    startLevel(nextIdx);
                    gameState = 'PLAYING';
                }
            }
            break;
        }

        // --------------------------------------------------
        case 'GAME_OVER': {
            GameOverScreen.update(dt);
            if (GameOverScreen.shouldReturn(Input.mouse.clicked, Input.isDown('Enter'))) {
                game.player = null;
                gameState   = 'MENU';
            }
            break;
        }
    }

    Input.flush();
}

function updatePlaying(dt, mx, my) {
    const p     = game.player;
    const level = LEVELS[game.levelIndex];

    // ESC → menu
    if (Input.isDown('Escape')) {
        gameState = 'MENU';
        return;
    }

    // Update player
    p.update(dt, mx, my, game.camera.x, game.camera.y);
    resolveTerrainCollision(p);

    // Shoot
    const bullet = p.tryShoot();
    if (bullet) {
        game.bullets.push(bullet);
        spawnMuzzleFlash(bullet.x, bullet.y, p.angle)
            .forEach(part => game.particles.push(part));
    }

    // Melee swing
    if (p.tryMelee()) {
        processMeleeHits(p, game.enemies, game.particles, ScoreSystem);

        // Also check boss
        if (game.boss && !game.boss.dead) {
            const bdx  = game.boss.x - p.x;
            const bdy  = game.boss.y - p.y;
            const bdist = Math.hypot(bdx, bdy);
            if (bdist <= MELEE_RANGE + game.boss.radius) {
                let ang = Math.atan2(bdy, bdx) - p.meleeAngle;
                while (ang >  Math.PI) ang -= Math.PI * 2;
                while (ang < -Math.PI) ang += Math.PI * 2;
                if (Math.abs(ang) <= MELEE_ARC + 0.2) {
                    game.boss.takeDamage(MELEE_DAMAGE);
                    game.boss.applyKnockback(bdx, bdy, 500);
                    spawnDeathParticles(game.boss.x, game.boss.y, '#dd88ff', 5)
                        .forEach(part => game.particles.push(part));
                }
            }
        }
    }

    // Update camera
    updateCamera();

    // Update player bullets — kill any that hit a wall
    game.bullets.forEach(b => b.update(dt));
    game.bullets.forEach(b => {
        if (b.dead) return;
        if (isTileSolid(Math.floor(b.x / GRID_SIZE), Math.floor(b.y / GRID_SIZE))) {
            b.dead = true;
            spawnDeathParticles(b.x, b.y, '#aaaaaa', 3)
                .forEach(part => game.particles.push(part));
        }
    });

    // Player bullets vs boss
    if (game.boss && !game.boss.dead) {
        for (let i = game.bullets.length - 1; i >= 0; i--) {
            const b = game.bullets[i];
            if (b.dead) continue;
            if (circleCollide(b, game.boss)) {
                b.dead = true;
                game.boss.takeDamage(b.damage);
                const count = game.boss.dead ? 14 : 4;
                const col   = game.boss.dead ? '#dd88ff' : '#ffffff';
                spawnDeathParticles(b.x, b.y, col, count)
                    .forEach(part => game.particles.push(part));
            }
        }
    }

    game.bullets = game.bullets.filter(b => !b.dead);

    // Refresh flow field
    updateFlowField(p.x, p.y);

    // Update regular enemies
    game.enemies.forEach(e => {
        e.update(dt, p.x, p.y);
        resolveTerrainCollision(e);
        if (e.pendingBullet) {
            game.enemyBullets.push(e.pendingBullet);
            spawnMuzzleFlash(e.pendingBullet.x, e.pendingBullet.y, e.angle)
                .forEach(part => game.particles.push(part));
            e.pendingBullet = null;
        }
    });

    // Update boss
    if (game.boss && !game.boss.dead) {
        game.boss.update(dt, p.x, p.y);
        // Drain boss bullets into the shared enemy-bullets array
        game.boss.pendingBullets.forEach(b => game.enemyBullets.push(b));
        game.boss.pendingBullets = [];
    }

    // Update enemy bullets — kill those that hit walls
    game.enemyBullets.forEach(b => b.update(dt));
    game.enemyBullets.forEach(b => {
        if (b.dead) return;
        if (isTileSolid(Math.floor(b.x / GRID_SIZE), Math.floor(b.y / GRID_SIZE))) {
            b.dead = true;
            spawnDeathParticles(b.x, b.y, '#aa4400', 3)
                .forEach(part => game.particles.push(part));
        }
    });
    game.enemyBullets = game.enemyBullets.filter(b => !b.dead);

    // Update particles
    game.particles.forEach(part => part.update(dt));
    game.particles = game.particles.filter(part => !part.dead);

    // Update spawner (only for non-boss levels)
    if (!level.isBoss) {
        game.spawner.update(dt, game.enemies, game.camera.x, game.camera.y);
    }

    // Timed combat powerup drop — every 15 s during normal play
    if (!level.isBoss) {
        game.powerupTimer -= dt;
        if (game.powerupTimer <= 0) {
            game.powerupTimer = 15;
            const combatTypes = ['speed', 'strength'];
            const pick = combatTypes[Math.floor(Math.random() * combatTypes.length)];
            const pos  = _randomPowerupPos(game.camera.x, game.camera.y);
            game.powerups.push(new Powerup(pick, pos.x, pos.y));
        }
    }

    // Boss fight: drop powerups + health packs every BOSS_POWERUP_INTERVAL seconds
    if (level.isBoss && game.boss && !game.boss.dead) {
        game.bossDropTimer -= dt;
        if (game.bossDropTimer <= 0) {
            game.bossDropTimer = BOSS_POWERUP_INTERVAL;
            const dropTypes = ['speed', 'strength', 'health'];
            const pick = dropTypes[Math.floor(Math.random() * dropTypes.length)];
            const pos  = _randomPowerupPos(game.camera.x, game.camera.y);
            game.powerups.push(new Powerup(pick, pos.x, pos.y));
        }
    }

    // Update powerups + check player pickup
    game.powerups.forEach(pu => pu.update(dt));
    for (const pu of game.powerups) {
        if (pu.pickedUp) continue;
        if (circleCollide(pu, p)) {
            if (pu.collect()) applyPowerup(pu.type, p);
        }
    }
    game.powerups = game.powerups.filter(pu => !pu.dead);

    // Collisions — player bullets vs enemies, enemies vs player
    let screenFlash = false;
    const col1 = processCollisions(game.bullets, game.enemies, p, game.particles, ScoreSystem);
    const col2 = processEnemyBulletCollisions(game.enemyBullets, p, game.particles);
    if (col1.screenFlash || col2.screenFlash) screenFlash = true;

    // Boss contact vs player
    if (game.boss && !game.boss.dead && circleCollide(game.boss, p)) {
        p.takeDamage(BOSS_CONTACT_DAMAGE);
        game.boss.applyKnockback(game.boss.x - p.x, game.boss.y - p.y, 300);
        if (p.hitFlashTimer > 0) screenFlash = true;
    }

    if (screenFlash) game.screenFlash = 0.25;
    if (game.screenFlash > 0) game.screenFlash -= dt;

    // Remove dead regular enemies
    game.enemies = game.enemies.filter(e => !e.dead);

    // Player death
    if (p.dead) {
        const rec = ScoreSystem.saveHigh();
        GameOverScreen.enter(ScoreSystem.get(), ScoreSystem.getHigh(), rec, false);
        gameState = 'GAME_OVER';
        return;
    }

    // Boss death handler — fire once, then count down before level complete
    if (game.boss && game.boss.dead && !game.boss._deathHandled) {
        game.boss._deathHandled = true;
        ScoreSystem.add(game.boss.score);
        game.bossDeathTimer = 2.0;
        // Big explosion of particles
        for (let i = 0; i < 6; i++) {
            spawnDeathParticles(
                game.boss.x + (Math.random() - 0.5) * 80,
                game.boss.y + (Math.random() - 0.5) * 80,
                '#dd88ff', 16
            ).forEach(part => game.particles.push(part));
        }
    }

    // Wave / level progression
    if (level.isBoss) {
        if (game.boss && game.boss._deathHandled) {
            game.bossDeathTimer -= dt;
            if (game.bossDeathTimer <= 0) {
                LevelCompleteScreen.enter(level.name, ScoreSystem.get());
                gameState = 'LEVEL_COMPLETE';
            }
        }
    } else {
        if (game.spawner.waveComplete) {
            game.spawner.waveComplete = false;
            const nextWave = game.waveIndex + 1;
            if (nextWave < level.waves.length) {
                startWave(nextWave);
            } else {
                LevelCompleteScreen.enter(level.name, ScoreSystem.get());
                gameState = 'LEVEL_COMPLETE';
            }
        }
    }
}

// ---- Main Render ----
function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    switch (gameState) {
        case 'MENU':
            MainMenu.draw(ctx, Input.mouse.x, Input.mouse.y);
            break;

        case 'PLAYING':
            renderPlaying();
            break;

        case 'LEVEL_COMPLETE':
            renderPlaying();  // game world in background
            LevelCompleteScreen.draw(ctx, Input.mouse.x, Input.mouse.y);
            break;

        case 'GAME_OVER':
            if (game.player) renderPlaying();
            GameOverScreen.draw(ctx, Input.mouse.x, Input.mouse.y);
            break;
    }
}

function renderPlaying() {
    const cam = game.camera;

    // Terrain background
    drawTerrain(ctx, cam.x, cam.y, CANVAS_WIDTH, CANVAS_HEIGHT, gameTime);

    // Powerups (on the ground, under everything else)
    game.powerups.forEach(pu => pu.draw(ctx, cam.x, cam.y));

    // Particles (behind enemies)
    game.particles.forEach(p => p.draw(ctx, cam.x, cam.y));

    // Bullets (player = cyan, enemy = magenta)
    game.enemyBullets.forEach(b => b.draw(ctx, cam.x, cam.y));
    game.bullets.forEach(b => b.draw(ctx, cam.x, cam.y));

    // Regular enemies
    game.enemies.forEach(e => e.draw(ctx, cam.x, cam.y));

    // Boss
    if (game.boss && !game.boss.dead) {
        game.boss.draw(ctx, cam.x, cam.y);
    }

    // Player (always screen center)
    if (game.player) game.player.draw(ctx);

    // Screen flash (player hit)
    if (game.screenFlash > 0) {
        const alpha = Math.min(1, game.screenFlash / 0.1) * 0.35;
        ctx.fillStyle = `rgba(255,0,0,${alpha})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Scanlines
    drawScanlines(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

    // HUD (pass boss for health bar)
    const level = LEVELS[game.levelIndex];
    HUD.draw(
        ctx,
        game.player,
        ScoreSystem,
        level.name,
        game.waveIndex + 1,
        level.waves.length,
        game.boss
    );

    // Custom cursor
    drawCursor(ctx, Input.mouse.x, Input.mouse.y);
}

// ---- Game Loop ----
let lastTime = 0;
let gameTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime  = timestamp;
    gameTime += dt;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// ---- Boot ----
requestAnimationFrame(ts => {
    lastTime = ts;
    requestAnimationFrame(gameLoop);
});
