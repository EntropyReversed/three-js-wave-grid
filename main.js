import { WaveGrid } from './WaveGrid';
import './style.css';

if (document.querySelector('canvas.webgl.wave-grid')) {
  new WaveGrid();
}
