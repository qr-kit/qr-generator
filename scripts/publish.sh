#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# publish.sh — Build and publish all @qr-kit packages to npm
#
# Usage:
#   ./scripts/publish.sh <otp>       # publish with 2FA code
#   DRY_RUN=1 ./scripts/publish.sh   # dry run (no OTP needed)
# ──────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Load .env if present (for NPM_TOKEN)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Validate NPM_TOKEN
if [ -z "${NPM_TOKEN:-}" ]; then
  echo "❌ NPM_TOKEN is not set. Add it to .env or export it."
  exit 1
fi

# Handle OTP for 2FA
OTP="${1:-}"
if [ -z "$OTP" ] && [ "${DRY_RUN:-}" != "1" ]; then
  read -rp "🔑 Enter your npm 2FA code: " OTP
fi

# Configure npm auth
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "$ROOT_DIR/.npmrc.publish"
NPM_FLAGS="--userconfig $ROOT_DIR/.npmrc.publish"
if [ -n "$OTP" ]; then
  NPM_FLAGS="$NPM_FLAGS --otp=$OTP"
fi

# Packages in dependency order (core first, then dom, then react)
PACKAGES=("packages/core" "packages/renderer" "packages/react")
PACKAGE_NAMES=("@qr-kit/core" "@qr-kit/dom" "@qr-kit/react")

cleanup() {
  # Restore original package.json files (with workspace:* references)
  for pkg in "${PACKAGES[@]}"; do
    if [ -f "$ROOT_DIR/$pkg/package.json.bak" ]; then
      mv "$ROOT_DIR/$pkg/package.json.bak" "$ROOT_DIR/$pkg/package.json"
    fi
  done
  rm -f "$ROOT_DIR/.npmrc.publish"
}
trap cleanup EXIT

# ── Step 1: Copy LICENSE into each package ──
echo ""
echo "📄 Copying LICENSE to packages..."
for pkg in "${PACKAGES[@]}"; do
  cp "$ROOT_DIR/LICENSE" "$ROOT_DIR/$pkg/LICENSE"
  echo "   ✓ $pkg/LICENSE"
done

# ── Step 2: Build all packages ──
echo ""
echo "🔨 Building all packages..."
pnpm -r build
echo "   ✓ Build complete"

# ── Step 3: Resolve workspace:* to real version numbers ──
#   npm publish does NOT resolve workspace:* like pnpm publish does.
#   We replace workspace:* with ^<version> before publishing, then
#   restore the originals on exit via the cleanup trap.
echo ""
echo "🔗 Resolving workspace:* dependencies..."

# Read versions
CORE_VERSION=$(node -p "require('./packages/core/package.json').version")
DOM_VERSION=$(node -p "require('./packages/renderer/package.json').version")

echo "   @qr-kit/core   = $CORE_VERSION"
echo "   @qr-kit/dom    = $DOM_VERSION"

# Back up originals
for pkg in "${PACKAGES[@]}"; do
  cp "$ROOT_DIR/$pkg/package.json" "$ROOT_DIR/$pkg/package.json.bak"
done

# Resolve workspace:* references using node
node -e "
  const fs = require('fs');
  const replacements = {
    '@qr-kit/core': '^${CORE_VERSION}',
    '@qr-kit/dom': '^${DOM_VERSION}',
  };
  const files = [
    '${ROOT_DIR}/packages/renderer/package.json',
    '${ROOT_DIR}/packages/react/package.json',
  ];
  for (const file of files) {
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (!pkg[depType]) continue;
      for (const [name, ver] of Object.entries(pkg[depType])) {
        if (typeof ver === 'string' && ver.startsWith('workspace:') && replacements[name]) {
          pkg[depType][name] = replacements[name];
        }
      }
    }
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  }
  console.log('   ✓ workspace:* resolved to versioned ranges');
"

# ── Step 4: Publish in dependency order ──
echo ""
if [ "${DRY_RUN:-}" = "1" ]; then
  echo "🧪 Dry run — no packages will be published"
  echo ""
fi

for i in "${!PACKAGES[@]}"; do
  pkg="${PACKAGES[$i]}"
  name="${PACKAGE_NAMES[$i]}"

  echo "📦 Publishing $name..."
  cd "$ROOT_DIR/$pkg"

  if [ "${DRY_RUN:-}" = "1" ]; then
    npm publish --access public --dry-run $NPM_FLAGS 2>&1 | sed 's/^/   /'
  else
    npm publish --access public $NPM_FLAGS 2>&1 | sed 's/^/   /'
  fi

  echo "   ✓ $name published"
  echo ""
  cd "$ROOT_DIR"
done

# ── Done ──
echo "✅ All packages published successfully!"
echo ""
echo "   @qr-kit/core   → https://www.npmjs.com/package/@qr-kit/core"
echo "   @qr-kit/dom    → https://www.npmjs.com/package/@qr-kit/dom"
echo "   @qr-kit/react  → https://www.npmjs.com/package/@qr-kit/react"
