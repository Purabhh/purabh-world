// Final color grade, run after OutputPass (so it works on display-space color).
// It pushes the flat dusk/day look toward a painted one: dark tones lean purple,
// bright tones lean warm, saturation goes up a notch and the corners darken a little.
// setMix(m) follows the day (0) <-> dusk (1) blend from atmosphere.js.
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uShadowTint: { value: new THREE.Vector3(0.42, 0.30, 0.62) },
    uShadowAmt: { value: 0.35 },
    uHighTint: { value: new THREE.Vector3(1.0, 0.86, 0.62) },
    uHighAmt: { value: 0.18 },
    uSaturation: { value: 1.18 },
    uVignette: { value: 0.22 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec3 uShadowTint, uHighTint;
    uniform float uShadowAmt, uHighAmt, uSaturation, uVignette;
    varying vec2 vUv;
    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 c = tex.rgb;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, uSaturation);
      float lo = (1.0 - l) * (1.0 - l);
      // Tint the darks purple, then lift them a touch so shadows stay soft, not black.
      c = mix(c, c * uShadowTint * 1.6, lo * uShadowAmt * 0.6);
      c += uShadowTint * lo * uShadowAmt * 0.18;
      c = mix(c, c * uHighTint * 1.08, l * l * uHighAmt);
      vec2 d = vUv - 0.5;
      c *= 1.0 - uVignette * smoothstep(0.25, 0.75, dot(d, d) * 2.0);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), tex.a);
    }`,
};

export function createGradePass() {
  const pass = new ShaderPass(GradeShader);
  pass.setMix = (m) => {
    pass.uniforms.uShadowAmt.value = 0.28 + (0.40 - 0.28) * m;
    pass.uniforms.uHighAmt.value = 0.12 + (0.24 - 0.12) * m;
  };
  pass.setMix(1);
  return pass;
}
