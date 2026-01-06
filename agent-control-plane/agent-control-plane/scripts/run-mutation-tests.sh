#!/bin/bash

###############################################################################
# Mutation Testing Execution Script
#
# Runs Stryker.js mutation testing with intelligent strategies:
# - Incremental mutation for speed
# - Critical path prioritization
# - Hive Mind coordination
# - Comprehensive reporting
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MUTATION_DIR="${PROJECT_ROOT}/test-reports/mutation"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${MUTATION_DIR}/mutation-run-${TIMESTAMP}.log"

# Hive Mind coordination
HIVE_MEMORY_KEY="hive/testing/mutation"
SESSION_ID="mutation-${TIMESTAMP}"

echo -e "${BLUE}🧬 Mutation Testing with Stryker.js${NC}"
echo "=================================================="
echo "Session ID: ${SESSION_ID}"
echo "Project: agent-control-plane"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Create directories
mkdir -p "${MUTATION_DIR}"
mkdir -p "${MUTATION_DIR}/archives"

# Pre-task hook - Notify Hive Mind
echo -e "${YELLOW}📡 Coordinating with Hive Mind...${NC}"
npx gendev@alpha hooks pre-task \
  --description "Starting mutation testing analysis" \
  --task-id "${SESSION_ID}" 2>/dev/null || echo "Hooks not available, continuing..."

# Store session start in memory
npx gendev@alpha hooks notify \
  --message "Mutation testing started: ${SESSION_ID}" 2>/dev/null || true

# Function to run mutation testing
run_mutation_test() {
  local mode=$1
  local target=$2
  local config=${3:-"stryker.conf.json"}

  echo -e "${BLUE}🔬 Running ${mode} mutation testing...${NC}"
  echo "Target: ${target}"
  echo "Config: ${config}"
  echo ""

  # Run Stryker
  if npx stryker run --mutate "${target}" 2>&1 | tee -a "${LOG_FILE}"; then
    echo -e "${GREEN}✓ Mutation testing completed${NC}"
    return 0
  else
    echo -e "${RED}✗ Mutation testing failed${NC}"
    return 1
  fi
}

# Function to analyze mutation report
analyze_mutation_report() {
  local report_file="${MUTATION_DIR}/mutation-report.json"

  if [ ! -f "${report_file}" ]; then
    echo -e "${YELLOW}⚠ Mutation report not found${NC}"
    return 1
  fi

  echo -e "${BLUE}📊 Analyzing mutation results...${NC}"

  # Extract key metrics using Node.js
  node -e "
    const fs = require('fs');
    const report = JSON.parse(fs.readFileSync('${report_file}', 'utf8'));

    const metrics = {
      totalMutants: report.files ? Object.values(report.files).reduce((sum, file) => sum + (file.mutants?.length || 0), 0) : 0,
      killed: report.files ? Object.values(report.files).reduce((sum, file) => sum + (file.mutants?.filter(m => m.status === 'Killed').length || 0), 0) : 0,
      survived: report.files ? Object.values(report.files).reduce((sum, file) => sum + (file.mutants?.filter(m => m.status === 'Survived').length || 0), 0) : 0,
      timeout: report.files ? Object.values(report.files).reduce((sum, file) => sum + (file.mutants?.filter(m => m.status === 'Timeout').length || 0), 0) : 0,
      noCoverage: report.files ? Object.values(report.files).reduce((sum, file) => sum + (file.mutants?.filter(m => m.status === 'NoCoverage').length || 0), 0) : 0
    };

    metrics.mutationScore = metrics.totalMutants > 0
      ? ((metrics.killed / (metrics.totalMutants - metrics.timeout - metrics.noCoverage)) * 100).toFixed(2)
      : 0;

    console.log(JSON.stringify(metrics, null, 2));
  " > "${MUTATION_DIR}/mutation-metrics-${TIMESTAMP}.json"

  # Display metrics
  cat "${MUTATION_DIR}/mutation-metrics-${TIMESTAMP}.json"
}

# Function to identify weak spots
identify_weak_spots() {
  local report_file="${MUTATION_DIR}/mutation-report.json"

  echo -e "${BLUE}🎯 Identifying weak test coverage...${NC}"

  node -e "
    const fs = require('fs');
    const report = JSON.parse(fs.readFileSync('${report_file}', 'utf8'));

    const weakSpots = [];

    if (report.files) {
      Object.entries(report.files).forEach(([filePath, fileData]) => {
        const survived = fileData.mutants?.filter(m => m.status === 'Survived') || [];
        const noCoverage = fileData.mutants?.filter(m => m.status === 'NoCoverage') || [];

        if (survived.length > 0 || noCoverage.length > 0) {
          weakSpots.push({
            file: filePath,
            survived: survived.length,
            noCoverage: noCoverage.length,
            total: fileData.mutants?.length || 0,
            mutators: [...new Set([...survived, ...noCoverage].map(m => m.mutatorName))]
          });
        }
      });
    }

    // Sort by worst coverage
    weakSpots.sort((a, b) => (b.survived + b.noCoverage) - (a.survived + a.noCoverage));

    console.log('## Weak Test Coverage Areas\\n');
    weakSpots.slice(0, 10).forEach(spot => {
      console.log(\`### \${spot.file}\`);
      console.log(\`- Survived mutants: \${spot.survived}\`);
      console.log(\`- No coverage: \${spot.noCoverage}\`);
      console.log(\`- Total mutants: \${spot.total}\`);
      console.log(\`- Weak mutators: \${spot.mutators.join(', ')}\`);
      console.log('');
    });
  " > "${MUTATION_DIR}/weak-spots-${TIMESTAMP}.md"

  cat "${MUTATION_DIR}/weak-spots-${TIMESTAMP}.md"
}

# Function to store results in Hive Mind
store_in_hive() {
  local metrics_file="${MUTATION_DIR}/mutation-metrics-${TIMESTAMP}.json"

  if [ ! -f "${metrics_file}" ]; then
    echo -e "${YELLOW}⚠ Metrics file not found, skipping Hive storage${NC}"
    return 1
  fi

  echo -e "${BLUE}💾 Storing results in Hive Mind memory...${NC}"

  # Read metrics
  local metrics=$(cat "${metrics_file}")

  # Store in memory using hooks
  npx gendev@alpha hooks post-task \
    --task-id "${SESSION_ID}" \
    --memory-key "${HIVE_MEMORY_KEY}/latest" \
    --data "${metrics}" 2>/dev/null || echo "Could not store in Hive memory"

  # Archive historical data
  npx gendev@alpha hooks post-task \
    --task-id "${SESSION_ID}" \
    --memory-key "${HIVE_MEMORY_KEY}/history/${TIMESTAMP}" \
    --data "${metrics}" 2>/dev/null || true

  echo -e "${GREEN}✓ Results stored in Hive Mind${NC}"
}

# Main execution
main() {
  echo -e "${BLUE}Starting mutation testing workflow...${NC}\n"

  # Step 1: Run mutation tests on critical security code
  if run_mutation_test "security" "agent-control-plane/src/security/**/*.ts"; then
    echo -e "${GREEN}✓ Security mutation tests passed${NC}\n"
  else
    echo -e "${RED}✗ Security mutation tests failed${NC}\n"
  fi

  # Step 2: Analyze results
  if analyze_mutation_report; then
    echo -e "${GREEN}✓ Analysis complete${NC}\n"
  fi

  # Step 3: Identify weak spots
  identify_weak_spots

  # Step 4: Store in Hive Mind
  store_in_hive

  # Step 5: Generate summary
  echo ""
  echo -e "${BLUE}=================================================="
  echo "📋 Mutation Testing Summary"
  echo -e "==================================================${NC}"
  echo ""
  echo "📁 Reports location: ${MUTATION_DIR}"
  echo "📄 Log file: ${LOG_FILE}"
  echo "📊 HTML Report: ${MUTATION_DIR}/mutation-report.html"
  echo "🎯 Weak spots: ${MUTATION_DIR}/weak-spots-${TIMESTAMP}.md"
  echo ""

  # Check thresholds
  local mutation_score=$(node -e "
    const fs = require('fs');
    const metrics = JSON.parse(fs.readFileSync('${MUTATION_DIR}/mutation-metrics-${TIMESTAMP}.json', 'utf8'));
    console.log(metrics.mutationScore);
  " 2>/dev/null || echo "0")

  echo "🧬 Mutation Score: ${mutation_score}%"

  if (( $(echo "$mutation_score >= 80" | bc -l) )); then
    echo -e "${GREEN}✓ Mutation score meets threshold (80%)${NC}"
    exit_code=0
  else
    echo -e "${YELLOW}⚠ Mutation score below threshold (80%)${NC}"
    exit_code=1
  fi

  # Post-task hook
  npx gendev@alpha hooks post-task \
    --task-id "${SESSION_ID}" 2>/dev/null || true

  # Archive the report
  if [ -f "${MUTATION_DIR}/mutation-report.html" ]; then
    cp "${MUTATION_DIR}/mutation-report.html" "${MUTATION_DIR}/archives/mutation-report-${TIMESTAMP}.html"
    cp "${MUTATION_DIR}/mutation-report.json" "${MUTATION_DIR}/archives/mutation-report-${TIMESTAMP}.json"
  fi

  echo ""
  echo -e "${BLUE}🏁 Mutation testing complete!${NC}"

  exit $exit_code
}

# Run main function
main "$@"
