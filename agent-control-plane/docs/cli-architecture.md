# AgentDB CLI Architecture

## System Overview

The AgentDB CLI has been refactored from a monolithic 861-line file into a clean, modular architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     agentdb-cli.ts (137 lines)                   │
│                       Main Entry Point                           │
├─────────────────────────────────────────────────────────────────┤
│  • Command-line argument parsing                                │
│  • Database initialization                                      │
│  • Controller initialization (embeddings, graphs, etc.)         │
│  • Route commands to appropriate handlers                       │
│  • Error handling and exit codes                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ├─── Imports ───┐
                     │                │
        ┌────────────▼────────────┐   │
        │   commands/index.ts     │   │
        │   (13 lines)            │   │
        │   Central Export        │   │
        └─────────┬───────────────┘   │
                  │                   │
                  └───────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
┌─────────▼─────────┐ ┌──▼──────────┐ ┌──▼─────────────┐
│   types.ts        │ │  help.ts    │ │ Command        │
│   (41 lines)      │ │  (105 lines)│ │ Modules        │
├───────────────────┤ ├─────────────┤ └────────────────┘
│ • CLIContext      │ │ • CLI help  │         │
│ • Color codes     │ │ • Usage     │         │
│ • Log utilities   │ │ • Examples  │         │
└───────────────────┘ └─────────────┘         │
                                               │
                    ┌──────────────────────────┼─────────────────────┐
                    │                          │                     │
          ┌─────────▼─────────┐   ┌───────────▼──────────┐ ┌───────▼──────────┐
          │   causal.ts       │   │   recall.ts          │ │  learner.ts      │
          │   (173 lines)     │   │   (73 lines)         │ │  (82 lines)      │
          ├───────────────────┤   ├──────────────────────┤ ├──────────────────┤
          │ • Add edges       │   │ • Certificate recall │ │ • Discover edges │
          │ • Experiments     │   │ • Episode retrieval  │ │ • Prune edges    │
          │ • Observations    │   │ • Provenance         │ │ • Automation     │
          │ • Calculate       │   └──────────────────────┘ └──────────────────┘
          │ • Query edges     │
          └───────────────────┘
                    │
          ┌─────────┴─────────────────┬──────────────────┐
          │                           │                  │
┌─────────▼─────────┐   ┌─────────────▼──────┐ ┌───────▼──────────┐
│  reflexion.ts     │   │   skills.ts        │ │  database.ts     │
│  (160 lines)      │   │   (146 lines)      │ │  (42 lines)      │
├───────────────────┤   ├────────────────────┤ ├──────────────────┤
│ • Store episodes  │   │ • Create skills    │ │ • Statistics     │
│ • Retrieve        │   │ • Search skills    │ │ • Management     │
│ • Critique        │   │ • Consolidate      │ └──────────────────┘
│ • Prune           │   │ • Prune skills     │
└───────────────────┘   └────────────────────┘
```

## Data Flow

```
User Command
    │
    ▼
agentdb-cli.ts
    │
    ├─ Parse arguments
    │
    ├─ Initialize context (DB, controllers, embeddings)
    │
    ├─ Route to command handler
    │
    ▼
Command Module (causal, recall, learner, etc.)
    │
    ├─ Validate parameters
    │
    ├─ Execute business logic via controllers
    │
    ├─ Format output
    │
    └─ Return to main
    │
    ▼
Exit with status code
```

## Module Dependencies

```
agentdb-cli.ts
  ├─ Database (better-sqlite3)
  ├─ Controllers
  │   ├─ CausalMemoryGraph
  │   ├─ CausalRecall
  │   ├─ ExplainableRecall
  │   ├─ NightlyLearner
  │   ├─ ReflexionMemory
  │   ├─ SkillLibrary
  │   └─ EmbeddingService
  └─ Command Modules
      ├─ types.ts (shared)
      ├─ causal.ts
      ├─ recall.ts
      ├─ learner.ts
      ├─ reflexion.ts
      ├─ skills.ts
      ├─ database.ts
      └─ help.ts
```

## Initialization Flow

```
1. Parse CLI arguments
2. Check for help flag
3. Initialize Database
   ├─ Open SQLite connection
   ├─ Set performance pragmas
   └─ Load schema if needed
4. Initialize EmbeddingService
   └─ Load model (all-MiniLM-L6-v2)
5. Initialize Controllers
   ├─ CausalMemoryGraph
   ├─ ExplainableRecall
   ├─ CausalRecall (depends on embeddings, graph, explainable)
   ├─ NightlyLearner (depends on embeddings, graph)
   ├─ ReflexionMemory (depends on embeddings)
   └─ SkillLibrary (depends on embeddings)
6. Create CLIContext
7. Route to command handler
8. Execute command
9. Clean exit
```

## Command Handler Pattern

All command modules follow this consistent pattern:

```typescript
// Individual command functions
async function commandAction(ctx: CLIContext, params: CommandParams): Promise<void> {
  // 1. Log header
  log.header('Action description');

  // 2. Validate and process
  const result = ctx.controller.method(params);

  // 3. Format output
  console.log(formatResult(result));

  // 4. Log success
  log.success('Completion message');
}

// Main handler function
export async function handleCommands(
  ctx: CLIContext,
  subcommand: string,
  args: string[]
): Promise<void> {
  if (subcommand === 'action1') {
    await commandAction(ctx, parseArgs(args));
  } else if (subcommand === 'action2') {
    await commandAction2(ctx, parseArgs(args));
  } else {
    log.error(`Unknown subcommand: ${subcommand}`);
    throw new Error(`Unknown subcommand: ${subcommand}`);
  }
}
```

## Error Handling Strategy

```
User Input
    │
    ▼
Argument Parsing
    │
    ├─ Invalid? → printHelp() + exit(1)
    │
    ▼
Command Routing
    │
    ├─ Unknown? → log.error() + printHelp() + exit(1)
    │
    ▼
Command Execution
    │
    ├─ Error? → Throw with message
    │
    ▼
Main Catch Block
    │
    ├─ log.error(message)
    └─ exit(1)
```

## Testing Strategy

### Unit Tests (Recommended)

- Test each command module independently
- Mock CLIContext with test data
- Verify command parameter parsing
- Test error conditions

### Integration Tests

- Test full CLI with real database
- Verify command chaining
- Test help output
- Verify exit codes

### Example Test Structure

```typescript
describe('causal commands', () => {
  let ctx: CLIContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should add causal edge', async () => {
    await causalAddEdge(ctx, {
      cause: 'A',
      effect: 'B',
      uplift: 0.5,
    });
    expect(ctx.causalGraph.addEdge).toHaveBeenCalled();
  });
});
```

## Extension Points

### Adding New Commands

1. Create new module in `commands/` directory
2. Export handler function
3. Add export to `commands/index.ts`
4. Import handler in `agentdb-cli.ts`
5. Add routing logic in `main()`
6. Update help text in `help.ts`

### Example: Adding `admin` commands

```typescript
// commands/admin.ts
export async function handleAdminCommands(
  ctx: CLIContext,
  subcommand: string,
  args: string[]
): Promise<void> {
  // Implementation
}

// commands/index.ts
export * from './admin.js';

// agentdb-cli.ts
import { handleAdminCommands } from './commands/admin.js';

// In main():
} else if (command === 'admin') {
  await handleAdminCommands(ctx, subcommand, args.slice(2));
}
```

## Performance Considerations

### Database Optimization

- WAL mode enabled for concurrent access
- NORMAL synchronous mode for speed
- 64MB cache size for performance

### Memory Management

- Single database connection
- Reuse embedding service
- Lazy controller initialization possible

### Scalability

- Each command module can be parallelized
- Database operations are synchronous
- Embedding operations cached

## Security Considerations

### Input Validation

- All arguments parsed and validated
- SQL injection prevented by prepared statements
- File path validation in schema loading

### Error Messages

- No sensitive information in error output
- Generic error messages to user
- Detailed errors logged internally

## Maintenance Guidelines

### Code Style

- Max 200 lines per module (except specialized commands)
- Consistent error handling
- Clear function naming
- Type-safe parameters

### Documentation

- JSDoc comments on public functions
- README for new features
- Update help text for new commands
- Architecture diagrams for major changes

### Version Control

- Keep backup files for major refactors
- Tag releases with version numbers
- Document breaking changes
- Maintain changelog

## Conclusion

This modular architecture provides:

- Clear separation of concerns
- Easy testing and maintenance
- Simple extension mechanism
- Type safety throughout
- Consistent error handling
- Professional code organization

All modules are under 200 lines, making the codebase maintainable and easy to understand.
