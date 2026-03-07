import './core.js';
import './geometry.js';
import './materials.js';
import './ui-controls.js';
import './presets.js';
import './export-utils.js';
import { bindDataEvents } from './app-bootstrap.js';
import { initWorkbench } from './pro-workbench.js';

window.addEventListener('DOMContentLoaded', () => {
  bindDataEvents(document);
  initWorkbench();
});
