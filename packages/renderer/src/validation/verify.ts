import { generateQR } from '@qr-kit/core';
import type { ErrorCorrectionLevel } from '@qr-kit/core';

export interface QRIntegrityResult {
  success: boolean;
  matchesInput: boolean;
  verificationMode: 'structural';
  issues: string[];
}

const FINDER_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

/**
 * Verify structural integrity of a QR code matrix.
 *
 * This is a round-trip structural check, NOT a real-world scan simulation.
 * It verifies:
 * 1. Finder patterns at 3 corners match the expected 7x7 pattern
 * 2. Timing patterns alternate correctly
 * 3. Re-generated matrix from the same data matches
 */
export function verifyQRIntegrity(
  matrix: number[][],
  expectedData: string,
  options?: {
    moduleTypes?: number[][];
    errorCorrection?: ErrorCorrectionLevel;
  },
): QRIntegrityResult {
  const issues: string[] = [];
  const size = matrix.length;

  // 1. Verify finder patterns at 3 corners
  const finderPositions = [
    { name: 'top-left', row: 0, col: 0 },
    { name: 'top-right', row: 0, col: size - 7 },
    { name: 'bottom-left', row: size - 7, col: 0 },
  ];

  for (const { name, row, col } of finderPositions) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const actual = matrix[row + r]?.[col + c];
        const expected = FINDER_PATTERN[r][c];
        if (actual !== expected) {
          issues.push(`finder pattern "${name}" corrupted at (${row + r},${col + c}): expected ${expected}, got ${actual}`);
        }
      }
    }
  }

  // 2. Verify timing patterns (row 6 and col 6, between finders)
  // Timing pattern: alternating 1,0,1,0... starting from position 8
  for (let i = 8; i < size - 8; i++) {
    const expectedVal = i % 2 === 0 ? 1 : 0;

    // Horizontal timing (row 6)
    if (matrix[6][i] !== expectedVal) {
      issues.push(`timing pattern corrupted at row 6, col ${i}: expected ${expectedVal}, got ${matrix[6][i]}`);
    }

    // Vertical timing (col 6)
    if (matrix[i][6] !== expectedVal) {
      issues.push(`timing pattern corrupted at row ${i}, col 6: expected ${expectedVal}, got ${matrix[i][6]}`);
    }
  }

  // 3. Round-trip verification: re-generate and compare
  const ec = options?.errorCorrection ?? 'M';
  let matchesInput = false;
  try {
    const regenerated = generateQR({ data: expectedData, errorCorrection: ec });
    if (regenerated.matrix.length === size) {
      matchesInput = true;
      for (let r = 0; r < size && matchesInput; r++) {
        for (let c = 0; c < size && matchesInput; c++) {
          if (regenerated.matrix[r][c] !== matrix[r][c]) {
            matchesInput = false;
          }
        }
      }
    }
  } catch {
    // If re-generation fails, data doesn't match
    matchesInput = false;
  }

  if (!matchesInput) {
    issues.push('matrix does not match re-generated QR for the expected data');
  }

  return {
    success: issues.length === 0,
    matchesInput,
    verificationMode: 'structural',
    issues,
  };
}
