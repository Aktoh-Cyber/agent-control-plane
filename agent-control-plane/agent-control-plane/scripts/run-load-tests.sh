#!/bin/bash
# Load Testing Execution Script
# Comprehensive script to run all load tests with K6

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPORTS_DIR="tests/load/reports"
SCENARIOS_DIR="tests/load/scenarios"
BASE_URL="${BASE_URL:-http://localhost:3000}"
K6_VERSION="${K6_VERSION:-latest}"

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if K6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "K6 is not installed"
        echo ""
        echo "Install K6:"
        echo "  macOS:   brew install k6"
        echo "  Linux:   sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list && sudo apt-get update && sudo apt-get install k6"
        echo "  Windows: choco install k6"
        echo "  Docker:  docker pull grafana/k6:${K6_VERSION}"
        echo ""
        exit 1
    fi

    local version=$(k6 version)
    print_success "K6 installed: $version"
}

# Check if API is accessible
check_api() {
    print_info "Checking API availability at $BASE_URL..."

    if curl -f -s "$BASE_URL/health" > /dev/null 2>&1; then
        print_success "API is accessible at $BASE_URL"
        return 0
    else
        print_error "API is not accessible at $BASE_URL"
        print_warning "Please ensure the server is running before starting load tests"
        return 1
    fi
}

# Run a specific test scenario
run_test() {
    local test_name=$1
    local test_file=$2
    local output_file="${REPORTS_DIR}/${test_name}-$(date +%Y%m%d-%H%M%S).json"
    local html_report="${REPORTS_DIR}/${test_name}-report.html"

    print_header "Running: $test_name"

    print_info "Test file: $test_file"
    print_info "Output: $output_file"
    print_info "Start time: $(date)"

    # Run K6 test
    if BASE_URL="$BASE_URL" k6 run \
        --out json="$output_file" \
        --summary-export="${REPORTS_DIR}/${test_name}-summary.json" \
        "$test_file"; then

        print_success "$test_name completed successfully"

        # Generate HTML report if k6-reporter is available
        if command -v k6-to-junit &> /dev/null; then
            k6-to-junit "$output_file" > "${REPORTS_DIR}/${test_name}-junit.xml"
            print_success "JUnit report generated"
        fi

        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Run baseline tests
run_baseline() {
    print_header "BASELINE PERFORMANCE TESTS"
    print_info "Establishing performance baselines (7 minutes)"

    run_test "baseline-performance" "$SCENARIOS_DIR/baseline-performance.js"
}

# Run API load tests
run_api_load() {
    print_header "API LOAD TESTS"
    print_info "Testing API endpoints under load (29 minutes)"

    run_test "api-load" "$SCENARIOS_DIR/api-load.js"
}

# Run swarm load tests
run_swarm_load() {
    print_header "SWARM OPERATIONS LOAD TESTS"
    print_info "Testing multi-agent coordination under load (29 minutes)"

    run_test "swarm-load" "$SCENARIOS_DIR/swarm-load.js"
}

# Run stress tests
run_stress() {
    print_header "STRESS TESTS"
    print_info "Pushing system to limits (25 minutes)"
    print_warning "This test will intentionally overload the system"

    run_test "stress-test" "$SCENARIOS_DIR/stress-test.js"
}

# Run memory leak detection
run_memory_leak() {
    print_header "MEMORY LEAK DETECTION"
    print_info "Long-running soak test (70 minutes)"
    print_warning "This is a 1-hour test - consider running separately"

    read -p "Do you want to run the memory leak test? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_test "memory-leak" "$SCENARIOS_DIR/memory-leak.js"
    else
        print_info "Skipping memory leak test"
    fi
}

# Generate summary report
generate_summary() {
    print_header "GENERATING SUMMARY REPORT"

    local summary_file="${REPORTS_DIR}/summary-$(date +%Y%m%d-%H%M%S).md"

    cat > "$summary_file" << EOF
# Load Test Summary Report

**Generated:** $(date)
**Base URL:** $BASE_URL

## Test Results

EOF

    # Parse summary files
    for summary in "$REPORTS_DIR"/*-summary.json; do
        if [ -f "$summary" ]; then
            local test_name=$(basename "$summary" -summary.json)

            echo "### $test_name" >> "$summary_file"
            echo "" >> "$summary_file"

            # Extract key metrics using jq if available
            if command -v jq &> /dev/null; then
                echo "\`\`\`" >> "$summary_file"
                jq -r '.metrics | to_entries[] | "\(.key): \(.value.values | to_entries[] | "\(.key)=\(.value)")"' "$summary" >> "$summary_file" 2>/dev/null || echo "Error parsing metrics" >> "$summary_file"
                echo "\`\`\`" >> "$summary_file"
            else
                echo "Install jq for detailed metrics parsing" >> "$summary_file"
            fi

            echo "" >> "$summary_file"
        fi
    done

    print_success "Summary report generated: $summary_file"
}

# Store results in hive memory
store_results() {
    print_header "STORING RESULTS IN HIVE MEMORY"

    if ! command -v npx &> /dev/null; then
        print_warning "npx not found, skipping hive memory storage"
        return
    fi

    # Store test completion status
    npx gendev@alpha hooks memory-store \
        --key "hive/testing/load/status" \
        --value "{\"status\":\"completed\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"tests_run\":$(ls -1 "$REPORTS_DIR"/*-summary.json 2>/dev/null | wc -l)}" \
        --namespace "coordination" 2>/dev/null || true

    # Store baseline results
    if [ -f "$REPORTS_DIR/baseline-performance-summary.json" ]; then
        npx gendev@alpha hooks memory-store \
            --key "hive/testing/load/baseline" \
            --value "$(cat "$REPORTS_DIR/baseline-performance-summary.json")" \
            --namespace "coordination" 2>/dev/null || true

        print_success "Baseline results stored in hive memory"
    fi

    # Store bottlenecks found
    local bottlenecks="[]"
    if [ -f "$REPORTS_DIR/stress-test-summary.json" ]; then
        bottlenecks=$(jq -c '[.metrics | to_entries[] | select(.key | contains("bottleneck")) | {name: .key, value: .value}]' "$REPORTS_DIR/stress-test-summary.json" 2>/dev/null || echo "[]")

        npx gendev@alpha hooks memory-store \
            --key "hive/testing/load/bottlenecks" \
            --value "$bottlenecks" \
            --namespace "coordination" 2>/dev/null || true

        print_success "Bottleneck data stored in hive memory"
    fi

    print_success "Results stored in hive coordination memory"
}

# Main menu
show_menu() {
    print_header "AGENTIC-FLOW LOAD TESTING SUITE"

    echo "Select test suite to run:"
    echo ""
    echo "  1) Baseline Performance Tests (7 min)"
    echo "  2) API Load Tests (29 min)"
    echo "  3) Swarm Load Tests (29 min)"
    echo "  4) Stress Tests (25 min)"
    echo "  5) Memory Leak Detection (70 min)"
    echo "  6) Run All Tests (except memory leak)"
    echo "  7) Run All Tests (including memory leak)"
    echo "  8) Quick Test (baseline only)"
    echo "  9) Exit"
    echo ""
    read -p "Enter choice [1-9]: " choice

    case $choice in
        1) run_baseline ;;
        2) run_api_load ;;
        3) run_swarm_load ;;
        4) run_stress ;;
        5) run_memory_leak ;;
        6)
            run_baseline
            run_api_load
            run_swarm_load
            run_stress
            ;;
        7)
            run_baseline
            run_api_load
            run_swarm_load
            run_stress
            run_memory_leak
            ;;
        8) run_baseline ;;
        9) exit 0 ;;
        *) print_error "Invalid choice"; show_menu ;;
    esac
}

# Parse command line arguments
parse_args() {
    case "${1:-}" in
        baseline)
            run_baseline
            ;;
        api)
            run_api_load
            ;;
        swarm)
            run_swarm_load
            ;;
        stress)
            run_stress
            ;;
        memory-leak|soak)
            run_memory_leak
            ;;
        all)
            run_baseline
            run_api_load
            run_swarm_load
            run_stress
            ;;
        full)
            run_baseline
            run_api_load
            run_swarm_load
            run_stress
            run_memory_leak
            ;;
        --help|-h)
            echo "Usage: $0 [baseline|api|swarm|stress|memory-leak|all|full]"
            echo ""
            echo "Options:"
            echo "  baseline     - Run baseline performance tests only"
            echo "  api          - Run API load tests only"
            echo "  swarm        - Run swarm load tests only"
            echo "  stress       - Run stress tests only"
            echo "  memory-leak  - Run memory leak detection only"
            echo "  all          - Run all tests except memory leak"
            echo "  full         - Run all tests including memory leak"
            echo "  (no args)    - Show interactive menu"
            echo ""
            echo "Environment Variables:"
            echo "  BASE_URL     - API base URL (default: http://localhost:3000)"
            echo "  K6_VERSION   - K6 version for Docker (default: latest)"
            echo ""
            exit 0
            ;;
        "")
            show_menu
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
}

# Main execution
main() {
    print_header "LOAD TEST SETUP"

    # Pre-flight checks
    check_k6

    if ! check_api; then
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Parse arguments or show menu
    parse_args "$@"

    # Post-test operations
    generate_summary
    store_results

    print_header "LOAD TESTING COMPLETE"
    print_success "All tests finished successfully"
    print_info "Reports available in: $REPORTS_DIR"
}

# Run main
main "$@"
