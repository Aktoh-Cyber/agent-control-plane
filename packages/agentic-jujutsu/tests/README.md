# Agentic-Jujutsu Test Suite

Comprehensive testing infrastructure for the agentic-jujutsu library.

## 📋 Test Organization

```
tests/
├── unit/                # Unit tests for individual modules
│   ├── config_tests.rs
│   ├── types_tests.rs
│   ├── operations_tests.rs
│   ├── error_tests.rs
│   └── wrapper_tests.rs
├── integration/         # Integration tests for workflows
│   └── wrapper_tests.rs
├── property/            # Property-based tests with proptest
│   ├── operations_properties.rs
│   └── types_properties.rs
├── wasm/                # WASM-specific tests
│   └── wasm_bindings.rs
└── mocks/               # Mock data and utilities
    ├── mod.rs
    └── jj_output_mocks.rs
```

## 🚀 Running Tests

### Run All Tests

```bash
cd packages/agentic-jujutsu
cargo test --all-features
```

### Run Specific Test Suites

**Unit Tests:**

```bash
cargo test --lib --all-features
```

**Integration Tests:**

```bash
cargo test --test '*' --all-features
```

**Property-Based Tests:**

```bash
PROPTEST_CASES=1000 cargo test --test '*properties*' --all-features
```

**WASM Tests:**

```bash
wasm-pack test --node --all-features
```

**Documentation Tests:**

```bash
cargo test --doc --all-features
```

### Run Specific Test

```bash
cargo test test_operation_creation --all-features -- --nocapture
```

## 📊 Coverage Reports

### Generate HTML Coverage Report

```bash
./scripts/coverage.sh
```

This generates an HTML report at `coverage/index.html`.

### Coverage Requirements

- **Statements:** >80%
- **Branches:** >75%
- **Functions:** >80%
- **Lines:** >80%

## ⚡ Performance Benchmarks

### Run All Benchmarks

```bash
cargo bench --all-features
```

### Run Specific Benchmark

```bash
cargo bench operation_creation --all-features
```

### Benchmark Compilation Only (CI)

```bash
cargo bench --no-run --all-features
```

## 🧪 Test Types

### 1. Unit Tests

Test individual functions and modules in isolation.

**Example:**

```rust
#[test]
fn test_config_default() {
    let config = JJConfig::default();
    assert_eq!(config.jj_path, "jj");
}
```

### 2. Integration Tests

Test interactions between multiple components.

**Example:**

```rust
#[test]
fn test_wrapper_full_workflow() {
    let mut wrapper = JJWrapper::with_config(JJConfig::default());
    // Test complete workflow
}
```

### 3. Property-Based Tests

Use proptest to verify properties hold for random inputs.

**Example:**

```rust
proptest! {
    #[test]
    fn test_serialization_roundtrip(op in operation_strategy()) {
        let json = serde_json::to_string(&op).unwrap();
        let deserialized: JJOperation = serde_json::from_str(&json).unwrap();
        assert_eq!(op.id, deserialized.id);
    }
}
```

### 4. WASM Tests

Test WASM bindings in browser/Node.js environment.

**Example:**

```rust
#[wasm_bindgen_test]
fn test_wasm_config() {
    let config = JJConfig::new();
    assert_eq!(config.jj_path, "jj");
}
```

### 5. Benchmarks

Measure performance of critical operations.

**Example:**

```rust
fn benchmark_operation_creation(c: &mut Criterion) {
    c.bench_function("create_operation", |b| {
        b.iter(|| JJOperation::new(...));
    });
}
```

## 🔧 Test Utilities

### Mock Data

Located in `tests/mocks/`, provides realistic test data:

```rust
use crate::mocks::*;

let wrapper = mock_wrapper();
let log = mock_operation_log(10);
let ops = mock_operations(5);
```

### Test Helpers

```rust
// Create test configuration
let config = JJConfig::default()
    .with_timeout(5000)
    .with_max_log_entries(50);

// Create test wrapper
let wrapper = JJWrapper::with_config(config);
```

## 📝 Writing New Tests

### Unit Test Template

```rust
#[test]
fn test_feature_name() {
    // Arrange
    let input = create_test_input();

    // Act
    let result = function_under_test(input);

    // Assert
    assert_eq!(result, expected_output);
}
```

### Property Test Template

```rust
proptest! {
    #[test]
    fn test_property_name(input in strategy()) {
        // Verify property holds for all inputs
        assert!(property_holds(input));
    }
}
```

### Integration Test Template

```rust
#[test]
fn test_integration_scenario() {
    // Setup
    let mut system = setup_test_system();

    // Execute workflow
    system.step1();
    system.step2();

    // Verify end state
    assert_eq!(system.state(), expected_state);
}
```

## 🐛 Debugging Tests

### Run with output

```bash
cargo test -- --nocapture
```

### Run single threaded

```bash
cargo test -- --test-threads=1
```

### Show all output

```bash
cargo test -- --show-output
```

### Increase proptest iterations

```bash
PROPTEST_CASES=10000 cargo test
```

## 📊 Coverage Analysis

### View Coverage by Module

```bash
./scripts/coverage.sh
# Open coverage/index.html
```

### Module Coverage Targets

- `config.rs`: 95%+
- `types.rs`: 95%+
- `operations.rs`: 90%+
- `wrapper.rs`: 85%+
- `error.rs`: 90%+

## 🔄 Continuous Integration

Tests run automatically on:

- Push to `main`, `develop`, or `feature/**` branches
- Pull requests to `main` or `develop`

See `.github/workflows/test.yml` for CI configuration.

## 📈 Test Metrics

Current test statistics (update after running tests):

- **Total Tests:** 150+
- **Unit Tests:** 80+
- **Integration Tests:** 20+
- **Property Tests:** 30+
- **WASM Tests:** 15+
- **Benchmarks:** 12+

## 🎯 Success Criteria

- ✅ All tests pass on CI/CD
- ✅ 90%+ code coverage
- ✅ Zero test warnings
- ✅ Benchmarks establish baselines
- ✅ WASM tests pass in browser
- ✅ Property tests find no bugs

## 🤝 Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure >90% coverage for new code
3. Add property tests for data structures
4. Update this README with new test categories
5. Run full test suite before PR

## 📚 Resources

- [Rust Testing Book](https://doc.rust-lang.org/book/ch11-00-testing.html)
- [Proptest Documentation](https://docs.rs/proptest/)
- [Criterion Benchmarking](https://docs.rs/criterion/)
- [wasm-bindgen-test](https://rustwasm.github.io/wasm-bindgen/wasm-bindgen-test/)
