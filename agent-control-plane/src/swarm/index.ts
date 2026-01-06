// Swarm Integration - Main export file for QUIC-enabled swarm coordination
// Provides unified interface for multi-agent swarm initialization and management

export {
  QuicCoordinator,
  type QuicCoordinatorConfig,
  type SwarmAgent,
  type SwarmMessage,
  type SwarmState,
  type SwarmStats,
} from './quic-coordinator.js';
export {
  TransportRouter,
  type RouteResult,
  type TransportConfig,
  type TransportProtocol,
  type TransportStats,
} from './transport-router.js';

import { QuicClient } from '../transport/quic.js';
import { logger } from '../utils/logger.js';
import { QuicCoordinator, SwarmAgent } from './quic-coordinator.js';
import { TransportConfig, TransportRouter } from './transport-router.js';

export interface SwarmInitOptions {
  swarmId: string;
  topology: 'mesh' | 'hierarchical' | 'ring' | 'star';
  transport?: 'quic' | 'http2' | 'auto';
  maxAgents?: number;
  quicPort?: number;
  quicHost?: string;
  enableFallback?: boolean;
}

export interface SwarmInstance {
  swarmId: string;
  topology: 'mesh' | 'hierarchical' | 'ring' | 'star';
  transport: 'quic' | 'http2';
  coordinator?: QuicCoordinator;
  router: TransportRouter;
  registerAgent: (agent: SwarmAgent) => Promise<void>;
  unregisterAgent: (agentId: string) => Promise<void>;
  getStats: () => any;
  shutdown: () => Promise<void>;
}

/**
 * Initialize a multi-agent swarm with QUIC transport coordination
 *
 * @description Creates a distributed swarm of AI agents with configurable topology
 * and high-performance QUIC transport. Supports mesh, hierarchical, ring, and star
 * topologies with automatic fallback to HTTP/2 when QUIC is unavailable.
 *
 * @param {SwarmInitOptions} options - Swarm configuration options
 * @param {string} options.swarmId - Unique identifier for the swarm
 * @param {'mesh'|'hierarchical'|'ring'|'star'} options.topology - Agent coordination topology
 * @param {'quic'|'http2'|'auto'} [options.transport='auto'] - Transport protocol (auto-detects QUIC availability)
 * @param {number} [options.maxAgents=10] - Maximum number of agents in the swarm
 * @param {number} [options.quicPort=4433] - Port for QUIC server
 * @param {string} [options.quicHost='localhost'] - Host for QUIC server
 * @param {boolean} [options.enableFallback=true] - Enable HTTP/2 fallback if QUIC unavailable
 *
 * @returns {Promise<SwarmInstance>} Initialized swarm instance with coordination methods
 *
 * @example
 * ```typescript
 * // Initialize mesh topology swarm with QUIC
 * const swarm = await initSwarm({
 *   swarmId: 'coding-swarm',
 *   topology: 'mesh',
 *   transport: 'quic',
 *   maxAgents: 5,
 *   quicPort: 4433
 * });
 *
 * // Register agents
 * await swarm.registerAgent({
 *   id: 'backend-agent',
 *   role: 'worker',
 *   host: 'localhost',
 *   port: 4434,
 *   capabilities: ['nodejs', 'database', 'api']
 * });
 *
 * await swarm.registerAgent({
 *   id: 'frontend-agent',
 *   role: 'worker',
 *   host: 'localhost',
 *   port: 4435,
 *   capabilities: ['react', 'typescript', 'ui']
 * });
 *
 * // Get swarm statistics
 * const stats = await swarm.getStats();
 * console.log(`Active agents: ${stats.coordinatorStats?.agents || 0}`);
 * console.log(`Transport: ${stats.transport}`);
 *
 * // Shutdown when done
 * await swarm.shutdown();
 * ```
 *
 * @example
 * ```typescript
 * // Hierarchical swarm with automatic transport selection
 * const swarm = await initSwarm({
 *   swarmId: 'data-pipeline',
 *   topology: 'hierarchical',
 *   transport: 'auto', // Tries QUIC, falls back to HTTP/2
 *   maxAgents: 20
 * });
 *
 * // Check which transport was selected
 * console.log(`Using transport: ${swarm.transport}`);
 * console.log(`QUIC available: ${swarm.router.isQuicAvailable()}`);
 * ```
 *
 * @throws {Error} If swarm initialization fails or invalid topology specified
 *
 * @since 1.9.0
 *
 * @remarks
 * Topology types:
 * - mesh: All agents communicate with each other (best for < 10 agents)
 * - hierarchical: Tree structure with coordinator nodes (scalable to 100+ agents)
 * - ring: Circular communication pattern (good for pipeline workflows)
 * - star: Central coordinator with worker nodes (simple coordination)
 *
 * QUIC transport benefits:
 * - 30-50% lower latency vs HTTP/2
 * - Multiplexed streams without head-of-line blocking
 * - Connection migration (maintains connections across network changes)
 * - Built-in congestion control
 * - 0-RTT connection establishment
 *
 * Fallback behavior:
 * - transport: 'auto' tries QUIC first, falls back to HTTP/2
 * - transport: 'quic' requires QUIC, throws error if unavailable
 * - transport: 'http2' uses HTTP/2 only
 */
export async function initSwarm(options: SwarmInitOptions): Promise<SwarmInstance> {
  const {
    swarmId,
    topology,
    transport = 'auto',
    maxAgents = 10,
    quicPort = 4433,
    quicHost = 'localhost',
    enableFallback = true,
  } = options;

  logger.info('Initializing swarm', {
    swarmId,
    topology,
    transport,
    maxAgents,
    quicPort,
  });

  // Create transport router configuration
  const transportConfig: TransportConfig = {
    protocol: transport,
    enableFallback,
    quicConfig: {
      host: quicHost,
      port: quicPort,
      maxConnections: maxAgents * 2, // Allow some overhead
    },
    http2Config: {
      host: quicHost,
      port: quicPort + 1000, // HTTP/2 fallback port
      maxConnections: maxAgents * 2,
      secure: true,
    },
  };

  // Initialize transport router
  const router = new TransportRouter(transportConfig);
  await router.initialize();

  const actualProtocol = router.getCurrentProtocol();
  logger.info('Transport initialized', {
    requestedProtocol: transport,
    actualProtocol,
    quicAvailable: router.isQuicAvailable(),
  });

  // Initialize swarm coordinator if using QUIC
  let coordinator: QuicCoordinator | undefined;
  if (actualProtocol === 'quic') {
    coordinator = await router.initializeSwarm(swarmId, topology, maxAgents);
  }

  // Create swarm instance
  const swarm: SwarmInstance = {
    swarmId,
    topology,
    transport: actualProtocol,
    coordinator,
    router,

    async registerAgent(agent: SwarmAgent): Promise<void> {
      if (coordinator) {
        await coordinator.registerAgent(agent);
      } else {
        logger.warn('QUIC coordinator not available, agent registration skipped', {
          agentId: agent.id,
        });
      }
    },

    async unregisterAgent(agentId: string): Promise<void> {
      if (coordinator) {
        await coordinator.unregisterAgent(agentId);
      } else {
        logger.warn('QUIC coordinator not available, agent unregistration skipped', {
          agentId,
        });
      }
    },

    async getStats() {
      return {
        swarmId,
        topology,
        transport: actualProtocol,
        coordinatorStats: coordinator ? (await coordinator.getState()).stats : undefined,
        transportStats: router.getStats(),
        quicAvailable: router.isQuicAvailable(),
      };
    },

    async shutdown(): Promise<void> {
      logger.info('Shutting down swarm', { swarmId });
      await router.shutdown();
      logger.info('Swarm shutdown complete', { swarmId });
    },
  };

  logger.info('Swarm initialized successfully', {
    swarmId,
    topology,
    transport: actualProtocol,
    quicEnabled: coordinator !== undefined,
  });

  return swarm;
}

/**
 * Check if QUIC transport is available on the system
 *
 * @description Tests whether QUIC transport can be initialized successfully.
 * Useful for conditionally enabling QUIC features or displaying system capabilities.
 *
 * @returns {Promise<boolean>} True if QUIC is available, false otherwise
 *
 * @example
 * ```typescript
 * // Check QUIC availability before initializing swarm
 * const hasQuic = await checkQuicAvailability();
 *
 * const swarm = await initSwarm({
 *   swarmId: 'my-swarm',
 *   topology: 'mesh',
 *   transport: hasQuic ? 'quic' : 'http2'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Display system capabilities
 * console.log('Transport capabilities:');
 * console.log(`- QUIC: ${await checkQuicAvailability() ? '✓' : '✗'}`);
 * console.log('- HTTP/2: ✓ (always available)');
 * ```
 *
 * @since 1.9.0
 *
 * @remarks
 * This function performs a lightweight initialization test and immediately
 * shuts down the client. It does not establish any persistent connections.
 */
export async function checkQuicAvailability(): Promise<boolean> {
  try {
    const client = new QuicClient();
    await client.initialize();
    await client.shutdown();
    return true;
  } catch (error) {
    logger.debug('QUIC not available', { error });
    return false;
  }
}
