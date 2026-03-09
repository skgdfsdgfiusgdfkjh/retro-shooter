// ============================================================
// animation.js — Simple frame-based animation controller
// ============================================================

class Animator {
    /**
     * @param {number} frameCount   — total frames in cycle
     * @param {number} fps          — frames per second
     */
    constructor(frameCount, fps = 8) {
        this.frameCount = frameCount;
        this.frameDur   = 1 / fps;   // seconds per frame
        this.timer      = 0;
        this.frame      = 0;
        this.playing    = true;
    }

    update(dt) {
        if (!this.playing) return;
        this.timer += dt;
        while (this.timer >= this.frameDur) {
            this.timer -= this.frameDur;
            this.frame  = (this.frame + 1) % this.frameCount;
        }
    }

    reset() {
        this.timer = 0;
        this.frame = 0;
    }

    pause() { this.playing = false; }
    play()  { this.playing = true;  }
}
