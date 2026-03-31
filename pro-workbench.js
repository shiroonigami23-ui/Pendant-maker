import { currentConfig, pendantGroup, renderer, scene, showStatus } from './core.js';
import { safeCreatePendant, syncUIWithConfig } from './ui-controls.js';
import {
  buildBOM,
  estimateCost,
  exportCsv,
  getPrintProfiles,
  loadProjects,
  makeReadonlyShareLink,
  parseReadonlyConfig,
  shareReviewLink,
  saveProjectVersion,
  validateManufacturing
} from './pro-utils.js';

let wizardStep = 0;
const wizard = ['shape', 'material', 'gem', 'engraving', 'export'];

const sectionMap = {
  shape: ['Base Shape'],
  material: ['Material & Finish'],
  gem: ['Gemstone'],
  engraving: ['Text Engraving'],
  export: ['Export & Save']
};

export function initWorkbench() {
  mountWorkbench();
  bindWorkbenchEvents();
  applyWizardStep();
  renderValidation();
  renderProjects();
  applyReviewModeIfPresent();
  updateCostCard();
}

function mountWorkbench() {
  const root = document.getElementById('pro-workbench');
  if (!root) return;
  root.innerHTML = `
    <div class="workbench-card">
      <div class="workbench-title">Workflow Wizard</div>
      <div class="wizard-row">
        <button id="wb-prev" class="mini-btn">Prev</button>
        <span id="wb-step-label">Step 1/5</span>
        <button id="wb-next" class="mini-btn">Next</button>
      </div>
      <div class="wizard-chip-row" id="wb-step-chips"></div>
    </div>

    <div class="workbench-card">
      <div class="workbench-title">UX Mode</div>
      <label><input type="radio" name="uxMode" value="basic" checked> Basic</label>
      <label><input type="radio" name="uxMode" value="advanced"> Advanced</label>
    </div>

    <div class="workbench-card">
      <div class="workbench-title">Manufacturing Validation</div>
      <select id="print-profile" class="workbench-input"></select>
      <label>Tolerance Compensation (mm)</label>
      <input id="tolerance-comp" type="range" min="-0.3" max="0.3" value="0" step="0.01">
      <div id="tolerance-label">0.00 mm</div>
      <div id="validation-hints" class="hint-box"></div>
      <button id="wb-refresh-validation" class="mini-btn">Recheck</button>
      <button id="wb-export-report" class="mini-btn">Export PDF Report</button>
    </div>

    <div class="workbench-card">
      <div class="workbench-title">Rendering Quality</div>
      <label>HDRI Environment</label>
      <select id="env-preset" class="workbench-input">
        <option value="studio">Studio</option>
        <option value="cool">Cool Daylight</option>
        <option value="warm">Warm Gold</option>
      </select>
      <label>Exposure</label>
      <input id="exposure" type="range" min="0.8" max="2.6" value="2.0" step="0.1">
      <label><input id="perf-mode" type="checkbox"> Performance mode</label>
    </div>

    <div class="workbench-card">
      <div class="workbench-title">Business Tools</div>
      <div id="cost-card" class="hint-box"></div>
      <button id="wb-export-bom" class="mini-btn">Export BOM CSV</button>
      <button id="wb-copy-review" class="mini-btn">Copy Review Link</button>
    </div>

    <div class="workbench-card">
      <div class="workbench-title">Project Versions</div>
      <input id="project-name" class="workbench-input" placeholder="Project name">
      <button id="wb-save-version" class="mini-btn">Save Version</button>
      <select id="project-select" class="workbench-input"></select>
      <select id="version-select" class="workbench-input"></select>
      <button id="wb-load-version" class="mini-btn">Load Version</button>
    </div>

    <div class="workbench-card">
      <div class="workbench-title">Preset Marketplace</div>
      <div class="market-item"><strong>Minimal Halo</strong><span>clean and printable</span><button class="mini-btn" data-load-preset="royal-gem">Load</button></div>
      <div class="market-item"><strong>Angel Signature</strong><span>ornate gift style</span><button class="mini-btn" data-load-preset="angel-heart">Load</button></div>
      <div class="market-item"><strong>Vintage Locket</strong><span>photo-memory layout</span><button class="mini-btn" data-load-preset="vintage-locket">Load</button></div>
    </div>
  `;

  const profiles = getPrintProfiles();
  const profileEl = document.getElementById('print-profile');
  Object.entries(profiles).forEach(([k, v]) => {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = v.name;
    profileEl.appendChild(o);
  });

  renderStepChips();
}

function bindWorkbenchEvents() {
  document.getElementById('wb-prev')?.addEventListener('click', () => {
    wizardStep = Math.max(0, wizardStep - 1);
    applyWizardStep();
  });

  document.getElementById('wb-next')?.addEventListener('click', () => {
    wizardStep = Math.min(wizard.length - 1, wizardStep + 1);
    applyWizardStep();
  });

  document.getElementsByName('uxMode').forEach((el) => {
    el.addEventListener('change', (e) => applyUxMode(e.target.value));
  });

  document.getElementById('wb-refresh-validation')?.addEventListener('click', renderValidation);
  document.getElementById('tolerance-comp')?.addEventListener('input', onToleranceChange);
  document.getElementById('print-profile')?.addEventListener('change', renderValidation);

  document.getElementById('wb-export-report')?.addEventListener('click', exportPdfReport);
  document
    .getElementById('wb-export-bom')
    ?.addEventListener('click', () => exportCsv(buildBOM(currentConfig), `bom-${Date.now()}.csv`));
  document.getElementById('wb-copy-review')?.addEventListener('click', copyReviewLink);

  document
    .getElementById('env-preset')
    ?.addEventListener('change', (e) => setEnvironmentPreset(e.target.value));
  document.getElementById('exposure')?.addEventListener('input', (e) => {
    renderer.toneMappingExposure = Number(e.target.value);
  });
  document
    .getElementById('perf-mode')
    ?.addEventListener('change', (e) => setPerformanceMode(Boolean(e.target.checked)));

  document.getElementById('wb-save-version')?.addEventListener('click', saveProject);
  document.getElementById('project-select')?.addEventListener('change', renderProjectVersions);
  document.getElementById('wb-load-version')?.addEventListener('click', loadSelectedVersion);

  document.querySelectorAll('[data-load-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-load-preset');
      if (window.loadPreset) window.loadPreset(preset);
      setTimeout(() => {
        renderValidation();
        updateCostCard();
      }, 100);
    });
  });

  ['input', 'change'].forEach((evt) => {
    document.querySelector('.control-panel')?.addEventListener(evt, () => {
      renderValidation();
      updateCostCard();
    });
  });
}

function renderStepChips() {
  const container = document.getElementById('wb-step-chips');
  if (!container) return;
  container.innerHTML = '';
  wizard.forEach((step, index) => {
    const chip = document.createElement('button');
    chip.className = `step-chip ${index === wizardStep ? 'active' : ''}`;
    chip.textContent = step;
    chip.addEventListener('click', () => {
      wizardStep = index;
      applyWizardStep();
    });
    container.appendChild(chip);
  });
}

function applyWizardStep() {
  document.getElementById('wb-step-label').textContent =
    `Step ${wizardStep + 1}/${wizard.length}: ${wizard[wizardStep]}`;
  renderStepChips();

  const allSections = [...document.querySelectorAll('.control-section')];
  allSections.forEach((sec) => (sec.style.display = 'none'));

  const labels = sectionMap[wizard[wizardStep]] || [];
  labels.forEach((label) => {
    const section = allSections.find((sec) => sec.querySelector('h3')?.textContent.includes(label));
    if (section) section.style.display = 'block';
  });
}

function applyUxMode(mode) {
  const advancedKeywords = ['Overlay', 'Chain', 'Lighting', 'Reference', 'Border'];
  const sections = [...document.querySelectorAll('.control-section')];
  sections.forEach((section) => {
    const title = section.querySelector('h3')?.textContent || '';
    const isAdvanced = advancedKeywords.some((k) => title.includes(k));
    if (mode === 'basic' && isAdvanced) {
      section.style.display = 'none';
    } else if (mode === 'advanced') {
      section.style.display = 'block';
    }
  });
}

function onToleranceChange() {
  const value = Number(document.getElementById('tolerance-comp').value);
  document.getElementById('tolerance-label').textContent = `${value.toFixed(2)} mm`;
  currentConfig.toleranceCompensation = value;
  renderValidation();
}

function renderValidation() {
  const box = document.getElementById('validation-hints');
  if (!box) return;

  const profileKey = document.getElementById('print-profile')?.value || 'metal_cast';
  const profile = getPrintProfiles()[profileKey];
  const results = validateManufacturing(currentConfig);

  const lines = [
    `Profile: ${profile.name}`,
    `Minimum thickness target: ${profile.minThickness.toFixed(2)} mm`
  ];

  if (currentConfig.thickness < profile.minThickness) {
    results.issues.push(
      `Current thickness ${currentConfig.thickness.toFixed(2)} mm is below profile minimum.`
    );
  }

  const meshChecks = inspectMeshIntegrity();
  if (meshChecks.warnings.length) {
    lines.push('Mesh Heuristics:');
    meshChecks.warnings.forEach((w) => lines.push(`- ${w}`));
  }

  if (results.issues.length) {
    lines.push('Issues:');
    results.issues.forEach((i) => lines.push(`- ${i}`));
  }

  if (results.warnings.length) {
    lines.push('Warnings:');
    results.warnings.forEach((w) => lines.push(`- ${w}`));
  }

  if (!results.issues.length && !results.warnings.length) {
    lines.push('All checks passed for selected profile.');
  }

  box.textContent = lines.join('\n');
}

function inspectMeshIntegrity() {
  const warnings = [];
  if (!pendantGroup) return { warnings };

  const meshes = [];
  pendantGroup.traverse((obj) => {
    if (obj.isMesh && obj.geometry) meshes.push(obj);
  });

  if (meshes.length === 0) {
    warnings.push('No mesh geometry found for integrity checks.');
    return { warnings };
  }

  let tinyPartCount = 0;
  let detachedCount = 0;
  const centers = [];
  let totalVolume = 0;

  for (const m of meshes) {
    m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox;
    if (!bb) continue;

    const sx = bb.max.x - bb.min.x;
    const sy = bb.max.y - bb.min.y;
    const sz = bb.max.z - bb.min.z;
    const volume = Math.abs(sx * sy * sz);
    totalVolume += volume;
    if (volume < 0.25) tinyPartCount++;

    centers.push({
      x: (bb.min.x + bb.max.x) / 2 + m.position.x,
      y: (bb.min.y + bb.max.y) / 2 + m.position.y,
      z: (bb.min.z + bb.max.z) / 2 + m.position.z,
      volume
    });
  }

  const main = centers.reduce(
    (acc, c) => (c.volume > acc.volume ? c : acc),
    centers[0] || { x: 0, y: 0, z: 0, volume: 0 }
  );

  for (const c of centers) {
    const d = Math.hypot(c.x - main.x, c.y - main.y, c.z - main.z);
    if (c !== main && d > Math.max(currentConfig.width, currentConfig.height) * 1.2) {
      detachedCount++;
    }
  }

  if (tinyPartCount > 2) {
    warnings.push(
      `${tinyPartCount} very small mesh components detected; verify fragile ornaments.`
    );
  }
  if (detachedCount > 0) {
    warnings.push(`${detachedCount} potentially detached mesh components detected.`);
  }
  if (totalVolume < 10) {
    warnings.push('Total mesh volume appears low for manufacturing scale.');
  }

  return { warnings };
}

function updateCostCard() {
  const card = document.getElementById('cost-card');
  if (!card) return;
  const c = estimateCost(currentConfig);
  card.innerHTML = `Material: ${c.material}<br>Mass: ${c.massGrams} g<br>Metal: $${c.metalCost}<br>Gem: $${c.gemCost}<br>Finish: $${c.finishingCost}<br><strong>Total: $${c.totalUsd}</strong>`;
}

async function exportPdfReport() {
  const [{ jsPDF }] = await Promise.all([import('jspdf')]);

  const pdf = new jsPDF();
  const v = validateManufacturing(currentConfig);
  const c = estimateCost(currentConfig);
  const rows = buildBOM(currentConfig);

  pdf.setFontSize(16);
  pdf.text('Pendant Manufacturing Report', 14, 18);
  pdf.setFontSize(11);
  pdf.text(`Date: ${new Date().toLocaleString()}`, 14, 26);
  pdf.text(`Shape: ${currentConfig.shape}`, 14, 34);
  pdf.text(
    `Dimensions (mm): ${currentConfig.width} x ${currentConfig.height} x ${currentConfig.thickness}`,
    14,
    41
  );
  pdf.text(`Material: ${currentConfig.material}`, 14, 48);
  pdf.text(
    `Tolerance compensation: ${Number(currentConfig.toleranceCompensation || 0).toFixed(2)} mm`,
    14,
    55
  );

  let y = 64;
  pdf.text('Validation', 14, y);
  y += 6;
  (v.issues.length ? v.issues : ['No blocking issues']).forEach((line) => {
    pdf.text(`- ${line}`, 16, y);
    y += 6;
  });

  y += 4;
  pdf.text(`Estimated Cost: $${c.totalUsd}`, 14, y);
  y += 8;

  pdf.text('BOM', 14, y);
  y += 6;
  rows.slice(1, 10).forEach((r) => {
    pdf.text(`${r[0]} | ${r[1]} | ${r[2]}`, 16, y);
    y += 6;
  });

  pdf.save(`pendant-report-${Date.now()}.pdf`);
  showStatus('PDF report exported', 'success');
}

async function copyReviewLink() {
  const url = makeReadonlyShareLink(currentConfig);
  if (shareReviewLink(url)) {
    showStatus('Review link opened in native share sheet', 'success');
    return;
  }
  await navigator.clipboard.writeText(url);
  showStatus('Review link copied', 'success');
}

function saveProject() {
  const name = document.getElementById('project-name')?.value?.trim();
  if (!name) {
    showStatus('Enter a project name first', 'warning');
    return;
  }
  saveProjectVersion(name, currentConfig);
  renderProjects();
  showStatus('Project version saved', 'success');
}

function renderProjects() {
  const all = loadProjects();
  const select = document.getElementById('project-select');
  if (!select) return;

  const names = Object.keys(all);
  select.innerHTML = names.map((n) => `<option value="${n}">${n}</option>`).join('');
  renderProjectVersions();
}

function renderProjectVersions() {
  const all = loadProjects();
  const project = document.getElementById('project-select')?.value;
  const versions = all[project] || [];
  const select = document.getElementById('version-select');
  if (!select) return;

  select.innerHTML = versions
    .map((v, idx) => `<option value="${idx}">${new Date(v.timestamp).toLocaleString()}</option>`)
    .join('');
}

function loadSelectedVersion() {
  const all = loadProjects();
  const project = document.getElementById('project-select')?.value;
  const idx = Number(document.getElementById('version-select')?.value || 0);
  const selected = all[project]?.[idx];
  if (!selected) {
    showStatus('No version selected', 'warning');
    return;
  }
  Object.assign(currentConfig, selected.config);
  syncUIWithConfig();
  safeCreatePendant();
  renderValidation();
  updateCostCard();
  showStatus('Project version loaded', 'success');
}

function applyReviewModeIfPresent() {
  const cfg = parseReadonlyConfig();
  if (!cfg) return;
  Object.assign(currentConfig, cfg);
  syncUIWithConfig();
  safeCreatePendant();
  document.querySelectorAll('input,select,button,textarea').forEach((el) => {
    if (el.id === 'wb-copy-review') return;
    el.disabled = true;
  });
  showStatus('Readonly review mode', 'info');
}

function setEnvironmentPreset(preset) {
  if (preset === 'cool') {
    scene.background.setHex(0xe6f3ff);
  } else if (preset === 'warm') {
    scene.background.setHex(0xfff1dd);
  } else {
    scene.background.setHex(0xf5f5f5);
  }
}

function setPerformanceMode(on) {
  if (on) {
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
    currentConfig.bloomEffect = false;
    showStatus('Performance mode enabled', 'info');
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    showStatus('Performance mode disabled', 'info');
  }
}
