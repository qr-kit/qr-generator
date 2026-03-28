# QR Gen — Feature Roadmap

20 features organized into 4 phases. Build them sequentially — each phase builds on the previous.

---

## Phase 1: Planned Core Features (4 features)

### 1. Download Support

- **Package:** `renderer`, `react`
- **What:** Add `downloadQR()` utility in renderer that converts output (SVG/PNG/BMP) to a downloadable Blob URL and triggers a browser download. In React, expose a `downloadable` prop on `<QRCode />` that renders a download button, plus a `ref` method `download(filename?)` for programmatic use.
- **API surface:**
  ```ts
  // renderer
  downloadQR(result: CreateQRResult, filename?: string): void

  // react
  <QRCode downloadable value="..." />
  qrRef.current.download('my-qr.png')
  ```
- **Effort:** Low
- **Size impact:** ~0.5-1 KB gzipped

---

### 2. Overlay Image Mode

- **Package:** `renderer`, `react`
- **What:** New `imagePosition: 'center' | 'overlay'` option. In overlay mode, the image fills the entire QR area as a background. QR dark modules are drawn on top as small shapes (diamonds/dots/etc.) with gaps between them so the image shows through. No clear zone is created — the image IS the background.
- **Key decisions:**
  - Accept `imageBackgroundColor` prop for finder pattern fill (auto-detection not feasible without canvas dependency)
  - Default to `bgColor` for finder fill when not specified
  - In SVG: render `<image>` full-bleed first, then modules on top
  - In raster: draw image pixels first, then overlay module shapes
- **API surface:**
  ```ts
  logo: {
    src: string;
    width: number;
    height: number;
    position?: 'center' | 'overlay'; // default: 'center'
    imageBackgroundColor?: string;    // used for finder fill in overlay mode
  }
  ```
- **Effort:** High
- **Size impact:** ~2-3 KB gzipped

---

### 3. Circle Finder Patterns

- **Package:** `renderer`
- **What:** Add `'circle'` to `FinderShape`. Renders finder patterns as 3 concentric circles (bullseye style) instead of per-module squares. Outer ring = finder color, middle ring = background color, inner dot = finder color (or custom `finderInnerColor`).
- **Key decisions:**
  - Needs composite rendering path — when shape is `'circle'`, skip per-module finder rendering and draw 3 `<circle>` elements per finder location
  - Radii proportional to 7, 5, 3 modules (outer, middle gap, inner dot)
  - In raster: use `fillCircle` on PixelBuffer for each ring
- **API surface:**
  ```ts
  finderShape: 'square' | 'rounded' | 'circle'
  ```
- **Effort:** Medium
- **Size impact:** ~0.5-1 KB gzipped

---

### 4. Diamond Module Shape

- **Package:** `renderer`
- **What:** Add `'diamond'` to `ModuleShape`. Renders each data module as a rotated 45-degree square (diamond/rhombus). In SVG: `<polygon>` with 4 points (top, right, bottom, left of the module cell). In raster: `isPixelInShape` uses diamond bounds check (manhattan distance from center <= half-size).
- **API surface:**
  ```ts
  shape: 'square' | 'rounded' | 'dots' | 'diamond'
  ```
- **Effort:** Low
- **Size impact:** ~0.3 KB gzipped

---

## Phase 2: Quick Wins — High Value, Low Effort (4 features)

### 5. Transparent Background

- **Package:** `renderer`
- **What:** Allow `bgColor` to accept `'transparent'` or `null`. In SVG, omit the background `<rect>`. In raster, leave the PixelBuffer alpha channel at 0 (already stores RGBA). PNG encoder must write the alpha channel correctly.
- **Changes:**
  - `renderSVG`: skip background rect when transparent
  - `rasterizeMatrix`: skip background fill when transparent
  - Update `bgColor` type: `string | 'transparent'`
  - Validation: skip contrast check when bg is transparent
- **Effort:** Low (~10 lines)
- **Size impact:** ~0 bytes (logic change only)

---

### 6. Module Scale / Gap Control

- **Package:** `renderer`
- **What:** Add `moduleScale?: number` (range 0.5–1.0, default 1.0) to `RenderOptions`. Shrinks each module within its grid cell, creating visible gaps between modules. This creates the "spaced dots" or "loose grid" aesthetic seen in artistic QR codes.
- **Changes:**
  - In `renderModule` and `renderRasterModule`: multiply `size` by scale, offset x/y to center the smaller module within the cell
  - `adjustedSize = size * moduleScale`
  - `offsetX = x + (size - adjustedSize) / 2`
  - `offsetY = y + (size - adjustedSize) / 2`
- **Effort:** Low (~10 lines)
- **Size impact:** ~30 bytes gzipped

---

### 7. Custom Module Renderer Callback

- **Package:** `renderer`
- **What:** Add optional `customModule?: (x, y, size, row, col, moduleType) => string` to `RenderOptions` for SVG output. When provided, call it instead of the built-in `renderModule`. This is the escape hatch — users can supply any SVG shape (stars, hearts, hexagons) without the library needing to bundle them.
- **Changes:**
  - In `renderSVG` module loop: `if (customModule) parts.push(customModule(...)) else parts.push(renderModule(...))`
  - For raster: add `customPixelTest?: (px, py, moduleX, moduleY, moduleSize) => boolean` to control which pixels are filled
- **Effort:** Low-medium (~30 lines)
- **Size impact:** ~100 bytes gzipped

---

### 8. Accessibility (ARIA / alt text)

- **Package:** `react`, `renderer`
- **What:** The React component currently renders a bare `<div>` with `dangerouslySetInnerHTML` and no accessibility attributes. Add `alt` prop, render with `role="img"` and `aria-label`. In SVG output, add `<title>` element inside `<svg>`.
- **Changes:**
  - React `<QRCode />`: add `alt?: string` prop, apply `role="img"`, `aria-label={alt}`
  - `svgDocument()` helper: accept optional title, render `<title>QR Code</title>` inside SVG
  - Default alt text: "QR Code" when not specified
- **Effort:** Low (~15 lines)
- **Size impact:** ~50 bytes gzipped

---

## Phase 3: Feature Expansion (7 features)

### 9. Frame / Border / "Scan Me" Label

- **Package:** `renderer`, `react`
- **What:** Add a decorative frame around the QR code with optional text label (e.g., "Scan Me", "Visit our menu"). Renders as part of the output image — no external compositing needed.
- **Options:**
  ```ts
  frame?: {
    text?: string;           // e.g., "Scan Me"
    textColor?: string;      // default: fgColor
    textPosition?: 'top' | 'bottom';  // default: 'bottom'
    fontSize?: number;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
  }
  ```
- **Key decisions:**
  - SVG: use `<text>` element — font rendering is handled by the browser/viewer
  - Raster: this is hard without a font rasterizer. Options: (a) skip raster text support, (b) embed a tiny bitmap font, (c) require the frame feature for SVG-only output
  - Recommendation: SVG-only for text labels initially; raster gets the border/padding but not text
- **Effort:** Medium
- **Size impact:** ~200-400 bytes gzipped

---

### 10. QR Data Type Helpers (WiFi, vCard, Calendar, SMS, Email, Geo)

- **Package:** New package `@qr-kit/data` or added to `core`
- **What:** Structured builders that produce correctly formatted QR data strings. Users fill in fields, the helper outputs the encoded string.
- **API surface:**
  ```ts
  import { wifi, vcard, event, email, sms, geo } from '@qr-kit/data';

  const wifiStr = wifi({ ssid: 'CafeGuest', password: 's3cret', encryption: 'WPA' });
  // → "WIFI:T:WPA;S:CafeGuest;P:s3cret;;"

  const contactStr = vcard({ name: 'Jane Doe', phone: '+1234567890', email: 'jane@example.com' });
  // → "BEGIN:VCARD\nVERSION:3.0\n..."

  const eventStr = event({ title: 'Launch Party', start: '2026-04-01T18:00', end: '2026-04-01T22:00', location: 'HQ' });
  // → "BEGIN:VEVENT\n..."
  ```
- **Key decisions:**
  - Separate package keeps core/renderer lean and tree-shakeable
  - Pure string output — pass result to `createQR(data, ...)` as usual
  - Validate required fields, escape special characters per each format spec
- **Effort:** Medium
- **Size impact:** ~1-2 KB gzipped (separate package, does not affect core/renderer size)

---

### 11. Finder Inner/Outer Independent Styling

- **Package:** `renderer`
- **What:** Separate control over the finder pattern's outer frame shape/color and inner dot shape/color. This is one of the most visible customization points on a QR code.
- **API surface:**
  ```ts
  finder?: {
    outerShape?: 'square' | 'rounded' | 'circle';
    innerShape?: 'square' | 'rounded' | 'circle' | 'diamond';
    outerColor?: ColorConfig;
    innerColor?: ColorConfig;
  }
  ```
- **Key decisions:**
  - Replaces current `finderShape` and `finderColor` (keep old props as aliases for backward compat)
  - "Outer" = the 7x7 border frame (modules at edges of finder)
  - "Inner" = the 3x3 center block
  - When using composite shapes (circle), render outer circle + bg circle + inner shape
  - The "middle" ring (white gap) always uses bgColor
- **Effort:** Medium
- **Size impact:** ~200-300 bytes gzipped

---

### 12. Style Presets / Themes

- **Package:** `renderer` (or separate entry point)
- **What:** Named preset objects (`Partial<RenderOptions>`) that users spread into their options for instant good-looking results.
- **API surface:**
  ```ts
  import { presets } from '@qr-kit/renderer';

  createQR(data, { ...presets.modernDots, size: 300 });
  createQR(data, { ...presets.classicElegant, size: 300, fgColor: '#1a1a2e' });
  ```
- **Preset examples:**
  - `modernDots` — dots shape, circle finders, 0.8 module scale, rounded border
  - `classicSquare` — square everything, high contrast, no frills
  - `brandFriendly` — rounded modules, circle finders, designed for logo overlay
  - `artistic` — diamond modules, circle finders, 0.7 module scale, designed for overlay mode
  - `minimal` — dots shape, 0.6 module scale, transparent background
- **Effort:** Low (just predefined objects)
- **Size impact:** ~100-200 bytes gzipped (tree-shakeable if separate entry point)

---

### 13. Scan Verification Utility

- **Package:** New utility `@qr-kit/verify` or added to `renderer`
- **What:** Decodes a generated QR code to verify it actually scans and matches the input data. Critical safety net, especially with artistic/overlay modes that push scannability limits.
- **API surface:**
  ```ts
  import { verifyQR } from '@qr-kit/verify';

  const result = createQR('https://example.com', options);
  const verification = await verifyQR(result);
  // { valid: true, decodedData: 'https://example.com', matchesInput: true }
  ```
- **Key decisions:**
  - Use `jsQR` as an optional peer dependency (not bundled)
  - For SVG: convert to canvas internally, then decode
  - For PNG/BMP: decode directly from pixel data
  - Returns structured result with decoded data for user comparison
  - Warn (don't fail) if peer dep is missing
- **Effort:** Medium
- **Size impact:** ~300 bytes gzipped in library (jsQR is ~40 KB but as peer dep, not bundled)

---

### 14. Background Opacity

- **Package:** `renderer`
- **What:** Add `bgOpacity?: number` (0–1, default 1) to `RenderOptions`. Makes the background semi-transparent, useful for overlaying QR codes on photos or colored surfaces.
- **Changes:**
  - SVG: add `opacity` attribute to background rect
  - Raster: multiply alpha channel of background pixels
  - Pairs with transparent background (feature 5) — they address the same compositing need
- **Effort:** Low (~15 lines)
- **Size impact:** ~50 bytes gzipped

---

### 15. Rounded Outer Border

- **Package:** `renderer`
- **What:** Add `borderRadius?: number` to `RenderOptions`. Clips the entire QR output to a rounded rectangle, giving it a card-like or app-icon appearance.
- **Changes:**
  - SVG: wrap content in a `<clipPath>` with a rounded rect, or make the background rect rounded and clip overflow
  - Raster: apply a rounded-rect mask to the final PixelBuffer (geometry code already exists in `PixelBuffer.fillRoundedRect`)
- **Effort:** Low-medium (~30-40 lines)
- **Size impact:** ~80 bytes gzipped

---

## Phase 4: Advanced & Future (5 features)

### 16. Quiet Zone / Margin Color

- **Package:** `renderer`
- **What:** Add `marginColor?: string` (defaults to `bgColor`) to `RenderOptions`. Allows the margin/quiet zone around the QR code to have a different color than the QR background.
- **Changes:**
  - SVG: render an outer rect with `marginColor`, then an inner rect with `bgColor` covering the QR data area
  - Raster: fill full buffer with `marginColor`, then fill inner area with `bgColor`
- **Use case:** White QR on a dark card — quiet zone matches the card color, QR background stays white for contrast
- **Effort:** Low (~5-10 lines)
- **Size impact:** ~0 bytes effectively

---

### 17. Alignment / Timing Pattern Colors

- **Package:** `renderer`
- **What:** Extend the pattern coloring system to support `alignmentColor?: ColorConfig` and `timingColor?: ColorConfig`. Uses the existing `moduleTypes` matrix which already classifies modules by type (DATA=0, FINDER=1, TIMING=2, ALIGNMENT=3, etc.).
- **Changes:**
  - In the module rendering loop, add checks for `moduleTypes[row][col] === 2` (timing) and `=== 3` (alignment)
  - Same pattern as existing `finderColor` logic — copy-paste extension
- **Effort:** Low-medium (~40 lines)
- **Size impact:** ~100 bytes gzipped

---

### 18. SVG Path Optimization

- **Package:** `renderer`
- **What:** Merge adjacent square modules into combined `<path>` elements using a scanline algorithm. Reduces SVG element count by 60-80% for square-shaped modules, improving rendering performance for embedded/resource-constrained environments.
- **Key decisions:**
  - Only applies to `square` shape (dots/diamonds are individual elements by nature)
  - `rounded` can partially benefit if adjacent modules share edges
  - Implement as an optional optimization pass, not a replacement for per-module rendering
- **Effort:** Medium (~80-120 lines)
- **Size impact:** ~200 bytes added to renderer, but generated SVGs shrink significantly

---

### 19. Print-Ready Output (DPI Multiplier)

- **Package:** `renderer`
- **What:** Add `dpi?: number` option that scales the raster output for print. When `dpi: 300` and `size: 256`, the actual pixel output is `256 * (300/72) ≈ 1067px`. SVG output adds `width`/`height` in physical units (mm/in).
- **Changes:**
  - Raster: multiply pixel dimensions by `dpi / 72` (screen DPI baseline)
  - SVG: optionally add `width="Xmm" height="Ymm"` attributes
  - Add `physicalSize?: { width: number; height: number; unit: 'mm' | 'in' }` as an alternative to pixel size
- **Effort:** Medium
- **Size impact:** ~100-150 bytes gzipped

---

### 20. Server-Side / Edge Runtime Validation

- **Package:** All packages
- **What:** Explicitly test, validate, and document that the library works in Node.js, Deno, Bun, Cloudflare Workers, and Vercel Edge. The SVG and raster renderers are already pure JS with no DOM/canvas dependencies — this is primarily a testing/documentation effort.
- **Changes:**
  - Add integration tests running in Node.js and edge runtime simulators
  - Document SSR usage patterns (Next.js App Router, Remix)
  - Verify PNG encoder works without Node `Buffer` (uses `Uint8Array`)
  - Add `@qr-kit/node` convenience package if needed (optional)
- **Effort:** Medium (mostly testing and docs)
- **Size impact:** ~0 bytes (no code changes expected)

---

## Summary


| Phase                 | Features                                                                                      | Total Size Impact    |
| --------------------- | --------------------------------------------------------------------------------------------- | -------------------- |
| Phase 1: Planned Core | #1–4 (download, overlay, circle finder, diamond)                                              | ~3.5-5.5 KB          |
| Phase 2: Quick Wins   | #5–8 (transparent bg, module scale, custom renderer, a11y)                                    | ~0.2 KB              |
| Phase 3: Expansion    | #9–15 (frame, data helpers, finder styling, presets, scan verify, bg opacity, rounded border) | ~2-3.5 KB            |
| Phase 4: Advanced     | #16–20 (margin color, pattern colors, SVG optimization, DPI, SSR)                             | ~0.4-0.6 KB          |
| **Total**             | **20 features**                                                                               | **~6-10 KB gzipped** |


Current library size: ~13.7 KB gzipped (core 7.7 + renderer 5.5 + react 0.5).
Projected final size: ~20-24 KB gzipped (excluding separate packages like `@qr-kit/data` and `@qr-kit/verify`).