/**
 * Verification System Main Export
 * Comprehensive anti-hallucination and verification system
 */

import { ConfidenceScorer } from './core/confidence-scorer';
import { LeanAgenticIntegration } from './integrations/lean-agentic-integration';
import { AgentDBIntegration } from './learning/agentdb-integration';
import { StrangeLoopsDetector } from './patterns/strange-loops-detector';
import { VerificationPipeline } from './pipeline/verification-pipeline';

export { ConfidenceScorer } from './core/confidence-scorer';
export type {
  ConfidenceMetadata,
  ConfidenceScore,
  MedicalCitation,
} from './core/confidence-scorer';

export { VerificationPipeline } from './pipeline/verification-pipeline';
export type {
  HallucinationDetection,
  ProviderReview,
  VerificationInput,
  VerificationMetadata,
  VerificationResult,
} from './pipeline/verification-pipeline';

export { LeanAgenticIntegration } from './integrations/lean-agentic-integration';
export type {
  CausalInferenceResult,
  CausalModel,
  PowerAnalysis,
  StatisticalTest,
} from './integrations/lean-agentic-integration';

export { StrangeLoopsDetector } from './patterns/strange-loops-detector';
export type {
  CausalChain,
  LogicalPattern,
  RecursivePattern,
} from './patterns/strange-loops-detector';

export { AgentDBIntegration } from './learning/agentdb-integration';
export type {
  LearningRecord,
  Pattern,
  ProviderFeedback,
  SourceReliability,
} from './learning/agentdb-integration';

/**
 * Main Verification System Class
 * Orchestrates all verification components
 */
export class VerificationSystem {
  public confidenceScorer: ConfidenceScorer;
  private pipeline: VerificationPipeline;
  public leanAgentic: LeanAgenticIntegration;
  private loopsDetector: StrangeLoopsDetector;
  private agentDB: AgentDBIntegration;

  constructor() {
    this.confidenceScorer = new ConfidenceScorer();
    this.pipeline = new VerificationPipeline();
    this.leanAgentic = new LeanAgenticIntegration();
    this.loopsDetector = new StrangeLoopsDetector();
    this.agentDB = new AgentDBIntegration();
  }

  /**
   * Perform comprehensive verification
   */
  async verify(input: any): Promise<any> {
    // Pre-output verification
    const verificationResult = await this.pipeline.preOutputVerification(input);

    // Detect logical issues
    const logicalPatterns = await this.loopsDetector.detectCircularReasoning(input.claim);
    const contradictions = await this.loopsDetector.detectContradictions(input.claim);

    // Get learning-based adjustments
    const adjustment = await this.agentDB.getConfidenceAdjustment(
      input.features || {},
      input.context || []
    );

    return {
      ...verificationResult,
      logicalPatterns,
      contradictions,
      learningAdjustment: adjustment,
    };
  }

  /**
   * Get system statistics
   */
  getStatistics(): any {
    return {
      pipeline: this.pipeline.getStatistics(),
      patterns: this.agentDB.getPatternStatistics(),
      model: this.agentDB.getModelStatistics(),
    };
  }
}
