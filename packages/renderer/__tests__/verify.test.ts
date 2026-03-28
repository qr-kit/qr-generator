import { describe, it, expect } from 'vitest';
import { verifyQRIntegrity } from '../src/validation/verify';
import { generateQR } from '@qr-kit/core';

describe('QR Integrity Verification', () => {
  describe('valid QR codes', () => {
    it('returns success for a freshly generated QR', () => {
      const qr = generateQR({ data: 'hello', errorCorrection: 'M' });
      const result = verifyQRIntegrity(qr.matrix, 'hello', {
        moduleTypes: qr.moduleTypes,
        errorCorrection: 'M',
      });
      expect(result.success).toBe(true);
      expect(result.matchesInput).toBe(true);
      expect(result.verificationMode).toBe('structural');
    });

    it('returns success for EC level H', () => {
      const qr = generateQR({ data: 'test123', errorCorrection: 'H' });
      const result = verifyQRIntegrity(qr.matrix, 'test123', {
        moduleTypes: qr.moduleTypes,
        errorCorrection: 'H',
      });
      expect(result.success).toBe(true);
      expect(result.matchesInput).toBe(true);
    });

    it('returns success for URL data', () => {
      const qr = generateQR({ data: 'https://example.com' });
      const result = verifyQRIntegrity(qr.matrix, 'https://example.com', {
        moduleTypes: qr.moduleTypes,
      });
      expect(result.success).toBe(true);
      expect(result.matchesInput).toBe(true);
    });
  });

  describe('corrupted QR codes', () => {
    it('returns failure when a finder bit is corrupted', () => {
      const qr = generateQR({ data: 'hello', errorCorrection: 'M' });
      const corrupted = qr.matrix.map(row => [...row]);
      // Flip a finder pattern bit (top-left corner should be 1)
      corrupted[0][0] = corrupted[0][0] === 1 ? 0 : 1;
      const result = verifyQRIntegrity(corrupted, 'hello', {
        moduleTypes: qr.moduleTypes,
        errorCorrection: 'M',
      });
      expect(result.success).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('returns matchesInput false when expected data differs', () => {
      const qr = generateQR({ data: 'hello', errorCorrection: 'M' });
      const result = verifyQRIntegrity(qr.matrix, 'goodbye', {
        moduleTypes: qr.moduleTypes,
        errorCorrection: 'M',
      });
      expect(result.matchesInput).toBe(false);
    });
  });

  describe('structural checks', () => {
    it('verifies finder pattern structure at all 3 corners', () => {
      const qr = generateQR({ data: 'TEST' });
      const result = verifyQRIntegrity(qr.matrix, 'TEST', {
        moduleTypes: qr.moduleTypes,
      });
      expect(result.success).toBe(true);
      // No finder issues
      expect(result.issues.filter(i => i.includes('finder'))).toHaveLength(0);
    });

    it('verifies timing pattern', () => {
      const qr = generateQR({ data: 'TEST' });
      const result = verifyQRIntegrity(qr.matrix, 'TEST', {
        moduleTypes: qr.moduleTypes,
      });
      expect(result.issues.filter(i => i.includes('timing'))).toHaveLength(0);
    });

    it('detects corrupted timing pattern', () => {
      const qr = generateQR({ data: 'TEST' });
      const corrupted = qr.matrix.map(row => [...row]);
      // Corrupt a timing pattern cell (row 6, between finders)
      const col = 8; // should be 1 (even col)
      corrupted[6][col] = corrupted[6][col] === 1 ? 0 : 1;
      const result = verifyQRIntegrity(corrupted, 'TEST', {
        moduleTypes: qr.moduleTypes,
      });
      expect(result.issues.some(i => i.includes('timing'))).toBe(true);
    });
  });

  describe('result properties', () => {
    it('always includes verificationMode structural', () => {
      const qr = generateQR({ data: 'test' });
      const result = verifyQRIntegrity(qr.matrix, 'test');
      expect(result.verificationMode).toBe('structural');
    });

    it('issues is an array', () => {
      const qr = generateQR({ data: 'test' });
      const result = verifyQRIntegrity(qr.matrix, 'test');
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });
});
