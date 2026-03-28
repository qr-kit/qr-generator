import { describe, it, expect, vi } from 'vitest';
import { renderSVG } from '../src/svg/renderer';
import { createQR } from '../src/create-qr';
import { MODULE_TYPE } from '@qr-kit/core';

const simpleMatrix = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1],
];

describe('Custom Module Renderer', () => {
  describe('SVG custom module callback', () => {
    it('callback is called for each dark module', () => {
      const callback = vi.fn().mockReturnValue('<rect/>');
      renderSVG(simpleMatrix, {
        size: 100,
        customModule: callback,
      });
      // simpleMatrix has 5 dark modules
      expect(callback).toHaveBeenCalledTimes(5);
    });

    it('callback receives correct x, y, size', () => {
      const calls: any[] = [];
      renderSVG(simpleMatrix, {
        size: 110, // 3+8=11 modules, moduleSize=10
        customModule: (args) => {
          calls.push(args);
          return '<rect/>';
        },
      });
      // First dark module at (0,0) with margin=4: x=(0+4)*10=40, y=(0+4)*10=40
      expect(calls[0].x).toBe(40);
      expect(calls[0].y).toBe(40);
      expect(calls[0].size).toBe(10);
    });

    it('callback receives correct row, col', () => {
      const calls: any[] = [];
      renderSVG(simpleMatrix, {
        size: 110,
        customModule: (args) => {
          calls.push(args);
          return '<rect/>';
        },
      });
      expect(calls[0].row).toBe(0);
      expect(calls[0].col).toBe(0);
      // Second dark module at (0,2)
      expect(calls[1].row).toBe(0);
      expect(calls[1].col).toBe(2);
    });

    it('callback receives moduleType from moduleTypes', () => {
      const moduleTypes = [
        [MODULE_TYPE.FINDER, MODULE_TYPE.DATA, MODULE_TYPE.DATA],
        [MODULE_TYPE.DATA, MODULE_TYPE.DATA, MODULE_TYPE.DATA],
        [MODULE_TYPE.DATA, MODULE_TYPE.DATA, MODULE_TYPE.DATA],
      ];
      const types: number[] = [];
      renderSVG(simpleMatrix, {
        size: 110,
        moduleTypes,
        customModule: (args) => {
          types.push(args.moduleType);
          return '<rect/>';
        },
        skipValidation: true,
      });
      expect(types[0]).toBe(MODULE_TYPE.FINDER); // (0,0) is finder
      expect(types[1]).toBe(MODULE_TYPE.DATA);   // (0,2) is data
    });

    it('callback return string is included in SVG output', () => {
      const svg = renderSVG(simpleMatrix, {
        size: 100,
        customModule: () => '<star class="custom"/>',
      });
      expect(svg).toContain('<star class="custom"/>');
    });

    it('callback returning null falls through to default rendering', () => {
      const svg = renderSVG(simpleMatrix, {
        size: 100,
        customModule: (args) => {
          // Only customize first module, let rest use default
          if (args.row === 0 && args.col === 0) return '<custom/>';
          return null;
        },
      });
      expect(svg).toContain('<custom/>');
      // Other modules should use default rect rendering
      expect(svg).toContain('<rect');
    });

    it('circle finders: callback NOT called for finder modules', () => {
      const { generateQR } = require('@qr-kit/core');
      const qr = generateQR({ data: 'test', errorCorrection: 'M' });
      const types: number[] = [];
      renderSVG(qr.matrix, {
        size: 256,
        finderShape: 'circle',
        moduleTypes: qr.moduleTypes,
        customModule: (args) => {
          types.push(args.moduleType);
          return '<rect/>';
        },
        skipValidation: true,
      });
      // No finder modules should reach the callback
      expect(types.every(t => t !== MODULE_TYPE.FINDER)).toBe(true);
    });

    it('callback NOT called for modules in logo zone', () => {
      const calls: any[] = [];
      // Create a matrix large enough for logo
      const matrix21 = Array.from({ length: 21 }, (_, r) =>
        Array.from({ length: 21 }, (_, c) => ((r + c) % 2 === 0 ? 1 : 0)),
      );
      renderSVG(matrix21, {
        size: 256,
        logo: { src: 'logo.png', width: 40, height: 40 },
        customModule: (args) => {
          calls.push(args);
          return '<rect/>';
        },
        skipValidation: true,
      });
      // Center modules should not be in the calls
      const centerCalls = calls.filter(c => c.row === 10 && c.col === 10);
      expect(centerCalls).toHaveLength(0);
    });

    it('moduleScale: callback receives scaled coordinates', () => {
      const calls: any[] = [];
      renderSVG(simpleMatrix, {
        size: 110, // moduleSize=10
        moduleScale: 0.5,
        customModule: (args) => {
          calls.push(args);
          return '<rect/>';
        },
      });
      // With scale 0.5: adjustedSize=5, offset=(10-5)/2=2.5
      // First module at (0,0) with margin 4: x=40+2.5=42.5
      expect(calls[0].size).toBe(5);
      expect(calls[0].x).toBe(42.5);
    });

    it('without moduleTypes: moduleType defaults to 0', () => {
      const types: number[] = [];
      renderSVG(simpleMatrix, {
        size: 100,
        customModule: (args) => {
          types.push(args.moduleType);
          return '<rect/>';
        },
      });
      expect(types.every(t => t === 0)).toBe(true);
    });
  });

  describe('E2E', () => {
    it('createQR with customModule produces valid SVG', () => {
      const result = createQR('test', {
        size: 256,
        customModule: (args) => `<circle cx="${args.x}" cy="${args.y}" r="2"/>`,
      });
      expect(result.data as string).toContain('<circle');
      expect(result.data as string).toContain('<svg');
    });
  });
});
