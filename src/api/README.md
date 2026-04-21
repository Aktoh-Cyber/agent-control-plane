# API Module

Express-based REST API with WebSocket support for the Medical Analysis system.

## Purpose

Provides the HTTP and WebSocket interface for submitting medical analyses, retrieving results, managing provider reviews, and accessing learning metrics.

## Key Files

- `index.ts` - `MedicalAnalysisAPI` class: Express server setup, route definitions, WebSocket handling
- `server.ts` - Server startup and configuration
- `agent-executor.ts` - Agent execution pipeline
- `medical-api.ts` - Medical-specific API helpers
- `action-queue.ts` - Queues actions for async processing
- `tool-factory-client.ts` - Client for the tool factory service

## REST Endpoints

| Method | Path                   | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| GET    | `/api/health`          | Health check                         |
| POST   | `/api/analyze`         | Submit symptoms for medical analysis |
| GET    | `/api/analysis/:id`    | Retrieve analysis results            |
| POST   | `/api/provider/review` | Submit provider review decision      |
| POST   | `/api/provider/notify` | Notify provider about an analysis    |
| GET    | `/api/metrics`         | Get learning metrics                 |

## WebSocket

Real-time analysis progress updates. Clients receive `analysis_update` messages with status, progress percentage, and current step.

## Security

- Helmet for HTTP security headers
- CORS with configurable origins
- Rate limiting: 100 requests/minute per IP
- Auth middleware on all `/api/` routes

## Dependencies

- `../middleware` - Auth and logging middleware
- `../services` - MedicalAnalysisService, AntiHallucinationService, AgentDBLearningService
- `../types` - Request/response type definitions
