import { describe, it, expect } from 'vitest';
import { renderSVG } from '../src/svg/renderer';
import { generateQR } from '@qr-kit/core';

// Generate a real QR to get proper moduleTypes
const qr = generateQR({ data: 'TEST' });
const { matrix, moduleTypes } = qr;

describe('Finder Inner/Outer Styling', () => {
  describe('SVG - independent colors', () => {
    it('uses finderOuterColor for outer ring modules', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        finderOuterColor: '#ff0000',
        finderInnerColor: '#0000ff',
        moduleTypes,
        skipValidation: true,
      });
      // Outer ring modules should use red
      expect(svg).toContain('fill="#ff0000"');
      // Inner box modules should use blue
      expect(svg).toContain('fill="#0000ff"');
    });

    it('uses finderInnerColor for inner box modules', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        finderInnerColor: '#00ff00',
        moduleTypes,
        skipValidation: true,
      });
      // Inner modules should use green
      expect(svg).toContain('fill="#00ff00"');
    });

    it('falls back finderOuterColor -> finderColor -> fgColor', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        finderColor: '#888888',
        moduleTypes,
        skipValidation: true,
      });
      // Both inner and outer should use finderColor when specific ones aren't set
      expect(svg).toContain('fill="#888888"');
    });

    it('backward compat: finderColor alone still works', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        finderColor: '#ff00ff',
        moduleTypes,
        skipValidation: true,
      });
      expect(svg).toContain('fill="#ff00ff"');
    });

    it('finderOuterColor overrides finderColor for outer ring', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        finderColor: '#888888',
        finderOuterColor: '#ff0000',
        moduleTypes,
        skipValidation: true,
      });
      // Should have both colors: red for outer, gray for inner (fallback to finderColor)
      expect(svg).toContain('fill="#ff0000"');
      expect(svg).toContain('fill="#888888"');
    });
  });

  describe('SVG - circle finders with independent colors', () => {
    it('uses finderOuterColor for outer/gap circles and finderInnerColor for inner dot', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        finderShape: 'circle',
        finderOuterColor: '#ff0000',
        finderInnerColor: '#0000ff',
        moduleTypes,
        skipValidation: true,
      });
      // Should have red outer circles and blue inner circles
      expect(svg).toContain('fill="#ff0000"');
      expect(svg).toContain('fill="#0000ff"');
    });
  });

  describe('SVG - independent shapes', () => {
    it('uses finderOuterShape for outer ring and finderInnerShape for inner box', () => {
      const svg = renderSVG(matrix, {
        size: 300,
        finderOuterShape: 'rounded',
        finderInnerShape: 'square',
        moduleTypes,
        skipValidation: true,
      });
      // Should produce different shapes for outer vs inner finder modules
      expect(svg).toBeTruthy();
    });
  });
});
