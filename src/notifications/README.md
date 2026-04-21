# Notifications Module

Multi-channel, HIPAA-compliant notification delivery for healthcare providers.

## Purpose

Orchestrates notification delivery across multiple channels (email, SMS, in-app, webhook, WebSocket) with fallback support and audit logging.

## Key Files

- `notification-manager.ts` - Central orchestrator. Initializes configured channels, manages delivery with fallback, maintains audit log.
- `email-notifier.ts` - Email delivery channel
- `sms-notifier.ts` - SMS delivery channel
- `inapp-notifier.ts` - In-app notification channel
- `webhook-notifier.ts` - Webhook delivery for external integrations
- `websocket-notifier.ts` - Real-time WebSocket push notifications
- `types.ts` - INotifier interface, NotificationChannel enum, NotificationConfig, NotificationPayload, NotificationResult

## How It Works

1. `NotificationManager` is initialized with a `NotificationConfig` specifying which channels are enabled
2. Each channel implements the `INotifier` interface
3. On send, the manager tries the primary channel and falls back to alternatives on failure
4. All deliveries are recorded in an audit log for HIPAA compliance

## Dependencies

- Used by `providers` and `api` modules to notify healthcare providers of analysis results and reviews
