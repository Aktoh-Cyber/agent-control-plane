# workflow-execute

Execute saved workflows.

## Usage

```bash
npx gendev workflow execute [options]
```

## Options

- `--name <name>` - Workflow name
- `--params <json>` - Workflow parameters
- `--dry-run` - Preview execution

## Examples

```bash
# Execute workflow
npx gendev workflow execute --name "deploy-api"

# With parameters
npx gendev workflow execute --name "test-suite" --params '{"env": "staging"}'

# Dry run
npx gendev workflow execute --name "deploy-api" --dry-run
```
