# MCP Tools Troubleshooting Guide

**Version:** 1.0.0
**Last Updated:** 2025-10-22
**Coverage:** 4 MCP servers, 233+ tools

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues Matrix](#common-issues-matrix)
3. [Per-Server Troubleshooting](#per-server-troubleshooting)
   - [GenDev Issues](#gendev-issues)
   - [AgentDB Issues](#agentdb-issues)
   - [Agentic Cloud Issues](#agentic-cloud-issues)
   - [Agentic Payments Issues](#agentic-payments-issues)
4. [Diagnostic Commands](#diagnostic-commands)
5. [Debug Mode](#debug-mode)
6. [Error Code Reference](#error-code-reference)
7. [Getting Help](#getting-help)
8. [FAQ](#faq)

---

## Quick Diagnostics

**First Steps (run these in order):**

```bash
# 1. Check MCP server installation
claude mcp list

# 2. Verify Claude Code version
claude --version

# 3. Test basic connectivity
npx gendev@alpha --version

# 4. Check environment variables
env | grep -E "(ANTHROPIC|OPENROUTER|GOOGLE)"
```

**Expected output:**

```
gendev (running)
agent-control-plane (optional)
agentic-cloud (optional)
```

If any server is missing or stopped, see [MCP Server Not Found](#1-mcp-server-not-found).

---

## Common Issues Matrix

| Issue                     | Symptoms                   | Cause                 | Quick Fix                 | Detailed Section                         |
| ------------------------- | -------------------------- | --------------------- | ------------------------- | ---------------------------------------- |
| **MCP server not found**  | "Server 'X' not available" | Not installed/started | `claude mcp add <server>` | [§3.1](#31-server-not-installed)         |
| **Authentication failed** | "AUTH_REQUIRED" error      | No login session      | Run login command         | [§3.3](#33-agentic-cloud-authentication) |
| **Tool not available**    | "Unknown tool" error       | Server not started    | Restart MCP server        | [§3.1](#31-server-not-installed)         |
| **Rate limit exceeded**   | "RATE_LIMITED" error       | Too many requests     | Wait or upgrade tier      | [§3.3](#agentic-cloud-rate-limits)       |
| **Invalid parameters**    | "INVALID_PARAMS" error     | Wrong param types     | Check tool docs           | [§6](#error-code-reference)              |
| **Connection timeout**    | No response after 30s      | Network/server issue  | Check network, restart    | [§4.3](#43-network-diagnostics)          |
| **Out of credits**        | "INSUFFICIENT_CREDITS"     | Low balance           | Add credits               | [§3.3](#agentic-cloud-credit-issues)     |
| **Keypair invalid**       | "SIGNATURE_INVALID" error  | Wrong private key     | Regenerate keypair        | [§3.4](#agentic-payments-keypair-issues) |
| **Database locked**       | "SQLITE_BUSY" error        | Concurrent access     | Wait, retry, or restart   | [§3.2](#agentdb-database-issues)         |
| **Sandbox timeout**       | Sandbox unresponsive       | Long-running code     | Increase timeout param    | [§3.3](#agentic-cloud-sandbox-issues)    |

---

## Per-Server Troubleshooting

### 3.1 GenDev Issues

**Server installation and basic operations.**

#### Server Not Installed

**Symptoms:**

```
Error: MCP server 'gendev' not found
```

**Solutions:**

1. **Install GenDev:**

   ```bash
   # Add MCP server
   claude mcp add gendev npx gendev@alpha mcp start

   # Verify installation
   claude mcp list
   ```

2. **Restart Claude Code:**

   ```bash
   # Close and reopen Claude Code
   # Or restart the terminal
   ```

3. **Check npm installation:**

   ```bash
   # Verify gendev is installed
   npm list -g | grep gendev

   # If missing, install globally
   npm install -g @ruvnet/gendev@alpha
   ```

#### Server Not Starting

**Symptoms:**

```
MCP server 'gendev' failed to start
Timeout waiting for server initialization
```

**Solutions:**

1. **Check Node.js version:**

   ```bash
   node --version  # Requires v18+ or v20+
   ```

2. **Clear npm cache:**

   ```bash
   npm cache clean --force
   npm install -g @ruvnet/gendev@alpha
   ```

3. **Check for port conflicts:**

   ```bash
   # GenDev uses ephemeral ports
   # No manual port configuration needed
   ```

4. **View detailed logs:**
   ```bash
   # Enable debug mode (see §5)
   DEBUG=gendev:* npx gendev@alpha mcp start
   ```

#### Swarm Initialization Failures

**Symptoms:**

```javascript
// Returns error
mcp__gendev__swarm_init({ topology: 'mesh' });
// Error: Failed to initialize swarm
```

**Solutions:**

1. **Check topology parameter:**

   ```javascript
   // ✅ Valid topologies
   mcp__gendev__swarm_init({ topology: 'mesh' });
   mcp__gendev__swarm_init({ topology: 'hierarchical' });
   mcp__gendev__swarm_init({ topology: 'ring' });
   mcp__gendev__swarm_init({ topology: 'star' });

   // ❌ Invalid
   mcp__gendev__swarm_init({ topology: 'custom' }); // Not supported
   ```

2. **Check maxAgents limit:**

   ```javascript
   // ✅ Within limits
   mcp__gendev__swarm_init({
     topology: 'mesh',
     maxAgents: 8, // Default: 8, Max: 100
   });

   // ❌ Exceeds limit
   mcp__gendev__swarm_init({
     topology: 'mesh',
     maxAgents: 200, // Error: exceeds max
   });
   ```

3. **Destroy existing swarm:**

   ```javascript
   // Get swarm ID
   const status = mcp__gendev__swarm_status();

   // Destroy if exists
   if (status.swarmId) {
     mcp__gendev__swarm_destroy({
       swarmId: status.swarmId,
     });
   }

   // Retry initialization
   mcp__gendev__swarm_init({ topology: 'mesh' });
   ```

#### Memory Operations Failing

**Symptoms:**

```javascript
// No error, but memory not persisting
mcp__gendev__memory_usage({
  action: 'store',
  key: 'test',
  value: 'data',
});

// Returns empty
mcp__gendev__memory_usage({
  action: 'retrieve',
  key: 'test',
});
```

**Solutions:**

1. **Check action parameter:**

   ```javascript
   // ✅ Valid actions
   ('store', 'retrieve', 'list', 'delete', 'search');

   // ❌ Invalid
   ('save', 'get', 'find'); // Use correct action names
   ```

2. **Verify namespace:**

   ```javascript
   // Namespaces are isolated
   mcp__gendev__memory_usage({
     action: 'store',
     key: 'test',
     namespace: 'project-a', // Stored in namespace
     value: 'data',
   });

   // Won't find it in default namespace
   mcp__gendev__memory_usage({
     action: 'retrieve',
     key: 'test', // Uses 'default' namespace
   });

   // ✅ Correct retrieval
   mcp__gendev__memory_usage({
     action: 'retrieve',
     key: 'test',
     namespace: 'project-a', // Match the namespace
   });
   ```

3. **Check value serialization:**

   ```javascript
   // ✅ Store objects as JSON strings
   mcp__gendev__memory_usage({
     action: 'store',
     key: 'config',
     value: JSON.stringify({ setting: 'value' }),
   });

   // ✅ Retrieve and parse
   const result = mcp__gendev__memory_usage({
     action: 'retrieve',
     key: 'config',
   });
   const config = JSON.parse(result.value);
   ```

---

### 3.2 AgentDB Issues

**Agent memory, learning, and database operations.**

#### Database Initialization

**Symptoms:**

```bash
Error: AgentDB not initialized
SQLITE_CANTOPEN: unable to open database file
```

**Solutions:**

1. **Initialize database:**

   ```bash
   # Create .agentdb directory
   mkdir -p .agentdb

   # Initialize with CLI
   npx agentdb init

   # Or set environment variable
   export AGENTDB_PATH="$(pwd)/.agentdb"
   ```

2. **Check permissions:**

   ```bash
   # Verify write permissions
   ls -la .agentdb/

   # Fix permissions if needed
   chmod 755 .agentdb
   chmod 644 .agentdb/*.db
   ```

3. **Check disk space:**
   ```bash
   df -h .
   # Ensure at least 100MB free
   ```

#### Database Locked

**Symptoms:**

```
SQLITE_BUSY: database is locked
Error: Cannot acquire lock after 5 seconds
```

**Solutions:**

1. **Close other connections:**

   ```bash
   # Find processes using AgentDB
   lsof .agentdb/*.db

   # Kill if necessary (use with caution)
   kill <PID>
   ```

2. **Wait and retry:**

   ```javascript
   // Implement retry logic
   async function retryQuery(fn, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.code === 'SQLITE_BUSY' && i < retries - 1) {
           await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
           continue;
         }
         throw error;
       }
     }
   }

   // Usage
   await retryQuery(() => mcp__agentdb__causal_query({ limit: 10 }));
   ```

3. **Enable WAL mode (if using CLI):**
   ```bash
   # Write-Ahead Logging for better concurrency
   npx agentdb config set wal_mode=ON
   ```

#### Causal Memory Issues

**Symptoms:**

```javascript
// Adding edge fails
mcp__agentdb__causal_add_edge({
  from: 'event1',
  to: 'event2',
  metadata: {},
});
// Error: Invalid edge data
```

**Solutions:**

1. **Validate edge parameters:**

   ```javascript
   // ✅ Valid edge
   mcp__agentdb__causal_add_edge({
     from: 'user_login', // Source event
     to: 'load_dashboard', // Target event
     relation: 'causes', // Relationship type
     confidence: 0.95, // Optional: 0-1
     metadata: {
       // Optional
       latency_ms: 120,
       user_id: 'abc123',
     },
   });

   // ❌ Invalid
   mcp__agentdb__causal_add_edge({
     from: '', // Empty string not allowed
     to: null, // Null not allowed
     confidence: 1.5, // Must be 0-1
   });
   ```

2. **Check for circular dependencies:**

   ```javascript
   // Detect cycles
   const cycles = mcp__agentdb__causal_detect_cycles();

   if (cycles.length > 0) {
     console.log('Circular dependencies found:', cycles);
     // Remove or restructure edges
   }
   ```

3. **Query before adding:**

   ```javascript
   // Check if edge already exists
   const existing = mcp__agentdb__causal_query({
     from: 'event1',
     to: 'event2',
     limit: 1
   });

   if (!existing.edges || existing.edges.length === 0) {
     mcp__agentdb__causal_add_edge({ ... });
   }
   ```

#### Reflexion Memory Issues

**Symptoms:**

```javascript
// Self-critique not working
mcp__agentdb__reflexion_add_trajectory({
  task: 'solve_problem',
  actions: [...],
  outcome: 'failed'
});
// No error, but no learning improvement
```

**Solutions:**

1. **Provide detailed trajectory:**

   ```javascript
   // ✅ Complete trajectory with context
   mcp__agentdb__reflexion_add_trajectory({
     task: 'implement_authentication',
     actions: [
       { step: 1, action: 'research_patterns', duration_ms: 5000 },
       { step: 2, action: 'write_code', duration_ms: 15000 },
       { step: 3, action: 'test_implementation', duration_ms: 8000 },
     ],
     outcome: 'success', // 'success' | 'failed' | 'partial'
     reflection: 'Should have written tests first',
     learned_patterns: ['tdd', 'auth_best_practices'],
     metadata: {
       complexity: 'medium',
       confidence: 0.8,
     },
   });
   ```

2. **Query learning history:**

   ```javascript
   // Check what patterns were learned
   const learnings = mcp__agentdb__reflexion_query({
     task: 'implement_authentication',
     outcome: 'success',
     limit: 10,
   });

   console.log('Learned from past:', learnings);
   ```

3. **Run nightly learner:**

   ```javascript
   // Discover patterns from trajectories
   const patterns = mcp__agentdb__nightly_discover_patterns({
     min_frequency: 3, // Minimum occurrences
     min_confidence: 0.7, // Minimum confidence
     time_window_hours: 24, // Look back period
   });

   console.log('Discovered patterns:', patterns);
   ```

#### Skill Library Issues

**Symptoms:**

```javascript
// Skill not found
mcp__agentdb__skill_retrieve({ skill_id: 'my-skill' });
// Error: Skill not found
```

**Solutions:**

1. **List available skills:**

   ```javascript
   // See all stored skills
   const skills = mcp__agentdb__skill_list({
     category: 'all',
     limit: 100,
   });

   console.log('Available skills:', skills);
   ```

2. **Store skill with complete metadata:**

   ```javascript
   // ✅ Properly formatted skill
   mcp__agentdb__skill_store({
     skill_id: 'authentication_handler',
     name: 'User Authentication Handler',
     description: 'Secure user login with JWT',
     code: `
       async function authenticate(credentials) {
         // Implementation
       }
     `,
     category: 'security',
     tags: ['auth', 'jwt', 'security'],
     usage_count: 0,
     success_rate: 0.0,
     metadata: {
       language: 'javascript',
       dependencies: ['jsonwebtoken', 'bcrypt'],
       author: 'system',
     },
   });
   ```

3. **Update usage metrics:**
   ```javascript
   // Track skill performance
   mcp__agentdb__skill_update_metrics({
     skill_id: 'authentication_handler',
     increment_usage: true,
     success: true, // or false if failed
     execution_time_ms: 150,
   });
   ```

---

### 3.3 Agentic Cloud Issues

**Cloud execution, authentication, and sandbox management.**

#### Agentic Cloud Authentication

**Symptoms:**

```javascript
mcp__agentic - cloud__sandbox_create({ template: 'node' });
// Error: AUTH_REQUIRED - Please login first
```

**Solutions:**

1. **Register (first-time users):**

   ```javascript
   // One-time registration
   mcp__agentic -
     cloud__user_register({
       email: 'user@example.com',
       password: 'secure-password-123',
       full_name: 'John Doe', // Optional
     });

   // Check email for verification link
   ```

2. **Verify email:**

   ```javascript
   // Click link in email, or use token
   mcp__agentic -
     cloud__user_verify_email({
       token: 'verification-token-from-email',
     });
   ```

3. **Login (each session):**

   ```javascript
   // Login after verification
   mcp__agentic -
     cloud__user_login({
       email: 'user@example.com',
       password: 'secure-password-123',
     });

   // Session token is stored automatically
   ```

4. **Check authentication status:**

   ```javascript
   const status =
     mcp__agentic -
     cloud__auth_status({
       detailed: true,
     });

   console.log('Authenticated:', status.authenticated);
   console.log('User ID:', status.user_id);
   console.log('Tier:', status.tier);
   ```

#### Agentic Cloud Rate Limits

**Symptoms:**

```javascript
// After many requests
mcp__agentic - cloud__sandbox_create({ template: 'node' });
// Error: RATE_LIMITED - Too many requests
// { retry_after_ms: 60000 }
```

**Solutions:**

1. **Implement retry logic:**

   ```javascript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.code === 'RATE_LIMITED') {
           const delay = error.details?.retry_after_ms || 1000 * (i + 1);
           console.log(`Rate limited, waiting ${delay}ms...`);
           await new Promise((resolve) => setTimeout(resolve, delay));
           continue;
         }
         throw error;
       }
     }
   }

   // Usage
   await retryWithBackoff(() => mcp__agentic - cloud__sandbox_create({ template: 'node' }));
   ```

2. **Check current limits:**

   ```javascript
   const stats =
     mcp__agentic -
     cloud__user_stats({
       user_id: 'your-user-id',
     });

   console.log('Requests this hour:', stats.requests_this_hour);
   console.log('Limit:', stats.rate_limit);
   console.log('Resets at:', stats.rate_limit_reset);
   ```

3. **Upgrade tier:**

   ```javascript
   // Upgrade to pro tier (higher limits)
   mcp__agentic -
     cloud__user_upgrade({
       user_id: 'your-user-id',
       tier: 'pro', // or 'enterprise'
     });
   ```

4. **Batch operations:**

   ```javascript
   // ❌ INEFFICIENT: Create sandbox per task
   for (const task of tasks) {
     const sandbox = mcp__agentic-cloud__sandbox_create({ ... });
     mcp__agentic-cloud__sandbox_execute({ ... });
     mcp__agentic-cloud__sandbox_delete({ ... });
   }

   // ✅ EFFICIENT: Reuse sandbox
   const sandbox = mcp__agentic-cloud__sandbox_create({ template: 'node' });
   for (const task of tasks) {
     mcp__agentic-cloud__sandbox_execute({
       sandbox_id: sandbox.data.sandbox_id,
       code: task.code
     });
   }
   mcp__agentic-cloud__sandbox_delete({ sandbox_id: sandbox.data.sandbox_id });
   ```

#### Agentic Cloud Credit Issues

**Symptoms:**

```javascript
mcp__agentic-cloud__neural_train({ config: {...}, tier: 'large' });
// Error: INSUFFICIENT_CREDITS - Balance too low
```

**Solutions:**

1. **Check balance:**

   ```javascript
   const balance = mcp__agentic - cloud__check_balance();

   console.log('Current balance:', balance.credits);
   console.log('Reserved:', balance.reserved_credits);
   console.log('Available:', balance.available_credits);
   ```

2. **Add credits:**

   ```javascript
   // Create payment link
   const payment =
     mcp__agentic -
     cloud__create_payment_link({
       amount: 50.0, // $50 USD (minimum $10)
     });

   console.log('Payment URL:', payment.checkout_url);
   // Open URL in browser to complete payment
   ```

3. **Configure auto-refill:**

   ```javascript
   // Auto-add credits when low
   mcp__agentic -
     cloud__configure_auto_refill({
       enabled: true,
       threshold: 10, // Refill when below 10 credits
       amount: 25.0, // Add $25 each time
     });
   ```

4. **Check transaction history:**

   ```javascript
   const history =
     mcp__agentic -
     cloud__get_payment_history({
       limit: 10,
     });

   console.log('Recent transactions:', history);
   ```

#### Agentic Cloud Sandbox Issues

**Symptoms:**

```javascript
// Sandbox creation hangs
mcp__agentic - cloud__sandbox_create({ template: 'node' });
// ... no response after 60 seconds
```

**Solutions:**

1. **Increase timeout:**

   ```javascript
   // Default timeout is 3600s (1 hour)
   mcp__agentic -
     cloud__sandbox_create({
       template: 'node',
       timeout: 7200, // 2 hours
     });
   ```

2. **Check sandbox status:**

   ```javascript
   // List all sandboxes
   const sandboxes =
     mcp__agentic -
     cloud__sandbox_list({
       status: 'all', // 'running' | 'stopped' | 'all'
     });

   console.log('Active sandboxes:', sandboxes);

   // Get specific sandbox
   const status =
     mcp__agentic -
     cloud__sandbox_status({
       sandbox_id: 'sandbox-abc123',
     });

   console.log('Status:', status.state);
   ```

3. **Delete stuck sandboxes:**

   ```javascript
   // Force delete unresponsive sandbox
   mcp__agentic -
     cloud__sandbox_delete({
       sandbox_id: 'sandbox-abc123',
     });
   ```

4. **Use lighter templates:**

   ```javascript
   // ❌ Heavy template (slow start)
   mcp__agentic - cloud__sandbox_create({ template: 'nextjs' });

   // ✅ Light template (fast start)
   mcp__agentic - cloud__sandbox_create({ template: 'base' });
   // Then install only what you need
   ```

5. **Check sandbox logs:**

   ```javascript
   const logs =
     mcp__agentic -
     cloud__sandbox_logs({
       sandbox_id: 'sandbox-abc123',
       lines: 100,
     });

   console.log('Logs:', logs);
   ```

---

### 3.4 Agentic Payments Issues

**Payment authorization, mandates, and cryptographic operations.**

#### Agentic Payments Keypair Issues

**Symptoms:**

```javascript
mcp__agentic-payments__sign_mandate({ mandate: {...}, private_key: 'key' });
// Error: SIGNATURE_INVALID - Invalid private key format
```

**Solutions:**

1. **Generate valid keypair:**

   ```javascript
   // Generate Ed25519 keypair
   const identity =
     mcp__agentic -
     payments__generate_agent_identity({
       include_private_key: true, // IMPORTANT: Store securely!
     });

   console.log('Public Key:', identity.public_key);
   console.log('Private Key:', identity.private_key);

   // ⚠️ SECURITY: Store private_key in secure vault
   // NEVER commit to version control
   // NEVER log in production
   ```

2. **Verify key format:**

   ```javascript
   // Private keys are 64-byte hex strings (128 chars)
   const privateKey = identity.private_key;

   if (!/^[0-9a-f]{128}$/i.test(privateKey)) {
     console.error('Invalid private key format');
   }

   // Public keys are 32-byte hex strings (64 chars)
   const publicKey = identity.public_key;

   if (!/^[0-9a-f]{64}$/i.test(publicKey)) {
     console.error('Invalid public key format');
   }
   ```

3. **Store securely:**

   ```javascript
   // ✅ SECURE: Use environment variables
   process.env.AGENT_PRIVATE_KEY = identity.private_key;

   // ✅ SECURE: Use secrets manager
   await secretsManager.store('agent-private-key', identity.private_key);

   // ❌ INSECURE: Plain file
   fs.writeFileSync('private-key.txt', identity.private_key);

   // ❌ INSECURE: Version control
   git.add('keys.json'); // NEVER DO THIS
   ```

#### Mandate Creation Issues

**Symptoms:**

```javascript
mcp__agentic -
  payments__create_active_mandate({
    agent: 'bot@example.com',
    holder: 'user-id',
    amount: 100,
    currency: 'USD',
    period: 'daily',
  });
// Error: INVALID_PARAMS - Missing required field
```

**Solutions:**

1. **Include all required fields:**

   ```javascript
   // ✅ Complete mandate
   const mandate =
     mcp__agentic -
     payments__create_active_mandate({
       agent: 'shopping-bot@agentics', // REQUIRED
       holder: 'user-public-key-abc123', // REQUIRED
       amount: 12000, // REQUIRED (minor units)
       currency: 'USD', // REQUIRED
       period: 'daily', // REQUIRED
       kind: 'intent', // REQUIRED ('intent' | 'cart')
       expires_at: '2025-12-31T23:59:59Z', // Optional (ISO8601)
       merchant_allow: [
         // Optional
         'amazon.com',
         'bestbuy.com',
       ],
       merchant_block: [], // Optional
     });
   ```

2. **Use correct amount format:**

   ```javascript
   // ✅ CORRECT: Minor units (cents)
   amount: 12000; // $120.00

   // ❌ WRONG: Major units (dollars)
   amount: 120.0; // Will be interpreted as $1.20

   // Conversion helper
   const dollarsToMinorUnits = (dollars) => Math.round(dollars * 100);
   amount: dollarsToMinorUnits(120.0); // 12000
   ```

3. **Validate period:**

   ```javascript
   // ✅ Valid periods
   period: 'single'; // One-time payment
   period: 'daily'; // $X per day
   period: 'weekly'; // $X per week
   period: 'monthly'; // $X per month

   // ❌ Invalid
   period: 'yearly'; // Not supported
   period: 'hourly'; // Not supported
   ```

4. **Validate kind:**

   ```javascript
   // ✅ Intent-based (high-level purchase intent)
   kind: 'intent';

   // ✅ Cart-based (specific line items)
   kind: 'cart';

   // ❌ Invalid
   kind: 'subscription'; // Not supported
   ```

#### Signature Verification Issues

**Symptoms:**

```javascript
mcp__agentic-payments__verify_mandate({ signed_mandate: {...} });
// Error: SIGNATURE_INVALID - Signature verification failed
```

**Solutions:**

1. **Sign mandate correctly:**

   ```javascript
   // Step 1: Create mandate
   const mandate =
     mcp__agentic -
     payments__create_active_mandate({
       agent: 'bot@example.com',
       holder: identity.public_key, // Use public key
       amount: 10000,
       currency: 'USD',
       period: 'single',
       kind: 'intent',
     });

   // Step 2: Sign with private key
   const signed =
     mcp__agentic -
     payments__sign_mandate({
       mandate: mandate,
       private_key: identity.private_key, // Use private key
     });

   // Step 3: Verify signature
   const verification =
     mcp__agentic -
     payments__verify_mandate({
       signed_mandate: signed,
       check_guards: true, // Also check expiration
     });

   console.log('Valid:', verification.valid);
   ```

2. **Check guard conditions:**

   ```javascript
   // Mandate may be valid but expired
   const verification =
     mcp__agentic -
     payments__verify_mandate({
       signed_mandate: signed,
       check_guards: true, // Checks expiration, revocation
     });

   if (!verification.valid) {
     console.log('Reason:', verification.reason);

     if (verification.reason === 'expired') {
       console.log('Mandate expired at:', verification.expired_at);
     }

     if (verification.reason === 'revoked') {
       console.log('Revoked at:', verification.revoked_at);
       console.log('Reason:', verification.revocation_reason);
     }
   }
   ```

3. **Check revocation status:**

   ```javascript
   // List all revoked mandates
   const revocations = mcp__agentic - payments__list_revocations();

   console.log('Revoked mandates:', revocations);

   // Check specific mandate
   const isRevoked = revocations.some((r) => r.mandate_id === signed.mandate_id);

   if (isRevoked) {
     console.log('Mandate was revoked');
   }
   ```

---

## 4. Diagnostic Commands

### 4.1 System Diagnostics

**Check overall system health:**

```bash
# 1. Claude Code version
claude --version
# Expected: v1.x.x or higher

# 2. Node.js version
node --version
# Expected: v18.x.x or v20.x.x

# 3. npm version
npm --version
# Expected: v9.x.x or higher

# 4. Available disk space
df -h .
# Expected: At least 1GB free

# 5. Memory available
free -h
# Expected: At least 512MB free

# 6. Network connectivity
ping -c 3 api.anthropic.com
# Expected: 0% packet loss
```

### 4.2 MCP Server Diagnostics

**Check MCP server health:**

```bash
# 1. List installed servers
claude mcp list

# 2. Check server status
claude mcp status gendev
claude mcp status agentic-cloud
claude mcp status agent-control-plane

# 3. Restart specific server
claude mcp restart gendev

# 4. Restart all servers
claude mcp restart --all

# 5. View server logs
claude mcp logs gendev --tail 50

# 6. Test server connectivity
npx gendev@alpha --version
npx agentic-cloud@latest --version
```

### 4.3 Network Diagnostics

**Check network and API connectivity:**

```bash
# 1. Test API endpoints
curl -I https://api.anthropic.com
curl -I https://agentic-cloud.tafy.io

# 2. Check DNS resolution
nslookup api.anthropic.com
nslookup agentic-cloud.tafy.io

# 3. Test with proxy (if using one)
export HTTPS_PROXY=http://proxy.example.com:8080
curl -I https://api.anthropic.com

# 4. Check SSL certificates
openssl s_client -connect api.anthropic.com:443 -servername api.anthropic.com

# 5. Test websocket connection (for real-time features)
wscat -c wss://agentic-cloud.tafy.io/ws
```

### 4.4 Database Diagnostics

**Check AgentDB health:**

```bash
# 1. Verify database files exist
ls -lh .agentdb/*.db

# 2. Check database integrity
sqlite3 .agentdb/agentdb.db "PRAGMA integrity_check;"
# Expected: ok

# 3. Check database size
du -sh .agentdb/

# 4. List tables
sqlite3 .agentdb/agentdb.db ".tables"

# 5. Check table counts
sqlite3 .agentdb/agentdb.db "
  SELECT 'causal_edges' as table_name, COUNT(*) FROM causal_edges
  UNION ALL
  SELECT 'reflexion_trajectories', COUNT(*) FROM reflexion_trajectories
  UNION ALL
  SELECT 'skill_library', COUNT(*) FROM skill_library;
"

# 6. Vacuum database (optimize)
sqlite3 .agentdb/agentdb.db "VACUUM;"
```

---

## 5. Debug Mode

### 5.1 Enable Debug Logging

**Environment variables:**

```bash
# GenDev debug mode
export DEBUG=gendev:*
export CLAUDE_FLOW_VERBOSE=true

# Agentic Cloud debug mode
export FLOW_NEXUS_DEBUG=true
export FLOW_NEXUS_LOG_LEVEL=debug

# AgentDB debug mode
export AGENTDB_DEBUG=true
export AGENTDB_LOG_SQL=true

# Node.js debug mode
export NODE_DEBUG=*
```

### 5.2 Debug Tool Calls

**Test individual tools with verbose output:**

```javascript
// Enable debug before calling tools
process.env.MCP_DEBUG = 'true';
process.env.MCP_VERBOSE = 'true';

// Test tool call
const result = mcp__gendev__swarm_init({
  topology: 'mesh',
  maxAgents: 8,
});

// Expected debug output:
// [MCP] Connecting to server: gendev
// [MCP] Server connected successfully
// [MCP] Calling tool: swarm_init
// [MCP] Parameters: {"topology":"mesh","maxAgents":8}
// [MCP] Request sent, waiting for response...
// [MCP] Response received in 45ms
// [MCP] Response: {"success":true,"swarmId":"abc123"}
```

### 5.3 Capture Network Logs

**Monitor MCP protocol communication:**

```bash
# 1. Install mitmproxy (optional)
pip install mitmproxy

# 2. Start proxy
mitmweb -p 8080

# 3. Configure Claude Code to use proxy
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080

# 4. Open http://localhost:8081 to view traffic

# 5. Run MCP commands
# All traffic will be visible in mitmweb
```

### 5.4 Debug Sandbox Execution

**Test sandbox code step-by-step:**

```javascript
// 1. Create sandbox with verbose logging
const sandbox =
  mcp__agentic -
  cloud__sandbox_create({
    template: 'node',
    name: 'debug-sandbox',
    env_vars: {
      DEBUG: '*',
      NODE_ENV: 'development',
    },
  });

// 2. Execute with capture_output
const result =
  mcp__agentic -
  cloud__sandbox_execute({
    sandbox_id: sandbox.data.sandbox_id,
    code: `
    console.log('Debug: Starting execution');
    console.error('Debug: Error stream test');
    process.stdout.write('Debug: stdout test\\n');
    process.stderr.write('Debug: stderr test\\n');
    console.log('Debug: Completed');
  `,
    capture_output: true, // Capture stdout/stderr
  });

console.log('Output:', result.output);
console.log('Errors:', result.errors);

// 3. Check sandbox logs
const logs =
  mcp__agentic -
  cloud__sandbox_logs({
    sandbox_id: sandbox.data.sandbox_id,
    lines: 100,
  });

console.log('Full logs:', logs);

// 4. Cleanup
mcp__agentic -
  cloud__sandbox_delete({
    sandbox_id: sandbox.data.sandbox_id,
  });
```

---

## 6. Error Code Reference

### 6.1 Authentication Errors

| Code                 | Description                  | Solution                             |
| -------------------- | ---------------------------- | ------------------------------------ |
| `AUTH_REQUIRED`      | No authentication session    | Run login command                    |
| `AUTH_EXPIRED`       | Session token expired        | Login again                          |
| `AUTH_INVALID`       | Invalid credentials          | Check email/password                 |
| `EMAIL_NOT_VERIFIED` | Email verification pending   | Check email, click verification link |
| `INVALID_TOKEN`      | Bad verification/reset token | Request new token                    |

### 6.2 Parameter Errors

| Code               | Description                     | Solution                               |
| ------------------ | ------------------------------- | -------------------------------------- |
| `INVALID_PARAMS`   | Wrong parameter types/values    | Check tool documentation               |
| `MISSING_PARAM`    | Required parameter not provided | Add missing parameter                  |
| `INVALID_TOPOLOGY` | Unsupported swarm topology      | Use: mesh, hierarchical, ring, star    |
| `INVALID_TEMPLATE` | Unknown sandbox template        | Use: node, python, react, nextjs, base |
| `INVALID_AMOUNT`   | Payment amount out of range     | Check minimum/maximum limits           |

### 6.3 Resource Errors

| Code                   | Description               | Solution                       |
| ---------------------- | ------------------------- | ------------------------------ |
| `RATE_LIMITED`         | Too many requests         | Wait, then retry               |
| `INSUFFICIENT_CREDITS` | Low balance               | Add credits                    |
| `QUOTA_EXCEEDED`       | Exceeded usage quota      | Upgrade tier or wait for reset |
| `SANDBOX_LIMIT`        | Too many active sandboxes | Delete unused sandboxes        |
| `MEMORY_LIMIT`         | Memory usage too high     | Reduce data size or upgrade    |

### 6.4 Server Errors

| Code                  | Description               | Solution                             |
| --------------------- | ------------------------- | ------------------------------------ |
| `SERVER_ERROR`        | Internal server error     | Retry later, report if persists      |
| `SERVICE_UNAVAILABLE` | Server temporarily down   | Wait and retry                       |
| `TIMEOUT`             | Request took too long     | Increase timeout or simplify request |
| `CONNECTION_FAILED`   | Cannot connect to server  | Check network, restart server        |
| `DATABASE_ERROR`      | Database operation failed | Check disk space, restart            |

### 6.5 Database Errors

| Code                   | Description              | Solution                                |
| ---------------------- | ------------------------ | --------------------------------------- |
| `SQLITE_BUSY`          | Database locked          | Wait and retry, close other connections |
| `SQLITE_CANTOPEN`      | Cannot open database     | Check permissions and path              |
| `SQLITE_CORRUPT`       | Database corrupted       | Restore from backup                     |
| `DISK_FULL`            | No disk space            | Free up space                           |
| `CONSTRAINT_VIOLATION` | Unique constraint failed | Check for duplicates                    |

### 6.6 Cryptographic Errors

| Code                | Description                      | Solution                                |
| ------------------- | -------------------------------- | --------------------------------------- |
| `SIGNATURE_INVALID` | Signature verification failed    | Check private key, regenerate if needed |
| `KEYPAIR_MISMATCH`  | Public key doesn't match private | Regenerate keypair                      |
| `MANDATE_EXPIRED`   | Mandate past expiration          | Create new mandate                      |
| `MANDATE_REVOKED`   | Mandate was revoked              | Create new mandate                      |
| `CONSENSUS_FAILED`  | Multi-agent consensus failed     | Check agent keys, retry                 |

---

## 7. Getting Help

### 7.1 GitHub Issues

**Report bugs or request features:**

- **GenDev:** https://github.com/tafyai/gendev/issues
- **Agentic Cloud:** https://github.com/tafyai/agentic-cloud/issues
- **AgentDB:** https://github.com/Aktoh-Cyber/agent-control-plane/issues

**When reporting issues, include:**

1. **Environment:**

   ```
   OS: [e.g., macOS 14.1, Ubuntu 22.04]
   Node.js: [e.g., v20.10.0]
   Claude Code: [e.g., v1.2.0]
   MCP Server: [e.g., gendev@alpha]
   ```

2. **Steps to reproduce:**

   ```
   1. Run command: mcp__gendev__swarm_init({ topology: 'mesh' })
   2. Observe error: ...
   3. Expected: swarm initialized successfully
   ```

3. **Error output:**

   ```
   Error: ...
   Stack trace: ...
   ```

4. **Debug logs:**
   ```bash
   DEBUG=* npx gendev@alpha mcp start
   # Include output
   ```

### 7.2 Documentation

**Reference documentation:**

- **Main docs:** `/workspaces/agent-control-plane/docs/guides/MCP-TOOLS.md`
- **Quick start:** `/workspaces/agent-control-plane/docs/guides/MCP-QUICKSTART.md`
- **Authentication:** `/workspaces/agent-control-plane/docs/guides/MCP-AUTHENTICATION.md`
- **Examples:** `/workspaces/agent-control-plane/docs/guides/MCP-EXAMPLES.md`
- **AgentDB CLI:** `/workspaces/agent-control-plane/docs/agentdb/CLI_GUIDE.md`
- **Architecture:** `/workspaces/agent-control-plane/docs/mcp-tools-architecture.md`

### 7.3 Community Support

**Get help from the community:**

- **Discord:** Join the GenDev community (link in GitHub README)
- **Stack Overflow:** Tag questions with `gendev`, `mcp-tools`, `agentdb`
- **GitHub Discussions:** https://github.com/tafyai/gendev/discussions

### 7.4 Professional Support

**For enterprise support:**

- **Email:** support@ruv.io
- **Agentic Cloud Platform:** https://agentic-cloud.tafy.io/support
- **Enterprise Plans:** Contact for SLA-backed support

---

## 8. FAQ

### 8.1 Installation & Setup

**Q: Do I need all 4 MCP servers?**

A: No. Start with GenDev (core orchestration). Add others as needed:

- **Agentic Cloud:** Cloud execution, sandboxes (requires registration)
- **Agentic Payments:** Payment authorization (requires keypair)
- **AgentDB:** Advanced memory (included in GenDev, but can be standalone)

**Q: Why is gendev@alpha instead of latest?**

A: The alpha release includes cutting-edge features. Use `@latest` for stable releases.

**Q: Can I use MCP tools without Claude Code?**

A: Technically yes (with MCP SDK), but Claude Code provides the best integration.

---

**Q: What's the difference between gendev and agentic-cloud?**

A:

- **GenDev:** Local orchestration, no auth, free
- **Agentic Cloud:** Cloud-based, auth required, free tier + paid

---

### 8.2 Authentication & Security

**Q: Is my Agentic Cloud password secure?**

A: Yes. Passwords are hashed with bcrypt (industry standard). Never stored in plaintext.

---

**Q: How do I rotate my agent identity keypair?**

A:

```javascript
// 1. Generate new keypair
const newIdentity =
  mcp__agentic -
  payments__generate_agent_identity({
    include_private_key: true,
  });

// 2. Revoke old mandates
mcp__agentic -
  payments__revoke_mandate({
    mandate_id: 'old-mandate-id',
    reason: 'Keypair rotation',
  });

// 3. Create new mandates with new keypair
mcp__agentic -
  payments__create_active_mandate({
    holder: newIdentity.public_key,
    // ... other params
  });

// 4. Update stored keypair
// Store newIdentity.private_key securely
```

---

**Q: Can I share my private key between agents?**

A: **NO.** Each agent should have its own keypair. Sharing compromises security.

---

### 8.3 Performance & Optimization

**Q: Why is sandbox creation slow?**

A: Sandboxes provision cloud resources. Use lighter templates or reuse sandboxes:

```javascript
// ❌ SLOW: Heavy template
mcp__agentic - cloud__sandbox_create({ template: 'nextjs' });

// ✅ FAST: Light template
mcp__agentic - cloud__sandbox_create({ template: 'base' });
```

---

**Q: How can I reduce API costs?**

A:

1. **Reuse sandboxes** instead of creating new ones
2. **Batch operations** (store multiple items at once)
3. **Use caching** (check memory before API calls)
4. **Optimize swarm size** (use minimum agents needed)

---

**Q: What's the fastest swarm topology?**

A: Depends on use case:

- **Mesh:** Best for peer-to-peer communication
- **Star:** Best for centralized coordination
- **Hierarchical:** Best for complex workflows
- **Ring:** Best for sequential processing

---

### 8.4 Debugging & Troubleshooting

**Q: How do I know if a tool call succeeded?**

A: Check the response:

```javascript
const result = mcp__gendev__swarm_init({ topology: 'mesh' });

if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error);
}
```

---

**Q: Can I see raw MCP protocol messages?**

A: Yes, enable debug mode:

```bash
export MCP_DEBUG=true
export MCP_VERBOSE=true
```

---

**Q: What if a sandbox becomes unresponsive?**

A:

```javascript
// 1. Check status
mcp__agentic - cloud__sandbox_status({ sandbox_id: 'abc123' });

// 2. Check logs
mcp__agentic - cloud__sandbox_logs({ sandbox_id: 'abc123' });

// 3. Force delete if needed
mcp__agentic - cloud__sandbox_delete({ sandbox_id: 'abc123' });
```

---

### 8.5 Best Practices

**Q: Should I use swarms for every task?**

A: No. Use swarms for:

- Multi-step workflows
- Parallel execution
- Dynamic scaling

Skip for simple single-agent tasks.

---

**Q: How do I persist swarm state across sessions?**

A:

```javascript
// Save state
mcp__gendev__memory_usage({
  action: 'store',
  key: 'swarm-state-abc',
  value: JSON.stringify(swarmState),
  namespace: 'swarms',
});

// Restore state
const saved = mcp__gendev__memory_usage({
  action: 'retrieve',
  key: 'swarm-state-abc',
  namespace: 'swarms',
});
const swarmState = JSON.parse(saved.value);
```

---

**Q: What's the recommended memory namespace strategy?**

A:

- `default`: Temporary data, single session
- `global`: Cross-session, application-wide
- `user-{id}`: Per-user data
- `project-{id}`: Per-project data
- `swarm-{id}`: Per-swarm coordination

---

## 9. Quick Reference

### 9.1 Most Common Issues

1. **"MCP server not found"** → `claude mcp add gendev npx gendev@alpha mcp start`
2. **"AUTH_REQUIRED"** → `mcp__agentic-cloud__user_login({ email, password })`
3. **"RATE_LIMITED"** → Wait and retry, or upgrade tier
4. **"SQLITE_BUSY"** → Close other connections, retry
5. **"INVALID_PARAMS"** → Check tool documentation for correct parameters

### 9.2 Essential Commands

```bash
# Check server status
claude mcp list

# Restart server
claude mcp restart gendev

# View logs
claude mcp logs gendev --tail 50

# Enable debug mode
export DEBUG=gendev:*

# Check database
sqlite3 .agentdb/agentdb.db "PRAGMA integrity_check;"
```

### 9.3 Support Contacts

- **GitHub Issues:** https://github.com/tafyai/gendev/issues
- **Documentation:** `/workspaces/agent-control-plane/docs/guides/`
- **Community:** Discord (link in README)
- **Enterprise:** support@ruv.io

---

**End of Troubleshooting Guide**

**Version:** 1.0.0
**Last Updated:** 2025-10-22
**Next Review:** 2025-11-22
**Status:** ✅ Production Ready
