# Providers Module

Healthcare provider management, patient queuing, and communication backend.

## Purpose

Manages healthcare provider registration, availability tracking, patient queue management, emergency escalation, and the provider review interface.

## Key Files

- `provider-service.ts` - Provider registration, status management, availability tracking, and metrics collection
- `patient-queue.ts` - Patient queue management for provider review workflows
- `provider-communication.ts` - Communication layer between the system and healthcare providers
- `emergency-escalation.ts` - Handles urgent escalation workflows when critical cases are detected
- `review-interface.ts` - Provider review interface for approving/modifying AI analysis results
- `types.ts` - Provider, ProviderStatus, ProviderType, ProviderMetrics types

## How It Works

1. Providers register via `ProviderService` with their specialization and availability
2. When an analysis requires review, the patient is added to the appropriate provider's queue
3. `EmergencyEscalation` handles critical cases with immediate notification
4. Providers use the `ReviewInterface` to approve, modify, or reject AI analyses
5. Provider metrics (response times, review counts) are tracked for routing optimization

## Dependencies

- `../routing` - Uses provider data for intelligent routing
- `../notifications` - Sends notifications to providers
- Used by `../api` for REST endpoints
