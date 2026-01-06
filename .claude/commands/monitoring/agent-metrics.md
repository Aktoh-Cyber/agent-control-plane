# agent-metrics

View agent performance metrics.

## Usage

```bash
npx gendev agent metrics [options]
```

## Options

- `--agent-id <id>` - Specific agent
- `--period <time>` - Time period
- `--format <type>` - Output format

## Examples

```bash
# All agents metrics
npx gendev agent metrics

# Specific agent
npx gendev agent metrics --agent-id agent-001

# Last hour
npx gendev agent metrics --period 1h
```
