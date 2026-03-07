export function validateManufacturing(config) {
  const issues = [];
  const warnings = [];

  if (config.thickness < 1.0) {
    issues.push('Thickness is below 1.0mm. Increase thickness for structural strength.');
  }
  if (config.bevelSize > config.thickness / 2) {
    issues.push('Bevel is too large for selected thickness. Reduce bevel or increase thickness.');
  }
  if (config.hasGem && config.gemSize > Math.min(config.width, config.height) * 0.5) {
    warnings.push('Gem size is large relative to pendant face and may weaken structure.');
  }
  if (config.hasChain && config.chainLinkThickness < 0.5) {
    warnings.push('Chain thickness is below 0.5mm and may be fragile.');
  }
  if (config.shape === 'locket' && config.locketOpenAngle > 0) {
    warnings.push('Exporting while locket is open can affect manufacturability previews.');
  }
  if (config.hasWings && config.wingSize > 2.0 && config.thickness < 1.4) {
    warnings.push('Large wings with thin body can create weak joints near the base.');
  }
  if (config.hasGem && config.settingStyle === 'minimal' && config.gemSize > 10) {
    warnings.push('Minimal setting with a large gem may be insecure for production.');
  }
  if (config.hasEngraving && config.engraveDepth > 0.2 && config.thickness < 2.0) {
    issues.push('Deep engraving on thin pendant risks puncture or structural failure.');
  }
  if (config.hasChain && !config.hasBail && config.shape !== 'locket') {
    warnings.push('Chain is enabled without bail; verify attachment strength.');
  }
  if (config.borderStyle === 'pave' && !config.borderGems) {
    warnings.push('Pave border style selected without border gems enabled.');
  }

  return {
    pass: issues.length === 0,
    issues,
    warnings
  };
}

export function getPrintProfiles() {
  return {
    resin: {
      name: 'Resin (SLA/DLP)',
      minThickness: 0.8,
      tolerance: 0.05,
      supportDensity: 'high'
    },
    metal_cast: {
      name: 'Metal Cast',
      minThickness: 1.2,
      tolerance: 0.15,
      supportDensity: 'medium'
    },
    fdm: {
      name: 'FDM Prototype',
      minThickness: 1.6,
      tolerance: 0.25,
      supportDensity: 'low'
    }
  };
}

export function estimateCost(config) {
  const densityByMaterial = {
    silver: 10.49,
    gold: 19.32,
    'rose-gold': 15.6,
    platinum: 21.45,
    copper: 8.96,
    titanium: 4.5,
    'white-gold': 15.8,
    bronze: 8.8
  };

  const usdPerGram = {
    silver: 0.9,
    gold: 64,
    'rose-gold': 42,
    platinum: 33,
    copper: 0.01,
    titanium: 0.02,
    'white-gold': 47,
    bronze: 0.01
  };

  const material = config.material || 'silver';
  const density = densityByMaterial[material] ?? 10;
  const price = usdPerGram[material] ?? 1;

  const volumeMm3 = config.width * config.height * config.thickness * 0.42;
  const volumeCm3 = volumeMm3 / 1000;
  const massGrams = volumeCm3 * density;

  let gemCost = 0;
  if (config.hasGem) {
    gemCost = 20 + config.gemSize * 4 + config.gemFacets * 0.3;
  }
  const finishingCost = 15 + (config.hasEngraving ? 10 : 0) + (config.hasBorder ? 8 : 0);

  const metalCost = massGrams * price;
  const total = metalCost + gemCost + finishingCost;

  return {
    material,
    massGrams: Number(massGrams.toFixed(2)),
    metalCost: Number(metalCost.toFixed(2)),
    gemCost: Number(gemCost.toFixed(2)),
    finishingCost: Number(finishingCost.toFixed(2)),
    totalUsd: Number(total.toFixed(2))
  };
}

export function buildBOM(config) {
  const rows = [];
  rows.push(['Component', 'Spec', 'Qty']);
  rows.push([
    'Base Pendant',
    `${config.shape}, ${config.width}x${config.height}x${config.thickness} mm`,
    '1'
  ]);
  rows.push(['Material', config.material || 'custom', '1']);
  if (config.hasGem)
    rows.push([
      'Gemstone',
      `${config.gemShape} ${config.gemSize}mm (${config.gemType || 'custom'})`,
      '1'
    ]);
  if (config.hasBorder) rows.push(['Border', `${config.borderStyle} ${config.borderWidth}mm`, '1']);
  if (config.hasBail) rows.push(['Bail', `${config.bailStyle} ${config.bailSize}mm`, '1']);
  if (config.hasChain) rows.push(['Chain', `${config.chainStyle} ${config.chainLength}cm`, '1']);
  return rows;
}

export function exportCsv(rows, filename = 'bom.csv') {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function makeReadonlyShareLink(config) {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
  const url = new URL(window.location.href);
  url.searchParams.set('review', encoded);
  return url.toString();
}

export function parseReadonlyConfig() {
  const params = new URLSearchParams(window.location.search);
  const review = params.get('review');
  if (!review) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(review))));
  } catch {
    return null;
  }
}

const PROJECT_KEY = 'pendant_projects_v1';

export function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveProjectVersion(projectName, config) {
  if (!projectName) throw new Error('Project name is required');
  const all = loadProjects();
  const bucket = all[projectName] || [];
  bucket.unshift({
    timestamp: new Date().toISOString(),
    config: JSON.parse(JSON.stringify(config))
  });
  all[projectName] = bucket.slice(0, 25);
  localStorage.setItem(PROJECT_KEY, JSON.stringify(all));
  return all[projectName][0];
}
