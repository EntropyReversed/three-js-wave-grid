export const fragmentShader = `
uniform float gridSize;
uniform float lineWidth;
uniform vec2 resolution;
uniform float edgeFade;
uniform float topFade;

varying vec2 vUv;
varying float vZ;

float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

vec2 saturate(vec2 v) {
  return clamp(v, 0.0, 1.0);
}

void main() {
  vec2 uv = vUv * gridSize;

  vec2 uvDeriv = fwidth(uv);
  vec2 drawWidth = max(vec2(lineWidth), uvDeriv);
  vec2 lineAA = uvDeriv * 1.5;

  vec2 gridUV = 1.0 - abs(fract(uv) * 2.0 - 1.0);
  vec2 grid2 = smoothstep(drawWidth + lineAA, drawWidth - lineAA, gridUV);
  grid2 *= saturate(vec2(lineWidth) / drawWidth);

  float grid = mix(grid2.x, 1.0, grid2.y);

  // Calculate the fade effect
  float fade = 1.0;
  fade *= smoothstep(0.0, edgeFade, vUv.x);      // Left edge fade
  fade *= smoothstep(0.0, edgeFade, 1.0 - vUv.x); // Right edge fade
  fade *= smoothstep(0.0, edgeFade, vUv.y);      // Bottom edge fade
  fade *= smoothstep(0.0, topFade, 1.0 - vUv.y); // Top edge fade

  vec3 color = mix(vec3(0.11), vec3(1.0), grid);
  gl_FragColor = vec4(color, fade);
}
`;