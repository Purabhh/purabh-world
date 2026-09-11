// Projects district — a green entry gate plus a grid of voxel kiosks, one per
// GitHub repo (live) or per resume fallback project (offline / no username).
//
// Layout: the district is centered at layout.DISTRICTS.projects.center = [0, 66]
// with radius 34. The player approaches from the plaza to the NORTH (toward -Z /
// smaller z), so the archway sits near the north edge and faces the player. The
// kiosk grid marches SOUTH (+Z) away from the arch, rows spread along X centered
// on x = 0.
//
// Each kiosk is color-coded by its primary language and registers a proximity
// interactable whose info card shows the repo's name, language, stars, blurb,
// and links (GitHub + optional live demo).
import * as THREE from 'three';
import { fetchRepos } from './github.js';
import { makeTextTexture, addBuildingSign, addFloatingLogo } from '../landmarks/floatingLogo.js';
import { addBox } from '../core/colliders.js';

// --- Language → color (GitHub linguist-ish hexes as CSS strings) -------------
// `default` resolves to palette.stone at build time (it's a THREE number, not a
// CSS string), so it's handled separately in colorFor().
const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Solidity: '#AA6746',
  'C++': '#f34b7d',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Go: '#00ADD8',
  Rust: '#dea584',
};

// '#rrggbb' -> 0xrrggbb (THREE color number).
const hexToNum = (hex) => parseInt(hex.replace('#', ''), 16);

export async function buildProjectsDistrict(ctx) {
  const { scene, voxel, palette, css, layout, resume, config, registerInteractable } = ctx;
  const { box, pillar, group, patch, tree } = voxel;

  const [cx, cz] = layout.DISTRICTS.projects.center; // [0, 66]
  const districtR = layout.DISTRICTS.projects.radius; // 34

  // Per-language color helpers. `language` may be '' → falls back to stone.
  const colorCss = (language) => LANG_COLORS[language] || css.projects; // for the panel accent
  const colorNum = (language) =>
    LANG_COLORS[language] ? hexToNum(LANG_COLORS[language]) : palette.stone; // for voxels

  const parts = [];

  // --- Plaza pad -------------------------------------------------------------
  parts.push(patch({ size: [districtR * 2 - 4, districtR * 2 - 4], color: palette.grassLight, pos: [cx, cz], y: 0.05 }));
  parts.push(patch({ size: [22, 22], color: palette.path, pos: [cx, cz - districtR + 8], y: 0.08 }));

  // --- Green archway / gate, facing the player (toward -Z) --------------------
  // Two posts straddling x=0 with a lintel across the top, planted at the north
  // edge so you walk THROUGH it into the district.
  const archZ = cz - districtR + 6;      // ~z = 38
  const archHalf = 5;                     // posts at x = ±5
  const postH = 8;
  const postFoot = [2, 2];
  parts.push(pillar({ footprint: postFoot, height: postH, color: palette.projectsDark, pos: [cx - archHalf, archZ] }));
  parts.push(pillar({ footprint: postFoot, height: postH, color: palette.projectsDark, pos: [cx + archHalf, archZ] }));
  // Lintel beam across the top.
  parts.push(box({ size: [archHalf * 2 + 3, 2, 2.4], color: palette.projects, pos: [cx, postH + 1, archZ] }));
  // Sign block on the lintel (the "PROJECTS" banner), bright green, faces -Z.
  parts.push(box({
    size: [archHalf * 2 + 1, 2.4, 0.6], color: palette.projects,
    pos: [cx, postH + 3, archZ - 1.1],
    emissive: palette.projects, emissiveIntensity: 0.28,
  }));
  // Welcome plinth just in front of the arch.
  parts.push(box({ size: [6, 1.2, 2], color: palette.projectsDark, pos: [cx, 0.6, archZ - 3] }));
  parts.push(box({ size: [5, 0.4, 1.2], color: palette.gold, pos: [cx, 1.4, archZ - 3], emissive: palette.gold, emissiveIntensity: 0.2 }));

  // "PROJECTS" wordmark across the light-green lintel, facing the player (-Z).
  addBuildingSign(ctx, {
    tex: makeTextTexture('PROJECTS', '#ffffff'),
    pos: [cx, postH + 1, archZ - 1.4], faceYaw: Math.PI, size: [8, 2.0],
  });

  // A couple of decorative trees flanking the gate.
  parts.push(tree({ pos: [cx - archHalf - 4, archZ], h: 4 }));
  parts.push(tree({ pos: [cx + archHalf + 4, archZ], h: 4 }));

  // --- Load projects: live GitHub if a username is set, else null ------------
  const username = config.GITHUB_USERNAME;
  let repos = username ? await fetchRepos(username) : null;

  // Offline / empty → resume fallback, plus a small "info" sign so the area
  // explains how to enable live mode and never looks broken.
  const usingFallback = !repos || repos.length === 0;
  if (usingFallback) {
    repos = resume.projectsFallback;

    // Info signpost: a "My Projects" board placed IN FRONT of the gate (on the
    // approach from spawn), offset to the side so it doesn't block the archway.
    const infoX = cx - 12;
    const infoZ = archZ - 11;
    parts.push(pillar({ footprint: [1, 1], height: 3, color: palette.stoneDark, pos: [infoX, infoZ] }));
    parts.push(box({ size: [4.5, 2.6, 0.5], color: palette.projects, pos: [infoX, 3.4, infoZ], emissive: palette.projects, emissiveIntensity: 0.25 }));
    // Label on the board's player-facing (-Z) side so it's no longer blank.
    addBuildingSign(ctx, {
      tex: makeTextTexture('MY PROJECTS', '#ffffff'),
      pos: [infoX, 3.5, infoZ - 0.3], faceYaw: Math.PI, size: [4, 1.4],
    });
    registerInteractable({
      id: 'projects-info',
      position: new THREE.Vector3(infoX, 1.5, infoZ),
      radius: 4,
      data: {
        title: 'My Projects',
        subtitle: 'A few things I have built',
        accent: css.projects,
        lines: ['Featured builds across AI, systems, and web. Walk up to any kiosk to read more, or see everything on GitHub.'],
        links: [{ label: 'GitHub', url: 'https://github.com/Purabhh' }],
      },
    });
  }

  // --- Grid layout math ------------------------------------------------------
  // Kiosks lay out in rows along X (centered on x=0) and columns marching +Z
  // away from the arch. Default 5 per row at 9-unit spacing; if there are many
  // repos we tighten spacing and/or widen rows so everything stays inside the
  // district radius.
  const n = repos.length;
  let perRow = 5;
  let spacing = 9;
  if (n > 20) { perRow = 7; spacing = 8; }
  else if (n > 12) { perRow = 6; spacing = 8; }

  const rows = Math.ceil(n / perRow);
  // First row starts south of the arch with a little breathing room.
  const startZ = archZ + 9;
  // Half-extent of the grid along Z; used to verify/contain the southern edge.
  const maxZ = startZ + (rows - 1) * spacing;
  // If the grid would spill past the south rim, compress the row pitch so the
  // last row still sits inside radius (leave ~3 units margin).
  const southLimit = cz + districtR - 4;
  const rowPitch = maxZ > southLimit && rows > 1
    ? Math.max(6, (southLimit - startZ) / (rows - 1))
    : spacing;

  // --- Build a kiosk per project ---------------------------------------------
  repos.forEach((repo, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;

    // Items in THIS row (last row may be short) so it stays centered on x=0.
    const itemsThisRow = Math.min(perRow, n - row * perRow);
    const x = cx + (col - (itemsThisRow - 1) / 2) * spacing;
    const z = startZ + row * rowPitch;

    // A project may override its color (e.g. LeaseLink goes gold as a hackathon win)
    // and opt into a shiny reflective metal look via the env map.
    const numColor = repo.color ? hexToNum(repo.color) : colorNum(repo.language);
    const cssColor = repo.color || colorCss(repo.language);
    // Shiny metallic (LeaseLink, a hackathon win): a near-mirror finish that
    // reflects the env map PLUS a soft self-lit glow in its own color, so the WHOLE
    // building reads as bright reflective gold (not a dark metal) even out of direct
    // sun. Spread onto every part below, pedestal included.
    const metal = repo.metallic
      ? { metalness: 1.0, roughness: 0.13, envMap: ctx.envMap, envMapIntensity: 2.0, emissive: numColor, emissiveIntensity: 0.25 }
      : null;

    // Pedestal (stone) + building whose height scales gently with stars.
    const ped = 0.8;
    const bodyH = Math.min(11, 4 + Math.sqrt(Math.max(0, repo.stars)) * 1.2); // clamp 4..11
    const foot = [4.2, 4.2];
    addBox(x, z, 2.3, 2.3, { top: ped + bodyH, leap: ped + bodyH <= 5 }); // solid; short kiosks are pounce-able

    parts.push(box({ size: [foot[0] + 1, ped, foot[1] + 1], color: metal ? numColor : palette.stone, pos: [x, ped / 2, z], ...metal }));
    parts.push(pillar({ footprint: foot, height: bodyH, color: numColor, pos: [x, z], y0: ped, ...metal }));
    // Roof cap in a darker tone of the same color family (reuse the language color).
    parts.push(box({ size: [foot[0] + 0.6, 0.8, foot[1] + 0.6], color: numColor, pos: [x, ped + bodyH + 0.4, z], emissive: numColor, emissiveIntensity: 0.15, ...metal }));
    // Language-colored label/banner block on the player-facing (-Z) side.
    parts.push(box({
      size: [foot[0] - 0.4, 1.4, 0.4], color: numColor,
      pos: [x, ped + bodyH - 1.2, z - foot[1] / 2 - 0.2],
      emissive: numColor, emissiveIntensity: 0.35, ...metal,
    }));
    // Tiny star nub on top when the repo has stars, as a little flourish.
    if (repo.stars > 0) {
      parts.push(box({ size: [0.6, 0.6, 0.6], color: palette.gold, pos: [x, ped + bodyH + 1.1, z], emissive: palette.gold, emissiveIntensity: 0.6 }));
    }

    // Floating name label above the kiosk, billboarding toward the player so you
    // can read each project at a glance.
    addFloatingLogo(ctx, {
      tex: makeTextTexture(repo.name, '#ffffff'),
      center: [x, z], y: ped + bodyH + 2.3, size: [5.6, 1.4], bob: 0.16,
    });

    // Links: the GitHub repo reads "Visit repo"; any live URL reads "Visit site".
    const links = [];
    if (repo.url) links.push({ label: /github\.com/i.test(repo.url) ? 'Visit repo' : 'Visit site', url: repo.url });
    if (repo.homepage) links.push({ label: 'Visit site', url: repo.homepage });

    registerInteractable({
      id: `project-${i}-${repo.name}`,
      position: new THREE.Vector3(x, 1.5, z),
      radius: 4.5,
      data: {
        title: repo.name,
        subtitle: (repo.language || 'Project') + (repo.stars ? ` · ★ ${repo.stars}` : ''),
        accent: cssColor,
        lines: [repo.description || 'No description.'],
        links,
        // Date-only strings parse as UTC midnight, which shows the previous day in US
        // timezones; pin them to local noon so the card shows the real date.
        meta: repo.updated ? `Updated ${new Date(/^\d{4}-\d{2}-\d{2}$/.test(repo.updated) ? repo.updated + 'T12:00:00' : repo.updated).toLocaleDateString()}` : '',
      },
    });
  });

  scene.add(group(parts));
}

// Local helper so we don't import githubUrl (it's a const captured at module load
// when the username may have been ''). Recompute from the live config instead.
function githubUrlFor(config) {
  return config.GITHUB_USERNAME ? `https://github.com/${config.GITHUB_USERNAME}` : 'https://github.com';
}
