// Frozen sun shadows for the static world, live shadows for what moves.
//
// Redrawing every caster into the shadow map each frame was ~680 draw calls. The
// sun only moves during the day/dusk blend, so the static casters are drawn once
// into a cached map. Each frame the cache is copied back into the sun's shadow map
// (depth too, so moving things still sit correctly inside static shadows) and only
// the dynamic casters are drawn on top.
//
// Dynamic = any object tagged `userData.dynamic` (and everything under it). Those
// meshes move to DYNAMIC_LAYER; the main camera sees both layers. Swaying trees
// (`userData.sway`) stay in the cache: their lean is too small to see in a shadow.
//
// Call invalidate() after adding static casters later (async GLBs, the Projects
// district). A moved sun is picked up on its own.
import * as THREE from 'three';

export const DYNAMIC_LAYER = 1;

const copyMaterial = new THREE.ShaderMaterial({
  uniforms: { tMap: { value: null } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  // The shadow map stores depth packed into RGBA; unpack it into gl_FragDepth so
  // the depth buffer matches and dynamic casters depth-test against static ones.
  fragmentShader: `#include <packing>
    uniform sampler2D tMap; varying vec2 vUv;
    void main() { vec4 c = texture2D(tMap, vUv); gl_FragColor = c; gl_FragDepth = unpackRGBAToDepth(c); }`,
  depthTest: true, depthWrite: true, depthFunc: THREE.AlwaysDepth, blending: THREE.NoBlending,
});

export function createShadowCache(renderer, scene, camera, sun) {
  const sm = renderer.shadowMap;
  sm.autoUpdate = false;
  camera.layers.enable(DYNAMIC_LAYER);

  const copyScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMaterial);
  quad.frustumCulled = false;
  copyScene.add(quad);
  const copyCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // The shadow pass only runs inside renderer.render(), and it filters casters by
  // the layers of the camera being rendered. So each pass renders the scene from a
  // camera that sees nothing (a sliver far below the world, into a 1x1 target):
  // the main pass draws nothing, and the shadow pass draws that camera's layer.
  const dummy = new THREE.WebGLRenderTarget(1, 1);
  const blindCam = (layer) => {
    const c = new THREE.OrthographicCamera(-0.01, 0.01, 0.01, -0.01, 0.1, 0.2);
    c.position.set(0, -1e5, 0); c.updateMatrixWorld();
    c.layers.set(layer);
    return c;
  };
  const staticCam = blindCam(0);
  const dynamicCam = blindCam(DYNAMIC_LAYER);
  sun.layers.enable(DYNAMIC_LAYER); // lights are collected by layer too

  let cache = null, dirty = true;
  const lastSun = new THREE.Vector3(), lastTarget = new THREE.Vector3();
  const noClear = () => {};

  function copy(from, to) {
    copyMaterial.uniforms.tMap.value = from.texture;
    renderer.setRenderTarget(to);
    renderer.render(copyScene, copyCam);
  }

  function tagDynamic() {
    scene.traverse((o) => {
      if (!o.userData.dynamic) return;
      o.traverse((c) => c.layers.set(DYNAMIC_LAYER));
    });
  }

  function shadowPass(cam) {
    sm.needsUpdate = true;
    renderer.setRenderTarget(dummy);
    renderer.render(scene, cam);
  }

  function rebuild() {
    tagDynamic();
    shadowPass(staticCam);
    const map = sun.shadow.map;
    if (!cache) cache = new THREE.WebGLRenderTarget(map.width, map.height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    copy(map, cache);
    lastSun.copy(sun.position); lastTarget.copy(sun.target.position);
    dirty = false;
  }

  // Run once per frame, before the main render.
  function update() {
    if (!sm.enabled) return;
    if (!sun.position.equals(lastSun) || !sun.target.position.equals(lastTarget)) dirty = true;
    const prev = renderer.getRenderTarget();
    if (dirty) rebuild();
    copy(cache, sun.shadow.map);
    // Draw the dynamic casters over the restored static map, without clearing it.
    const clear = renderer.clear;
    renderer.clear = noClear;
    shadowPass(dynamicCam);
    renderer.clear = clear;
    renderer.setRenderTarget(prev);
  }

  return { update, invalidate: () => { dirty = true; } };
}
