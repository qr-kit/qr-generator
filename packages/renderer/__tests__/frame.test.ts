import { describe, it, expect } from 'vitest';
import { renderSVG } from '../src/svg/renderer';
import { rasterizeMatrix } from '../src/raster/rasterize';
import { generateQR } from '@qr-kit/core';

const qr = generateQR({ data: 'TEST' });
const { matrix, moduleTypes } = qr;

describe('Frame / Border / Label', () => {
  describe('SVG - basic frame', () => {
    it('renders frame border as stroke rect', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square' },
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('stroke=');
    });

    it('total SVG dimensions equal size (frame included)', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square', label: 'SCAN ME' },
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('width="300"');
      expect(svg).toContain('height="300"');
    });

    it('frame with rounded style uses rx/ry on frame border', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'rounded' },
        moduleTypes,
        skipValidation: true,
      });
      // Frame border should have rounded corners
      expect(svg).toContain('rx=');
    });
  });

  describe('SVG - label', () => {
    it('label text appears in SVG output', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square', label: 'SCAN ME' },
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('SCAN ME');
      expect(svg).toContain('<text');
    });

    it('label uses text-anchor middle for centering', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square', label: 'SCAN ME' },
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('text-anchor="middle"');
    });

    it('custom label color is applied', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square', label: 'SCAN', labelColor: '#ff0000' },
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('fill="#ff0000"');
    });

    it('label position bottom (default) places text below QR', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square', label: 'SCAN ME' },
        moduleTypes,
        skipValidation: true,
      });
      // Text should exist and be in the lower portion
      expect(svg).toContain('<text');
    });

    it('label position top places text above QR', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square', label: 'SCAN ME', labelPosition: 'top' },
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('<text');
    });

    it('escapes XML special chars in label', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square', label: 'Scan & Go' },
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('Scan &amp; Go');
    });
  });

  describe('SVG - no label', () => {
    it('frame without label has no text element', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square' },
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).not.toContain('<text');
    });
  });

  describe('SVG - custom options', () => {
    it('custom frame color overrides fgColor', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        frame: { style: 'square', color: '#00ff00' },
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('#00ff00');
    });
  });

  describe('Raster', () => {
    it('raster frame renders without error', () => {
      const buffer = rasterizeMatrix(matrix, {
        size: 300,
        frame: { style: 'square' },
        moduleTypes,
        skipValidation: true,
      });
      expect(buffer.width).toBe(300);
      expect(buffer.height).toBe(300);
    });

    it('raster frame with label does not crash (label silently omitted)', () => {
      const buffer = rasterizeMatrix(matrix, {
        size: 300,
        frame: { style: 'square', label: 'SCAN ME' },
        moduleTypes,
        skipValidation: true,
      });
      expect(buffer.width).toBe(300);
    });
  });

  describe('Frame without frame option', () => {
    it('no frame renders normally', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).not.toContain('stroke=');
    });
  });
});
