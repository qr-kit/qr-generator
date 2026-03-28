# qr-gen

A production-grade, zero-dependency QR code library built from scratch. ISO/IEC 18004 compliant with custom rendering, multi-format output, and React integration.

**13.8 KB gzipped** for the entire library.

## Packages

| Package | Description | Size (gzip) |
|---------|-------------|-------------|
| `@qr-kit/core` | QR generation engine — encoding, Reed-Solomon EC, matrix construction | 7.7 KB |
| `@qr-kit/dom` | Multi-format renderer — SVG, PNG, BMP, Canvas, Data URI | 5.5 KB |
| `@qr-kit/react` | React component + hook | 0.5 KB |

## Install

```bash
# Plain JavaScript / Node.js
npm install @qr-kit/dom

# React
npm install @qr-kit/react
```

Both install `@qr-kit/core` automatically.

---

## Vanilla JavaScript

### Quick Start

```ts
import { createQR } from '@qr-kit/dom';

// Generate a QR code as SVG string
const result = createQR('https://example.com', { size: 256 });
document.getElementById('qr').innerHTML = result.data;
```

### Output Formats

```ts
import { createQR } from '@qr-kit/dom';

// SVG (default)
const svg = createQR('hello', { size: 256 });
// svg.data → string containing <svg>...</svg>

// PNG
const png = createQR('hello', { size: 256, format: 'png' });
// png.data → Uint8Array of PNG bytes

// BMP
const bmp = createQR('hello', { size: 256, format: 'bmp' });
// bmp.data → Uint8Array of BMP bytes

// Data URI (for <img> tags)
const uri = createQR('hello', { size: 256, format: 'data-uri' });
// uri.data → "data:image/png;base64,..."
```

### Low-Level Renderers

For more control, use the individual render functions with a matrix from `@qr-kit/core`:

```ts
import { generateQR } from '@qr-kit/core';
import { renderSVG, renderPNG, renderBMP, renderCanvas } from '@qr-kit/dom';

const qr = generateQR({ data: 'https://example.com' });

// SVG string
const svg = renderSVG(qr.matrix, { size: 256 });

// PNG bytes
const png = renderPNG(qr.matrix, { size: 512 });

// BMP bytes
const bmp = renderBMP(qr.matrix, { size: 512 });

// Direct Canvas rendering (browser only)
const canvas = document.getElementById('canvas');
renderCanvas(qr.matrix, { size: 256 }, canvas);
```

### Styling

```ts
import { createQR } from '@qr-kit/dom';

const result = createQR('https://example.com', {
  size: 300,
  fgColor: '#1a1a2e',
  bgColor: '#e0e0e0',
  shape: 'dots',           // 'square' | 'rounded' | 'dots'
  margin: 4,               // quiet zone modules
});
```

### Gradients

```ts
const result = createQR('https://example.com', {
  size: 300,
  fgColor: {
    type: 'linear',
    colors: ['#667eea', '#764ba2'],
    angle: 135,
  },
});
```

### Finder Pattern Customization

```ts
const result = createQR('https://example.com', {
  size: 300,
  shape: 'dots',
  finderShape: 'rounded',      // 'square' | 'rounded'
  finderColor: '#e94560',       // independent of fgColor
});
```

### Logo Embedding

```ts
const result = createQR('https://example.com', {
  size: 300,
  logo: {
    src: 'https://example.com/logo.png',  // URL or data URI
    width: 50,
    height: 50,
    padding: 5,
  },
});
// Error correction is auto-upgraded to 'H' when a logo is present
```

### Scannability Scoring

```ts
import { computeScannability } from '@qr-kit/dom';

const score = computeScannability({
  errorCorrection: 'H',
  fgColor: '#000000',
  bgColor: '#ffffff',
  shape: 'square',
  size: 256,
  margin: 4,
});

console.log(score.score);      // 0-100
console.log(score.breakdown);  // { errorCorrection, contrast, logoImpact, moduleShape, quietZone }
```

### Validation

```ts
import { validateRenderOptions } from '@qr-kit/dom';

const result = validateRenderOptions(
  { size: 256, fgColor: '#777777', bgColor: '#888888' },
  'M',
);

console.log(result.valid);   // false
console.log(result.issues);  // [{ code: 'CONTRAST_TOO_LOW', severity: 'error', message: '...' }]
```

### Saving to File (Node.js)

```ts
import { createQR } from '@qr-kit/dom';
import { writeFileSync } from 'fs';

// Save as SVG
const svg = createQR('https://example.com', { size: 512 });
writeFileSync('qr.svg', svg.data);

// Save as PNG
const png = createQR('https://example.com', { size: 512, format: 'png' });
writeFileSync('qr.png', png.data);
```

---

## React

### Quick Start

```tsx
import { QRCode } from '@qr-kit/react';

function App() {
  return <QRCode value="https://example.com" size={256} />;
}
```

### Full Props

```tsx
<QRCode
  value="https://example.com"
  size={300}
  errorCorrection="H"
  fgColor="#1a1a2e"
  bgColor="#ffffff"
  shape="rounded"
  finderShape="rounded"
  finderColor="#e94560"
  margin={4}
  logo={{
    src: '/logo.png',
    width: 50,
    height: 50,
  }}
  className="my-qr"
  style={{ border: '1px solid #ccc' }}
/>
```

### useQRCode Hook

For custom rendering, use the hook to access the raw QR matrix:

```tsx
import { useQRCode } from '@qr-kit/react';

function CustomQR() {
  const { matrix, moduleTypes, version, size } = useQRCode({
    value: 'https://example.com',
    errorCorrection: 'H',
  });

  // Render however you want — Canvas, WebGL, etc.
  return <canvas ref={/* use matrix data */} />;
}
```

---

## API Reference

### Render Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `number` | required | Output size in pixels |
| `fgColor` | `string \| GradientConfig` | `'#000000'` | Foreground color or gradient |
| `bgColor` | `string` | `'#ffffff'` | Background color |
| `shape` | `'square' \| 'rounded' \| 'dots'` | `'square'` | Module shape |
| `finderShape` | `'square' \| 'rounded'` | same as `shape` | Finder pattern shape |
| `finderColor` | `string \| GradientConfig` | same as `fgColor` | Finder pattern color |
| `logo` | `LogoConfig` | — | Logo to embed in center |
| `margin` | `number` | `4` | Quiet zone in modules |
| `skipValidation` | `boolean` | `false` | Skip contrast/size checks |

### Error Correction Levels

| Level | Recovery | Use Case |
|-------|----------|----------|
| `L` | ~7% | Maximum data capacity |
| `M` | ~15% | Default, balanced |
| `Q` | ~25% | Higher reliability |
| `H` | ~30% | Required when using logos |

### Validation Codes

| Code | Severity | Description |
|------|----------|-------------|
| `CONTRAST_TOO_LOW` | error | Contrast ratio < 4.5 (WCAG) |
| `LOGO_TOO_LARGE` | error | Logo area > 20% of QR |
| `INVALID_COLOR` | error | Malformed hex color |
| `EC_NOT_H_WITH_LOGO` | warning | Logo present but EC not H |
| `SHAPE_SCAN_RISK` | warning | Dots shape with low EC |
| `MODULE_TOO_SMALL` | warning | Module < 3px with non-square shape |

---

## Architecture

```
@qr-kit/core          @qr-kit/dom           @qr-kit/react
┌──────────────┐      ┌─────────────────────┐    ┌──────────────┐
│ Encoding     │      │ SVG Renderer        │    │ <QRCode />   │
│ Reed-Solomon │─────▶│ PNG Encoder (custom) │◀───│ useQRCode()  │
│ Matrix Build │      │ BMP Encoder (custom) │    └──────────────┘
│ Masking      │      │ Canvas Renderer     │
└──────────────┘      │ Data URI            │
                      │ Validation          │
                      │ Scannability Score  │
                      └─────────────────────┘
```

Zero production dependencies. PNG and BMP encoders are built from scratch (deflate, CRC-32, Adler-32).

## License

MIT
