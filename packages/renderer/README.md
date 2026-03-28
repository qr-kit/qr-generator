# @qr-kit/dom

Zero-dependency QR code renderer with multi-format output — SVG, PNG, BMP, Canvas, and Data URI. Built from scratch with custom PNG/BMP encoders (no native dependencies).

**5.5 KB gzipped.**

## Install

```bash
npm install @qr-kit/dom
```

Automatically installs `@qr-kit/core`.

## Quick Start

```ts
import { createQR } from '@qr-kit/dom';

const result = createQR('https://example.com', { size: 256 });
document.getElementById('qr').innerHTML = result.data;
```

## Output Formats

```ts
import { createQR } from '@qr-kit/dom';

// SVG (default)
const svg = createQR('hello', { size: 256 });
// svg.data -> SVG string

// PNG
const png = createQR('hello', { size: 256, format: 'png' });
// png.data -> Uint8Array

// BMP
const bmp = createQR('hello', { size: 256, format: 'bmp' });
// bmp.data -> Uint8Array

// Data URI (for <img> tags)
const uri = createQR('hello', { size: 256, format: 'data-uri' });
// uri.data -> "data:image/png;base64,..."
```

## CreateQRResult

`createQR()` returns a result with helper methods:

```ts
const result = createQR('hello', { size: 256 });

result.data;              // string | Uint8Array
result.format;            // 'svg' | 'png' | 'bmp' | 'data-uri'
result.version;           // QR version (1-40)
result.errorCorrection;   // 'L' | 'M' | 'Q' | 'H'
result.size;              // matrix size in modules
result.validation;        // { valid, issues }

result.toDataURL('png');  // data URL string (works everywhere)
result.toBlob('png');     // Blob (browser only)
result.download();        // triggers file download (browser only)
result.download({ filename: 'my-qr.svg', format: 'svg' });
```

## SVG-Only Shortcut

```ts
import { createQRSVG } from '@qr-kit/dom';

const { svg, version, errorCorrection, validation } = createQRSVG(
  'https://example.com',
  { size: 300, shape: 'rounded' },
);
```

## Low-Level Renderers

```ts
import { generateQR } from '@qr-kit/core';
import { renderSVG, renderPNG, renderBMP, renderCanvas, renderDataURI } from '@qr-kit/dom';

const qr = generateQR({ data: 'https://example.com' });

const svg = renderSVG(qr.matrix, { size: 256, moduleTypes: qr.moduleTypes });
const png = renderPNG(qr.matrix, { size: 512 });
const bmp = renderBMP(qr.matrix, { size: 512 });
const dataUri = renderDataURI(qr.matrix, { size: 256 });

// Canvas (browser only)
renderCanvas(qr.matrix, { size: 256 }, document.getElementById('canvas'));
```

## Styling

### Colors and Shapes

```ts
createQR('https://example.com', {
  size: 300,
  fgColor: '#1a1a2e',
  bgColor: '#e0e0e0',
  shape: 'dots',              // 'square' | 'rounded' | 'dots' | 'diamond'
  margin: 4,
  bgOpacity: 0.5,             // background opacity (0-1)
  borderRadius: 10,           // outer border radius in px
  moduleScale: 0.85,          // scale modules down (0-1)
});
```

### Gradients

```ts
createQR('https://example.com', {
  size: 300,
  fgColor: {
    type: 'linear',            // 'linear' | 'radial'
    colors: ['#667eea', '#764ba2'],
    angle: 135,
  },
});
```

### Finder Pattern Customization

```ts
createQR('https://example.com', {
  size: 300,
  shape: 'dots',
  finderShape: 'rounded',          // 'square' | 'rounded' | 'circle'
  finderColor: '#e94560',
  // Granular control:
  finderOuterShape: 'rounded',
  finderInnerShape: 'circle',
  finderOuterColor: '#e94560',
  finderInnerColor: '#333333',
});
```

### Logo Embedding

```ts
createQR('https://example.com', {
  size: 300,
  logo: {
    src: '/logo.png',         // URL or data URI
    width: 50,
    height: 50,
    padding: 5,
  },
});
// EC auto-upgrades to 'H' when a logo is present
```

### Overlay Image

```ts
createQR('https://example.com', {
  size: 300,
  overlayImage: {
    src: '/background.png',
    opacity: 0.3,
    finderBackgroundColor: '#ffffff',
  },
});
// EC auto-upgrades to 'H' when an overlay is present
```

### Frame

```ts
createQR('https://example.com', {
  size: 300,
  frame: {
    style: 'rounded',              // 'square' | 'rounded'
    color: '#333333',
    thickness: 3,
    label: 'Scan me',
    labelPosition: 'bottom',       // 'top' | 'bottom'
    labelColor: '#333333',
    labelFontSize: 14,
    padding: 8,
  },
});
```

### Custom Module Renderer

```ts
createQR('https://example.com', {
  size: 300,
  customModule: ({ x, y, size, row, col, moduleType }) => {
    // Return an SVG string, or null to use the default shape
    return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 3}" fill="red"/>`;
  },
});
```

## Presets

```ts
import { applyPreset, PRESET_NAMES } from '@qr-kit/dom';

// Available: 'default' | 'minimal' | 'rounded' | 'dots' | 'sharp' | 'elegant'
const opts = applyPreset('elegant');
const result = createQR('hello', { size: 256, ...opts });

// Override preset values
const custom = applyPreset('dots', { fgColor: '#e94560' });
```

## File Download (Browser)

```ts
import { createQR, downloadQR } from '@qr-kit/dom';

const result = createQR('https://example.com', { size: 512 });
result.download({ filename: 'my-qr.png', format: 'png' });

// Or use the standalone function
downloadQR(result, { filename: 'my-qr.svg', format: 'svg' });
```

## Save to File (Node.js)

```ts
import { createQR } from '@qr-kit/dom';
import { writeFileSync } from 'fs';

writeFileSync('qr.svg', createQR('https://example.com', { size: 512 }).data);
writeFileSync('qr.png', createQR('https://example.com', { size: 512, format: 'png' }).data);
```

## Validation

### Render Options Validation

```ts
import { validateRenderOptions } from '@qr-kit/dom';

const result = validateRenderOptions(
  { size: 256, fgColor: '#777777', bgColor: '#888888' },
  'M',
);

result.valid;    // false
result.issues;   // [{ code: 'CONTRAST_TOO_LOW', severity: 'error', message: '...' }]
```

### Scannability Scoring

```ts
import { computeScannability } from '@qr-kit/dom';

const { score, breakdown } = computeScannability({
  errorCorrection: 'H',
  fgColor: '#000000',
  bgColor: '#ffffff',
  shape: 'square',
  size: 256,
  margin: 4,
});
// score: 0-100
```

### Structural Integrity Verification

```ts
import { generateQR } from '@qr-kit/core';
import { verifyQRIntegrity } from '@qr-kit/dom';

const qr = generateQR({ data: 'hello' });
const result = verifyQRIntegrity(qr.matrix, 'hello', {
  errorCorrection: 'M',
});
// result.success, result.matchesInput, result.issues
```

### Contrast Ratio

```ts
import { contrastRatio } from '@qr-kit/dom';

contrastRatio('#000000', '#ffffff'); // 21
```

## Render Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `number` | required | Output size in pixels |
| `fgColor` | `string \| GradientConfig` | `'#000000'` | Foreground color or gradient |
| `bgColor` | `string` | `'#ffffff'` | Background color |
| `bgOpacity` | `number` | `1` | Background opacity (0-1) |
| `borderRadius` | `number` | `0` | Outer border radius in pixels |
| `shape` | `'square' \| 'rounded' \| 'dots' \| 'diamond'` | `'square'` | Module shape |
| `moduleScale` | `number` | `1` | Scale factor for modules (0-1) |
| `customModule` | `function` | - | Custom SVG module renderer |
| `finderShape` | `'square' \| 'rounded' \| 'circle'` | matches `shape` | Finder pattern shape |
| `finderColor` | `string \| GradientConfig` | matches `fgColor` | Finder pattern color |
| `finderOuterShape` | `FinderShape` | matches `finderShape` | Outer finder ring shape |
| `finderInnerShape` | `FinderShape` | matches `finderShape` | Inner finder dot shape |
| `finderOuterColor` | `string \| GradientConfig` | matches `finderColor` | Outer finder ring color |
| `finderInnerColor` | `string \| GradientConfig` | matches `finderColor` | Inner finder dot color |
| `logo` | `LogoConfig` | - | Logo to embed in center |
| `overlayImage` | `OverlayImageConfig` | - | Background overlay image |
| `margin` | `number` | `4` | Quiet zone in modules |
| `title` | `string` | - | SVG title element |
| `frame` | `FrameConfig` | - | Decorative frame with optional label |
| `skipValidation` | `boolean` | `false` | Skip contrast/size checks |

## Validation Codes

| Code | Severity | Description |
|------|----------|-------------|
| `CONTRAST_TOO_LOW` | error | Contrast ratio < 4.5 (WCAG) |
| `LOGO_TOO_LARGE` | error | Logo area > 20% of QR |
| `INVALID_COLOR` | error | Malformed hex color |
| `INVALID_MODULE_SCALE` | error | Module scale out of range |
| `INVALID_BG_OPACITY` | error | Background opacity out of range |
| `EC_NOT_H_WITH_LOGO` | warning | Logo present but EC not H |
| `SHAPE_SCAN_RISK` | warning | Dots shape with low EC |
| `MODULE_TOO_SMALL` | warning | Module < 3px with non-square shape |
| `OVERLAY_REQUIRES_HIGH_EC` | warning | Overlay present but EC not H |
| `OVERLAY_HIGH_OPACITY` | warning | Overlay opacity too high for scanning |

## Related Packages

| Package | Description |
|---------|-------------|
| [`@qr-kit/core`](https://www.npmjs.com/package/@qr-kit/core) | QR generation engine (installed automatically) |
| [`@qr-kit/react`](https://www.npmjs.com/package/@qr-kit/react) | React component and hook |

## License

MIT
