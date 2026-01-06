#!/bin/bash
# Type Safety Monitoring Script
# Tracks usage of 'any' types across the codebase

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Type Safety Analysis ===${NC}\n"

# Count total 'any' usages
total_any=$(grep -rn "\bany\b" --include="*.ts" --include="*.tsx" src/ tests/ 2>/dev/null | grep -E "(: any|<any>|as any|Array<any>|Promise<any>|Record<.*any)" | wc -l | tr -d ' ')

echo -e "${BLUE}Total 'any' usages:${NC} $total_any"

# Count by directory
src_any=$(grep -rn "\bany\b" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | grep -E "(: any|<any>|as any|Array<any>|Promise<any>|Record<.*any)" | wc -l | tr -d ' ' || echo "0")
tests_any=$(grep -rn "\bany\b" --include="*.ts" --include="*.tsx" tests/ 2>/dev/null | grep -E "(: any|<any>|as any|Array<any>|Promise<any>|Record<.*any)" | wc -l | tr -d ' ' || echo "0")

echo -e "${BLUE}Source code 'any':${NC} $src_any"
echo -e "${BLUE}Test code 'any':${NC} $tests_any"
echo ""

# Check public APIs (exported functions and classes)
echo -e "${YELLOW}Checking public APIs...${NC}"
public_api_any=$(grep -rn "export.*: any" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l | tr -d ' ' || echo "0")

if [ "$public_api_any" -eq 0 ]; then
    echo -e "${GREEN}✓ No 'any' types in public APIs${NC}"
else
    echo -e "${RED}✗ Found $public_api_any 'any' types in public APIs:${NC}"
    grep -rn "export.*: any" --include="*.ts" --include="*.tsx" src/ 2>/dev/null || true
fi
echo ""

# List top files with most 'any' usage
echo -e "${YELLOW}Top 10 files with 'any' usage:${NC}"
grep -rn "\bany\b" --include="*.ts" --include="*.tsx" src/ tests/ 2>/dev/null | \
  grep -E "(: any|<any>|as any|Array<any>|Promise<any>|Record<.*any)" | \
  cut -d: -f1 | \
  sort | \
  uniq -c | \
  sort -rn | \
  head -10 | \
  while read count file; do
    echo -e "  ${BLUE}$count${NC} - $file"
  done
echo ""

# Check for undocumented 'any' usage
echo -e "${YELLOW}Checking for undocumented 'any' usage...${NC}"
undocumented=0

while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  line_num=$(echo "$line" | cut -d: -f2)

  # Check if there's a comment on the line or line above explaining the 'any'
  prev_line=$((line_num - 1))
  has_comment=$(sed -n "${prev_line}p;${line_num}p" "$file" 2>/dev/null | grep -i "intentional\|any" | grep -c "//" || echo "0")

  if [ "$has_comment" -eq 0 ]; then
    undocumented=$((undocumented + 1))
  fi
done < <(grep -rn "\bany\b" --include="*.ts" src/ 2>/dev/null | grep -E "(: any|<any>|as any)" || true)

if [ "$undocumented" -eq 0 ]; then
    echo -e "${GREEN}✓ All 'any' usages in src/ are documented${NC}"
else
    echo -e "${YELLOW}⚠ Found $undocumented undocumented 'any' usages in src/${NC}"
fi
echo ""

# Historical tracking
HISTORY_FILE="docs/.type-safety-history"
mkdir -p docs

if [ -f "$HISTORY_FILE" ]; then
    last_count=$(tail -1 "$HISTORY_FILE" | cut -d',' -f2)

    if [ "$total_any" -lt "$last_count" ]; then
        echo -e "${GREEN}✓ Progress: Reduced from $last_count to $total_any 'any' usages${NC}"
    elif [ "$total_any" -gt "$last_count" ]; then
        echo -e "${RED}✗ Regression: Increased from $last_count to $total_any 'any' usages${NC}"
    else
        echo -e "${BLUE}No change from last check ($total_any)${NC}"
    fi
fi

# Append to history
echo "$(date +%Y-%m-%d),$total_any,$src_any,$tests_any" >> "$HISTORY_FILE"
echo ""

# Summary and recommendations
echo -e "${BLUE}=== Summary ===${NC}"
echo -e "Total 'any' types: $total_any"
echo -e "Target (50% reduction from 148): 74"
echo -e "Public API 'any': $public_api_any"
echo ""

if [ "$total_any" -le 74 ]; then
    echo -e "${GREEN}✓ Target achieved! (>50% reduction)${NC}"
else
    echo -e "${YELLOW}⚠ Target not yet achieved${NC}"
fi

if [ "$public_api_any" -eq 0 ]; then
    echo -e "${GREEN}✓ Zero 'any' in public APIs achieved!${NC}"
else
    echo -e "${RED}✗ Public APIs still contain 'any'${NC}"
fi

echo ""
echo -e "${BLUE}=== Recommendations ===${NC}"

if [ "$total_any" -gt 50 ]; then
    echo "1. Focus on reducing 'any' in test files"
    echo "2. Consider using 'unknown' for truly unknown types"
    echo "3. Add type guards for runtime validation"
fi

if [ "$public_api_any" -gt 0 ]; then
    echo "1. PRIORITY: Remove 'any' from public APIs"
    echo "2. Use generic constraints instead"
    echo "3. Create specific interfaces for complex types"
fi

echo ""
echo -e "${BLUE}Run 'npm run typecheck' to verify type safety${NC}"

# Exit with error if public APIs contain 'any'
if [ "$public_api_any" -gt 0 ]; then
    exit 1
fi

exit 0
