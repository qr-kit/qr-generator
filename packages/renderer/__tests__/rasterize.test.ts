import { describe, it, expect } from 'vitest';
import { rasterizeMatrix } from '../src/raster/rasterize';
import type { RenderOptions } from '../src/types';
import { MODULE_TYPE } from '@qr-kit/core';

/**
 * Helper: create a simple matrix of given size with all cells dark (1).
 */
function allDarkMatrix(n: number): number[][] {
  return Array.from({ length: n }, () => Array(n).fill(1));
}

/**
 * Helper: create a simple matrix of given size with all cells light (0).
 */
function allLightMatrix(n: number): number[][] {
  return Array.from({ length: n }, () => Array(n).fill(0));
}

/**
 * Helper: create a 3×3 identity-like matrix (diagonal is dark).
 */
function identityMatrix(): number[][] {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

const defaultOptions: RenderOptions = {
  size: 100,
  skipValidation: true,
};

describe('rasterizeMatrix', () => {
  it('returns a buffer with correct dimensions (size × size)', () => {
    const matrix = identityMatrix();
    const buffer = rasterizeMatrix(matrix, { ...defaultOptions, size: 200 });
    expect(buffer.width).toBe(200);
    expect(buffer.height).toBe(200);
  });

  it('fills background with default white (255,255,255,255)', () => {
    const matrix = allLightMatrix(3);
    const buffer = rasterizeMatrix(matrix, defaultOptions);
    // Check a pixel in the margin area (top-left corner)
    const [r, g, b, a] = buffer.getPixel(0, 0);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
    expect(a).toBe(255);
  });

  it('renders dark modules with foreground color at expected positions', () => {
    // Use a matrix where top-left is dark, default margin=4
    const matrix = [[1]];
    const size = 100;
    const margin = 4;
    const totalModules = 1 + margin * 2; // 9
    const moduleSize = size / totalModules;
    const buffer = rasterizeMatrix(matrix, { size, skipValidation: true });

    // The dark module is at col=0, row=0
    // pixel position: x = (0 + margin) * moduleSize, y = (0 + margin) * moduleSize
    const px = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
    const py = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
    const [r, g, b, a] = buffer.getPixel(px, py);
    // Default fgColor is black
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
    expect(a).toBe(255);
  });

  it('keeps light modules as background color', () => {
    // A 3×3 matrix where center is light
    const matrix = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ];
    const size = 110; // divisible by 11 (3 + 4*2 = 11)
    const margin = 4;
    const totalModules = 3 + margin * 2; // 11
    const moduleSize = size / totalModules; // 10
    const buffer = rasterizeMatrix(matrix, { size, skipValidation: true });

    // Center module is at row=1, col=1 => pixel center at (5*10+5, 5*10+5) = (55, 55)
    const px = Math.floor((1 + margin) * moduleSize + moduleSize / 2);
    const py = Math.floor((1 + margin) * moduleSize + moduleSize / 2);
    const [r, g, b, a] = buffer.getPixel(px, py);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
    expect(a).toBe(255);
  });

  it('fills margin area with background color', () => {
    const matrix = allDarkMatrix(3);
    const size = 110;
    const buffer = rasterizeMatrix(matrix, { size, skipValidation: true });

    // Top-left pixel is in the margin, should be bg color
    const [r, g, b, a] = buffer.getPixel(0, 0);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
    expect(a).toBe(255);

    // Bottom-right pixel is also in the margin
    const [r2, g2, b2, a2] = buffer.getPixel(size - 1, size - 1);
    expect(r2).toBe(255);
    expect(g2).toBe(255);
    expect(b2).toBe(255);
    expect(a2).toBe(255);
  });

  it('applies custom fgColor (#ff0000) producing red module pixels', () => {
    const matrix = [[1]];
    const size = 90; // 9 totalModules => moduleSize=10
    const margin = 4;
    const totalModules = 1 + margin * 2;
    const moduleSize = size / totalModules;
    const buffer = rasterizeMatrix(matrix, { size, fgColor: '#ff0000', skipValidation: true });

    const px = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
    const py = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
    const [r, g, b, a] = buffer.getPixel(px, py);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
    expect(a).toBe(255);
  });

  it('applies custom bgColor (#0000ff) producing blue background', () => {
    const matrix = allLightMatrix(1);
    const size = 90;
    const buffer = rasterizeMatrix(matrix, { size, bgColor: '#0000ff', skipValidation: true });

    const [r, g, b, a] = buffer.getPixel(0, 0);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(255);
    expect(a).toBe(255);
  });

  it('shape "square" fills the whole module area', () => {
    const matrix = [[1]];
    const size = 90;
    const margin = 4;
    const totalModules = 1 + margin * 2;
    const moduleSize = size / totalModules;
    const buffer = rasterizeMatrix(matrix, { size, shape: 'square', skipValidation: true });

    // Check all four corners of the module area are filled
    const x0 = Math.floor((0 + margin) * moduleSize);
    const y0 = Math.floor((0 + margin) * moduleSize);
    // Top-left of module
    const [r1] = buffer.getPixel(x0 + 1, y0 + 1);
    expect(r1).toBe(0);
    // Top-right of module
    const [r2] = buffer.getPixel(x0 + Math.floor(moduleSize) - 2, y0 + 1);
    expect(r2).toBe(0);
    // Bottom-left of module
    const [r3] = buffer.getPixel(x0 + 1, y0 + Math.floor(moduleSize) - 2);
    expect(r3).toBe(0);
    // Bottom-right of module
    const [r4] = buffer.getPixel(x0 + Math.floor(moduleSize) - 2, y0 + Math.floor(moduleSize) - 2);
    expect(r4).toBe(0);
  });

  it('shape "dots" leaves corners of the module empty', () => {
    const matrix = [[1]];
    const size = 180; // 9 totalModules => moduleSize=20 (large enough for visible corners)
    const margin = 4;
    const totalModules = 1 + margin * 2;
    const moduleSize = size / totalModules;
    const buffer = rasterizeMatrix(matrix, { size, shape: 'dots', skipValidation: true });

    const x0 = Math.floor((0 + margin) * moduleSize);
    const y0 = Math.floor((0 + margin) * moduleSize);

    // The dot is a circle with radius=moduleSize*0.45, centered in the module.
    // Corners of the module bounding box should remain background (white).
    const [r1, g1, b1] = buffer.getPixel(x0, y0);
    expect(r1).toBe(255);
    expect(g1).toBe(255);
    expect(b1).toBe(255);

    // Center should be dark
    const cx = Math.floor(x0 + moduleSize / 2);
    const cy = Math.floor(y0 + moduleSize / 2);
    const [rc] = buffer.getPixel(cx, cy);
    expect(rc).toBe(0);
  });

  it('shape "rounded" produces different output than shape "square"', () => {
    const matrix = [[1]];
    const size = 180;
    const buffer1 = rasterizeMatrix(matrix, { size, shape: 'square', skipValidation: true });
    const buffer2 = rasterizeMatrix(matrix, { size, shape: 'rounded', skipValidation: true });

    // The buffers should differ in at least some pixels (corner rounding)
    let diffCount = 0;
    for (let i = 0; i < buffer1.data.length; i++) {
      if (buffer1.data[i] !== buffer2.data[i]) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it('gradient fgColor produces pixels that vary across the buffer', () => {
    const matrix = allDarkMatrix(5);
    const size = 130; // 5 + 8 = 13 totalModules => moduleSize=10
    const buffer = rasterizeMatrix(matrix, {
      size,
      fgColor: {
        type: 'linear',
        colors: ['#ff0000', '#0000ff'],
        angle: 90,
      },
      skipValidation: true,
    });

    // Sample pixels from left and right dark modules
    const margin = 4;
    const totalModules = 5 + margin * 2;
    const moduleSize = size / totalModules;

    // Left module (col=0): center pixel
    const lx = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
    const ly = Math.floor((2 + margin) * moduleSize + moduleSize / 2);
    const leftPixel = buffer.getPixel(lx, ly);

    // Right module (col=4): center pixel
    const rx = Math.floor((4 + margin) * moduleSize + moduleSize / 2);
    const ry = Math.floor((2 + margin) * moduleSize + moduleSize / 2);
    const rightPixel = buffer.getPixel(rx, ry);

    // With a left-to-right gradient from red to blue, left should be more red, right more blue
    expect(leftPixel[0]).toBeGreaterThan(rightPixel[0]); // more red on left
    expect(leftPixel[2]).toBeLessThan(rightPixel[2]); // more blue on right
  });

  it('logo config: modules in logo clear zone are skipped (remain background)', () => {
    const matrix = allDarkMatrix(5);
    const size = 130;
    const margin = 4;
    const totalModules = 5 + margin * 2;
    const moduleSize = size / totalModules;

    const buffer = rasterizeMatrix(matrix, {
      size,
      logo: { src: 'logo.png', width: 20, height: 20, padding: 5 },
      skipValidation: true,
    });

    // Center of the QR code: the logo clear zone should prevent modules from rendering
    // Center pixel of the whole buffer
    const centerX = Math.floor(size / 2);
    const centerY = Math.floor(size / 2);
    const [r, g, b, a] = buffer.getPixel(centerX, centerY);
    // Should be background color (white), not foreground (black)
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
    expect(a).toBe(255);
  });

  it('validation runs by default and throws on low contrast', () => {
    const matrix = [[1]];
    // fgColor and bgColor very similar => low contrast
    expect(() =>
      rasterizeMatrix(matrix, { size: 100, fgColor: '#777777', bgColor: '#888888' }),
    ).toThrow('QR validation failed');
  });

  it('skipValidation bypasses validation', () => {
    const matrix = [[1]];
    // Same low-contrast colors but with skipValidation
    expect(() =>
      rasterizeMatrix(matrix, { size: 100, fgColor: '#777777', bgColor: '#888888', skipValidation: true }),
    ).not.toThrow();
  });

  describe('finder rendering', () => {
    it('applies solid finderColor to finder modules when moduleTypes is provided', () => {
      const matrix = [[1]];
      const moduleTypes = [[MODULE_TYPE.FINDER]];
      const size = 90;
      const margin = 4;
      const totalModules = 1 + margin * 2;
      const moduleSize = size / totalModules;

      const buffer = rasterizeMatrix(matrix, {
        size,
        finderColor: '#ff0000',
        moduleTypes,
        skipValidation: true,
      });

      // Center of the finder module should be red
      const px = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
      const py = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
      const [r, g, b, a] = buffer.getPixel(px, py);
      expect(r).toBe(255);
      expect(g).toBe(0);
      expect(b).toBe(0);
      expect(a).toBe(255);
    });

    it('ignores finderColor when moduleTypes is not provided (backward compat)', () => {
      const matrix = [[1]];
      const size = 90;
      const margin = 4;
      const totalModules = 1 + margin * 2;
      const moduleSize = size / totalModules;

      const buffer = rasterizeMatrix(matrix, {
        size,
        finderColor: '#ff0000',
        skipValidation: true,
      });

      // Without moduleTypes, module should use default fg (black)
      const px = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
      const py = Math.floor((0 + margin) * moduleSize + moduleSize / 2);
      const [r, g, b] = buffer.getPixel(px, py);
      expect(r).toBe(0);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it('applies finderShape=rounded differently than square data modules', () => {
      const matrix = [[1, 1]];
      const moduleTypes = [[MODULE_TYPE.FINDER, MODULE_TYPE.DATA]];
      const size = 200; // Large enough for shape differences to show
      const buffer1 = rasterizeMatrix(matrix, {
        size,
        finderShape: 'rounded',
        moduleTypes,
        skipValidation: true,
      });
      const buffer2 = rasterizeMatrix(matrix, {
        size,
        moduleTypes,
        skipValidation: true,
      });

      // Buffers should differ because the finder module uses rounded shape
      let diffCount = 0;
      for (let i = 0; i < buffer1.data.length; i++) {
        if (buffer1.data[i] !== buffer2.data[i]) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(0);
    });
  });

  describe('circle finder patterns', () => {
    it('renders circle finders: center of finder is foreground color', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const size = 512;
      const margin = 4;
      const matrixSize = qr.matrix.length;
      const totalModules = matrixSize + margin * 2;
      const moduleSize = size / totalModules;

      const buffer = rasterizeMatrix(qr.matrix, {
        size,
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });

      // Top-left finder center: module (3, 3)
      const cx = Math.floor((3 + margin) * moduleSize + moduleSize / 2);
      const cy = Math.floor((3 + margin) * moduleSize + moduleSize / 2);
      const [r, g, b, a] = buffer.getPixel(cx, cy);
      // Should be foreground (black)
      expect(r).toBe(0);
      expect(g).toBe(0);
      expect(b).toBe(0);
      expect(a).toBe(255);
    });

    it('renders circle finders: middle ring is background color', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const size = 512;
      const margin = 4;
      const matrixSize = qr.matrix.length;
      const totalModules = matrixSize + margin * 2;
      const moduleSize = size / totalModules;

      const buffer = rasterizeMatrix(qr.matrix, {
        size,
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });

      // Top-left finder center at module (3, 3)
      const cx = (3 + margin) * moduleSize + moduleSize / 2;
      const cy = (3 + margin) * moduleSize + moduleSize / 2;
      // Middle ring at radius ~2*moduleSize (between inner 1.5ms and outer 2.5ms)
      const ringX = Math.floor(cx + 2 * moduleSize);
      const ringY = Math.floor(cy);
      const [r, g, b] = buffer.getPixel(ringX, ringY);
      // Should be background (white)
      expect(r).toBe(255);
      expect(g).toBe(255);
      expect(b).toBe(255);
    });

    it('circle finders with finderColor uses custom color', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const size = 512;
      const margin = 4;
      const matrixSize = qr.matrix.length;
      const totalModules = matrixSize + margin * 2;
      const moduleSize = size / totalModules;

      const buffer = rasterizeMatrix(qr.matrix, {
        size,
        finderShape: 'circle',
        finderColor: '#ff0000',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });

      // Center of top-left finder should be red
      const cx = Math.floor((3 + margin) * moduleSize + moduleSize / 2);
      const cy = Math.floor((3 + margin) * moduleSize + moduleSize / 2);
      const [r, g, b, a] = buffer.getPixel(cx, cy);
      expect(r).toBe(255);
      expect(g).toBe(0);
      expect(b).toBe(0);
      expect(a).toBe(255);
    });
  });
});
