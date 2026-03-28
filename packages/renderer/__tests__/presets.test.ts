import { describe, it, expect } from 'vitest';
import { applyPreset, PRESET_NAMES } from '../src/presets';
import { validateRenderOptions } from '../src/validation/validate';
import { renderSVG } from '../src/svg/renderer';
import { generateQR } from '@qr-kit/core';

const qr = generateQR({ data: 'TEST' });

describe('Style Presets', () => {
  it('applyPreset returns a Partial<RenderOptions> object', () => {
    const preset = applyPreset('dots');
    expect(typeof preset).toBe('object');
    expect(preset.shape).toBe('dots');
  });

  it('all presets pass validation when merged with size', () => {
    for (const name of PRESET_NAMES) {
      const preset = applyPreset(name);
      const opts = { size: 300, skipValidation: false, ...preset };
      // transparent bg skips contrast check
      if (opts.bgColor === 'transparent') {
        opts.skipValidation = true;
      }
      const result = validateRenderOptions(opts);
      const errors = result.issues.filter(i => i.severity === 'error');
      expect(errors).toEqual([]);
    }
  });

  it('user overrides take precedence over preset values', () => {
    const result = applyPreset('dots', { shape: 'square' });
    expect(result.shape).toBe('square');
  });

  it('presets do not include fgColor or bgColor (neutral)', () => {
    for (const name of PRESET_NAMES) {
      if (name === 'default') continue;
      const preset = applyPreset(name);
      // Presets may include bgColor: 'transparent' but not a specific color
      if (preset.bgColor && preset.bgColor !== 'transparent') {
        throw new Error(`Preset "${name}" has non-neutral bgColor: ${preset.bgColor}`);
      }
      expect(preset.fgColor).toBeUndefined();
    }
  });

  it('default preset returns empty object', () => {
    const preset = applyPreset('default');
    expect(Object.keys(preset).length).toBe(0);
  });

  it('all presets produce valid SVG output', () => {
    for (const name of PRESET_NAMES) {
      const preset = applyPreset(name);
      const opts = { size: 300, ...preset, moduleTypes: qr.moduleTypes, skipValidation: true };
      const svg = renderSVG(qr.matrix, opts);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }
  });

  it('PRESET_NAMES is a non-empty array', () => {
    expect(PRESET_NAMES.length).toBeGreaterThan(0);
    expect(PRESET_NAMES).toContain('default');
    expect(PRESET_NAMES).toContain('dots');
    expect(PRESET_NAMES).toContain('rounded');
  });
});
