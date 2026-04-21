# Consent Module

Patient consent management with HIPAA compliance.

## Purpose

Manages the full lifecycle of patient consent: creation, validation, revocation, and audit. Enforces authorization rules and data sharing controls.

## Key Files

- `consent-manager.ts` - Core consent lifecycle (create, validate, revoke). Indexes consents by patient ID for fast lookup.
- `authorization-service.ts` - Validates provider authorization to access patient data based on active consents
- `data-sharing-controls.ts` - Granular controls for what data can be shared with whom
- `hipaa-compliance.ts` - HIPAA-specific compliance checks and validation rules
- `types.ts` - Consent, ConsentStatus, ConsentType definitions

## How It Works

1. Consent records are created via `ConsentManager` and indexed by patient
2. Before any data access, `AuthorizationService` checks for valid active consent
3. `DataSharingControls` enforce field-level access restrictions
4. `HIPAACompliance` validates all operations meet regulatory requirements

## Dependencies

- Used by the `api` and `providers` modules for access control
