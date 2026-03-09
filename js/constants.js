// ============================================================
// constants.js — Game-wide configuration
// ============================================================

const CANVAS_WIDTH  = 800;
const CANVAS_HEIGHT = 600;

const WORLD_WIDTH  = 3200;
const WORLD_HEIGHT = 3200;

// Pixel size for sprite rendering (each "pixel" in the art = this many real pixels)
const PIXEL = 4;

// Colors
const COLORS = {
    BG:            '#0a0a0a',
    GRID:          '#1a1a1a',
    PLAYER:        '#00ff88',
    PLAYER_DARK:   '#00aa55',
    PLAYER_GUN:    '#888888',
    BULLET:        '#00ffff',
    BULLET_GLOW:   '#005566',
    ENEMY_BASIC:   '#ff2222',
    ENEMY_FAST:    '#ffdd00',
    ENEMY_TANK:    '#bb44ff',
    PARTICLE:      '#ff8800',
    HUD_BG:        'rgba(0,0,0,0.7)',
    HUD_HEALTH:    '#ff2222',
    HUD_HEALTH_BG: '#440000',
    HUD_TEXT:      '#00ff88',
    HUD_AMMO:      '#00ffff',
    SCANLINE:      'rgba(0,0,0,0.08)',
    FLASH_HIT:     'rgba(255,0,0,0.3)',
    WHITE:         '#ffffff',
    DARK:          '#111111',
    MUZZLE:        '#ffff00',
};

// Player settings
const PLAYER_SPEED    = 200;   // px/s
const PLAYER_RADIUS   = 12;
const PLAYER_MAX_HP   = 100;
const PLAYER_MAG_SIZE = 30;
const PLAYER_RELOAD_TIME = 1.5; // seconds
const PLAYER_DAMAGE_COOLDOWN = 0.5; // seconds between taking damage

// Bullet settings
const BULLET_SPEED    = 600;   // px/s
const BULLET_LIFETIME = 1.5;   // seconds
const BULLET_RADIUS   = 4;
const BULLET_DAMAGE   = 15;

// Enemy settings
// Colors here are used for death particles and health bars; match character palettes
const ENEMY_CONFIGS = {
    basic: { color: '#cc1133', speed: 80,  hp: 30,  score: 10, radius: 14, damage: 10 }, // Akane — red uniform
    fast:  { color: '#ffcc00', speed: 160, hp: 15,  score: 20, radius: 10, damage: 8  }, // Kaze  — yellow suit
    tank:  { color: '#8833cc', speed: 40,  hp: 120, score: 50, radius: 22, damage: 20 }, // Yami  — purple robes (radius bumped for wider sprite)
};

// Spawner settings
const SPAWN_INTERVAL     = 0.8;  // seconds between individual enemy spawns
const WAVE_END_DELAY     = 2.0;  // seconds after wave cleared before next starts
const SPAWN_EDGE_PADDING = 60;   // px from world edge

// Grid cell size for background
const GRID_SIZE = 32;

// Powerup settings
const POWERUP_COLORS = {
    speed:    '#00ffff',  // cyan
    strength: '#ff8800',  // orange
    health:   '#44ff88',  // green
};
const POWERUP_DURATION_SPEED    = 8;    // seconds
const POWERUP_DURATION_STRENGTH = 8;    // seconds
const POWERUP_SPEED_MULTIPLIER  = 3.5;  // fire-rate multiplier (shoot cooldown ÷ this)
const POWERUP_DAMAGE_MULTIPLIER = 2.5;  // bullet damage multiplier
const HEALTH_PACK_RESTORE       = 35;   // HP restored by a health pack

// Melee attack
const MELEE_RANGE    = 90;              // px — reach of the sword arc
const MELEE_DAMAGE   = 40;             // damage per enemy hit
const MELEE_COOLDOWN = 0.55;           // seconds between swings
const MELEE_DURATION = 0.22;           // seconds for the swing animation
const MELEE_ARC      = Math.PI * 0.7; // half-arc (±126° total sweep)

// HUD
const HUD_FONT       = '"Press Start 2P", monospace';
const HUD_FONT_SMALL = '10px ' + HUD_FONT;
const HUD_FONT_MED   = '14px ' + HUD_FONT;
const HUD_FONT_LARGE = '22px ' + HUD_FONT;
const HUD_FONT_HUGE  = '36px ' + HUD_FONT;
