# @qr-kit/core

Zero-dependency QR code generation engine. ISO/IEC 18004 compliant with encoding, Reed-Solomon error correction, and matrix construction.

**7.7 KB gzipped. Zero dependencies.**

## Install

```bash
npm install @qr-kit/core
```

> Most users should install `@qr-kit/dom` or `@qr-kit/react` instead, which include this package automatically and provide rendering capabilities.

## Quick Start

```ts
import { generateQR } from '@qr-kit/core';

const qr = generateQR({ data: 'https://example.com' });

console.log(qr.matrix);          // 2D boolean matrix
console.log(qr.version);         // QR version (1-40)
console.log(qr.errorCorrection); // 'L' | 'M' | 'Q' | 'H'
console.log(qr.mode);            // 'numeric' | 'alphanumeric' | 'byte'
console.log(qr.size);            // matrix dimension
console.log(qr.moduleTypes);     // module type map (data, finder, timing, etc.)
```

## Options

```ts
const qr = generateQR({
  data: 'https://example.com',
  errorCorrection: 'H',  // 'L' | 'M' | 'Q' | 'H' (default: 'M')
  version: 5,             // force specific version (default: auto)
  minVersion: 3,          // minimum version to use (default: 1)
});
```

## Error Correction Levels

| Level | Recovery | Use Case |
|-------|----------|----------|
| `L` | ~7% | Maximum data capacity |
| `M` | ~15% | Default, balanced |
| `Q` | ~25% | Higher reliability |
| `H` | ~30% | Required when using logos |

## Data Helpers

Format structured data for common QR use cases:

### WiFi

```ts
import { formatWifi } from '@qr-kit/core';

const data = formatWifi({
  ssid: 'MyNetwork',
  password: 'secret123',
  encryption: 'WPA',  // 'WPA' | 'WEP' | 'nopass'
  hidden: false,
});

const qr = generateQR({ data });
```

### vCard (Contact)

```ts
import { formatVCard } from '@qr-kit/core';

const data = formatVCard({
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  email: 'john@example.com',
  organization: 'Acme Corp',
  url: 'https://example.com',
});
```

### Calendar Event

```ts
import { formatCalendarEvent } from '@qr-kit/core';

const data = formatCalendarEvent({
  title: 'Team Meeting',
  start: new Date('2025-03-15T10:00:00'),
  end: new Date('2025-03-15T11:00:00'),
  location: 'Room 42',
  description: 'Weekly sync',
});
```

### SMS

```ts
import { formatSMS } from '@qr-kit/core';

const data = formatSMS({
  phone: '+1234567890',
  message: 'Hello!',
});
```

### Email

```ts
import { formatEmail } from '@qr-kit/core';

const data = formatEmail({
  to: 'hello@example.com',
  subject: 'Hello',
  body: 'Hi there!',
});
```

### Geolocation

```ts
import { formatGeo } from '@qr-kit/core';

const data = formatGeo({
  latitude: 37.7749,
  longitude: -122.4194,
});
```

## Caching

`generateQR` caches results for identical inputs. Clear the cache if needed:

```ts
import { clearQRCache } from '@qr-kit/core';

clearQRCache();
```

## Module Types

The `moduleTypes` matrix identifies what each module represents, useful for custom rendering:

```ts
import { MODULE_TYPE } from '@qr-kit/core';

MODULE_TYPE.DATA          // 0 - data modules
MODULE_TYPE.FINDER        // 1 - finder patterns
MODULE_TYPE.TIMING        // 2 - timing patterns
MODULE_TYPE.ALIGNMENT     // 3 - alignment patterns
MODULE_TYPE.FORMAT_INFO   // 4 - format information
MODULE_TYPE.VERSION_INFO  // 5 - version information
MODULE_TYPE.DARK_MODULE   // 6 - fixed dark module
MODULE_TYPE.SEPARATOR     // 7 - finder separators
MODULE_TYPE.FINDER_INNER  // 8 - inner finder dot
```

## Error Handling

```ts
import { generateQR, DataTooLongError, InvalidVersionError, InvalidInputError } from '@qr-kit/core';

try {
  const qr = generateQR({ data: veryLongString });
} catch (e) {
  if (e instanceof DataTooLongError) {
    // Data exceeds QR capacity
  }
  if (e instanceof InvalidVersionError) {
    // Invalid version number
  }
  if (e instanceof InvalidInputError) {
    // Invalid input data
  }
}
```

## Related Packages

| Package | Description |
|---------|-------------|
| [`@qr-kit/dom`](https://www.npmjs.com/package/@qr-kit/dom) | Multi-format renderer (SVG, PNG, BMP, Canvas, Data URI) |
| [`@qr-kit/react`](https://www.npmjs.com/package/@qr-kit/react) | React component and hook |

## License

MIT
