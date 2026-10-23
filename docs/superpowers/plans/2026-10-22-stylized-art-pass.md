# Stylized Art Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. When Purabh says "do the art pass" (or "do task N"), start at the first unchecked task below and follow it exactly.

**Goal:** Make Purabh's World stop reading as "Roblox boxes" and read as a soft, painterly three.js world like `docs/art-ref/reference.webp`: dense wind-blown grass, fluffy leaf-card trees, warm graded lighting with purple shadows, softened edges.

**Architecture:** Four additive layers on the existing no-build ES-module app. The cheap one goes first: (1) a color-grade post pass plus a re-tuned palette and lights; (2) one instanced, shader-animated grass field in place of the box tufts; (3) leaf-card canopies replacing the two-cube `tree()`; (4) falling-leaf particles; (5) bevelled `box()` edges. Each task ships to the live site on its own, so a bad layer can be reverted alone.

**Tech Stack:** three.js r162 from the unpkg importmap in `index.html` (`three`, `three/addons/...`), plain ES modules, `node server.mjs` locally on :5174, Vercel auto-deploys `main`.

**Spec:** The reference screenshot `docs/art-ref/reference.webp` plus this scoping, agreed in chat on 2026-10-22:
- Grass: one `InstancedMesh` of thin blades, root-to-tip gradient (dark olive to bright yellow-green), vertex-shader wind, masked off paths and plazas, ground under it painted the root color.
- Trees: trunk plus hundreds of alpha-tested leaf cards clustered in spheres, normals pointing out from each cluster center so the canopy shades like a soft ball. Varied canopy colors (pink, yellow, green, red).
- Lighting: warm, saturated, purple-tinted shadows; a final color grade.
- Objects: keep the landmarks, just add bevels and the new shading.
- Performance must not regress: grass about 1 draw call, all leaves cheap, blade count scales with `engine.lowQuality`.

## Global Constraints

- No build step and no new dependencies. Only `three` and `three/addons/*` at version 0.162.0 through the existing importmap.
- No new textures as files. Leaf and noise textures are generated on a `<canvas>` at runtime, like `makeSoftDot()` in `src/world/atmosphere.js`.
- Keep every collider, interactable, district position and text exactly as it is. This is visual only.
- The day/dusk toggle (`ctx.dayNight`, "N" key) must keep working, and the grade must follow it.
- `?quality=low` and `engine.setLowQuality()` must keep reducing cost (fewer blades, no shadows, no bloom).
- Budget per task, measured with the snippet below from the spawn camera: draw calls may rise by at most +30 over the baseline recorded in Task 0, and the frame must not visibly hitch.
- Commit only web files, by name, authored as Purabh with **no AI attribution** (git-push-as-user skill). Never commit `graphify-out/`, launchers, `.app-icon/`, `dist/`.
- After each task: deploy with the sync-site skill (push `main` → Vercel), verify on https://purabh.website, run `graphify update .`, and add a write-log entry at the end of the session.

## Review Focus

1. **Day ↔ dusk toggle.** The grade, the grass colors and the leaf colors must all still look right in *both* modes, since the world boots in dusk. Covered by the verify step in Tasks 1–3 (screenshot both modes).
2. **Grass poking through things.** No blades on paths, plazas, district floors, the beach, or inside buildings. Covered by the Task 2 mask test.
3. **Low-quality / weak GPUs.** `?quality=low` must cut the blade count to `GRASS_LOW` and the page must still run. Covered by the Task 2 low-quality step.
4. **Trees added later.** The Projects district adds trees asynchronously after its GitHub fetch. Those must get the new canopy and keep swaying. Covered by the Task 3 count check.
5. **Player walking into grass and trees.** Grass doesn't collide. It bends away from the player. Tree colliders stay the same `addCircle` call. Covered by the Task 2 player-bend check and the Task 3 collider count.

---

## Shared verification snippets

Run these in the Browser pane against the local preview (`preview_start {name: "purabh-world"}`). The pane may be hidden, so **don't** wait on `requestAnimationFrame`. Render manually.

**MEASURE** (draw calls, triangles, mesh count):
```js
await new Promise(r => setTimeout(r, 8000));
const { engine, ctx } = PW; const r = engine.renderer;
let meshes = 0; ctx.scene.traverse(o => { if (o.isMesh || o.isPoints) meshes++; });
r.info.autoReset = false; r.info.reset(); engine.composer.render();
const out = { calls: r.info.render.calls, tris: r.info.render.triangles, meshes };
r.info.autoReset = true; out
```

**CAMERA** (frame a spot for a screenshot; set `window.__cam` again to move it):
```js
const { engine, player } = PW; player.setCinematic(true);
document.querySelectorAll('.pw-root').forEach(el => el.style.display = 'none');
window.__cam = [[18, 10, 22], [0, 1, 0]];          // [position, lookAt]
if (!window.__hooked) { engine.onUpdate(() => { const [p, t] = window.__cam; engine.camera.position.set(...p); engine.camera.lookAt(...t); }); window.__hooked = true; }
```
Then take a `computer {action:"screenshot", scale:0.6}`. Toggle dusk/day with `PW.ctx.dayNight.toggle()`. Reload the page afterwards to drop the hook.

Compare screenshots against `docs/art-ref/reference.webp` by eye. The goal is the same *feel* (warm, soft, dense), not a pixel match.

---

### Task 0: Baseline and prerequisites

**Files:** none.

- [x] **Step 1: Make sure the voxel-merge work has landed.** A separate session was merging static voxel meshes and freezing the shadow map in `src/voxel/voxel.js` / `src/core/engine.js`. Run `git fetch -q && git log --oneline origin/main -10`. If there's no commit about merging voxels or freezing shadows, **stop and ask Purabh** whether to wait. Tasks 2, 3 and 5 edit the same files.
- [x] **Step 2:** `git pull --rebase`, then `git status --short`. Only untracked local-only files and `graphify-out/` should show.
- [x] **Step 3:** Start the preview, run **MEASURE**, and write the numbers into this file under "Baseline" below. Take one CAMERA screenshot at `[[18,10,22],[0,1,0]]` in dusk and one in day as the "before".

Also record the tree count: `(await import('/src/voxel/voxel.js')).swayables.length` (after the 8s wait, so the Projects district trees are in).

Baseline (2026-10-22, camera [[18,10,22],[0,1,0]]): calls = 917 , tris = 136,738 , meshes = 921 , trees = 40

---

### Task 1: Color grade, palette and lights

**Files:**
- Create: `src/core/grade.js`
- Modify: `src/core/engine.js` (composer chain, hemi light, export `grade`)
- Modify: `src/world/atmosphere.js` (the day/dusk lerp near line 300 also drives the grade)
- Modify: `src/core/constants.js` (`palette` grass/leaf tones)

**Interfaces:**
- Produces: `createGradePass(): ShaderPass` with `pass.setMix(m: number)`, where m=0 is day and m=1 is dusk. `engine.grade` exposes it.
- Produces: palette keys `grassRoot`, `grassTip` (used by Tasks 2 and 3).

- [x] **Step 1: Write `createGradePass()`** in `src/core/grade.js`. It's a `ShaderPass` (`three/addons/postprocessing/ShaderPass.js`) that runs *after* `OutputPass`, so it works in display space. Its uniforms and starting values, to tune by eye against the reference:
  - `uShadowTint` = vec3(0.42, 0.30, 0.62) (purple), blended into pixels by `(1 - luma)^2 * uShadowAmt`, with `uShadowAmt` = 0.35
  - `uHighTint` = vec3(1.0, 0.86, 0.62) (warm), blended by `luma^2 * uHighAmt`, with `uHighAmt` = 0.18
  - `uSaturation` = 1.18 (mix from luma toward color)
  - `uVignette` = 0.22 (darken toward the corners)
  - `setMix(m)` lerps `uShadowAmt` 0.28 → 0.40 and `uHighAmt` 0.12 → 0.24 from day to dusk
- [x] **Step 2: Wire it in `engine.js`.** `composer.addPass(grade)` after the `OutputPass`. Change the `HemisphereLight` ground color from `palette.grassDark` to `0x6a4a8a` (purple bounce, so shadowed sides go purple instead of grey). Return `grade` from `createEngine`.
- [x] **Step 3: Drive it from day/dusk.** In the `atmosphere.js` lerp function (the one that sets `hemi.color` from `hemiDay`/`hemiDusk` using `m`), call `ctx.engine?.grade?.setMix(m)`, or whatever reference to the engine is already in scope there. Also lerp the hemi ground color from `0x6a4a8a` (day) to `0x5a3a7a` (dusk).
- [x] **Step 4: Warm the palette.** In `constants.js`: `grass: 0xa8b84a`, `grassDark: 0x7f8f35`, `grassLight: 0xc9cf62`, and add `grassRoot: 0x4f5a22` and `grassTip: 0xd9d860`. Leave the district accents alone.
- [x] **Step 5: Verify.** Reload, run MEASURE: calls must equal the baseline +1 (the grade pass) at most. Take CAMERA screenshots in dusk and day. Shadows should read purple, highlights warm, grass yellow-green. Console: no errors (`read_console_messages onlyErrors`).
- [x] **Step 6: Commit and ship.**
```bash
git add src/core/grade.js src/core/engine.js src/world/atmosphere.js src/core/constants.js
git commit -m "Art pass: warm color grade, purple shadow bounce, warmer grass palette"
```
Then the sync-site skill: push, wait for the live `src/core/grade.js` to match, and check https://purabh.website loads with no console errors.

---

### Task 2: Instanced grass field

**Files:**
- Create: `src/world/groundMask.js`
- Create: `src/world/grass.js`
- Modify: `src/world/terrain.js` (import `PLAZA`, `PATH_W` from groundMask instead of defining them)
- Modify: `src/world/atmosphere.js` (delete the box tufts loop in section 3, keep the tree sway in the same `onUpdate`)
- Modify: `src/main.js` (call `buildGrass(ctx)` after `buildTerrain`; paint the ground slab `palette.grassRoot`)

**Interfaces:**
- Consumes: `palette.grassRoot`, `palette.grassTip` (Task 1); `layout.DISTRICTS`, `layout.groundSize`; `engine.lowQuality`; `PW.player` position (whatever `player.js` exposes; read it once, likely `player.position` or `player.object.position`).
- Produces: `export const PLAZA = 24, PATH_W = 4;` and `export function isGround(x: number, z: number): boolean` in `groundMask.js`. It returns true only on open grass.
- Produces: `export function buildGrass(ctx): { mesh: THREE.InstancedMesh, count: number }` in `grass.js`.

- [x] **Step 1: Write the mask test** (run in the Browser pane after Step 2):
```js
const { isGround } = await import('/src/world/groundMask.js');
({
  spawn: isGround(0, 0),                     // false: plaza
  pathToRutgers: isGround(0, -30),           // false: on the walkway
  rutgersFloor: isGround(0, -52),            // false: district floor
  beach: isGround(115, 0),                   // false: sand rim
  openField: isGround(30, 0),                // true
  besidePath: isGround(5, -30),              // true: just off the 4m walkway
})
```
Expected: exactly the comments above.
- [x] **Step 2: Implement `isGround`.** It returns false when: `|x|,|z| < PLAZA/2 + 2`; the distance from `(x,z)` to the segment from the origin to any district center is `< PATH_W/2 + 0.6`; it's inside a district's floor square (`|x-cx|, |z-cz| < radius*0.9 + 1.5`); or `|x|` or `|z| > groundSize/2 - 14` (the beach). Make `terrain.js` import `PLAZA` and `PATH_W` from here, so the paths and the mask can never drift apart. Run the Step 1 test: all six values match.
- [x] **Step 3: Build the blade geometry and shader in `grass.js`.**
  - Blade: one `BufferGeometry` with 5 vertices, 3 triangles, width 0.12 tapering to 0 at the tip, height 1. Store an attribute `aT` (0 at the root, 1 at the tip).
  - Instances: `GRASS_HIGH = 90000`, `GRASS_LOW = 25000`, using `GRASS_LOW` when `engine.lowQuality` or `?quality=low`. Scatter them with a seeded RNG (copy `makeRng` from `environment.js`) over the island and keep only `isGround` points. Each one gets a random yaw, height 0.5–1.1 and a small lean, packed in `instanceMatrix`, plus one `aRand` float per instance.
  - Material: `ShaderMaterial` with `fog: true` and the uniforms `UniformsLib.fog` + `uTime`, `uRoot`, `uTip`, `uSunDir`, `uPlayer` (vec3), `uFadeDist` = 85.
  - Vertex shader: world position from `instanceMatrix`. Wind bends the tip by `aT^2 * (sin(uTime*1.7 + wx*0.35 + wz*0.22)*0.25 + noise)`. The tip is pushed away from `uPlayer` within 1.6 m. Height scales to 0 between `uFadeDist` and `uFadeDist + 15` from the camera. Include `fog_pars_vertex` / `fog_vertex` chunks.
  - Fragment shader: `mix(uRoot, uTip, aT)`, times a fake light `0.75 + 0.25 * max(dot(n, uSunDir), 0)` with a per-instance ±8% brightness from `aRand`, then the `fog_fragment` chunk.
  - `frustumCulled = false`, `castShadow = false`, `receiveShadow = false`. Update `uTime`, `uPlayer` and `uSunDir` (from `engine.sun.position`) in `ctx.onUpdate`.
- [x] **Step 4: Remove the old tufts.** In `atmosphere.js` section 3, delete the `bladeTones` / `tufts` scatter and the `tf.g.rotation` line. Keep the `swayables` loop exactly as it is, and update the header comment to `3) tree sway`. In `main.js`, change the ground slab color to `palette.grassRoot` and call `buildGrass(ctx)` right after `buildTerrain(ctx)`.
- [x] **Step 5: Verify.**
  - MEASURE: calls ≤ the Task 1 number −(old tuft meshes) +1. Log `buildGrass` count with `console.info('[grass]', count)`. It should be about 50–70k after masking on high.
  - CAMERA `[[18,10,22],[0,1,0]]` and `[[30,4,10],[40,0,0]]` (low, inside a field), in dusk and day. The grass should be dense, gradient, moving, and absent from paths and plazas.
  - Player bend: `PW.player` walks into grass and the blades around the feet lean away. A screenshot is enough.
  - Low quality: load `http://localhost:5174/?quality=low`. The console shows `[grass]` ≤ 25000 and no errors.
> **As built (2026-10-22):** the blades don't cover the whole island. 80k blades (25k low) sit in a 92 m square patch that is re-centered each frame on where the camera looks, wrapping in world space, with the mask baked into a 256² texture. `buildGrass(ctx, player, engine)` is called after `createPlayer`. The ground slab stays `palette.grass` (the mid tone), because a far field painted the root color looked like dirt.

- [x] **Step 6: Commit and ship.**
```bash
git add src/world/groundMask.js src/world/grass.js src/world/terrain.js src/world/atmosphere.js src/main.js
git commit -m "Art pass: instanced wind-blown grass field replaces box tufts"
```
Then sync-site and check the live site as in Task 1.

---

### Task 3: Leaf-card trees

**Files:**
- Create: `src/world/foliage.js`
- Modify: `src/voxel/voxel.js` (`tree()` body only, same signature and return type)
- Modify: `src/world/environment.js` (pass a varied `leaf` color per cluster)

**Interfaces:**
- Consumes: `swayables` (unchanged); `addCircle` (unchanged call).
- Produces: `export function canopy({ radius: number, cards: number, color: number, seed: number }): THREE.Mesh` in `foliage.js`. That's ONE mesh per canopy, with all the cards merged into a single geometry and a shared material per color.
- Produces: `export const CANOPY_COLORS = { green: 0x9cc84a, yellow: 0xe8c840, pink: 0xf08fb4, red: 0xe0563a };`
- Keeps: `tree({ pos, h, trunk, leaf }) → THREE.Group` with `userData.sway = true`, pushed into `swayables`, with the same collider call. The Projects district and `environment.js` callers must not need changes to keep working.

- [x] **Step 1: Write the count check** (run after Step 3):
```js
await new Promise(r => setTimeout(r, 9000));   // let Projects district finish
const { swayables } = await import('/src/voxel/voxel.js');
const leafy = swayables.filter(g => g.children.some(c => c.userData.canopy)).length;
({ trees: swayables.length, leafy })
```
Expected: `leafy === trees` and `trees` the same as before (count it at Task 0 or before editing).
- [x] **Step 2: Implement `canopy()`.**
  - Leaf texture: a 64×64 canvas with a white rounded-diamond leaf shape on transparency, made once and cached.
  - Cards: `cards` quads of size 0.55–0.9, placed with random points in a sphere of `radius` (bias them toward the surface: `r = radius * (0.55 + 0.45*rand^0.5)`), each facing a random direction.
  - Normals: **every vertex normal of a card = `normalize(cardCenter)`** (out from the canopy center). This is the trick that makes it shade like a soft ball.
  - Build all cards into one `BufferGeometry` with position, normal and uv.
  - Material: `MeshLambertMaterial({ map: leafTex, color, alphaTest: 0.5, side: DoubleSide })`, cached per color.
  - Mesh: `castShadow = true`, `receiveShadow = false`, `userData.canopy = true`.
- [x] **Step 3: Rebuild `tree()`.** A trunk made from `CylinderGeometry(0.22, 0.38, h, 6)` in the trunk color, positioned at `h/2`. Then three canopies from `canopy()`: a main one at `[0, h+0.6, 0]` with radius 2.2 and 320 cards, plus two smaller ones offset ±0.9 at `h-0.2` with radius 1.4 and 160 cards. Everything else (group, sway flag, `swayables.push`, `addCircle`) stays exactly as it is.
- [x] **Step 4: Vary the colors.** In `environment.js`, replace `leafTones` with `[CANOPY_COLORS.green, CANOPY_COLORS.green, CANOPY_COLORS.yellow, CANOPY_COLORS.pink, CANOPY_COLORS.red]` and pick **one color per cluster** (not per tree), so groves read as groups like in the reference.
- [x] **Step 5: Verify.** The count check from Step 1 passes. MEASURE: calls ≤ the Task 2 number + 30 (one canopy mesh replaces two boxes, roughly neutral). CAMERA at `[[18,10,22],[0,1,0]]` and close on a grove (find one with `swayables[0].position`), in dusk and day. Canopies should look fluffy, soft-shaded and colored, still swaying. Walk into a trunk: the player is still blocked.
- [x] **Step 6: Commit and ship.**
```bash
git add src/world/foliage.js src/voxel/voxel.js src/world/environment.js
git commit -m "Art pass: fluffy leaf-card tree canopies in grove colors"
```
Then sync-site and check the live site.

---

### Task 4: Falling leaves

**Files:**
- Modify: `src/world/foliage.js` (add `buildFallingLeaves(ctx)`)
- Modify: `src/main.js` (call it after `buildEnvironment`)

**Interfaces:**
- Consumes: `swayables` (spawn points), `CANOPY_COLORS`.
- Produces: `export function buildFallingLeaves(ctx): THREE.Points`.

- [x] **Step 1: Implement.** One `Points` of `LEAVES = 400` (150 when low quality), using the leaf texture as `map`, size 0.35, `sizeAttenuation`, a per-point color picked from the nearest tree's canopy color, and `depthWrite: false`. Each frame in `onUpdate`: fall at 0.4–0.8 m/s, drift sideways with the same wind phase as the grass, and respawn under a random tree canopy once below y=0.05. Add a tiny spin by modulating x with a sine.
- [x] **Step 2: Verify.** MEASURE: calls +1 at most. A CAMERA screenshot near a grove shows a few leaves in the air. No console errors.
- [x] **Step 3: Commit and ship.**
```bash
git add src/world/foliage.js src/main.js
git commit -m "Art pass: falling leaves drifting from the groves"
```
Then sync-site.

---

### Task 5: Bevelled boxes

**Files:**
- Modify: `src/voxel/voxel.js` (`box()` geometry only)

**Interfaces:**
- Keeps: `box({ size, color, pos, shadow, ...mat }) → THREE.Mesh`. It gains one optional `bevel` param (default `true`); `patch()` and `groundSlab()` never bevel.

- [x] **Step 1: Implement.** In `box()`, use `RoundedBoxGeometry(w, h, d, 2, r)` from `three/addons/geometries/RoundedBoxGeometry.js`, with `r = min(0.08, 0.18 * min(w,h,d))`. Cache geometries by the key `w|h|d` in a `Map`, so identical boxes share one geometry. If the merge work keys anything off `BoxGeometry` (for example `instanceof` or a `type` check), keep that compatible.
- [x] **Step 2: Verify.** MEASURE: calls must equal the Task 4 number (bevels add triangles, not calls). Triangles may grow, and that's fine below about 2× the Task 4 count. If they grow more, drop the segments to 1. Take a CAMERA screenshot close on a landmark: edges should catch a soft highlight and nothing should z-fight.
- [x] **Step 3: Commit and ship.**
```bash
git add src/voxel/voxel.js
git commit -m "Art pass: soft bevelled edges on voxel boxes"
```
Then sync-site, `graphify update .`, and a write-log entry summarizing the art pass with the before/after numbers.
