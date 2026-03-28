import { useMemo } from 'react';
import { generateQR } from '@qr-kit/core';
import type { ErrorCorrectionLevel } from '@qr-kit/core';

export interface UseQRCodeOptions {
  value: string;
  errorCorrection?: ErrorCorrectionLevel;
  version?: number;
  /** When true, auto-upgrades error correction to 'H' for logo resilience. */
  hasLogo?: boolean;
}

export interface UseQRCodeResult {
  matrix: number[][];
  moduleTypes: number[][];
  version: number;
  size: number;
  errorCorrection: ErrorCorrectionLevel;
}

export function useQRCode(options: UseQRCodeOptions): UseQRCodeResult {
  const { value, errorCorrection, version, hasLogo } = options;

  const ecLevel: ErrorCorrectionLevel = hasLogo
    ? 'H'
    : errorCorrection ?? 'M';

  return useMemo(() => {
    const qr = generateQR({ data: value, errorCorrection: ecLevel, version });
    return {
      matrix: qr.matrix,
      moduleTypes: qr.moduleTypes,
      version: qr.version,
      size: qr.size,
      errorCorrection: qr.errorCorrection,
    };
  }, [value, ecLevel, version]);
}
