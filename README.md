# PURABH'S WORLD

A walkable 3D voxel world that's also my portfolio. Built with **three.js** — no build step, nothing to `npm install`.

## Run it

You just need Node.js (any recent version):

```bash
npm run dev
```

Then open **http://localhost:5174**. (That's just `node server.mjs` — a tiny static file server with zero dependencies. Run `node server.mjs 8080` to use a different port.)

## Make it yours

Open `src/core/constants.js` and set:

- **`GITHUB_USERNAME`** — your GitHub handle. The Projects district then auto-loads every public repo as a voxel kiosk, color-coded by language. Until you set it, it shows two sample projects + a hint kiosk.
- **`LINKEDIN_URL`** — your LinkedIn profile URL (the LinkedIn nav button on the title screen).

Your résumé text lives in `src/data/resume.js` — edit a bullet there and the matching landmark's card updates. `Resume.pdf` in the project root powers the "Resume" button.

## Controls

- **WASD / arrows** — move
- **Click + drag** — look around (mouse wheel / pinch to zoom)
- **E** — read the info card at the landmark you're standing near
- **Space** — jump

## How it's built

Plain ES modules; three.js r162 is loaded from a CDN via an importmap (see `index.html`).

```
src/core/        constants (palette, world layout, config), engine, interaction registry
src/voxel/       the flat-shaded voxel building toolkit
src/data/        resume.js — the single source of truth for all text
src/player/      third-person avatar + follow camera
src/world/       terrain, paths, plazas, trees, clouds
src/landmarks/   one building per job (BNY, Essex, Azonix, Rutgers, Achievements)
src/projects/    live GitHub fetch + the procedural Projects district
src/ui/          landing screen, info panels, HUD
main.js          wires it all together
```

`window.PW` is exposed in the browser console as a debug handle (engine, player, scene) for tuning.

## Deploy

It's fully static, so any static host works:

- **Your own server / droplet:** copy the folder up and run `node server.mjs 80`, or point nginx/Caddy at the directory.
- **GitHub Pages / Netlify / Vercel:** push the repo and serve the root — no build command needed.

The live GitHub Projects district and the three.js CDN both need internet at runtime.
