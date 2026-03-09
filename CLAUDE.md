# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `index.html` directly in a browser — no build step, no server required. Because all scripts are loaded as plain `<script>` tags, simply double-clicking the file works in Chrome and Firefox.

To iterate quickly, keep browser DevTools open (F12) so console errors surface immediately after each file save.

## Git Workflow

**After every task or meaningful change, commit and push immediately.** This is non-negotiable — it ensures no work is ever lost and the repository always reflects the current state of the project.

```bash
git add <specific files>
git commit -m "short imperative subject line

Optional body explaining why, not what."
git push
```

Rules:
- Stage only the files that were intentionally changed — never `git add -A` or `git add .`
- Commit after each self-contained piece of work (bug fix, feature, tweak) — not just at the end of a session
- Commit messages must use the imperative mood ("Add X", "Fix Y", "Remove Z"), be specific, and explain intent where the diff alone isn't obvious
- Always `git push` immediately after committing — a local-only commit is not a saved state
- All commits must include the co-author trailer:
  `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

## Architecture

This is a single-page, no-framework game. All JavaScript runs as global scripts loaded in dependency order defined in `index.html`. There is no module system — every file shares the global `window` scope.

### Script Loading Order (dependency chain)

```
constants.js        ← everything depends on this
input.js
sprites.js          ← depends on COLORS, PIXEL, BULLET_RADIUS from constants
animation.js
levels/levelData.js
entities/bullet.js  ← depends on BULLET_* constants, drawBullet from sprites
entities/particle.js← depends on COLORS, drawParticle, spawnDeathParticles
entities/enemy.js   ← depends on ENEMY_CONFIGS, Animator, drawEnemy, createEnemy
entities/player.js  ← depends on Player constants, Animator, Bullet, drawPlayer, Input
systems/collision.js← depends on spawnDeathParticles
systems/spawner.js  ← depends on ENEMY_CONFIGS, CANVAS_*, createEnemy
systems/score.js    ← no dependencies
ui/hud.js           ← depends on COLORS, HUD_FONT_*, PLAYER_RELOAD_TIME
ui/menu.js          ← depends on drawBackground, drawScanlines, drawCursor, ScoreSystem
ui/levelComplete.js ← depends on drawCursor, HUD_FONT_*
ui/gameOver.js      ← depends on drawCursor, HUD_FONT_*
main.js             ← depends on everything above
```

Adding a new script requires inserting it in the correct position in `index.html`.

### Coordinate Systems

- **World space**: all entities (player, enemies, bullets, particles) store positions in a 3200×3200 world.
- **Screen space**: rendered by subtracting `camera.x / camera.y`. The player is always drawn at the canvas center (`CANVAS_WIDTH/2, CANVAS_HEIGHT/2`); the camera is computed as `player.x - CANVAS_WIDTH/2`.
- **HUD**: drawn in screen space after the world render — never offset by camera.

### State Machine (`main.js`)

`gameState` is a string: `'MENU'` → `'PLAYING'` → `'LEVEL_COMPLETE'` → `'PLAYING'` (next level) or `'GAME_OVER'`. The `game` object holds all live session data (player, enemies, bullets, particles, camera, spawner, levelIndex, waveIndex). On new game, `startNewGame()` resets score and creates a fresh `Player`; `startLevel()` resets entities and calls `startWave(0)`; `startWave()` resets enemies/bullets and calls `spawner.loadWave()`.

### Sprite System (`sprites.js`)

Sprites are 2D number arrays where `0` = transparent and `1–N` index into a palette array. `drawSprite(ctx, frame, x, y, ps, palette)` renders each non-zero cell as a `fillRect` of size `PIXEL` (4px). Player frames are 7×9, enemy frames are 5×7. All draw functions (`drawPlayer`, `drawEnemy`, `drawBullet`, `drawParticle`, `drawBackground`, `drawScanlines`, `drawCursor`) are plain functions called directly — not methods.

### Adding a New Enemy Type

1. Add its config to `ENEMY_CONFIGS` in `constants.js`.
2. Add a palette constant and any new frame data in `sprites.js`, then handle it in `drawEnemy`.
3. Add behavior logic in `enemy.js` `update()`.
4. Reference the new type string in `levels/levelData.js` wave definitions.

### Key Constants (`constants.js`)

All tuning values live here. Changing gameplay feel (speed, damage, timing) only requires editing this file — no logic changes needed.

| Constant | Purpose |
|---|---|
| `PIXEL` | Scale factor for all sprite rendering (4 = each art pixel = 4×4 screen pixels) |
| `WORLD_WIDTH/HEIGHT` | 3200×3200 — the scrollable play area |
| `SPAWN_INTERVAL` | Seconds between individual enemy spawns within a wave |
| `WAVE_END_DELAY` | Seconds of pause after all enemies die before next wave starts |
| `PLAYER_DAMAGE_COOLDOWN` | Prevents rapid HP drain from sustained enemy contact |
