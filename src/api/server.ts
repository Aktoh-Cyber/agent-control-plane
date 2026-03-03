/**
 * Agent API Server
 *
 * Express + WebSocket server for agent interactions.
 * HTTP: GET /api/health, GET /api/agents, GET /api/agents/:name, POST /api/agents/:name/execute
 * WS:   /api/agents/stream (streaming execution), /api/agents/actions (human-in-the-loop)
 */

import express, { NextFunction, Request, Response } from 'express';
import { createServer, Server as HTTPServer, IncomingMessage } from 'http';
import * as path from 'path';
import { Duplex } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import {
  authMiddleware,
  type AuthRequest,
  type HorsemenIdentity,
} from '../middleware/auth.middleware.js';
import { createComponentLogger } from '../utils/logger.js';
import { ActionQueue } from './action-queue.js';
import { AgentExecutor } from './agent-executor.js';

const logger = createComponentLogger('agent-api-server');

/** Inbound messages on /api/agents/stream. */
export type StreamInbound =
  | { type: 'auth'; token: string }
  | { type: 'execute'; agent: string; task: string; conversationId?: string };

/** Outbound messages on /api/agents/stream. */
export type StreamOutbound =
  | { type: 'chunk'; data: string }
  | { type: 'tool_use'; tool: string; input: Record<string, unknown> }
  | { type: 'complete'; result: Record<string, unknown> }
  | { type: 'error'; message: string }
  | { type: 'auth_ok'; identity: { sub: string; roles: string[] } }
  | { type: 'pong' };

/** Inbound messages on /api/agents/actions. */
export type ActionsInbound =
  | { type: 'auth'; token: string }
  | { type: 'approve'; actionId: string }
  | { type: 'reject'; actionId: string; reason?: string };

/** Outbound messages on /api/agents/actions. */
export type ActionsOutbound =
  | {
      type: 'action_required';
      actionId: string;
      description: string;
      tool: string;
      input: Record<string, unknown>;
    }
  | { type: 'action_resolved'; actionId: string; approved: boolean; reason?: string }
  | { type: 'error'; message: string }
  | { type: 'auth_ok'; identity: { sub: string; roles: string[] } }
  | { type: 'pong' };

export interface AgentServerConfig {
  port: number;
  agentsDir: string;
  heartbeatIntervalMs?: number;
}

type AliveWebSocket = WebSocket & { isAlive: boolean };

export class AgentServer {
  private app: express.Express;
  private httpServer: HTTPServer;
  private streamWss: WebSocketServer;
  private actionsWss: WebSocketServer;
  private actionQueue: ActionQueue;
  private executor: AgentExecutor;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly heartbeatMs: number;
  private wsIdentities: WeakMap<WebSocket, HorsemenIdentity> = new WeakMap();

  constructor(private config: AgentServerConfig) {
    this.heartbeatMs = config.heartbeatIntervalMs ?? 30_000;
    this.app = express();
    this.httpServer = createServer(this.app);
    this.streamWss = new WebSocketServer({ noServer: true });
    this.actionsWss = new WebSocketServer({ noServer: true });
    this.actionQueue = new ActionQueue();
    this.executor = new AgentExecutor(config.agentsDir, this.actionQueue);

    this.app.use(express.json({ limit: '1mb' }));
    this.setupHttpRoutes();
    this.setupUpgradeHandler();
    this.setupStreamWss();
    this.setupActionsWss();
    this.setupActionQueueBroadcast();
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled HTTP error', { error: err });
      res
        .status(500)
        .json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
        });
    });
  }

  private setupHttpRoutes(): void {
    const router = express.Router();

    router.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        connections: { stream: this.streamWss.clients.size, actions: this.actionsWss.clients.size },
        pendingActions: this.actionQueue.size,
      });
    });

    router.get('/agents', authMiddleware, (_req: Request, res: Response) => {
      const agents = this.executor.listAgents().map((a) => ({
        name: a.name,
        type: a.type,
        description: a.description,
        capabilities: a.capabilities,
        priority: a.priority,
        path: a.path,
      }));
      res.json({
        success: true,
        data: agents,
        metadata: {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          count: agents.length,
        },
      });
    });

    router.get('/agents/:name', authMiddleware, (req: Request, res: Response) => {
      const name = req.params.name as string;
      const agent = this.executor.getAgent(name);
      if (!agent) {
        res
          .status(404)
          .json({
            success: false,
            error: { code: 'NOT_FOUND', message: `Agent '${name}' not found` },
          });
        return;
      }
      res.json({
        success: true,
        data: {
          name: agent.name,
          type: agent.type,
          description: agent.description,
          capabilities: agent.capabilities,
          priority: agent.priority,
          path: agent.path,
        },
      });
    });

    router.post('/agents/:name/execute', authMiddleware, async (req: Request, res: Response) => {
      const authReq = req as AuthRequest;
      const name = req.params.name as string;
      const { task, conversationId } = req.body as { task?: string; conversationId?: string };
      if (!task || typeof task !== 'string') {
        res
          .status(400)
          .json({
            success: false,
            error: { code: 'BAD_REQUEST', message: 'Field "task" is required' },
          });
        return;
      }
      try {
        const result = await this.executor.execute(name, task, conversationId ?? uuidv4());
        res.json({
          success: true,
          data: result,
          metadata: {
            requestId: uuidv4(),
            timestamp: new Date().toISOString(),
            userId: authReq.userId,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Execution failed';
        res
          .status(message.includes('not found') ? 404 : 500)
          .json({ success: false, error: { code: 'EXECUTION_ERROR', message } });
      }
    });

    this.app.use('/api', router);
  }

  private setupUpgradeHandler(): void {
    this.httpServer.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      if (url.pathname === '/api/agents/stream') {
        this.streamWss.handleUpgrade(req, socket, head, (ws) =>
          this.streamWss.emit('connection', ws, req)
        );
      } else if (url.pathname === '/api/agents/actions') {
        this.actionsWss.handleUpgrade(req, socket, head, (ws) =>
          this.actionsWss.emit('connection', ws, req)
        );
      } else {
        socket.destroy();
      }
    });
  }

  private setupStreamWss(): void {
    this.streamWss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.authenticateFromQuery(ws, req);
      this.markAlive(ws);
      ws.on('message', (raw: Buffer | string) => this.handleStreamMessage(ws, raw));
      ws.on('close', () => logger.debug('Stream client disconnected'));
      ws.on('error', (err) => logger.error('Stream WebSocket error', { error: err }));
    });
  }

  private handleStreamMessage(ws: WebSocket, raw: Buffer | string): void {
    let msg: StreamInbound;
    try {
      msg = JSON.parse(raw.toString()) as StreamInbound;
    } catch {
      this.wsSend(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    if (msg.type === 'auth') {
      this.authenticateWithToken(ws, msg.token);
      return;
    }
    if (msg.type === 'execute') {
      if (!this.wsIdentities.has(ws) && !this.isDevMode()) {
        this.wsSend(ws, {
          type: 'error',
          message:
            'Authentication required. Send { type: "auth", token: "..." } or use ?token= query param.',
        });
        return;
      }
      this.executeWithStreaming(ws, msg.agent, msg.task, msg.conversationId ?? uuidv4());
      return;
    }
    this.wsSend(ws, {
      type: 'error',
      message: `Unknown message type: ${(msg as { type: string }).type}`,
    });
  }

  private async executeWithStreaming(
    ws: WebSocket,
    agentName: string,
    task: string,
    conversationId: string
  ): Promise<void> {
    const onChunk = (evt: { data: string }) => this.wsSend(ws, { type: 'chunk', data: evt.data });
    const onToolUse = (evt: { tool: string; input: Record<string, unknown> }) =>
      this.wsSend(ws, { type: 'tool_use', tool: evt.tool, input: evt.input });
    const onAction = (evt: {
      actionId: string;
      description: string;
      tool: string;
      input: Record<string, unknown>;
    }) => {
      this.wsSend(ws, {
        type: 'tool_use',
        tool: evt.tool,
        input: { ...evt.input, _actionId: evt.actionId, _description: evt.description },
      });
    };
    this.executor.on('chunk', onChunk);
    this.executor.on('tool_use', onToolUse);
    this.executor.on('action_required', onAction);
    try {
      const result = await this.executor.execute(agentName, task, conversationId);
      this.wsSend(ws, { type: 'complete', result: result as unknown as Record<string, unknown> });
    } catch (err) {
      this.wsSend(ws, {
        type: 'error',
        message: err instanceof Error ? err.message : 'Execution failed',
      });
    } finally {
      this.executor.removeListener('chunk', onChunk);
      this.executor.removeListener('tool_use', onToolUse);
      this.executor.removeListener('action_required', onAction);
    }
  }

  private setupActionsWss(): void {
    this.actionsWss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.authenticateFromQuery(ws, req);
      this.markAlive(ws);

      for (const action of this.actionQueue.listPending()) {
        this.wsSend(ws, {
          type: 'action_required',
          actionId: action.actionId,
          description: action.description,
          tool: action.tool,
          input: action.input,
        });
      }

      ws.on('message', (raw: Buffer | string) => this.handleActionsMessage(ws, raw));
      ws.on('close', () => logger.debug('Actions client disconnected'));
      ws.on('error', (err) => logger.error('Actions WebSocket error', { error: err }));
    });
  }

  private handleActionsMessage(ws: WebSocket, raw: Buffer | string): void {
    let msg: ActionsInbound;
    try {
      msg = JSON.parse(raw.toString()) as ActionsInbound;
    } catch {
      this.wsSend(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    if (msg.type === 'auth') {
      this.authenticateWithToken(ws, msg.token);
      return;
    }

    if (!this.wsIdentities.has(ws) && !this.isDevMode()) {
      this.wsSend(ws, { type: 'error', message: 'Authentication required' });
      return;
    }

    if (msg.type === 'approve') {
      if (this.actionQueue.approveAction(msg.actionId)) {
        this.broadcastToActions({
          type: 'action_resolved',
          actionId: msg.actionId,
          approved: true,
        });
      } else {
        this.wsSend(ws, {
          type: 'error',
          message: `Action '${msg.actionId}' not found or already resolved`,
        });
      }
      return;
    }

    if (msg.type === 'reject') {
      if (this.actionQueue.rejectAction(msg.actionId, msg.reason)) {
        this.broadcastToActions({
          type: 'action_resolved',
          actionId: msg.actionId,
          approved: false,
          reason: msg.reason,
        });
      } else {
        this.wsSend(ws, {
          type: 'error',
          message: `Action '${msg.actionId}' not found or already resolved`,
        });
      }
      return;
    }

    this.wsSend(ws, {
      type: 'error',
      message: `Unknown message type: ${(msg as { type: string }).type}`,
    });
  }

  private setupActionQueueBroadcast(): void {
    this.actionQueue.on(
      'action_proposed',
      (action: {
        actionId: string;
        description: string;
        tool: string;
        input: Record<string, unknown>;
      }) => {
        this.broadcastToActions({
          type: 'action_required',
          actionId: action.actionId,
          description: action.description,
          tool: action.tool,
          input: action.input,
        });
      }
    );
  }

  private broadcastToActions(msg: ActionsOutbound): void {
    for (const client of this.actionsWss.clients) {
      if (client.readyState === WebSocket.OPEN) this.wsSend(client, msg);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const ping = (wss: WebSocketServer) => {
        for (const ws of wss.clients) {
          const alive = ws as AliveWebSocket;
          if (!alive.isAlive) {
            ws.terminate();
            continue;
          }
          alive.isAlive = false;
          ws.ping();
        }
      };
      ping(this.streamWss);
      ping(this.actionsWss);
    }, this.heartbeatMs);
  }

  private authenticateFromQuery(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const token = url.searchParams.get('token');
    if (token) this.authenticateWithToken(ws, token);
  }

  private authenticateWithToken(ws: WebSocket, token: string): void {
    const identity = this.extractIdentityFromToken(token);
    if (identity) {
      this.wsIdentities.set(ws, identity);
      this.wsSend(ws, { type: 'auth_ok', identity: { sub: identity.sub, roles: identity.roles } });
    } else {
      this.wsSend(ws, { type: 'error', message: 'Authentication failed' });
    }
  }

  private markAlive(ws: WebSocket): void {
    (ws as AliveWebSocket).isAlive = true;
    ws.on('pong', () => {
      (ws as AliveWebSocket).isAlive = true;
    });
  }

  private extractIdentityFromToken(token: string): HorsemenIdentity | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payloadPart = parts[1];
      if (!payloadPart) return null;
      const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
      return {
        sub: (payload.sub as string) || '',
        email: (payload.email as string) || '',
        orgId: (payload['custom:organization'] as string) || (payload.tenant as string) || '',
        teamId: (payload['custom:team'] as string) || undefined,
        roles: (payload['cognito:groups'] as string[]) || (payload.roles as string[]) || ['viewer'],
        iat: payload.iat || 0,
        exp: payload.exp || 0,
        rawToken: token,
      };
    } catch {
      return null;
    }
  }

  private isDevMode(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  private wsSend(ws: WebSocket, msg: StreamOutbound | ActionsOutbound): void {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.config.port, () => {
        this.startHeartbeat();
        logger.info('Agent API server started', {
          port: this.config.port,
          agentsDir: this.config.agentsDir,
        });
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.actionQueue.clear();
    for (const ws of this.streamWss.clients) ws.close(1001, 'Server shutting down');
    for (const ws of this.actionsWss.clients) ws.close(1001, 'Server shutting down');
    await new Promise<void>((resolve) => {
      this.streamWss.close(() => {
        this.actionsWss.close(() => {
          this.httpServer.close(() => {
            logger.info('Agent API server stopped');
            resolve();
          });
        });
      });
    });
  }

  getHttpServer(): HTTPServer {
    return this.httpServer;
  }
  getApp(): express.Express {
    return this.app;
  }
  getActionQueue(): ActionQueue {
    return this.actionQueue;
  }
  getExecutor(): AgentExecutor {
    return this.executor;
  }
}

/** Create an AgentServer with sensible defaults. */
export function createAgentServer(overrides?: Partial<AgentServerConfig>): AgentServer {
  return new AgentServer({
    port: parseInt(process.env.AGENT_API_PORT ?? '3001', 10),
    agentsDir: path.resolve(process.cwd(), '.claude', 'agents'),
    heartbeatIntervalMs: 30_000,
    ...overrides,
  });
}
