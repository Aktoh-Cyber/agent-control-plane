# workflow-create

Create reusable workflow templates.

## Usage

```bash
npx gendev workflow create [options]
```

## Options

- `--name <name>` - Workflow name
- `--from-history` - Create from history
- `--interactive` - Interactive creation

## Examples

```bash
# Create workflow
npx gendev workflow create --name "deploy-api"

# From history
npx gendev workflow create --name "test-suite" --from-history

# Interactive mode
npx gendev workflow create --interactive
```
