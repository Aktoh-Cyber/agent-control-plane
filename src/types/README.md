# Types Module

TypeScript type definitions for the Agent Control Plane's medical analysis system.

## Overview

This module defines the complete type hierarchy for the ACP's medical AI analysis pipeline, including patient data, diagnosis, anti-hallucination scoring, knowledge base structures, provider workflows, and learning patterns.

## Files

| File               | Description                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `medical.ts`       | Core data types: `PatientData`, `VitalSigns`, `LabResult`, `MedicalAnalysis`, `Citation`, `RiskFactor` |
| `medical.types.ts` | Extended type definitions covering the full analysis lifecycle                                         |

## Type Categories

### Core Analysis

- `MedicalQuery` -- Inbound analysis request with symptoms, history, and priority level
- `AnalysisResult` -- Full analysis output with diagnosis, recommendations, confidence scoring, citations, and status tracking through provider review
- `Diagnosis` -- Individual diagnosis with ICD-10 code, probability, differential diagnoses, supporting evidence, and contradictions
- `Recommendation` -- Treatment, diagnostic, lifestyle, or emergency recommendations with priority and rationale

### Anti-Hallucination

- `ConfidenceScore` -- Composite score with breakdown across diagnosis confidence, citation verification, knowledge base validation, contradiction detection, and provider alignment
- `ConfidenceFactor` -- Individual factor contributing to the overall score
- `Warning` -- Typed warnings for hallucination, low confidence, contradiction, outdated info, missing data, and emergencies
- `Contradiction` -- Detected contradictions between statements with severity and resolution

### Knowledge Base

- `MedicalKnowledgeBase` -- Condition-level knowledge with symptoms, treatments, diagnostic criteria, contraindications, and references
- `KnowledgeSymptom` -- Symptom with prevalence, specificity, and sensitivity metrics
- `KnowledgeTreatment` -- Treatment with efficacy rating and evidence level (A-D)
- `DiagnosticCriteria` -- Required, optional, and exclusion criteria with minimum threshold
- `Contraindication` -- Medication contraindications (absolute/relative)

### Provider Workflow

- `Provider` -- Healthcare provider with credentials, license, and notification preferences
- `ProviderReview` -- Review decision (approved/rejected/modified) with comments and modifications
- `NotificationPreferences` -- Channel preferences (email, SMS, push) with urgency filtering

### API Contracts

- `AnalysisRequest` / `AnalysisResponse` -- REST API request/response types
- `PatientContext` -- Optional patient demographics, history, medications, allergies, family history
- `AnalysisOptions` -- Analysis configuration (differentials, confidence threshold, emergency check)
- `ResponseMetadata` -- Request ID, timestamp, processing time, version

### Real-Time

- `WebSocketMessage` -- WebSocket event types for analysis updates, confidence updates, provider notifications, warnings, and errors
- `AnalysisUpdate` -- Progress tracking with status, percentage, current step, and ETA

### Learning

- `LearningPattern` -- Recognized patterns (diagnosis, treatment, symptom cluster, provider decision) with frequency and accuracy metrics
- `PatternRecognitionResult` -- Pattern matching output with confidence and applicability assessment

### Configuration

- `SystemConfig` -- Top-level configuration combining anti-hallucination, provider, API, and learning settings
- `AntiHallucinationConfig` -- Confidence thresholds, contradiction detection, citation verification toggles
- `LearningConfig` -- AgentDB path, pattern frequency thresholds, retrain intervals
