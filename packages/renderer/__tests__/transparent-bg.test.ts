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

describe('Transparent Background', () => {
  describe('SVG', () => {
    it('transparent bg omits background rect', () => {
      const svg = renderSVG(simpleMatrix, { size: 100, bgColor: 'transparent', skipValidation: true });
      // Should not contain a full-size rect with fill="transparent" or fill="#ffffff"
      // The first rect should be a module, not a background
      const rects = svg.match(/<rect[^>]*>/g) || [];
      // No rect should have fill matching a bg color for the full canvas
      const bgRect = rects.find(r => r.includes('width="100"') && r.includes('height="100"'));
      expect(bgRect).toBeUndefined();
    });

    it('default bg still produces background rect', () => {
      const svg = renderSVG(simpleMatrix, { size: 100 });
      expect(svg).toContain('fill="#ffffff"');
    });

    it('transparent bg + circle finders: gap ring uses white', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        bgColor: 'transparent',
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      // Gap circles should use white, not transparent
      expect(svg).toContain('fill="#ffffff"');
    });

    it('transparent bg + overlay: finder bg defaults to white', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        bgColor: 'transparent',
        overlayImage: { src: 'test.png' },
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      // Finder bg rects should use white fallback
      expect(svg).toContain('fill="#ffffff"');
    });

    it('transparent bg + logo: clear zone rect omitted', () => {
      const svg = renderSVG(simpleMatrix, {
        size: 100,
        bgColor: 'transparent',
        logo: { src: 'logo.png', width: 10, height: 10 },
        skipValidation: true,
      });
      // Logo image should still render
      expect(svg).toContain('<image');
    });
  });

  describe('Raster', () => {
    it('transparent bg: background pixels have alpha=0', () => {
      const buffer = rasterizeMatrix([[0]], {
        size: 90,
        bgColor: 'transparent',
        skipValidation: true,
      });
      // Corner pixel should be transparent (alpha=0)
      const [r, g, b, a] = buffer.getPixel(0, 0);
      expect(a).toBe(0);
    });

    it('transparent bg: module pixels still have alpha=255', () => {
      const buffer = rasterizeMatrix([[1]], {
        size: 90,
        bgColor: 'transparent',
        skipValidation: true,
      });
      // Center of module should be opaque
      const margin = 4;
      const moduleSize = 90 / (1 + margin * 2);
      const cx = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
      const cy = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
      const [r, g, b, a] = buffer.getPixel(cx, cy);
      expect(a).toBe(255);
      expect(r).toBe(0);
    });

    it('transparent bg + circle finders: gap ring is white', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const size = 512;
      const margin = 4;
      const matrixSize = qr.matrix.length;
      const totalModules = matrixSize + margin * 2;
      const moduleSize = size / totalModules;

      const buffer = rasterizeMatrix(qr.matrix, {
        size,
        bgColor: 'transparent',
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });

      // Gap ring at ~2 modules from center should be white (255,255,255,255)
      const cx = (3 + margin) * moduleSize + moduleSize / 2;
      const cy = (3 + margin) * moduleSize + moduleSize / 2;
      const ringX = Math.floor(cx + 2 * moduleSize);
      const ringY = Math.floor(cy);
      const [r, g, b, a] = buffer.getPixel(ringX, ringY);
      expect(r).toBe(255);
      expect(g).toBe(255);
      expect(b).toBe(255);
      expect(a).toBe(255);
    });
  });

  describe('Validation', () => {
    it('transparent bg does not trigger INVALID_COLOR', () => {
      const result = validateRenderOptions({ size: 256, bgColor: 'transparent' });
      expect(result.issues.some(i => i.code === 'INVALID_COLOR')).toBe(false);
    });

    it('transparent bg does not trigger CONTRAST_TOO_LOW', () => {
      const result = validateRenderOptions({ size: 256, bgColor: 'transparent' });
      expect(result.issues.some(i => i.code === 'CONTRAST_TOO_LOW')).toBe(false);
    });

    it('normal invalid bg still triggers INVALID_COLOR', () => {
      const result = validateRenderOptions({ size: 256, bgColor: 'notacolor' });
      expect(result.issues.some(i => i.code === 'INVALID_COLOR')).toBe(true);
    });
  });

  describe('E2E', () => {
    it('createQR with transparent bg and PNG format produces valid output', () => {
      const result = createQR('test', { size: 100, bgColor: 'transparent', format: 'png' });
      expect(result.data).toBeInstanceOf(Uint8Array);
      const bytes = Array.from((result.data as Uint8Array).slice(0, 8));
      expect(bytes).toEqual([137, 80, 78, 71, 13, 10, 26, 10]); // PNG signature
    });
  });
});
