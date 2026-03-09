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
    player:    null,
    enemies:   [],
    bullets:   [],
    particles: [],
    powerups:  [],
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
    game.enemies    = [];
    game.bullets    = [];
    game.particles  = [];
    game.powerups   = [];
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

    // Start first wave
    startWave(0);
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
    game.enemies   = [];
    game.bullets   = [];
    game.powerups  = [];
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
    const p = game.player;

    // ESC → menu
    if (Input.isDown('Escape')) {
        gameState = 'MENU';
        return;
    }

    // Update player
    p.update(dt, mx, my, game.camera.x, game.camera.y);

    // Shoot
    const bullet = p.tryShoot();
    if (bullet) {
        game.bullets.push(bullet);
        // Muzzle flash
        spawnMuzzleFlash(bullet.x, bullet.y, p.angle)
            .forEach(part => game.particles.push(part));
    }

    // Melee swing
    if (p.tryMelee()) {
        processMeleeHits(p, game.enemies, game.particles, ScoreSystem);
    }

    // Update camera
    updateCamera();

    // Update bullets
    game.bullets.forEach(b => b.update(dt));
    game.bullets = game.bullets.filter(b => !b.dead);

    // Update enemies
    game.enemies.forEach(e => e.update(dt, p.x, p.y));

    // Update particles
    game.particles.forEach(part => part.update(dt));
    game.particles = game.particles.filter(part => !part.dead);

    // Update spawner
    game.spawner.update(dt, game.enemies, game.camera.x, game.camera.y);

    // Timed combat powerup drop (every 15 seconds)
    game.powerupTimer -= dt;
    if (game.powerupTimer <= 0) {
        game.powerupTimer = 15;
        const combatTypes = ['speed', 'strength'];
        const pick = combatTypes[Math.floor(Math.random() * combatTypes.length)];
        const pos  = _randomPowerupPos(game.camera.x, game.camera.y);
        game.powerups.push(new Powerup(pick, pos.x, pos.y));
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

    // Collisions
    const { screenFlash } = processCollisions(
        game.bullets, game.enemies, p, game.particles, ScoreSystem
    );
    if (screenFlash) game.screenFlash = 0.25;
    if (game.screenFlash > 0) game.screenFlash -= dt;

    // Remove dead enemies
    game.enemies = game.enemies.filter(e => !e.dead);

    // Player death
    if (p.dead) {
        const rec = ScoreSystem.saveHigh();
        GameOverScreen.enter(ScoreSystem.get(), ScoreSystem.getHigh(), rec, false);
        gameState = 'GAME_OVER';
        return;
    }

    // Wave / level progression
    if (game.spawner.waveComplete) {
        game.spawner.waveComplete = false;
        const level      = LEVELS[game.levelIndex];
        const nextWave   = game.waveIndex + 1;
        if (nextWave < level.waves.length) {
            startWave(nextWave);
        } else {
            // Level complete
            LevelCompleteScreen.enter(level.name, ScoreSystem.get());
            gameState = 'LEVEL_COMPLETE';
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

    // Background grid
    drawBackground(ctx, cam.x, cam.y, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Powerups (on the ground, under everything else)
    game.powerups.forEach(pu => pu.draw(ctx, cam.x, cam.y));

    // Particles (behind enemies)
    game.particles.forEach(p => p.draw(ctx, cam.x, cam.y));

    // Bullets
    game.bullets.forEach(b => b.draw(ctx, cam.x, cam.y));

    // Enemies
    game.enemies.forEach(e => e.draw(ctx, cam.x, cam.y));

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

    // HUD
    const level = LEVELS[game.levelIndex];
    HUD.draw(
        ctx,
        game.player,
        ScoreSystem,
        level.name,
        game.waveIndex + 1,
        level.waves.length
    );

    // Custom cursor
    drawCursor(ctx, Input.mouse.x, Input.mouse.y);
}

// ---- Game Loop ----
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime  = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// ---- Boot ----
requestAnimationFrame(ts => {
    lastTime = ts;
    requestAnimationFrame(gameLoop);
});
