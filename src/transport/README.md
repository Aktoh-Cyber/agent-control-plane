# Transport Module

QUIC-based transport layer for high-performance agent-to-agent communication within the Agent Control Plane.

## Overview

This module provides a QUIC protocol transport backed by a Rust/WASM implementation (`crates/agent-control-plane-quic/pkg`), with an automatic WebSocket fallback for environments where QUIC is not available.

## Files

| File             | Description                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `quic.ts`        | Core `QuicTransport` class wrapping the Rust/WASM QUIC client. Provides connect, send, receive, request, batch send, and connection pool stats.                          |
| `quic-loader.ts` | Adaptive loader that attempts QUIC and falls back to `WebSocketFallbackTransport`. Exports `loadQuicTransport()`, `isQuicAvailable()`, and `getTransportCapabilities()`. |

## Architecture

```
loadQuicTransport()
  |
  +---> Try:  QuicTransport (Rust/WASM)
  |           - 0-RTT connection establishment
  |           - Stream multiplexing (no head-of-line blocking)
  |           - TLS 1.3 built-in
  |           - Connection pooling
  |
  +---> Catch: WebSocketFallbackTransport
                - Standard WebSocket connections
                - Same API surface
                - Message queue for receive ordering
```

Both transports implement the same interface: `send()`, `receive()`, `request()`, `sendBatch()`, `getStats()`, `close()`.

## Configuration

```typescript
interface QuicTransportConfig {
  serverName?: string; // SNI server name (default: "localhost")
  maxIdleTimeoutMs?: number; // Idle timeout in ms, min 1000 (default: 30000)
  maxConcurrentStreams?: number; // Streams per connection (default: 100)
  enable0Rtt?: boolean; // 0-RTT resumption (default: true)
}
```

## Message Format

All agent messages follow the `AgentMessage` structure:

```typescript
interface AgentMessage {
  id: string;
  type: 'task' | 'result' | 'status' | 'coordination' | 'heartbeat' | string;
  payload: any;
  metadata?: Record<string, any>;
}
```

## Usage

```typescript
import { loadQuicTransport } from './transport/quic-loader';

const transport = await loadQuicTransport({
  serverName: 'agent-proxy.local',
  enable0Rtt: true,
});

await transport.send('127.0.0.1:4433', {
  id: 'task-1',
  type: 'task',
  payload: { action: 'spawn', agentType: 'coder' },
});

const response = await transport.receive('127.0.0.1:4433');
const stats = await transport.getStats();
await transport.close();
```

## Performance

| Metric                | QUIC                       | WebSocket Fallback     |
| --------------------- | -------------------------- | ---------------------- |
| Connection latency    | 0-RTT (50-70% faster)      | Standard TCP handshake |
| Head-of-line blocking | None (stream multiplexing) | Yes                    |
| Encryption            | TLS 1.3 built-in           | Optional TLS 1.2/1.3   |
| Throughput            | Very high                  | High                   |
