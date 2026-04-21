# Services Module

Core business logic services for medical analysis, anti-hallucination, and learning.

## Purpose

Contains the primary service classes that power the analysis pipeline: medical condition analysis, confidence scoring and hallucination detection, pattern learning, and provider notification.

## Key Files

- `medical-analysis.service.ts` - Core analysis engine. Generates diagnoses, differential diagnoses, recommendations, and citations from symptom input. Stores results for retrieval.
- `anti-hallucination.service.ts` - Confidence scoring across multiple factors (diagnosis confidence, citation verification, consistency, knowledge base coverage). Generates warnings and determines if provider review is required. Thresholds: auto-approve at 0.9, requires review below 0.75.
- `agentdb-learning.service.ts` - Pattern recognition and learning from provider feedback. Recognizes symptom patterns from historical data and improves accuracy over time.
- `medical-analyzer.ts` - Medical analysis utilities
- `knowledge-base.ts` - Medical knowledge base for cross-referencing
- `notification-service.ts` - Service-layer notification helpers
- `provider.service.ts` - Provider-facing service operations
- `verification-service.ts` - Analysis verification logic

## How It Works

1. `MedicalAnalysisService.analyze()` processes symptoms into a structured diagnosis with recommendations
2. `AntiHallucinationService.calculateConfidenceScore()` evaluates the result across 4+ factors
3. If confidence is below threshold, the analysis is flagged for provider review
4. `AgentDBLearningService.learnFromAnalysis()` records outcomes for future pattern improvement

## Dependencies

- `../types/medical.types` - All medical domain types
- Used by `../api` for request handling
