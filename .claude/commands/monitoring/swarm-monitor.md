# swarm-monitor

Real-time swarm monitoring.

## Usage

```bash
npx gendev swarm monitor [options]
```

## Options

- `--interval <ms>` - Update interval
- `--metrics` - Show detailed metrics
- `--export` - Export monitoring data

## Examples

```bash
# Start monitoring
npx gendev swarm monitor

# Custom interval
npx gendev swarm monitor --interval 5000

# With metrics
npx gendev swarm monitor --metrics
```
