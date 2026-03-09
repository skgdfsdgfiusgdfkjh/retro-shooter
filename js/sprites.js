// ============================================================
// sprites.js — Pixel art draw functions
// ============================================================

/**
 * Draw a sprite frame.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number[][]} frame   - 2D array; 0 = transparent, other values index palette
 * @param {number} x           - top-left x on canvas
 * @param {number} y           - top-left y on canvas
 * @param {number} ps          - pixel size (PIXEL constant)
 * @param {string[]} palette   - palette[0] unused (transparent), palette[1..n] = colors
 */
function drawSprite(ctx, frame, x, y, ps, palette) {
    for (let row = 0; row < frame.length; row++) {
        for (let col = 0; col < frame[row].length; col++) {
            const v = frame[row][col];
            if (v === 0) continue;
            ctx.fillStyle = palette[v];
            ctx.fillRect(x + col * ps, y + row * ps, ps, ps);
        }
    }
}

// ---------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------
const PALETTE_PLAYER = [
    null,           // 0 transparent
    '#f5c5a3',      // 1 skin
    '#222222',      // 2 dark / outline
    '#00cc66',      // 3 shirt / body
    '#00ff88',      // 4 bright green highlight
    '#888888',      // 5 gun grey
    '#cccccc',      // 6 gun light
];

const PALETTE_ENEMY_BASIC = [
    null,
    '#ff2222',      // 1 body
    '#aa0000',      // 2 dark
    '#ff6666',      // 3 highlight
    '#ffffff',      // 4 eye
    '#000000',      // 5 pupil
];

const PALETTE_ENEMY_FAST = [
    null,
    '#ffdd00',      // 1 body
    '#aa8800',      // 2 dark
    '#ffff66',      // 3 highlight
    '#ffffff',      // 4 eye
    '#000000',      // 5 pupil
];

const PALETTE_ENEMY_TANK = [
    null,
    '#bb44ff',      // 1 body
    '#660099',      // 2 dark
    '#dd88ff',      // 3 highlight
    '#ffffff',      // 4 eye
    '#000000',      // 5 pupil
];

// ---------------------------------------------------------------
// Player frames  (7×9 pixels, rendered at PIXEL size each)
// Rows: head, torso, legs
// ---------------------------------------------------------------
const PLAYER_FRAMES = [
    // Frame 0 — idle / walk A
    [
        [0,0,2,2,2,0,0],
        [0,2,1,1,1,2,0],
        [0,2,1,1,1,2,0],
        [0,2,2,1,2,2,0],
        [0,3,3,3,3,3,0],
        [2,3,4,3,4,3,2],
        [0,3,3,3,3,3,0],
        [0,2,0,0,0,2,0],
        [0,2,0,0,0,2,0],
    ],
    // Frame 1 — walk B (legs shifted)
    [
        [0,0,2,2,2,0,0],
        [0,2,1,1,1,2,0],
        [0,2,1,1,1,2,0],
        [0,2,2,1,2,2,0],
        [0,3,3,3,3,3,0],
        [2,3,4,3,4,3,2],
        [0,3,3,3,3,3,0],
        [0,0,2,0,2,0,0],
        [0,2,0,0,0,2,0],
    ],
    // Frame 2 — walk C
    [
        [0,0,2,2,2,0,0],
        [0,2,1,1,1,2,0],
        [0,2,1,1,1,2,0],
        [0,2,2,1,2,2,0],
        [0,3,3,3,3,3,0],
        [2,3,4,3,4,3,2],
        [0,3,3,3,3,3,0],
        [0,2,0,0,0,2,0],
        [0,2,0,0,0,2,0],
    ],
    // Frame 3 — walk D
    [
        [0,0,2,2,2,0,0],
        [0,2,1,1,1,2,0],
        [0,2,1,1,1,2,0],
        [0,2,2,1,2,2,0],
        [0,3,3,3,3,3,0],
        [2,3,4,3,4,3,2],
        [0,3,3,3,3,3,0],
        [0,2,0,0,2,0,0],
        [0,0,0,0,0,2,0],
    ],
];

// ---------------------------------------------------------------
// Enemy frames — 5×7 pixels
// ---------------------------------------------------------------
const ENEMY_FRAMES = [
    // Frame 0
    [
        [0,1,1,1,0],
        [1,1,1,1,1],
        [1,4,1,4,1],
        [1,5,1,5,1],
        [1,1,1,1,1],
        [2,1,2,1,2],
        [2,0,2,0,2],
    ],
    // Frame 1 (legs apart)
    [
        [0,1,1,1,0],
        [1,1,1,1,1],
        [1,4,1,4,1],
        [1,5,1,5,1],
        [1,1,1,1,1],
        [1,2,1,2,1],
        [2,0,0,0,2],
    ],
];

// ---------------------------------------------------------------
// Draw player (centered at cx, cy, rotated by angle)
// ---------------------------------------------------------------
function drawPlayer(ctx, cx, cy, angle, frameIndex) {
    const ps = PIXEL;
    const frame = PLAYER_FRAMES[frameIndex % PLAYER_FRAMES.length];
    const w = frame[0].length * ps;
    const h = frame.length    * ps;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI / 2);

    // Draw gun first (behind player visually when rotated)
    ctx.fillStyle = PALETTE_PLAYER[5];
    ctx.fillRect(ps / 2, -h / 2 - ps * 3, ps * 2, ps * 4);
    ctx.fillStyle = PALETTE_PLAYER[6];
    ctx.fillRect(ps / 2, -h / 2 - ps * 3, ps, ps);

    // Draw sprite centered
    drawSprite(ctx, frame, -w / 2, -h / 2, ps, PALETTE_PLAYER);

    ctx.restore();
}

// ---------------------------------------------------------------
// Draw enemy (centered at cx, cy, rotated toward target angle)
// ---------------------------------------------------------------
function drawEnemy(ctx, cx, cy, angle, frameIndex, type) {
    const ps = PIXEL;
    const frame = ENEMY_FRAMES[frameIndex % ENEMY_FRAMES.length];
    const w = frame[0].length * ps;
    const h = frame.length    * ps;

    const palette = type === 'basic' ? PALETTE_ENEMY_BASIC
                  : type === 'fast'  ? PALETTE_ENEMY_FAST
                  :                    PALETTE_ENEMY_TANK;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI / 2);

    const scale = type === 'tank' ? 1.5 : 1;
    ctx.scale(scale, scale);

    drawSprite(ctx, frame, -w / 2, -h / 2, ps, palette);

    ctx.restore();
}

// ---------------------------------------------------------------
// Draw bullet (cx, cy)
// ---------------------------------------------------------------
function drawBullet(ctx, cx, cy, trailPoints) {
    // Trail
    if (trailPoints && trailPoints.length > 1) {
        ctx.strokeStyle = COLORS.BULLET_GLOW;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
        for (let i = 1; i < trailPoints.length; i++) {
            ctx.lineTo(trailPoints[i].x, trailPoints[i].y);
        }
        ctx.stroke();
    }

    // Glow
    ctx.shadowColor = COLORS.BULLET;
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = COLORS.BULLET;
    ctx.beginPath();
    ctx.arc(cx, cy, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ---------------------------------------------------------------
// Draw particle
// ---------------------------------------------------------------
function drawParticle(ctx, p) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------
// Draw tiled grid background
// ---------------------------------------------------------------
function drawBackground(ctx, camX, camY, canvasW, canvasH) {
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth   = 1;

    const startCol = Math.floor(camX / GRID_SIZE);
    const startRow = Math.floor(camY / GRID_SIZE);
    const endCol   = startCol + Math.ceil(canvasW / GRID_SIZE) + 1;
    const endRow   = startRow + Math.ceil(canvasH / GRID_SIZE) + 1;

    for (let col = startCol; col <= endCol; col++) {
        const sx = col * GRID_SIZE - camX;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, canvasH);
        ctx.stroke();
    }
    for (let row = startRow; row <= endRow; row++) {
        const sy = row * GRID_SIZE - camY;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(canvasW, sy);
        ctx.stroke();
    }
}

// ---------------------------------------------------------------
// Scanline overlay (CRT effect)
// ---------------------------------------------------------------
function drawScanlines(ctx, canvasW, canvasH) {
    ctx.fillStyle = COLORS.SCANLINE;
    for (let y = 0; y < canvasH; y += 2) {
        ctx.fillRect(0, y, canvasW, 1);
    }
}

// ---------------------------------------------------------------
// Draw custom crosshair cursor
// ---------------------------------------------------------------
function drawCursor(ctx, mx, my) {
    const size = 12;
    const gap  = 4;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth   = 2;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = 6;

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(mx - size, my);
    ctx.lineTo(mx - gap, my);
    ctx.moveTo(mx + gap, my);
    ctx.lineTo(mx + size, my);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(mx, my - size);
    ctx.lineTo(mx, my - gap);
    ctx.moveTo(mx, my + gap);
    ctx.lineTo(mx, my + size);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(mx, my, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
}
