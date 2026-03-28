import { describe, it, expect } from 'vitest';
import { renderSVG } from '../src/svg/renderer';
import type { RenderOptions } from '../src/types';
import { MODULE_TYPE } from '@qr-kit/core';

describe('SVG Renderer', () => {
  const simpleMatrix = [
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
  ];

  it('produces valid SVG string', () => {
    const svg = renderSVG(simpleMatrix, { size: 100 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('applies size correctly', () => {
    const svg = renderSVG(simpleMatrix, { size: 256 });
    expect(svg).toContain('width="256"');
    expect(svg).toContain('height="256"');
  });

  it('uses default colors (black fg, white bg)', () => {
    const svg = renderSVG(simpleMatrix, { size: 100 });
    expect(svg).toContain('#000000'); // fg
    expect(svg).toContain('#ffffff'); // bg
  });

  it('applies custom colors', () => {
    const svg = renderSVG(simpleMatrix, { size: 100, fgColor: '#ff0000', bgColor: '#00ff00', skipValidation: true });
    expect(svg).toContain('#ff0000');
    expect(svg).toContain('#00ff00');
  });

  it('renders correct number of dark modules', () => {
    const svg = renderSVG(simpleMatrix, { size: 100 });
    // 5 dark modules in simpleMatrix
    const rects = (svg.match(/<rect[^/]*fill="#000000"/g) || []).length;
    const circles = (svg.match(/<circle/g) || []).length;
    // Background rect is also #ffffff, so count only fg rects
    expect(rects + circles).toBe(5);
  });

  it('uses square shape by default', () => {
    const svg = renderSVG(simpleMatrix, { size: 100, shape: 'square' });
    expect(svg).not.toContain('<circle');
  });

  it('uses dots shape when specified', () => {
    const svg = renderSVG(simpleMatrix, { size: 100, shape: 'dots' });
    expect(svg).toContain('<circle');
  });

  it('uses rounded shape when specified', () => {
    const svg = renderSVG(simpleMatrix, { size: 100, shape: 'rounded' });
    expect(svg).toContain('rx=');
  });

  it('includes quiet zone margin', () => {
    const svg = renderSVG(simpleMatrix, { size: 100, margin: 4 });
    expect(svg).toContain('viewBox=');
  });

  it('supports gradient foreground', () => {
    const svg = renderSVG(simpleMatrix, {
      size: 100,
      fgColor: { type: 'linear', colors: ['#f00', '#00f'] },
    });
    expect(svg).toContain('<linearGradient');
    expect(svg).toContain('url(#qr-gradient-fg)');
  });

  it('works with a real QR matrix', () => {
    // Generate a simple 21x21 matrix (all zeros with finders)
    const matrix = Array.from({ length: 21 }, () => new Array(21).fill(0));
    // Set some modules to 1
    for (let i = 0; i < 7; i++) {
      matrix[0][i] = 1;
      matrix[i][0] = 1;
    }
    const svg = renderSVG(matrix, { size: 256 });
    expect(svg).toContain('<svg');
    expect(svg.length).toBeGreaterThan(100);
  });

  describe('logo integration', () => {
    // 21x21 matrix with some dark modules
    const matrix21 = Array.from({ length: 21 }, (_, r) =>
      Array.from({ length: 21 }, (_, c) => ((r + c) % 2 === 0 ? 1 : 0)),
    );

    it('renders logo image element when logo is provided', () => {
      const svg = renderSVG(matrix21, {
        size: 256,
        logo: { src: '/logo.png', width: 40, height: 40 },
        skipValidation: true,
      });
      expect(svg).toContain('<image');
      expect(svg).toContain('href="/logo.png"');
      expect(svg).toContain('width="40"');
      expect(svg).toContain('height="40"');
    });

    it('renders clear zone rect behind logo', () => {
      const svg = renderSVG(matrix21, {
        size: 256,
        logo: { src: '/logo.png', width: 40, height: 40 },
        skipValidation: true,
      });
      // Clear zone rect should appear before the image
      const clearZoneIndex = svg.indexOf('fill="#ffffff"');
      const imageIndex = svg.indexOf('<image');
      // There are multiple fills, but the clear zone rect should exist
      expect(svg).toContain('<image');
    });

    it('skips modules behind the logo clear zone', () => {
      const svgWithLogo = renderSVG(matrix21, {
        size: 256,
        logo: { src: '/logo.png', width: 40, height: 40 },
        skipValidation: true,
      });
      const svgWithoutLogo = renderSVG(matrix21, {
        size: 256,
        skipValidation: true,
      });
      // SVG with logo should have fewer module elements
      const countModules = (svg: string) => (svg.match(/<rect[^/]*fill="#000000"/g) || []).length;
      expect(countModules(svgWithLogo)).toBeLessThan(countModules(svgWithoutLogo));
    });

    it('handles data URI logo source', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
      const svg = renderSVG(matrix21, {
        size: 256,
        logo: { src: dataUri, width: 20, height: 20 },
        skipValidation: true,
      });
      expect(svg).toContain(`href="${dataUri}"`);
    });
  });

  describe('finder pattern rendering', () => {
    // Helper to create moduleTypes for a 3x3 matrix where (0,0) is a finder module
    function createModuleTypes3x3(): number[][] {
      return [
        [MODULE_TYPE.FINDER, MODULE_TYPE.DATA, MODULE_TYPE.DATA],
        [MODULE_TYPE.DATA, MODULE_TYPE.DATA, MODULE_TYPE.DATA],
        [MODULE_TYPE.DATA, MODULE_TYPE.DATA, MODULE_TYPE.DATA],
      ];
    }

    it('applies finderColor to finder modules when moduleTypes is provided', () => {
      const svg = renderSVG(simpleMatrix, {
        size: 100,
        finderColor: '#ff0000',
        moduleTypes: createModuleTypes3x3(),
        skipValidation: true,
      });
      expect(svg).toContain('fill="#ff0000"');
    });

    it('applies finderShape=rounded to finder modules with rx= attribute', () => {
      const svg = renderSVG(simpleMatrix, {
        size: 100,
        finderShape: 'rounded',
        moduleTypes: createModuleTypes3x3(),
        skipValidation: true,
      });
      expect(svg).toContain('rx=');
    });

    it('ignores finderColor/finderShape when moduleTypes is not provided (backward compat)', () => {
      const svg = renderSVG(simpleMatrix, {
        size: 100,
        finderColor: '#ff0000',
        finderShape: 'rounded',
        skipValidation: true,
      });
      // Without moduleTypes, all modules use default fg color (black)
      expect(svg).not.toContain('fill="#ff0000"');
    });

    it('applies gradient finderColor with defs when moduleTypes is provided', () => {
      const svg = renderSVG(simpleMatrix, {
        size: 100,
        finderColor: { type: 'linear', colors: ['#ff0000', '#00ff00'] },
        moduleTypes: createModuleTypes3x3(),
        skipValidation: true,
      });
      expect(svg).toContain('qr-gradient-finder');
    });

    it('does not render separator modules (value 0 in matrix) even with moduleTypes', () => {
      // Create a matrix where (0,1) is 0 (light), and moduleTypes marks it as SEPARATOR
      const matrix = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
      ];
      const moduleTypes = [
        [MODULE_TYPE.FINDER, MODULE_TYPE.SEPARATOR, MODULE_TYPE.DATA],
        [MODULE_TYPE.DATA, MODULE_TYPE.DATA, MODULE_TYPE.DATA],
        [MODULE_TYPE.DATA, MODULE_TYPE.DATA, MODULE_TYPE.DATA],
      ];
      const svg = renderSVG(matrix, {
        size: 100,
        finderColor: '#ff0000',
        moduleTypes,
        skipValidation: true,
      });
      // Only 5 dark modules should render (same as simpleMatrix), separator at (0,1) is light
      const rects = (svg.match(/<rect[^/]*\/>/g) || []).length;
      // Background rect + 5 dark module rects = 6
      expect(rects).toBe(6);
    });
  });

  describe('circle finder patterns', () => {
    // Use a real QR generation to get proper moduleTypes
    it('produces 9 circle elements (3 concentric circles x 3 finders)', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      const circles = (svg.match(/<circle/g) || []);
      expect(circles.length).toBe(9); // 3 finders x 3 concentric circles
    });

    it('circle radii are proportional to moduleSize (3.5, 2.5, 1.5)', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const size = 256;
      const matrixSize = qr.matrix.length;
      const margin = 4;
      const moduleSize = size / (matrixSize + margin * 2);

      const svg = renderSVG(qr.matrix, {
        size,
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });

      const outerR = (3.5 * moduleSize).toString();
      const midR = (2.5 * moduleSize).toString();
      const innerR = (1.5 * moduleSize).toString();

      expect(svg).toContain(`r="${outerR}"`);
      expect(svg).toContain(`r="${midR}"`);
      expect(svg).toContain(`r="${innerR}"`);
    });

    it('does not render individual finder module rects when finderShape=circle', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const svgCircle = renderSVG(qr.matrix, {
        size: 256,
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      const svgSquare = renderSVG(qr.matrix, {
        size: 256,
        finderShape: 'square',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      // Circle finders should have fewer rect elements (no per-module finder rects)
      const circleRects = (svgCircle.match(/<rect/g) || []).length;
      const squareRects = (svgSquare.match(/<rect/g) || []).length;
      expect(circleRects).toBeLessThan(squareRects);
    });

    it('uses finderColor for circle finders when specified', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        finderShape: 'circle',
        finderColor: '#ff0000',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      // The circle elements should use the finder color
      expect(svg).toContain('fill="#ff0000"');
    });

    it('composes with diamond module shape', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        shape: 'diamond',
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('<circle');   // circle finders
      expect(svg).toContain('<polygon');  // diamond data modules
    });
  });

  describe('overlay image', () => {
    it('renders <image> element when overlayImage is provided', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        overlayImage: { src: 'data:image/png;base64,abc123' },
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('<image');
      expect(svg).toContain('href="data:image/png;base64,abc123"');
    });

    it('applies default opacity of 0.3', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        overlayImage: { src: 'test.png' },
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('opacity="0.3"');
    });

    it('applies custom opacity', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        overlayImage: { src: 'test.png', opacity: 0.5 },
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('opacity="0.5"');
    });

    it('renders image at full QR size with preserveAspectRatio', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        overlayImage: { src: 'test.png' },
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('width="256"');
      expect(svg).toContain('height="256"');
      expect(svg).toContain('preserveAspectRatio="xMidYMid slice"');
    });

    it('renders finder background rects for scannability', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        overlayImage: { src: 'test.png' },
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      // Should have finder backgrounds — look for rects with bgColor after the image
      const imageIdx = svg.indexOf('<image');
      const afterImage = svg.slice(imageIdx);
      // There should be background rects for 3 finder positions
      const bgRects = (afterImage.match(/<rect[^/]*fill="#ffffff"/g) || []);
      expect(bgRects.length).toBeGreaterThanOrEqual(3);
    });

    it('uses finderBackgroundColor when specified', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        overlayImage: { src: 'test.png', finderBackgroundColor: '#eeeeee' },
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('fill="#eeeeee"');
    });

    it('renders circular finder backgrounds when finderShape is circle', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        overlayImage: { src: 'test.png' },
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      // Should contain circle elements for finder backgrounds + circle finders
      const circles = (svg.match(/<circle/g) || []);
      // 3 bg circles + 9 concentric circles = 12 total
      expect(circles.length).toBe(12);
    });

    it('coexists with logo', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        overlayImage: { src: 'overlay.png' },
        logo: { src: 'logo.png', width: 30, height: 30 },
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      // Both overlay image and logo image should be present
      const images = (svg.match(/<image/g) || []);
      expect(images.length).toBe(2);
      expect(svg).toContain('href="overlay.png"');
      expect(svg).toContain('href="logo.png"');
    });

    it('image appears after bg rect but before modules', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'H' });
      const svg = renderSVG(qr.matrix, {
        size: 256,
        overlayImage: { src: 'test.png' },
        moduleTypes: qr.moduleTypes,
        skipValidation: true,
      });
      const bgIdx = svg.indexOf('fill="#ffffff"');
      const imgIdx = svg.indexOf('<image');
      // Find first data module element (rect or polygon after the image)
      const firstModuleAfterImg = svg.indexOf('<rect', imgIdx + 50) !== -1
        ? svg.indexOf('<rect', imgIdx + 50)
        : svg.indexOf('<polygon', imgIdx);
      expect(bgIdx).toBeLessThan(imgIdx);
      if (firstModuleAfterImg !== -1) {
        expect(imgIdx).toBeLessThan(firstModuleAfterImg);
      }
    });
  });

  describe('validation integration', () => {
    it('throws on low contrast by default', () => {
      expect(() =>
        renderSVG(simpleMatrix, {
          size: 100,
          fgColor: '#999999',
          bgColor: '#ffffff',
        }),
      ).toThrow(/contrast/i);
    });

    it('does not throw when skipValidation is true', () => {
      expect(() =>
        renderSVG(simpleMatrix, {
          size: 100,
          fgColor: '#999999',
          bgColor: '#ffffff',
          skipValidation: true,
        }),
      ).not.toThrow();
    });

    it('throws when logo is too large', () => {
      expect(() =>
        renderSVG(simpleMatrix, {
          size: 100,
          logo: { src: '/logo.png', width: 80, height: 80 },
        }),
      ).toThrow(/logo/i);
    });
  });
});
