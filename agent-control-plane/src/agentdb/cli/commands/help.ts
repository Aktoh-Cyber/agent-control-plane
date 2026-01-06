/**
 * Help text and documentation for AgentDB CLI
 */
import { colors } from './types.js';

export function printHelp(): void {
  console.log(`
${colors.bright}${colors.cyan}█▀█ █▀▀ █▀▀ █▄░█ ▀█▀ █▀▄ █▄▄
█▀█ █▄█ ██▄ █░▀█ ░█░ █▄▀ █▄█${colors.reset}

${colors.bright}${colors.cyan}AgentDB CLI - Frontier Memory Features${colors.reset}

${colors.bright}USAGE:${colors.reset}
  agentdb <command> <subcommand> [options]

${colors.bright}CAUSAL COMMANDS:${colors.reset}
  agentdb causal add-edge <cause> <effect> <uplift> [confidence] [sample-size]
    Add a causal edge manually

  agentdb causal experiment create <name> <cause> <effect>
    Create a new A/B experiment

  agentdb causal experiment add-observation <experiment-id> <is-treatment> <outcome> [context]
    Record an observation (is-treatment: true/false)

  agentdb causal experiment calculate <experiment-id>
    Calculate uplift and statistical significance

  agentdb causal query [cause] [effect] [min-confidence] [min-uplift] [limit]
    Query causal edges with filters

${colors.bright}RECALL COMMANDS:${colors.reset}
  agentdb recall with-certificate <query> [k] [alpha] [beta] [gamma]
    Retrieve episodes with causal utility and provenance certificate
    Defaults: k=12, alpha=0.7, beta=0.2, gamma=0.1

${colors.bright}LEARNER COMMANDS:${colors.reset}
  agentdb learner run [min-attempts] [min-success-rate] [min-confidence] [dry-run]
    Discover causal edges from episode patterns
    Defaults: min-attempts=3, min-success-rate=0.6, min-confidence=0.7

  agentdb learner prune [min-confidence] [min-uplift] [max-age-days]
    Remove low-quality or old causal edges
    Defaults: min-confidence=0.5, min-uplift=0.05, max-age-days=90

${colors.bright}REFLEXION COMMANDS:${colors.reset}
  agentdb reflexion store <session-id> <task> <reward> <success> [critique] [input] [output] [latency-ms] [tokens]
    Store episode with self-critique

  agentdb reflexion retrieve <task> [k] [min-reward] [only-failures] [only-successes]
    Retrieve relevant past episodes

  agentdb reflexion critique-summary <task> [only-failures]
    Get aggregated critique lessons

  agentdb reflexion prune [max-age-days] [max-reward]
    Clean up old or low-value episodes

${colors.bright}SKILL COMMANDS:${colors.reset}
  agentdb skill create <name> <description> [code]
    Create a reusable skill

  agentdb skill search <query> [k]
    Find applicable skills by similarity

  agentdb skill consolidate [min-attempts] [min-reward] [time-window-days]
    Auto-create skills from successful episodes (defaults: 3, 0.7, 7)

  agentdb skill prune [min-uses] [min-success-rate] [max-age-days]
    Remove underperforming skills (defaults: 3, 0.4, 60)

${colors.bright}DATABASE COMMANDS:${colors.reset}
  agentdb db stats
    Show database statistics

${colors.bright}ENVIRONMENT:${colors.reset}
  AGENTDB_PATH    Database file path (default: ./agentdb.db)

${colors.bright}EXAMPLES:${colors.reset}
  # Reflexion: Store and retrieve episodes
  agentdb reflexion store "session-1" "implement_auth" 0.95 true "Used OAuth2"
  agentdb reflexion retrieve "authentication" 10 0.8
  agentdb reflexion critique-summary "bug_fix" true

  # Skills: Create and search
  agentdb skill create "jwt_auth" "Generate JWT tokens" "code here..."
  agentdb skill search "authentication" 5
  agentdb skill consolidate 3 0.7 7

  # Causal: Add edges and run experiments
  agentdb causal add-edge "add_tests" "code_quality" 0.25 0.95 100
  agentdb causal experiment create "test-coverage-quality" "test_coverage" "bug_rate"
  agentdb causal experiment add-observation 1 true 0.15
  agentdb causal experiment calculate 1

  # Retrieve with causal utility
  agentdb recall with-certificate "implement authentication" 10

  # Discover patterns automatically
  agentdb learner run 3 0.6 0.7

  # Get database stats
  agentdb db stats
`);
}
