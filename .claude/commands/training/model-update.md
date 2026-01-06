# model-update

Update neural models with new data.

## Usage

```bash
npx gendev training model-update [options]
```

## Options

- `--model <name>` - Model to update
- `--incremental` - Incremental update
- `--validate` - Validate after update

## Examples

```bash
# Update all models
npx gendev training model-update

# Specific model
npx gendev training model-update --model agent-selector

# Incremental with validation
npx gendev training model-update --incremental --validate
```
