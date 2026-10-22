// Shared design + layout tokens. Single source of truth for colors and where
// each district lives. Terrain, landmarks, projects, and UI all read from here
// so the pieces line up in the world.

// --- Config you set ----------------------------------------------------------
// The Projects district reads PUBLIC repos from this GitHub account. Set the
// username and the world auto-populates. Leave '' to show a friendly placeholder.
export const config = {
  GITHUB_USERNAME: 'Purabhh', // GitHub handle (powers the Projects district)
  LINKEDIN_URL: 'https://www.linkedin.com/in/purabh/', // LinkedIn profile (landing pill + tour CTA)
  RESUME_FILE: 'Resume.pdf',  // lives in /public; powers the "Resume" button
  // Projects district filter. GITHUB_INCLUDE: if non-empty, ONLY these repo names
  // show, in this order. GITHUB_EXCLUDE: always hidden. REQUIRE_DESCRIPTION: hide
  // repos with no GitHub description (off: it would hide real projects with no description).
  GITHUB_INCLUDE: [],
  // empty stubs (<3 KB of code), the profile repo, and this site itself
  GITHUB_EXCLUDE: [
    // empty stubs (<3 KB of code), the profile repo, and this site itself
    '3d-Portfolio', 'Agent1', 'Agent2', 'C_create', 'CartMaker', 'COPWATCH-FRONTEND', 'Purabhh', 'purabh-world',
    // 1-2 commit, unfinished for now (add back to GITHUB_INCLUDE when they're done)
    'coolfinder', 'EpsReport_Ai_Agent', 'Humanizing-Workflow', 'LimitOrder', 'stockvizzy', 'FireBot', 'Hermes',
    // removed by request
    'SwipeHousing', 'Kalonji-Website', 'CryptoWhaleTracker',
  ],
  GITHUB_REQUIRE_DESCRIPTION: false,
  // Layout order: GITHUB_ORDER goes first (in this order), GITHUB_LAST goes at the end.
  // Everything else keeps GitHub's order in between.
  GITHUB_ORDER: ['FastRust', 'Mochee', 'vaultdb'],
  GITHUB_LAST: ['Gencost', 'stormlink'],
};

// --- Colors as three.js hex numbers -----------------------------------------
export const palette = {
  // sky / atmosphere (from the chosen "Friendly Game Title" template)
  skyTop: 0xffe6ba, skyMid: 0xffd183, skyBottom: 0xffc06b, fog: 0xffe9c6,
  // 3D world sky — a clear blue-white
  worldSkyHaze: 0xeef5fb, worldSkyLight: 0xdfeef8,

  // ground + nature
  grass: 0x8fce6b, grassDark: 0x77b657, grassLight: 0xa6dd86,
  soil: 0x9b6b43, sand: 0xf0dca0,
  path: 0xead9a8, pathEdge: 0xd8c184,
  water: 0x6fc6e0, waterDeep: 0x4fb0d6,
  trunk: 0x8a5a2b, leaf: 0x6fbf52, leafDark: 0x57a03f,
  stone: 0xcbc3b4, stoneDark: 0xa89f8d, cloud: 0xf7fbff,

  // district accents
  rutgers: 0xd4322c, rutgersDark: 0xa8241f,                 // scarlet
  bny: 0xe9b949, bnyDark: 0xb98e2e, gold: 0xffd34e,         // bank gold
  chain: 0x49d2ff, chainGlow: 0x9ff0ff,                     // glowing blockchain
  essex: 0x4f86f2, essexDark: 0x315fb8,                     // trading blue
  azonix: 0x7d5fe0, azonixDark: 0x5a40b0,                   // tech purple
  achievement: 0xffc83d, trophy: 0xffd34e,                  // gold trophy
  projects: 0x3fb14e, projectsDark: 0x2f8a3c,               // green
  skills: 0x49e0d0, skillsDark: 0x2bb3a6,                   // tech-stack constellation cyan

  // ui / generic
  cta: 0x5fd06a, ctaDark: 0x3fb14e, ink: 0x2b2620, white: 0xffffff,
};

// --- Colors as CSS strings (for HTML/UI) ------------------------------------
export const css = {
  skyTop: '#ffe6ba', skyMid: '#ffd183', skyBottom: '#ffc06b',
  cta: '#5fd06a', ctaDark: '#3fb14e', ink: '#2b2620', panel: '#fffaf0',
  rutgers: '#d4322c', bny: '#e9b949', essex: '#4f86f2',
  azonix: '#7d5fe0', projects: '#3fb14e', achievement: '#ffc83d',
  skills: '#49e0d0',
};

// --- World layout ------------------------------------------------------------
// center is [x, z] on the ground plane. Player spawns at [0,0] (the plaza).
// Districts ring the plaza so everything is a short walk away.
export const layout = {
  groundSize: 240,   // square island side length, centered on origin
  groundHeight: 2,   // thickness of the ground slab
  spawn: [0, 0],
  DISTRICTS: {
    education:    { center: [0, -52],   radius: 14, accent: palette.rutgers,     label: 'Rutgers University' },
    bny:          { center: [-54, 28],  radius: 14, accent: palette.bny,         label: 'BNY' },
    essex:        { center: [54, 28],   radius: 14, accent: palette.essex,       label: 'Essex Securities' },
    azonix:       { center: [54, -28],  radius: 14, accent: palette.azonix,      label: 'Azonix Tech' },
    skills:       { center: [-54, -28], radius: 13, accent: palette.skills,      label: 'My Stack' },
    projects:     { center: [0, 66],    radius: 34, accent: palette.projects,    label: 'Projects District' },
  },
};

// Convenience: the github profile URL (or a safe fallback).
export const githubUrl = config.GITHUB_USERNAME
  ? `https://github.com/${config.GITHUB_USERNAME}`
  : 'https://github.com';
