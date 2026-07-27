// Shared helpers for the big logos that float above the landmark buildings.
import * as THREE from 'three';

// Draw a rounded wordmark panel (a big primary line plus an optional small,
// letter-spaced secondary line) to a canvas texture. Corners stay transparent.
export function makeWordmarkTexture({ primary, secondary = '', bg = '#5a40b0', fg = '#ffffff' }) {
  const w = 1024, h = 384;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');

  const round = (x, y, ww, hh, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + ww, y, x + ww, y + hh, r);
    g.arcTo(x + ww, y + hh, x, y + hh, r);
    g.arcTo(x, y + hh, x, y, r);
    g.arcTo(x, y, x + ww, y, r);
    g.closePath();
  };

  // bg is optional: pass null/false/'transparent' to draw the text straight onto
  // a transparent panel so it sits directly on whatever is behind it.
  if (bg && bg !== 'transparent') {
    g.fillStyle = bg;
    round(14, 14, w - 28, h - 28, 48);
    g.fill();
  }

  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '800 156px "Arial Black", Arial, sans-serif';
  g.fillText(primary, w / 2, secondary ? h / 2 - 40 : h / 2);
  if (secondary) {
    g.font = '700 58px Arial, sans-serif';
    try { g.letterSpacing = '12px'; } catch (e) { /* fine if unsupported */ }
    g.fillText(secondary, w / 2 + 6, h / 2 + 86);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Add a logo plane floating above `center` at height `y`, gently bobbing and
// always billboarding (kept upright) toward the camera.
export function addFloatingLogo(ctx, { tex, center, y, size = [10, 3.75], bob = 0.5 }) {
  const { scene, camera, onUpdate } = ctx;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size[0], size[1]),
    new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.5,
      transparent: true, alphaTest: 0.15, roughness: 0.8, metalness: 0, side: THREE.DoubleSide,
    }),
  );
  mesh.position.set(center[0], y, center[1]);
  scene.add(mesh);
  onUpdate((dt, elapsed) => {
    mesh.position.y = y + Math.sin(elapsed * 1.1) * bob;
    mesh.rotation.y = Math.atan2(camera.position.x - mesh.position.x, camera.position.z - mesh.position.z);
  });
  return mesh;
}

// Draw a single bold word to a transparent texture (e.g. a sign label). The font
// auto-shrinks so wide words are never clipped at the edges of the canvas.
export function makeTextTexture(text, fg = '#ffffff') {
  const w = 1024, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  try { g.letterSpacing = '6px'; } catch (e) { /* fine if unsupported */ }
  let size = 168;
  g.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  while (size > 48 && g.measureText(text).width > w * 0.84) {
    size -= 6;
    g.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  }
  g.fillText(text, w / 2, h / 2 + 6);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Add a static logo sign mounted flat on a building face.
//   pos:     [x, y, z] center of the sign
//   faceYaw: rotation.y so it faces outward (+PI/2 = +X, -PI/2 = -X, 0 = +Z, PI = -Z)
export function addBuildingSign(ctx, { tex, pos, faceYaw, size = [5, 1.9] }) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size[0], size[1]),
    new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.5,
      transparent: true, alphaTest: 0.12, roughness: 0.8, metalness: 0, side: THREE.DoubleSide,
    }),
  );
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.y = faceYaw;
  ctx.scene.add(mesh);
  return mesh;
}
