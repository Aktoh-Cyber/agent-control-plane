/**
 * Medical MCP Server - Main Entry Point
 * Exports all components for both SSE and STDIO transports
 */

// Types
export * from './types';

// Tools
export { CitationVerifyTool } from './tools/citation-verify';
export { ConfidenceScoreTool } from './tools/confidence-score';
export { KnowledgeSearchTool } from './tools/knowledge-search';
export { MedicalAnalyzeTool } from './tools/medical-analyze';
export { MedicalVerifyTool } from './tools/medical-verify';
export { ProviderNotifyTool } from './tools/provider-notify';

// Anti-hallucination features
export { CitationValidator } from './anti-hallucination/citation-validator';
export { ConfidenceMonitor } from './anti-hallucination/confidence-monitor';
export { EmergencyEscalationHandler } from './anti-hallucination/emergency-escalation';
export { ProviderWorkflow } from './anti-hallucination/provider-workflow';

// AgentDB integration
export { AgentDBIntegration } from './agentdb-integration';

// Transports (for programmatic use)
// Note: For CLI usage, run the transport files directly:
// - SSE: node src/mcp/transports/sse.js
// - STDIO: node src/mcp/transports/stdio.js
