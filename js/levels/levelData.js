// ============================================================
// levelData.js — Level and wave definitions
// ============================================================

const LEVELS = [
    {
        name: 'Level 1',
        waves: [
            { count: 8,  types: ['basic'] },
            { count: 10, types: ['basic'] },
        ]
    },
    {
        name: 'Level 2',
        waves: [
            { count: 10, types: ['basic', 'fast'] },
            { count: 8,  types: ['fast', 'sniper'] },
        ]
    },
    {
        name: 'Level 3',
        waves: [
            { count: 8,  types: ['basic', 'sniper'] },
            { count: 10, types: ['basic', 'fast', 'tank'] },
        ]
    },
    {
        name: 'Level 4',
        waves: [
            { count: 15, types: ['fast', 'tank', 'sniper'] },
            { count: 15, types: ['basic', 'fast', 'tank', 'sniper'] },
        ]
    },
    {
        name: 'Level 5 — BOSS',
        isBoss: true,
        waves: [
            { count: 0, types: [] },  // no regular enemies — boss spawns directly
        ]
    },
];
