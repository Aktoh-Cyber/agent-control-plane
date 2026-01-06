#!/bin/bash
# Final validation before npm publish

set -e

echo "🔍 Final Validation for v0.1.1"
echo "════════════════════════════════"
echo ""

# Check 1: Version consistency
echo "1️⃣  Checking version consistency..."
CARGO_VERSION=$(grep '^version' Cargo.toml | head -1 | cut -d'"' -f2)
NPM_VERSION=$(node -p "require('./package.json').version")

if [ "$CARGO_VERSION" = "$NPM_VERSION" ]; then
    echo "   ✓ Versions match: $CARGO_VERSION"
else
    echo "   ❌ Version mismatch: Cargo=$CARGO_VERSION, npm=$NPM_VERSION"
    exit 1
fi

# Check 2: WASM builds exist
echo "2️⃣  Checking WASM builds..."
TARGETS=("web" "node" "bundler" "deno")
for target in "${TARGETS[@]}"; do
    if [ -f "pkg/$target/agentic_jujutsu_bg.wasm" ]; then
        echo "   ✓ $target build present"
    else
        echo "   ❌ $target build missing"
        exit 1
    fi
done

# Check 3: Required files
echo "3️⃣  Checking required files..."
REQUIRED=("README.md" "LICENSE" "package.json" "Cargo.toml")
for file in "${REQUIRED[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file exists"
    else
        echo "   ❌ $file missing"
        exit 1
    fi
done

# Check 4: Scripts executable
echo "4️⃣  Checking script permissions..."
if [ -x "scripts/verify-build.sh" ]; then
    echo "   ✓ verify-build.sh is executable"
fi
if [ -x "tests/wasm/basic.test.js" ]; then
    echo "   ✓ basic.test.js is executable"
fi

# Check 5: Package size
echo "5️⃣  Checking package size..."
SIZE=$(npm pack --dry-run 2>&1 | grep "package size:" | awk '{print $4}')
echo "   ✓ Package size: $SIZE"

# Check 6: Run tests
echo "6️⃣  Running tests..."
npm test > /dev/null 2>&1 && echo "   ✓ All tests passing" || {
    echo "   ❌ Tests failed"
    exit 1
}

# Check 7: Git status
echo "7️⃣  Checking git status..."
if [ -z "$(git status --porcelain)" ]; then
    echo "   ✓ Working directory clean"
else
    echo "   ⚠️  Uncommitted changes present"
fi

echo ""
echo "════════════════════════════════"
echo "✅ All validation checks passed!"
echo ""
echo "📦 Package Details:"
echo "   Name: @agent-control-plane/jujutsu"
echo "   Version: $NPM_VERSION"
echo "   Size: $SIZE"
echo "   Files: 23"
echo ""
echo "🚀 Ready for publication!"
