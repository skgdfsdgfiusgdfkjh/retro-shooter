// ============================================================
// spawner.js — Wave-based enemy spawner
// ============================================================

class Spawner {
    constructor() {
        this.reset();
    }

    reset() {
        this.queue        = [];   // enemies yet to spawn
        this.spawnTimer   = 0;
        this.waveTimer    = 0;
        this.waitingNext  = false;
        this.waveActive   = false;
        this.waveComplete = false;
    }

    /**
     * Load a wave definition and start spawning.
     * @param {{ count: number, types: string[] }} waveDef
     * @param {number} camX   current camera X (world)
     * @param {number} camY   current camera Y (world)
     */
    loadWave(waveDef, camX, camY) {
        this.queue = [];
        for (let i = 0; i < waveDef.count; i++) {
            const type = waveDef.types[Math.floor(Math.random() * waveDef.types.length)];
            const pos  = this._randomEdgePos(camX, camY);
            this.queue.push({ type, x: pos.x, y: pos.y });
        }
        this.spawnTimer   = 0;
        this.waitingNext  = false;
        this.waveActive   = true;
        this.waveComplete = false;
    }

    /**
     * Update spawner each frame.
     * @param {number}  dt
     * @param {Enemy[]} enemies   — live enemy array to push into
     * @param {number}  camX
     * @param {number}  camY
     */
    update(dt, enemies, camX, camY) {
        if (!this.waveActive) return;

        // Spawn queued enemies at intervals
        if (this.queue.length > 0) {
            this.spawnTimer += dt;
            if (this.spawnTimer >= SPAWN_INTERVAL) {
                this.spawnTimer = 0;
                const data = this.queue.shift();
                enemies.push(createEnemy(data.type, data.x, data.y));
            }
        }

        // Check if all enemies are dead and queue is empty
        const alive = enemies.filter(e => !e.dead).length;
        if (this.queue.length === 0 && alive === 0 && !this.waitingNext) {
            this.waitingNext = true;
            this.waveTimer   = WAVE_END_DELAY;
        }

        if (this.waitingNext) {
            this.waveTimer -= dt;
            if (this.waveTimer <= 0) {
                this.waveActive   = false;
                this.waveComplete = true;
            }
        }
    }

    /**
     * Returns a position on one of the four screen edges (in world coords),
     * padded inward by SPAWN_EDGE_PADDING from the camera view edge.
     */
    _randomEdgePos(camX, camY) {
        const W  = CANVAS_WIDTH;
        const H  = CANVAS_HEIGHT;
        const pad = SPAWN_EDGE_PADDING;
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        switch (edge) {
            case 0: x = camX + Math.random() * W;   y = camY - pad;      break; // top
            case 1: x = camX + Math.random() * W;   y = camY + H + pad;  break; // bottom
            case 2: x = camX - pad;                 y = camY + Math.random() * H; break; // left
            case 3: x = camX + W + pad;             y = camY + Math.random() * H; break; // right
        }
        // Clamp to world bounds
        x = Math.max(pad, Math.min(WORLD_WIDTH  - pad, x));
        y = Math.max(pad, Math.min(WORLD_HEIGHT - pad, y));
        return { x, y };
    }
}
