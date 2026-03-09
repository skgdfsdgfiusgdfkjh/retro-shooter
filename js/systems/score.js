// ============================================================
// score.js — Score tracking + localStorage high score
// ============================================================

const ScoreSystem = (() => {
    const LS_KEY = 'retro_shooter_highscore';

    let current   = 0;
    let highScore = parseInt(localStorage.getItem(LS_KEY) || '0', 10);

    return {
        reset()  { current = 0; },
        add(n)   { current += n; },
        get()    { return current; },
        getHigh(){ return highScore; },

        saveHigh() {
            if (current > highScore) {
                highScore = current;
                localStorage.setItem(LS_KEY, highScore);
                return true; // new record
            }
            return false;
        },
    };
})();
