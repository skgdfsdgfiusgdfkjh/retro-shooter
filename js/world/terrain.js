// ============================================================
// terrain.js — Tile map generation, rendering, and collision
// ============================================================

const TILE_GRASS      = 0;
const TILE_GRASS_DARK = 1;  // forest / tree canopy
const TILE_WATER      = 2;  // SOLID — impassable
const TILE_DIRT       = 3;
const TILE_STONE      = 4;  // SOLID — impassable

const MAP_COLS = WORLD_WIDTH  / GRID_SIZE;   // 100
const MAP_ROWS = WORLD_HEIGHT / GRID_SIZE;   // 100

let TILE_MAP = null;

// ---- Helpers ----

function _tileHash(col, row) {
    let h = (col * 374761393 ^ row * 668265263) >>> 0;
    h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
    return h ^ (h >>> 16);
}

function _makeRng(seed) {
    let s = seed | 0;
    return () => {
        s = Math.imul(1664525, s) + 1013904223 | 0;
        return (s >>> 0) / 4294967296;
    };
}

function _getTile(col, row) {
    if (!TILE_MAP) return TILE_GRASS;
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return TILE_GRASS;
    return TILE_MAP[row * MAP_COLS + col];
}

// overwrite=true bypasses the water-protection guard
function _setTile(col, row, type, overwrite) {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return;
    if (!overwrite && TILE_MAP[row * MAP_COLS + col] === TILE_WATER) return;
    TILE_MAP[row * MAP_COLS + col] = type;
}

// ============================================================
// Structure / feature placement helpers
// ============================================================

// Organic lake + muddy dirt shore
function _placeLake(rng, cx, cy, rx, ry) {
    for (let r = cy - ry - 2; r <= cy + ry + 2; r++) {
        for (let c = cx - rx - 2; c <= cx + rx + 2; c++) {
            const dx   = (c - cx) / rx;
            const dy   = (r - cy) / ry;
            const dist = Math.hypot(dx, dy) + (rng() - 0.5) * 0.45;
            if (dist < 0.88) {
                _setTile(c, r, TILE_WATER, true);
            } else if (dist < 1.2 && _getTile(c, r) === TILE_GRASS) {
                _setTile(c, r, TILE_DIRT, false);
            }
        }
    }
}

// Winding river across the map along a target row band
function _placeRiver(rng, targetRow, fromCol, toCol) {
    let r = targetRow;
    for (let c = fromCol; c < toCol; c++) {
        r += (rng() < 0.25) ? (rng() < 0.5 ? 1 : -1) : 0;
        r  = Math.max(targetRow - 4, Math.min(targetRow + 4, r));
        _setTile(c, r,     TILE_WATER, true);
        _setTile(c, r + 1, TILE_WATER, true);
        if (rng() < 0.3) _setTile(c, r - 1, TILE_WATER, true);
        if (rng() < 0.3) _setTile(c, r + 2, TILE_WATER, true);
        // Dirt shores
        if (_getTile(c, r - 1) === TILE_GRASS) _setTile(c, r - 1, TILE_DIRT, false);
        if (_getTile(c, r + 2) === TILE_GRASS) _setTile(c, r + 2, TILE_DIRT, false);
    }
}

// Rectangular ring of stone walls with door openings
// doors: array of 'n','s','e','w'
function _placeBuilding(cx, cy, w, h, doors) {
    const L = cx - Math.floor(w / 2);
    const T = cy - Math.floor(h / 2);
    for (let r = T; r < T + h; r++) {
        for (let c = L; c < L + w; c++) {
            const onEdge = (r === T || r === T + h - 1 || c === L || c === L + w - 1);
            if (!onEdge) continue;
            let isDoor = false;
            if (doors.includes('n') && r === T       && Math.abs(c - cx) <= 1) isDoor = true;
            if (doors.includes('s') && r === T + h-1 && Math.abs(c - cx) <= 1) isDoor = true;
            if (doors.includes('e') && c === L + w-1 && Math.abs(r - cy) <= 1) isDoor = true;
            if (doors.includes('w') && c === L       && Math.abs(r - cy) <= 1) isDoor = true;
            if (!isDoor && _getTile(c, r) !== TILE_WATER) {
                _setTile(c, r, TILE_STONE, true);
            }
        }
    }
}

// Partial/ruined building — random sections removed for a worn look
function _placeRuin(rng, cx, cy, w, h, integrity) {
    const L = cx - Math.floor(w / 2);
    const T = cy - Math.floor(h / 2);
    for (let r = T; r < T + h; r++) {
        for (let c = L; c < L + w; c++) {
            const onEdge = (r === T || r === T + h - 1 || c === L || c === L + w - 1);
            if (!onEdge) continue;
            if (rng() < integrity && _getTile(c, r) !== TILE_WATER) {
                _setTile(c, r, TILE_STONE, false);
            }
        }
    }
}

// Short straight wall segment (horizontal or vertical)
function _placeWall(c1, r1, c2, r2) {
    const dc = Math.sign(c2 - c1);
    const dr = Math.sign(r2 - r1);
    let c = c1, r = r1;
    while (true) {
        if (_getTile(c, r) !== TILE_WATER) _setTile(c, r, TILE_STONE, false);
        if (c === c2 && r === r2) break;
        c += dc;
        r += dr;
    }
}

// Slightly wandering dirt path between two tile positions
function _placePath(rng, c1, r1, c2, r2) {
    let c = c1, r = r1;
    while (c !== c2 || r !== r2) {
        const dx = c2 - c, dy = r2 - r;
        if (dx === 0 && dy === 0) break;
        // 2-wide path
        for (let dc = 0; dc <= 1; dc++) {
            for (let dr = 0; dr <= 1; dr++) {
                const t = _getTile(c + dc, r + dr);
                if (t !== TILE_WATER && t !== TILE_STONE) {
                    _setTile(c + dc, r + dr, TILE_DIRT, false);
                }
            }
        }
        if (Math.abs(dx) >= Math.abs(dy)) {
            c += Math.sign(dx);
            if (rng() < 0.18 && dy !== 0) r += Math.sign(dy);
        } else {
            r += Math.sign(dy);
            if (rng() < 0.18 && dx !== 0) c += Math.sign(dx);
        }
    }
}

// Organic dark-grass / forest cluster
function _placeForest(rng, cx, cy, rad) {
    for (let dr = -rad - 1; dr <= rad + 1; dr++) {
        for (let dc = -rad - 1; dc <= rad + 1; dc++) {
            if (Math.hypot(dc, dr) < rad + (rng() - 0.5) * 1.8) {
                if (_getTile(cx + dc, cy + dr) === TILE_GRASS) {
                    _setTile(cx + dc, cy + dr, TILE_GRASS_DARK, false);
                }
            }
        }
    }
}

// ============================================================
// Main generation
// ============================================================
function generateTerrain() {
    const rng = _makeRng(0xcafebabe);
    TILE_MAP   = new Uint8Array(MAP_COLS * MAP_ROWS).fill(TILE_GRASS);

    // --- Water lakes at corners and mid-edges ---
    _placeLake(rng, 14, 14, 6,  5);
    _placeLake(rng, 82, 16, 7,  5);
    _placeLake(rng, 16, 80, 5,  6);
    _placeLake(rng, 84, 82, 6,  6);
    _placeLake(rng, 50, 14, 5,  4);   // north centre lake
    _placeLake(rng, 16, 50, 4,  5);   // west lake
    _placeLake(rng, 85, 52, 5,  4);   // east lake

    // --- Winding river cutting east–west through the upper third ---
    _placeRiver(rng, 33, 0, MAP_COLS);

    // --- Central fortress: stone ring, 4 wide doorways ---
    _placeBuilding(50, 50, 18, 14, ['n', 's', 'e', 'w']);

    // --- Cardinal outposts ---
    _placeRuin(rng, 50, 80, 10, 8,  0.78);   // south
    _placeRuin(rng, 80, 52, 8,  10, 0.72);   // east
    _placeRuin(rng, 22, 52, 8,  10, 0.68);   // west

    // North outpost is above the river — place as a full building to look intentional
    _placeBuilding(50, 20, 8, 6, ['s']);

    // --- Mid-field ruins (L-shapes, partial rings, isolated fragments) ---
    _placeRuin(rng, 32, 28,  6, 5, 0.62);
    _placeRuin(rng, 68, 28,  6, 5, 0.58);
    _placeRuin(rng, 30, 66,  5, 6, 0.65);
    _placeRuin(rng, 70, 66,  5, 6, 0.60);
    _placeRuin(rng, 40, 60,  5, 4, 0.55);
    _placeRuin(rng, 62, 42,  4, 5, 0.55);
    _placeRuin(rng, 28, 42,  4, 4, 0.50);
    _placeRuin(rng, 72, 60,  4, 4, 0.50);

    // --- Scattered lone wall fragments ---
    _placeWall(18, 28, 22, 28);
    _placeWall(76, 30, 76, 34);
    _placeWall(10, 60, 10, 65);
    _placeWall(88, 60, 92, 60);
    _placeWall(40, 85, 44, 85);
    _placeWall(55, 88, 55, 92);
    _placeWall(35, 18, 35, 22);
    _placeWall(64, 24, 68, 24);
    for (let i = 0; i < 18; i++) {
        const c  = 5  + Math.floor(rng() * 90);
        const r  = 45 + Math.floor(rng() * 50);
        const l  = 2  + Math.floor(rng() * 5);
        const hz = rng() < 0.5;
        _placeWall(c, r, c + (hz ? l : 0), r + (hz ? 0 : l));
    }

    // --- Dirt paths connecting the structures ---
    _placePath(rng, 50, 43, 50, 26);   // fortress → north outpost
    _placePath(rng, 50, 57, 50, 76);   // fortress → south ruin
    _placePath(rng, 41, 50, 30, 52);   // fortress → west ruin
    _placePath(rng, 59, 50, 72, 52);   // fortress → east ruin
    _placePath(rng,  0, 52, 14, 52);   // world edge → west ruin
    _placePath(rng, 88, 52, 100, 52);  // east ruin → world edge
    _placePath(rng, 50, 88, 50, 100);  // south → world edge
    _placePath(rng, 50, 26, 50,  2);   // north outpost → world edge (crosses over river on bridge)
    _placePath(rng, 32, 28, 32, 40);   // NW ruin → mid
    _placePath(rng, 68, 28, 68, 40);   // NE ruin → mid

    // --- Forest clusters (edges and corners, away from centre) ---
    const forests = [
        [8,  28,  4], [24, 12,  5], [66, 12,  5], [90, 26,  4],
        [90, 68,  5], [68, 88,  4], [24, 88,  5], [8,  68,  4],
        [36, 36,  3], [64, 36,  3], [36, 64,  3], [64, 64,  3],
        [12, 52,  3], [88, 50,  3], [50,  6,  3], [50, 94,  3],
        [20, 36,  3], [80, 36,  3], [20, 68,  3], [80, 68,  3],
    ];
    for (const [cx, cy, r] of forests) _placeForest(rng, cx, cy, r);

    // --- Ensure central spawn is clear ---
    for (let r = 45; r <= 55; r++) {
        for (let c = 45; c <= 55; c++) {
            if (_getTile(c, r) === TILE_STONE) _setTile(c, r, TILE_GRASS, true);
        }
    }
}

// ============================================================
// Per-tile rendering
// ============================================================
function _drawTile(ctx, sx, sy, type, col, row, time) {
    const s = GRID_SIZE;
    const h = _tileHash(col, row);

    switch (type) {

        case TILE_GRASS: {
            ctx.fillStyle = '#3d9945';
            ctx.fillRect(sx, sy, s, s);

            // Blade clumps (3 positions per tile, deterministic)
            ctx.fillStyle = '#4eb054';
            for (let i = 0; i < 3; i++) {
                const bx = ((h * (i * 7 + 1)) % 22) + 4;
                const by = ((h * (i * 5 + 3)) % 20) + 6;
                ctx.fillRect(sx + bx,     sy + by,     1, 10);
                ctx.fillRect(sx + bx + 2, sy + by + 2, 1, 8);
            }
            // Occasional slightly darker patch
            if ((h & 0x1f) < 4) {
                ctx.fillStyle = '#2d7535';
                ctx.fillRect(sx + (h % 20) + 4, sy + ((h >> 5) % 20) + 4, 7, 5);
            }
            // Rare flower (~3% of tiles)
            if ((h & 0x3f) === 0) {
                const fx = (h >> 6)  % 22 + 5;
                const fy = (h >> 11) % 22 + 5;
                ctx.fillStyle = (h & 0x10000) ? '#e84455' : '#f0e030';
                ctx.fillRect(sx + fx,     sy + fy,     3, 3);
                ctx.fillStyle = '#ffffffcc';
                ctx.fillRect(sx + fx + 1, sy + fy + 1, 1, 1);
            }
            // Shadow received from stone above or to the left
            if (_getTile(col, row - 1) === TILE_STONE) {
                ctx.fillStyle = 'rgba(0,0,0,0.38)';
                ctx.fillRect(sx, sy, s, 7);
            }
            if (_getTile(col - 1, row) === TILE_STONE) {
                ctx.fillStyle = 'rgba(0,0,0,0.30)';
                ctx.fillRect(sx, sy, 7, s);
            }
            break;
        }

        case TILE_GRASS_DARK: {
            // Undergrowth base
            ctx.fillStyle = '#0e3a12';
            ctx.fillRect(sx, sy, s, s);
            // Main canopy
            ctx.fillStyle = '#1a6122';
            ctx.fillRect(sx + 2, sy + 1, s - 4, s - 3);
            ctx.fillRect(sx + 1, sy + 2, s - 2, s - 5);
            // Lit face (NW)
            const litW = 13 + (h & 0x3);
            const litH = 11 + ((h >> 2) & 0x3);
            ctx.fillStyle = '#2a7830';
            ctx.fillRect(sx + 2, sy + 2, litW, litH);
            // Highlight dot
            ctx.fillStyle = '#44a848';
            ctx.fillRect(sx + 3 + (h & 0x3), sy + 3 + ((h >> 3) & 0x3), 4, 3);
            // Shadow fringe (SE)
            ctx.fillStyle = '#0a2a0d';
            ctx.fillRect(sx + s - 8, sy + s - 7, 6, 5);
            ctx.fillRect(sx + s - 5, sy + s - 5, 3, 3);
            // Shadow received from stone
            if (_getTile(col, row - 1) === TILE_STONE) {
                ctx.fillStyle = 'rgba(0,0,0,0.45)';
                ctx.fillRect(sx, sy, s, 7);
            }
            if (_getTile(col - 1, row) === TILE_STONE) {
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.fillRect(sx, sy, 7, s);
            }
            break;
        }

        case TILE_WATER: {
            ctx.fillStyle = '#1638a8';
            ctx.fillRect(sx, sy, s, s);
            // Shallow band at top
            ctx.fillStyle = '#2050cc';
            ctx.fillRect(sx, sy, s, 10);
            // Animated ripple dashes
            ctx.fillStyle = '#3462d8';
            const wPhase = Math.floor(time * 2.5 + col * 0.8) % s;
            for (let wy = 6; wy < s; wy += 10) {
                const seg = (wPhase + wy * 3) % (s - 8);
                ctx.fillRect(sx + seg, sy + wy, 8, 2);
            }
            // Occasional deep shimmer
            if ((h & 0x7) < 2) {
                ctx.fillStyle = '#5588ee';
                ctx.fillRect(sx + (h % 22) + 5, sy + ((h >> 3) % 22) + 5, 4, 1);
            }
            // Shore foam where water meets non-water
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            if (_getTile(col, row - 1) !== TILE_WATER) ctx.fillRect(sx,     sy,         s, 3);
            if (_getTile(col, row + 1) !== TILE_WATER) ctx.fillRect(sx,     sy + s - 3, s, 3);
            if (_getTile(col - 1, row) !== TILE_WATER) ctx.fillRect(sx,     sy,         3, s);
            if (_getTile(col + 1, row) !== TILE_WATER) ctx.fillRect(sx + s - 3, sy,     3, s);
            break;
        }

        case TILE_DIRT: {
            ctx.fillStyle = '#7a5035';
            ctx.fillRect(sx, sy, s, s);
            // Top highlight band
            ctx.fillStyle = '#9c6848';
            ctx.fillRect(sx, sy, s, 3);
            // Wheel/foot groove marks
            ctx.fillStyle = '#5c3820';
            const g1 = (h % 16) + 4;
            const g2 = g1 + 12;
            ctx.fillRect(sx, sy + g1, s, 1);
            if (g2 < s) ctx.fillRect(sx, sy + g2, s, 1);
            // Pebble dots
            ctx.fillStyle = '#9a6848';
            for (let i = 0; i < 3; i++) {
                const dx = ((h * (i + 3) * 5) % 24) + 4;
                const dy = ((h * (i + 2) * 7) % 24) + 4;
                ctx.fillRect(sx + dx, sy + dy, 2, 2);
            }
            // Shadow received from stone
            if (_getTile(col, row - 1) === TILE_STONE) {
                ctx.fillStyle = 'rgba(0,0,0,0.40)';
                ctx.fillRect(sx, sy, s, 7);
            }
            if (_getTile(col - 1, row) === TILE_STONE) {
                ctx.fillStyle = 'rgba(0,0,0,0.32)';
                ctx.fillRect(sx, sy, 7, s);
            }
            break;
        }

        case TILE_STONE: {
            // Deep base / mortar
            ctx.fillStyle = '#1e1c2c';
            ctx.fillRect(sx, sy, s, s);
            // Main stone face
            ctx.fillStyle = '#44425a';
            ctx.fillRect(sx + 1, sy + 1, s - 2, s - 2);
            // Top-left bevel (lit)
            ctx.fillStyle = '#5e5c78';
            ctx.fillRect(sx + 1, sy + 1, s - 2, 3);
            ctx.fillRect(sx + 1, sy + 1, 3, s - 2);
            // Mortar joints — horizontal
            ctx.fillStyle = '#1e1c2c';
            ctx.fillRect(sx, sy + 12, s, 2);
            ctx.fillRect(sx, sy + 24, s, 2);
            // Mortar joints — vertical (staggered by row parity)
            const bo = (row % 2 === 0) ? 0 : 16;
            ctx.fillRect(sx +  bo,            sy,      2, 12);
            ctx.fillRect(sx + (bo + 16) % s,  sy,      2, 12);
            ctx.fillRect(sx + (bo +  8) % s,  sy + 14, 2, 10);
            ctx.fillRect(sx + (bo + 24) % s,  sy + 14, 2, 10);
            // Per-brick face highlight (small lit patch on each brick)
            ctx.fillStyle = '#5a587a';
            ctx.fillRect(sx + 2, sy + 2, 6, 4);
            const bx2 = (bo + 18) % s;
            if (bx2 + 6 < s) ctx.fillRect(sx + bx2, sy + 2, 6, 4);
            // Bottom / right drop-shadow edge (wall looks tall)
            const southIsFloor = _getTile(col, row + 1) !== TILE_STONE;
            const eastIsFloor  = _getTile(col + 1, row) !== TILE_STONE;
            if (southIsFloor) {
                ctx.fillStyle = '#0a0818';
                ctx.fillRect(sx, sy + s - 5, s, 5);
            }
            if (eastIsFloor) {
                ctx.fillStyle = '#0a0818';
                ctx.fillRect(sx + s - 5, sy, 5, s);
            }
            break;
        }
    }
}

// ============================================================
// Main draw call — renders only visible tiles
// ============================================================
function drawTerrain(ctx, camX, camY, canvasW, canvasH, time) {
    ctx.fillStyle = '#3d9945';
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (!TILE_MAP) return;

    const startCol = Math.max(0, Math.floor(camX / GRID_SIZE));
    const startRow = Math.max(0, Math.floor(camY / GRID_SIZE));
    const endCol   = Math.min(MAP_COLS - 1, Math.floor((camX + canvasW)  / GRID_SIZE) + 1);
    const endRow   = Math.min(MAP_ROWS - 1, Math.floor((camY + canvasH) / GRID_SIZE) + 1);

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            _drawTile(
                ctx,
                col * GRID_SIZE - camX,
                row * GRID_SIZE - camY,
                TILE_MAP[row * MAP_COLS + col],
                col, row, time
            );
        }
    }
}

// ============================================================
// Collision — circle vs solid tile AABB
// ============================================================

function isTileSolid(col, row) {
    if (!TILE_MAP) return false;
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return true;
    const t = TILE_MAP[row * MAP_COLS + col];
    return t === TILE_STONE || t === TILE_WATER;
}

/**
 * Push `entity` (needs .x .y .radius) out of any solid tiles it overlaps.
 * Call this after applying movement each frame.
 */
function resolveTerrainCollision(entity) {
    const r      = entity.radius;
    const minCol = Math.floor((entity.x - r) / GRID_SIZE);
    const maxCol = Math.floor((entity.x + r) / GRID_SIZE);
    const minRow = Math.floor((entity.y - r) / GRID_SIZE);
    const maxRow = Math.floor((entity.y + r) / GRID_SIZE);

    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            if (!isTileSolid(col, row)) continue;

            const tileL = col * GRID_SIZE;
            const tileR = tileL + GRID_SIZE;
            const tileT = row * GRID_SIZE;
            const tileB = tileT + GRID_SIZE;

            // Closest point on tile AABB to circle centre
            const closestX = Math.max(tileL, Math.min(entity.x, tileR));
            const closestY = Math.max(tileT, Math.min(entity.y, tileB));

            const dx = entity.x - closestX;
            const dy = entity.y - closestY;
            const distSq = dx * dx + dy * dy;

            if (distSq >= r * r) continue; // no overlap

            if (distSq === 0) {
                // Centre is exactly on tile boundary — push toward nearest edge
                const dL = entity.x - tileL, dR = tileR - entity.x;
                const dT = entity.y - tileT, dB = tileB - entity.y;
                const m  = Math.min(dL, dR, dT, dB);
                if      (m === dL) entity.x = tileL - r;
                else if (m === dR) entity.x = tileR + r;
                else if (m === dT) entity.y = tileT - r;
                else               entity.y = tileB + r;
            } else {
                const dist = Math.sqrt(distSq);
                const push = r - dist;
                entity.x  += (dx / dist) * push;
                entity.y  += (dy / dist) * push;
            }
        }
    }
}

// Generate map on script load (deterministic — no game-state dependency)
generateTerrain();
