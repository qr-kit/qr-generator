# @qr-kit/react

React component and hook for generating QR codes. Zero-dependency QR engine with custom rendering — shapes, gradients, logos, overlays, frames, and finder pattern customization.

**0.5 KB gzipped** (+ 13.2 KB for core + vanilla, installed automatically).

## Install

```bash
npm install @qr-kit/react
```

Requires React 18+. Automatically installs `@qr-kit/core` and `@qr-kit/dom`.

## Quick Start

```tsx
import { QRCode } from '@qr-kit/react';

function App() {
  return <QRCode value="https://example.com" size={256} />;
}
```

## Styling

```tsx
<QRCode
  value="https://example.com"
  size={300}
  fgColor="#1a1a2e"
  bgColor="#ffffff"
  bgOpacity={0.8}
  borderRadius={10}
  shape="rounded"
  moduleScale={0.9}
  margin={4}
/>
```

## Gradients

```tsx
<QRCode
  value="https://example.com"
  size={300}
  fgColor={{
    type: 'linear',
    colors: ['#667eea', '#764ba2'],
    angle: 135,
  }}
/>
```

## Finder Pattern Customization

```tsx
<QRCode
  value="https://example.com"
  size={300}
  shape="dots"
  finderShape="rounded"
  finderColor="#e94560"
  // Granular control:
  finderOuterShape="rounded"
  finderInnerShape="circle"
  finderOuterColor="#e94560"
  finderInnerColor="#333333"
/>
```

## Logo Embedding

```tsx
<QRCode
  value="https://example.com"
  size={300}
  logo={{
    src: "/logo.png",
    width: 50,
    height: 50,
    padding: 5,
  }}
/>
```

Error correction is automatically upgraded to `'H'` when a logo is present.

## Overlay Image

```tsx
<QRCode
  value="https://example.com"
  size={300}
  overlayImage={{
    src: "/background.png",
    opacity: 0.3,
    finderBackgroundColor: "#ffffff",
  }}
/>
```

Error correction is automatically upgraded to `'H'` when an overlay is present.

## Frame

```tsx
<QRCode
  value="https://example.com"
  size={300}
  frame={{
    style: 'rounded',
    color: '#333333',
    thickness: 3,
    label: 'Scan me',
    labelPosition: 'bottom',
    labelColor: '#333333',
    labelFontSize: 14,
    padding: 8,
  }}
/>
```

## Presets

```tsx
<QRCode
  value="https://example.com"
  size={300}
  preset="elegant"
  fgColor="#1a1a2e"   // explicit props override preset values
/>
```

Available presets: `'default'` | `'minimal'` | `'rounded'` | `'dots'` | `'sharp'` | `'elegant'`

## Custom Module Renderer

```tsx
<QRCode
  value="https://example.com"
  size={300}
  customModule={({ x, y, size, row, col, moduleType }) => {
    return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 3}" fill="red"/>`;
  }}
/>
```

## Imperative Handle (ref)

Access download/export methods via ref:

```tsx
import { useRef } from 'react';
import { QRCode } from '@qr-kit/react';
import type { QRCodeHandle } from '@qr-kit/react';

function App() {
  const qrRef = useRef<QRCodeHandle>(null);

  return (
    <>
      <QRCode ref={qrRef} value="https://example.com" size={256} />
      <button onClick={() => qrRef.current?.download('my-qr.png')}>
        Download
      </button>
    </>
  );
}
```

### QRCodeHandle methods

| Method | Returns | Description |
|--------|---------|-------------|
| `download(filename?)` | `void` | Trigger a file download (browser only) |
| `toBlob()` | `Blob` | Get QR as a Blob (browser only) |
| `toDataURL()` | `string` | Get QR as a data URL string |
| `element` | `HTMLDivElement \| null` | Access the underlying DOM element |

## useQRCode Hook

For custom rendering (Canvas, WebGL, etc.), use the hook to get the raw QR matrix:

```tsx
import { useQRCode } from '@qr-kit/react';

function CustomQR() {
  const { matrix, moduleTypes, version, size, errorCorrection } = useQRCode({
    value: 'https://example.com',
    errorCorrection: 'H',
  });

  return <canvas ref={/* render matrix yourself */} />;
}
```

### UseQRCodeOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | required | Data to encode |
| `errorCorrection` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Error correction level |
| `version` | `number` | auto | QR version (1-40) |
| `hasLogo` | `boolean` | `false` | Auto-upgrade EC to `'H'` |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Data to encode |
| `size` | `number` | `256` | Output size in pixels |
| `errorCorrection` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Error correction level |
| `version` | `number` | auto | QR version (1-40) |
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
| `frame` | `FrameConfig` | - | Decorative frame with optional label |
| `preset` | `PresetName` | - | Apply a style preset |
| `skipValidation` | `boolean` | `false` | Skip contrast/size checks |
| `alt` | `string` | `'QR Code'` | Accessible label (aria-label) |
| `className` | `string` | - | CSS class on wrapper div |
| `style` | `CSSProperties` | - | Inline styles on wrapper div |

## Related Packages

| Package | Description |
|---------|-------------|
| [`@qr-kit/core`](https://www.npmjs.com/package/@qr-kit/core) | QR generation engine (installed automatically) |
| [`@qr-kit/dom`](https://www.npmjs.com/package/@qr-kit/dom) | Vanilla JS renderer (installed automatically) |

## License

MIT
