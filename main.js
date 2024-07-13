import './style.css';

import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Objects
const geometry = new THREE.PlaneGeometry(2, 1, 100, 30);

// Materials
const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 1.0 },
    resolution: { value: new THREE.Vector2() },
    gridSize: { value: 30.0 },
    lineWidth: { value: 0.05 },
    edgeFade: { value: 0.1 },
    topFade: { value: 0.5 },
    strength: { value: 0.1 },
    speed: { value: 1.0 },
  },
  transparent: true,
  side: THREE.DoubleSide,
  vertexShader: `
    varying vec2 vUv;

    uniform float time;
    uniform float strength;
    uniform float speed;

    // GLSL Simplex Noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    
    vec4 taylorInvSqrt(vec4 r)
    {
      return 1.79284291400159 - 0.85373472095314 * r;
    }
    
    float snoise(vec3 v)
    {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    
      // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;
    
      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
    
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
    
      // Permutations
      i = mod289(i);
      vec4 p = permute( permute( permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    
      // Gradients
      vec3  ns = 1.0 / 7.0 * D.wyz - D.xzx;
    
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
    
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
    
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
    
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
    
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
    
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
    
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    
    void main() {
      vUv = uv;
      vec3 pos = position;
    
      // Apply noise to the z-coordinate of the vertex position
      float noise = snoise(vec3(pos.x * 2.0, pos.y * 2.0, time * 0.2 * speed));
      pos.z += noise * strength;
    
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  
  `,
  fragmentShader: `
    uniform float gridSize;
    uniform float lineWidth;
    uniform vec2 resolution;
    uniform float edgeFade;
    uniform float topFade;

    varying vec2 vUv;

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
  `,
});

// Mesh
const grid = new THREE.Mesh(geometry, material);
scene.add(grid);
grid.rotation.x = -1;

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

function updateResolution() {
  const canvas = renderer.domElement;
  material.uniforms.resolution.value.set(canvas.width, canvas.height);
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  updateResolution();
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 2;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setClearColor(0x000000, 0);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

updateResolution();

gui
  .add(material.uniforms.gridSize, 'value')
  .min(5)
  .max(40)
  .step(1)
  .name('Grid Size');

gui
  .add(material.uniforms.strength, 'value')
  .min(0)
  .max(0.3)
  .step(0.01)
  .name('Strength');

gui
  .add(material.uniforms.speed, 'value')
  .min(0)
  .max(4)
  .step(0.01)
  .name('Speed');

gui
  .add(material.uniforms.lineWidth, 'value')
  .min(0.001)
  .max(0.1)
  .step(0.001)
  .name('Line Width');

gui
  .add(material.uniforms.edgeFade, 'value')
  .min(0)
  .max(0.5)
  .step(0.01)
  .name('Edge Fade');

gui
  .add(material.uniforms.topFade, 'value')
  .min(0)
  .max(1)
  .step(0.01)
  .name('Top Fade');

/**
 * Animate
 */

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  // console.log(material)
  // Update Orbital Controls
  // controls.update()

  // if (material) {
  material.uniforms.time.value = elapsedTime;
  // }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
