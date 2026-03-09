// ============================================================
// terrain.js — Tile map generation and drawing
// ============================================================

const TILE_GRASS      = 0;
const TILE_GRASS_DARK = 1;
const TILE_WATER      = 2;
const TILE_DIRT       = 3;
const TILE_STONE      = 4;

const MAP_COLS = WORLD_WIDTH  / GRID_SIZE;  // 100
const MAP_ROWS = WORLD_HEIGHT / GRID_SIZE;  // 100

let TILE_MAP = null;

// ---- Deterministic hash for per-tile texture variation ----
function _tileHash(col, row) {
    let h = (col * 374761393 ^ row * 668265263) >>> 0;
    h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
    return h ^ (h >>> 16);
}

// ---- Seeded PRNG for map generation ----
function _makeRng(seed) {
    let s = seed | 0;
    return () => {
        s = Math.imul(1664525, s) + 1013904223 | 0;
        return (s >>> 0) / 4294967296;
    };
}

// ---- Map generation ----
function generateTerrain() {
    const rng = _makeRng(0xdeadbeef);
    TILE_MAP = new Uint8Array(MAP_COLS * MAP_ROWS).fill(TILE_GRASS);

    const get = (c, r) => {
        if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return TILE_GRASS;
        return TILE_MAP[r * MAP_COLS + c];
    };
    const set = (c, r, t) => {
        if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return;
        TILE_MAP[r * MAP_COLS + c] = t;
    };

    // Water lakes with organic, wobbled shapes
    for (let lake = 0; lake < 7; lake++) {
        const cx = 8  + Math.floor(rng() * 84);
        const cy = 8  + Math.floor(rng() * 84);
        const rx = 4  + rng() * 7;
        const ry = 3  + rng() * 6;
        for (let r = cy - ry - 2; r <= cy + ry + 2; r++) {
            for (let c = cx - rx - 2; c <= cx + rx + 2; c++) {
                const dx    = (c - cx) / rx;
                const dy    = (r - cy) / ry;
                const noise = (rng() - 0.5) * 0.35;
                const dist  = Math.hypot(dx, dy) + noise;
                if (dist < 0.92) {
                    set(c, r, TILE_WATER);
                } else if (dist < 1.2 && get(c, r) === TILE_GRASS) {
                    set(c, r, TILE_DIRT); // muddy shore
                }
            }
        }
    }

    // Dirt paths: 2 horizontal + 2 vertical (width 2), skip water
    for (const pr of [28, 68]) {
        for (let c = 0; c < MAP_COLS; c++) {
            for (const dr of [0, 1]) {
                if (get(c, pr + dr) !== TILE_WATER) set(c, pr + dr, TILE_DIRT);
            }
        }
    }
    for (const pc of [32, 72]) {
        for (let r = 0; r < MAP_ROWS; r++) {
            for (const dc of [0, 1]) {
                if (get(pc + dc, r) !== TILE_WATER) set(pc + dc, r, TILE_DIRT);
            }
        }
    }

    // Dark grass / forest clusters
    for (let p = 0; p < 22; p++) {
        const cx  = Math.floor(rng() * MAP_COLS);
        const cy  = Math.floor(rng() * MAP_ROWS);
        const rad = 2 + rng() * 5;
        for (let dr = -rad - 1; dr <= rad + 1; dr++) {
            for (let dc = -rad - 1; dc <= rad + 1; dc++) {
                if (Math.hypot(dc, dr) < rad + (rng() - 0.5)) {
                    if (get(cx + dc, cy + dr) === TILE_GRASS) {
                        set(cx + dc, cy + dr, TILE_GRASS_DARK);
                    }
                }
            }
        }
    }

    // Stone outcroppings
    for (let p = 0; p < 12; p++) {
        const cx  = Math.floor(rng() * MAP_COLS);
        const cy  = Math.floor(rng() * MAP_ROWS);
        const rad = 1 + rng() * 3;
        for (let dr = -rad - 1; dr <= rad + 1; dr++) {
            for (let dc = -rad - 1; dc <= rad + 1; dc++) {
                if (Math.hypot(dc, dr) < rad + (rng() - 0.5) * 0.6) {
                    const t = get(cx + dc, cy + dr);
                    if (t !== TILE_WATER) set(cx + dc, cy + dr, TILE_STONE);
                }
            }
        }
    }
}

// ---- Draw a single tile ----
function _drawTile(ctx, sx, sy, type, col, row, time) {
    const s = GRID_SIZE; // 32
    const h = _tileHash(col, row);

    switch (type) {
        case TILE_GRASS: {
            ctx.fillStyle = '#3a7d44';
            ctx.fillRect(sx, sy, s, s);
            // Blade streaks
            ctx.fillStyle = '#4c9956';
            for (const bx of [4, 10, 18, 26]) {
                const ox = (bx + (h & 3)) % s;
                ctx.fillRect(sx + ox, sy + 8, 1, 10);
            }
            // Occasional darker accent dot
            if ((h & 0xf) < 3) {
                ctx.fillStyle = '#2d6635';
                ctx.fillRect(sx + (h % 22) + 5, sy + ((h >> 4) % 22) + 5, 2, 2);
            }
            break;
        }

        case TILE_GRASS_DARK: {
            ctx.fillStyle = '#1e5c28';
            ctx.fillRect(sx, sy, s, s);
            // Canopy shadow dots
            ctx.fillStyle = '#143d1c';
            for (let i = 0; i < 5; i++) {
                const dx = ((h * (i + 1) * 7)  % 24) + 4;
                const dy = ((h * (i + 1) * 11) % 24) + 4;
                ctx.fillRect(sx + dx, sy + dy, 2, 2);
            }
            // Single bright highlight
            ctx.fillStyle = '#3a8042';
            ctx.fillRect(sx + ((h * 3) % 20) + 6, sy + ((h * 5) % 20) + 6, 2, 2);
            break;
        }

        case TILE_WATER: {
            ctx.fillStyle = '#1a3d8f';
            ctx.fillRect(sx, sy, s, s);
            // Animated ripple lines
            ctx.fillStyle = '#2255bb';
            const shift = Math.floor(time * 2.5 + col * 0.7) % s;
            for (let wy = 4; wy < s; wy += 9) {
                const seg = (shift + wy * 2) % s;
                ctx.fillRect(sx,          sy + wy, seg,          2);
                if (seg + 4 < s) ctx.fillRect(sx + seg + 4, sy + wy, s - seg - 4, 2);
            }
            // Occasional shimmer dot
            if ((h & 0x7) < 2) {
                ctx.fillStyle = '#5588dd';
                ctx.fillRect(sx + (h % 24) + 4, sy + ((h >> 3) % 24) + 4, 3, 1);
            }
            break;
        }

        case TILE_DIRT: {
            ctx.fillStyle = '#7a5238';
            ctx.fillRect(sx, sy, s, s);
            // Top highlight strip
            ctx.fillStyle = '#9a6a48';
            ctx.fillRect(sx, sy, s, 2);
            // Pebble dots
            ctx.fillStyle = '#5a3520';
            for (let i = 0; i < 3; i++) {
                const dx = ((h * (i + 3) * 5) % 24) + 4;
                const dy = ((h * (i + 2) * 7) % 24) + 4;
                ctx.fillRect(sx + dx, sy + dy, 2, 2);
            }
            break;
        }

        case TILE_STONE: {
            ctx.fillStyle = '#555555';
            ctx.fillRect(sx, sy, s, s);
            // Top-left bevel highlight
            ctx.fillStyle = '#6e6e6e';
            ctx.fillRect(sx, sy,     s, 2);
            ctx.fillRect(sx, sy + 2, 2, s - 2);
            // Mortar lines
            ctx.fillStyle = '#333333';
            ctx.fillRect(sx, sy + 11, s, 1);
            ctx.fillRect(sx, sy + 22, s, 1);
            // Staggered brick joints
            const bo = (col % 2 === 0) ? 0 : 16;
            ctx.fillRect(sx +  bo,           sy,      1, 11);
            ctx.fillRect(sx + (bo + 16) % s, sy,      1, 11);
            ctx.fillRect(sx + (bo +  8) % s, sy + 12, 1, 10);
            break;
        }
    }
}

// ---- Main draw call (replaces drawBackground in PLAYING state) ----
function drawTerrain(ctx, camX, camY, canvasW, canvasH, time) {
    // Fallback fill in case map hasn't generated yet
    ctx.fillStyle = '#3a7d44';
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (!TILE_MAP) return;

    const startCol = Math.max(0, Math.floor(camX / GRID_SIZE));
    const startRow = Math.max(0, Math.floor(camY / GRID_SIZE));
    const endCol   = Math.min(MAP_COLS - 1, Math.floor((camX + canvasW)  / GRID_SIZE) + 1);
    const endRow   = Math.min(MAP_ROWS - 1, Math.floor((camY + canvasH) / GRID_SIZE) + 1);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            const sx   = col * GRID_SIZE - camX;
            const sy   = row * GRID_SIZE - camY;
            const type = TILE_MAP[row * MAP_COLS + col];
            _drawTile(ctx, sx, sy, type, col, row, time);
        }
    }
}

// Generate on load (deterministic, no game state needed)
generateTerrain();
