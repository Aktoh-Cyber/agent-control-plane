# Routing Module

Priority and severity routing system for intelligent patient query triage.

## Purpose

Routes patient queries to appropriate providers based on emergency detection and severity classification. Handles escalation for critical cases.

## Key Files

- `emergency-detector.ts` - Detects emergency conditions from patient queries using keyword matching with weighted scoring (life-threatening symptoms, urgent indicators)
- `severity-classifier.ts` - Classifies query severity using weighted multi-factor scoring: symptom severity (40%), urgency (30%), risk factors (20%), patient history (10%)
- `escalation-router.ts` - Routes queries to providers based on severity level and emergency status
- `provider-matcher.ts` - Matches patients to appropriate providers based on specialization and availability
- `types.ts` - Severity levels, emergency signals, scoring types

## How It Works

1. `EmergencyDetector` scans query text for emergency keywords (chest pain, stroke, etc.) with weighted scoring
2. `SeverityClassifier` computes a composite severity score across four dimensions
3. `EscalationRouter` uses both signals to determine routing: emergency cases go to immediate escalation, high severity to priority queue, etc.
4. `ProviderMatcher` selects the best available provider for the case

## Dependencies

- `../providers/types` (PatientQuery type)
