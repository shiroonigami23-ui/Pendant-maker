import { describe, expect, it } from 'vitest';
import { buildBOM, estimateCost, validateManufacturing } from '../pro-utils.js';

describe('manufacturing validation', () => {
  it('fails when thickness is too low', () => {
    const result = validateManufacturing({ thickness: 0.8, bevelSize: 0.1, hasGem: false, hasChain: false, width: 25, height: 25 });
    expect(result.pass).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('estimates costs and builds bom', () => {
    const cfg = {
      material: 'silver',
      width: 25,
      height: 30,
      thickness: 3,
      hasGem: true,
      gemSize: 8,
      gemFacets: 24,
      shape: 'heart',
      gemShape: 'round',
      gemType: 'diamond',
      hasBorder: true,
      borderStyle: 'simple',
      borderWidth: 0.15,
      hasBail: true,
      bailStyle: 'simple',
      bailSize: 0.8,
      hasChain: true,
      chainStyle: 'rope',
      chainLength: 50
    };

    const cost = estimateCost(cfg);
    expect(cost.totalUsd).toBeGreaterThan(0);

    const bom = buildBOM(cfg);
    expect(bom.length).toBeGreaterThan(3);
  });
});
