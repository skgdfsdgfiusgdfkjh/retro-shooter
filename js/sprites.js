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

// Basic — red schoolgirl "Akane": twin-tails, sailor uniform, huge eyes, A-line skirt
const PALETTE_ENEMY_BASIC = [
    null,
    '#ffd0a8',      // 1 skin
    '#331100',      // 2 dark outline
    '#cc1133',      // 3 red uniform
    '#ffffff',      // 4 white (bow, socks)
    '#aa1122',      // 5 dark-red hair
    '#88ccff',      // 6 blue eyes
    '#222222',      // 7 dark shoes
];

// Fast — yellow ninja girl "Kaze": sleek suit, red headband, absurdly long legs, ponytail
const PALETTE_ENEMY_FAST = [
    null,
    '#ffd0a8',      // 1 skin
    '#111122',      // 2 dark outline
    '#ffcc00',      // 3 yellow suit
    '#ff8800',      // 4 orange accent
    '#111133',      // 5 dark blue-black hair
    '#ff2244',      // 6 red headband
    '#ffffff',      // 7 white highlights
];

// Tank — purple dark-mage "Yami": enormous silver hair, wide hips, voluminous robes, gold eyes
const PALETTE_ENEMY_TANK = [
    null,
    '#ffd0a8',      // 1 skin
    '#220033',      // 2 dark-purple outline
    '#8833cc',      // 3 purple robes
    '#cc77ff',      // 4 lavender accent
    '#eeeeff',      // 5 silver-white hair
    '#ffcc44',      // 6 gold (eyes, trim)
    '#440088',      // 7 deep purple (waist cinch)
    '#ff88bb',      // 8 rose lips
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
// Enemy frames — per-type pixel art (9–11 wide × 13–15 tall)
// Palette key: 0=transparent, others index the type's palette
// ---------------------------------------------------------------

// BASIC — red schoolgirl "Akane"  (9×13)
// Exaggerated: big head, huge eyes, tiny waist, flared A-line skirt
const ENEMY_FRAMES_BASIC = [
    // Frame 0 — idle
    [
        [0,5,5,2,2,2,5,5,0],   // twin-tails fan out
        [5,2,2,1,1,1,2,2,5],   // head framed by hair
        [5,2,1,1,1,1,1,2,5],   // forehead
        [0,2,6,2,1,2,6,2,0],   // BIG eyes (6=iris, 2=pupil outline)
        [0,2,1,1,1,1,1,2,0],   // cheeks / tiny mouth hint
        [0,0,2,3,4,3,2,0,0],   // sailor collar + white ribbon bow
        [0,2,3,3,3,3,3,2,0],   // chest (uniform top)
        [0,2,3,3,3,3,3,2,0],   // waist (same width — tiny)
        [0,0,3,3,3,3,3,0,0],   // skirt flares wide
        [0,0,3,3,0,3,3,0,0],   // skirt hem — gap shows legs
        [0,0,4,1,0,1,4,0,0],   // knee socks (4=white)
        [0,0,4,1,0,1,4,0,0],   // lower socks
        [0,0,7,7,0,7,7,0,0],   // mary-jane shoes
    ],
    // Frame 1 — walk (legs shifted)
    [
        [0,5,5,2,2,2,5,5,0],
        [5,2,2,1,1,1,2,2,5],
        [5,2,1,1,1,1,1,2,5],
        [0,2,6,2,1,2,6,2,0],
        [0,2,1,1,1,1,1,2,0],
        [0,0,2,3,4,3,2,0,0],
        [0,2,3,3,3,3,3,2,0],
        [0,2,3,3,3,3,3,2,0],
        [0,0,3,3,3,3,3,0,0],
        [0,0,0,3,3,3,0,0,0],   // narrower skirt as stride opens
        [0,0,4,4,0,1,0,0,0],   // one leg forward
        [0,0,0,1,0,4,4,0,0],   // other leg back
        [0,0,7,7,0,0,7,0,0],   // shoes offset
    ],
];

// FAST — yellow ninja girl "Kaze"  (9×15)
// Exaggerated: impossibly long legs, razor-thin waist, wild ponytail, red headband
const ENEMY_FRAMES_FAST = [
    // Frame 0 — idle
    [
        [0,0,5,5,5,0,5,5,0],   // ponytail flying up-right
        [0,5,2,1,1,2,0,5,5],   // head + ponytail continues
        [0,0,6,6,6,6,6,0,0],   // red headband across forehead
        [0,0,2,1,1,1,2,0,0],   // upper face
        [0,0,2,7,2,7,2,0,0],   // two big eyes (7=white highlight)
        [0,0,2,1,1,1,2,0,0],   // lower face / small mouth
        [0,0,2,3,4,3,2,0,0],   // collar with orange accent
        [0,2,3,4,3,3,3,2,0],   // chest — accent stripe
        [0,2,3,3,3,3,3,2,0],   // waist (razor thin)
        [0,0,2,3,3,3,2,0,0],   // narrow hips
        [0,0,2,1,0,1,2,0,0],   // upper legs — very long
        [0,0,2,1,0,1,2,0,0],   // mid legs
        [0,0,2,1,0,1,2,0,0],   // lower legs
        [0,0,2,3,0,3,2,0,0],   // yellow boots
        [0,0,2,2,0,2,2,0,0],   // boot soles
    ],
    // Frame 1 — running stride
    [
        [0,0,5,5,5,0,5,5,0],
        [0,5,2,1,1,2,0,5,5],
        [0,0,6,6,6,6,6,0,0],
        [0,0,2,1,1,1,2,0,0],
        [0,0,2,7,2,7,2,0,0],
        [0,0,2,1,1,1,2,0,0],
        [0,0,2,3,4,3,2,0,0],
        [0,2,3,4,3,3,3,2,0],
        [0,2,3,3,3,3,3,2,0],
        [0,0,2,3,3,3,2,0,0],
        [0,0,0,2,1,2,0,0,0],   // legs together mid-stride
        [0,0,2,1,2,1,0,0,0],   // crossing
        [0,0,2,1,0,0,2,0,0],   // one leg forward
        [0,0,2,3,0,0,2,3,0],   // boots spread in stride
        [0,0,7,2,0,0,2,7,0],   // boot tips
    ],
];

// TANK — purple dark-mage "Yami"  (11×14)
// Exaggerated: massive silver hair wider than body, huge hips, imposing height
const ENEMY_FRAMES_TANK = [
    // Frame 0 — idle
    [
        [0,5,5,5,2,2,5,5,5,0,0],   // enormous hair — spreads far wider than face
        [5,5,5,2,1,1,2,5,5,5,0],   // hair walls the face on both sides
        [5,5,2,1,1,1,1,2,5,5,0],   // wide face framed by silver locks
        [0,5,2,1,6,1,6,2,5,0,0],   // gold eyes (6=gold) — large and intense
        [0,5,2,1,1,8,1,2,5,0,0],   // cheeks + rose lips (8=pink)
        [0,0,2,3,4,4,3,2,0,0,0],   // chest — lavender accent visible
        [0,2,3,3,3,3,3,3,2,0,0],   // wide chest (8 cols!)
        [0,2,7,3,3,3,3,7,2,0,0],   // waist cinched by deep-purple corset
        [2,3,3,3,3,3,3,3,3,2,0],   // MAX-width hips — full 10 cols
        [0,2,3,3,1,1,3,3,2,0,0],   // upper thighs showing through robe split
        [0,0,2,3,1,1,3,2,0,0,0],   // thighs
        [0,0,2,3,1,1,3,2,0,0,0],   // lower legs
        [0,0,2,3,3,3,3,2,0,0,0],   // robe hem sweeps the floor
        [0,0,2,2,2,2,2,2,0,0,0],   // feet — barely visible under robes
    ],
    // Frame 1 — slow sway
    [
        [0,5,5,5,2,2,5,5,5,0,0],
        [5,5,5,2,1,1,2,5,5,5,0],
        [5,5,2,1,1,1,1,2,5,5,0],
        [0,5,2,1,6,1,6,2,5,0,0],
        [0,5,2,1,1,8,1,2,5,0,0],
        [0,0,2,3,4,4,3,2,0,0,0],
        [0,2,3,3,3,3,3,3,2,0,0],
        [0,2,7,3,3,3,3,7,2,0,0],
        [2,3,3,3,3,3,3,3,3,2,0],
        [0,2,3,1,3,1,3,3,2,0,0],   // legs shifted slightly
        [0,0,2,1,3,1,3,2,0,0,0],
        [0,0,2,1,1,3,3,2,0,0,0],
        [0,0,0,2,3,3,2,2,0,0,0],   // robe hem follows motion
        [0,0,0,2,2,2,2,0,0,0,0],
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

    const frames  = type === 'basic' ? ENEMY_FRAMES_BASIC
                  : type === 'fast'  ? ENEMY_FRAMES_FAST
                  :                    ENEMY_FRAMES_TANK;

    const palette = type === 'basic' ? PALETTE_ENEMY_BASIC
                  : type === 'fast'  ? PALETTE_ENEMY_FAST
                  :                    PALETTE_ENEMY_TANK;

    const frame = frames[frameIndex % frames.length];
    const w = frame[0].length * ps;
    const h = frame.length    * ps;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI / 2);

    // Tank is already wide/tall via larger frame; small boost keeps her imposing
    if (type === 'tank') ctx.scale(1.2, 1.2);

    drawSprite(ctx, frame, -w / 2, -h / 2, ps, palette);

    ctx.restore();
}

// ---------------------------------------------------------------
// Powerup icons  (5×5 pixel art, 1 = filled)
// ---------------------------------------------------------------
const POWERUP_ICON_SPEED = [     // lightning bolt
    [0,0,1,1,0],
    [0,1,1,0,0],
    [1,1,1,1,0],
    [0,0,1,1,0],
    [0,0,1,0,0],
];
const POWERUP_ICON_STRENGTH = [  // 8-pointed star burst
    [1,0,1,0,1],
    [0,1,1,1,0],
    [1,1,1,1,1],
    [0,1,1,1,0],
    [1,0,1,0,1],
];
const POWERUP_ICON_HEALTH = [    // plus / cross
    [0,0,1,0,0],
    [0,1,1,1,0],
    [1,1,1,1,1],
    [0,1,1,1,0],
    [0,0,1,0,0],
];

/**
 * Draw a powerup pickup at screen position (cx, cy).
 * @param {number} pulseTimer  — continuously incrementing timer for the pulse animation
 */
function drawPowerup(ctx, cx, cy, type, pulseTimer) {
    const color   = POWERUP_COLORS[type];
    const boxSize = 28;
    const pulse   = 1 + Math.sin(pulseTimer * 3) * 0.08;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur  = 14;

    // Dark background box
    ctx.fillStyle   = 'rgba(0,0,0,0.75)';
    ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

    // Colored border
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.strokeRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

    // Corner accent dots
    const h = boxSize / 2;
    ctx.fillStyle = color;
    [[-h,-h],[h-2,-h],[-h,h-2],[h-2,h-2]].forEach(([dx, dy]) => {
        ctx.fillRect(dx, dy, 2, 2);
    });

    // Pixel icon centered
    const icon = type === 'speed'    ? POWERUP_ICON_SPEED
               : type === 'strength' ? POWERUP_ICON_STRENGTH
               :                       POWERUP_ICON_HEALTH;
    const ps = 4;
    const iw = icon[0].length * ps;
    const ih = icon.length    * ps;
    ctx.fillStyle = color;
    for (let row = 0; row < icon.length; row++) {
        for (let col = 0; col < icon[row].length; col++) {
            if (icon[row][col] === 1) {
                ctx.fillRect(-iw / 2 + col * ps, -ih / 2 + row * ps, ps, ps);
            }
        }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
}

// ---------------------------------------------------------------
// Draw melee sword-swing arc (centered on cx, cy, player-space)
// progress 0→1 over the swing duration
// ---------------------------------------------------------------
function drawMeleeSwing(ctx, cx, cy, angle, progress, range) {
    const startAng = angle - MELEE_ARC;
    const sweepEnd = startAng + MELEE_ARC * 2 * progress; // leading edge

    ctx.save();
    ctx.translate(cx, cy);

    // Swept sector — faint fill
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, range, startAng, sweepEnd);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,180,0.07)';
    ctx.fill();

    // Outer arc trail
    ctx.beginPath();
    ctx.arc(0, 0, range, startAng, sweepEnd);
    ctx.strokeStyle = 'rgba(255,255,160,0.45)';
    ctx.lineWidth   = 5;
    ctx.stroke();

    // Leading blade line (bright, glowing)
    const bx = Math.cos(sweepEnd) * range;
    const by = Math.sin(sweepEnd) * range;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = '#ffffcc';
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = '#ffffaa';
    ctx.shadowBlur  = 16;
    ctx.stroke();

    // Bright tip spark
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.fill();

    ctx.shadowBlur = 0;
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
