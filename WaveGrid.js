import * as THREE from 'three';
import * as dat from 'dat.gui';
import { vertexShader } from './vertexShader';
import { fragmentShader } from './fragmentShader';

export class WaveGrid {
  constructor() {
    this.gui = new dat.GUI();
    this.clock = new THREE.Clock();
    this.noiseOffset = 0.0;
    this.targetNoiseOffset = 0.0;

    this.init();
  }

  createScene() {
    this.scene = new THREE.Scene();
  }

  createMesh() {
    const geometry = new THREE.PlaneGeometry(2, 1, 100, 50);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 1.0 },
        resolution: { value: new THREE.Vector2() },
        gridSize: { value: 50.0 },
        lineWidth: { value: 0.015 },
        edgeFade: { value: 0.2 },
        topFade: { value: 0.9 },
        strength: { value: 0.6 },
        speed: { value: 0.5 },
        noiseOffset: { value: 0.0 },
        noiseScale: { value: 1.0 }
      },
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader,
      fragmentShader,
    });

    this.grid = new THREE.Mesh(geometry, material);
    this.grid.rotation.x = -1.1;
    this.grid.position.z = -3.5;
    this.scene.add(this.grid);

    this.gui.add(material.uniforms.gridSize, 'value').min(5).max(100).step(1).name('Grid Size');
    this.gui.add(material.uniforms.strength, 'value').min(0).max(1).step(0.01).name('Strength');
    this.gui.add(material.uniforms.speed, 'value').min(0).max(4).step(0.01).name('Speed');
    this.gui.add(material.uniforms.noiseScale, 'value').min(0).max(2).step(0.01).name('Noise Scale');
    this.gui.add(material.uniforms.lineWidth, 'value').min(0.001).max(0.1).step(0.001).name('Line Width');
    this.gui.add(material.uniforms.edgeFade, 'value').min(0).max(0.5).step(0.01).name('Edge Fade');
    this.gui.add(material.uniforms.topFade, 'value').min(0).max(1).step(0.01).name('Top Fade');
    this.gui.add(this.grid.rotation, 'x').min(-1.5).max(0).step(0.01).name('Rotation');
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('canvas.webgl'), alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.updateResolution();
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 2;
    this.scene.add(this.camera);
    this.updateGridScale();
  }

  addListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('wheel', this.onWheel.bind(this));
  }

  onWheel(event) {
    this.targetNoiseOffset += event.deltaY * 0.001;
  }

  lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  updateResolution() {
    const canvas = this.renderer.domElement;
    this.grid.material.uniforms.resolution.value.set(canvas.width, canvas.height);
  }

  updateGridScale() {
    const fovY = this.camera.position.z * Math.tan((this.camera.fov * Math.PI / 180));
    this.grid.scale.x = fovY * 0.8;
    this.grid.scale.y = fovY * 0.8;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.updateGridScale();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.updateResolution();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.grid.material.uniforms.time.value = elapsedTime;
    this.noiseOffset = this.lerp(this.noiseOffset, this.targetNoiseOffset, 0.1);
    this.grid.material.uniforms.noiseOffset.value = this.noiseOffset;
    this.renderer.render(this.scene, this.camera);
  }

  init() {
    this.createScene();
    this.createMesh();
    this.createRenderer();
    this.createCamera();
    this.addListeners();
    this.animate();
  }
}