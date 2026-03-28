import type { ErrorCorrectionLevel } from '@qr-kit/core';
import type { ColorConfig, ModuleShape, LogoConfig, OverlayImageConfig, GradientConfig } from '../types';
import { contrastRatio } from './contrast';

export interface ScannabilityBreakdown {
  errorCorrection: number;  // 0-25
  contrast: number;         // 0-25
  logoImpact: number;       // 0-20
  moduleShape: number;      // 0-15
  quietZone: number;        // 0-15
}

export interface ScannabilityResult {
  score: number;            // 0-100
  breakdown: ScannabilityBreakdown;
}

export function computeScannability(options: {
  errorCorrection: ErrorCorrectionLevel;
  fgColor?: ColorConfig;
  bgColor?: string;
  shape?: ModuleShape;
  logo?: LogoConfig;
  overlayImage?: OverlayImageConfig;
  size: number;
  margin?: number;
}): ScannabilityResult {
  const {
    errorCorrection,
    fgColor = '#000000',
    bgColor = '#ffffff',
    shape = 'square',
    logo,
    overlayImage,
    size,
    margin = 4,
  } = options;

  // EC scoring
  const ecScores: Record<string, number> = { H: 25, Q: 20, M: 15, L: 10 };
  const ecScore = ecScores[errorCorrection] ?? 10;

  // Contrast scoring
  let contrastScore: number;
  if (typeof fgColor === 'string') {
    const ratio = contrastRatio(fgColor, bgColor);
    contrastScore = ratio >= 7 ? 25 : ratio >= 4.5 ? 20 : ratio >= 3 ? 10 : 0;
  } else {
    // Gradient: use minimum contrast of all endpoints
    const gradient = fgColor as GradientConfig;
    let minRatio = Infinity;
    for (const color of gradient.colors) {
      const ratio = contrastRatio(color, bgColor);
      if (ratio < minRatio) minRatio = ratio;
    }
    contrastScore = minRatio >= 7 ? 25 : minRatio >= 4.5 ? 20 : minRatio >= 3 ? 10 : 0;
  }

  // Logo scoring
  let logoScore: number;
  if (!logo) {
    logoScore = 20;
  } else {
    const logoArea = logo.width * logo.height;
    const qrArea = size * size;
    const ratio = logoArea / qrArea;
    logoScore = ratio <= 0.10 ? 15 : ratio <= 0.15 ? 10 : ratio <= 0.20 ? 5 : 0;
  }

  // Shape scoring
  const shapeScores: Record<string, number> = { square: 15, rounded: 12, diamond: 10, dots: 8 };
  const shapeScore = shapeScores[shape] ?? 15;

  // Quiet zone scoring
  let qzScore: number;
  if (margin >= 4) qzScore = 15;
  else if (margin === 3) qzScore = 10;
  else if (margin === 2) qzScore = 5;
  else if (margin === 1) qzScore = 2;
  else qzScore = 0;

  // Overlay image penalty: reduces contrast reliability
  const overlayPenalty = overlayImage ? 10 : 0;

  const breakdown: ScannabilityBreakdown = {
    errorCorrection: ecScore,
    contrast: contrastScore,
    logoImpact: logoScore,
    moduleShape: shapeScore,
    quietZone: qzScore,
  };

  const rawScore = ecScore + contrastScore + logoScore + shapeScore + qzScore - overlayPenalty;

  return {
    score: Math.max(0, rawScore),
    breakdown,
  };
}
