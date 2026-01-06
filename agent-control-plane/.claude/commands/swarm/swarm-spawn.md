# swarm-spawn

Spawn agents in the swarm.

## Usage

```bash
npx gendev swarm spawn [options]
```

## Options

- `--type <type>` - Agent type
- `--count <n>` - Number to spawn
- `--capabilities <list>` - Agent capabilities

## Examples

```bash
npx gendev swarm spawn --type coder --count 3
npx gendev swarm spawn --type researcher --capabilities "web-search,analysis"
```
