import { describe, it, expect } from 'vitest';
import { renderSVG } from '../src/svg/renderer';
import { rasterizeMatrix } from '../src/raster/rasterize';
import { validateRenderOptions } from '../src/validation/validate';
import { createQR } from '../src/create-qr';

const simpleMatrix = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1],
];

describe('Module Scale / Gap Control', () => {
  describe('SVG', () => {
    it('moduleScale 1.0 produces identical output to default', () => {
      const svgDefault = renderSVG(simpleMatrix, { size: 100 });
      const svgScale1 = renderSVG(simpleMatrix, { size: 100, moduleScale: 1.0 });
      expect(svgScale1).toBe(svgDefault);
    });

    it('moduleScale 0.5 produces smaller modules', () => {
      const size = 110; // 3 + 8 margin = 11 modules, moduleSize = 10
      const svgFull = renderSVG(simpleMatrix, { size, moduleScale: 1.0 });
      const svgHalf = renderSVG(simpleMatrix, { size, moduleScale: 0.5 });
      // Half-size modules should have width 5 instead of 10
      expect(svgFull).toContain('width="10"');
      expect(svgHalf).toContain('width="5"');
    });

    it('scaled modules are centered in grid cell', () => {
      const size = 110; // moduleSize = 10
      const svg = renderSVG(simpleMatrix, { size, moduleScale: 0.5 });
      // Module at (0,0) with margin=4: x = (0+4)*10 = 40
      // With scale 0.5: adjustedSize=5, offset = (10-5)/2 = 2.5
      // So x = 40 + 2.5 = 42.5
      expect(svg).toContain('x="42.5"');
    });

    it('finder patterns are NOT scaled', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const size = 256;
      const margin = 4;
      const matrixSize = qr.matrix.length;
      const totalModules = matrixSize + margin * 2;
      const moduleSize = size / totalModules;

      const svgFull = renderSVG(qr.matrix, {
        size,
        moduleScale: 1.0,
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      const svgScaled = renderSVG(qr.matrix, {
        size,
        moduleScale: 0.5,
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });

      // Both should contain the same size finder module rects
      // (moduleSize remains unchanged for finders)
      const fullWidth = `width="${moduleSize}"`;
      const halfWidth = `width="${moduleSize * 0.5}"`;

      // Full-size modules should exist in both (finder modules)
      expect(svgFull).toContain(fullWidth);
      expect(svgScaled).toContain(fullWidth);
      // Half-size modules should only exist in the scaled version (data modules)
      expect(svgScaled).toContain(halfWidth);
    });

    it('works with dots shape', () => {
      const svg = renderSVG(simpleMatrix, { size: 110, shape: 'dots', moduleScale: 0.8 });
      expect(svg).toContain('<circle');
    });

    it('works with diamond shape', () => {
      const svg = renderSVG(simpleMatrix, { size: 110, shape: 'diamond', moduleScale: 0.8 });
      expect(svg).toContain('<polygon');
    });

    it('works with transparent background', () => {
      const svg = renderSVG(simpleMatrix, {
        size: 110,
        bgColor: 'transparent',
        moduleScale: 0.7,
        skipValidation: true,
      });
      expect(svg).toContain('<svg');
    });
  });

  describe('Raster', () => {
    it('moduleScale 0.8 has fewer filled pixels than default', () => {
      const bufFull = rasterizeMatrix([[1]], { size: 90, skipValidation: true });
      const bufScaled = rasterizeMatrix([[1]], { size: 90, moduleScale: 0.8, skipValidation: true });

      let fullCount = 0, scaledCount = 0;
      for (let i = 3; i < bufFull.data.length; i += 4) {
        if (bufFull.data[i] === 255 && bufFull.data[i - 3] === 0) fullCount++;
        if (bufScaled.data[i] === 255 && bufScaled.data[i - 3] === 0) scaledCount++;
      }
      expect(scaledCount).toBeLessThan(fullCount);
    });

    it('works with gradient foreground', () => {
      expect(() =>
        rasterizeMatrix(simpleMatrix, {
          size: 110,
          fgColor: { type: 'linear', colors: ['#000', '#00f'] },
          moduleScale: 0.8,
          skipValidation: true,
        }),
      ).not.toThrow();
    });
  });

  describe('Validation', () => {
    it('moduleScale 0.3 triggers INVALID_MODULE_SCALE error', () => {
      const result = validateRenderOptions({ size: 256, moduleScale: 0.3 });
      expect(result.issues.some(i => i.code === 'INVALID_MODULE_SCALE')).toBe(true);
      expect(result.issues.find(i => i.code === 'INVALID_MODULE_SCALE')!.severity).toBe('error');
    });

    it('moduleScale 1.5 triggers INVALID_MODULE_SCALE error', () => {
      const result = validateRenderOptions({ size: 256, moduleScale: 1.5 });
      expect(result.issues.some(i => i.code === 'INVALID_MODULE_SCALE')).toBe(true);
    });

    it('moduleScale 0.5 passes validation', () => {
      const result = validateRenderOptions({ size: 256, moduleScale: 0.5 });
      expect(result.issues.some(i => i.code === 'INVALID_MODULE_SCALE')).toBe(false);
    });

    it('moduleScale 1.0 passes validation', () => {
      const result = validateRenderOptions({ size: 256, moduleScale: 1.0 });
      expect(result.issues.some(i => i.code === 'INVALID_MODULE_SCALE')).toBe(false);
    });

    it('undefined moduleScale passes validation', () => {
      const result = validateRenderOptions({ size: 256 });
      expect(result.issues.some(i => i.code === 'INVALID_MODULE_SCALE')).toBe(false);
    });
  });

  describe('E2E', () => {
    it('createQR with moduleScale produces valid SVG', () => {
      const result = createQR('test', { size: 256, moduleScale: 0.7 });
      expect(result.data as string).toContain('<svg');
    });
  });
});
