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
            { count: 12, types: ['fast'] },
        ]
    },
    {
        name: 'Level 3',
        waves: [
            { count: 6,  types: ['basic', 'tank'] },
            { count: 10, types: ['basic', 'fast', 'tank'] },
        ]
    },
    {
        name: 'Level 4',
        waves: [
            { count: 15, types: ['fast', 'tank'] },
            { count: 15, types: ['basic', 'fast', 'tank'] },
        ]
    },
    {
        name: 'Level 5 — BOSS RUSH',
        waves: [
            { count: 20, types: ['fast', 'tank'] },
            { count: 25, types: ['basic', 'fast', 'tank'] },
        ]
    },
];
