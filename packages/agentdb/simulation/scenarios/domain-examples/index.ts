/**
 * Domain-Specific Attention Configuration Examples
 *
 * This module exports real-world configurations and examples for various industries
 * and use cases, demonstrating how to adapt AgentDB's attention mechanisms for
 * specific requirements.
 */

export {
  TRADING_ATTENTION_CONFIG,
  TRADING_CONFIG_VARIATIONS,
  TRADING_PERFORMANCE_TARGETS,
  adaptConfigToMarket,
  matchTradingPattern,
  type TradingMetrics,
  type TradingSignal,
} from './trading-systems';

export {
  MEDICAL_ATTENTION_CONFIG,
  MEDICAL_CONFIG_VARIATIONS,
  MEDICAL_PERFORMANCE_TARGETS,
  adaptConfigToUrgency,
  findSimilarCases,
  validateMedicalData,
  type MedicalDataQuality,
  type MedicalMetrics,
  type SimilarCase,
} from './medical-imaging';

export {
  ROBOTICS_ATTENTION_CONFIG,
  ROBOTICS_CONFIG_VARIATIONS,
  ROBOTICS_PERFORMANCE_TARGETS,
  adaptConfigToEnvironment,
  adaptConfigToPower,
  matchEnvironment,
  type NavigationPlan,
  type RobotContext,
  type RoboticsMetrics,
} from './robotics-navigation';

export {
  ECOMMERCE_ATTENTION_CONFIG,
  ECOMMERCE_CONFIG_VARIATIONS,
  ECOMMERCE_PERFORMANCE_TARGETS,
  adaptConfigToPromotion,
  adaptConfigToUserSegment,
  generateABTestConfigs,
  recommendProducts,
  type ECommerceMetrics,
  type PromotionalContext,
  type Recommendation,
} from './e-commerce-recommendations';

export {
  RESEARCH_ATTENTION_CONFIG,
  RESEARCH_CONFIG_VARIATIONS,
  RESEARCH_PERFORMANCE_TARGETS,
  adaptConfigToResearchStage,
  adaptConfigToSearchMode,
  analyzeCitationNetwork,
  discoverRelatedResearch,
  type CitationNetworkMetrics,
  type ResearchConnection,
  type ResearchMetrics,
} from './scientific-research';

export {
  IOT_ATTENTION_CONFIG,
  IOT_CONFIG_VARIATIONS,
  IOT_PERFORMANCE_TARGETS,
  adaptConfigToBattery,
  adaptConfigToDeployment,
  adaptConfigToTopology,
  detectAnomalies,
  type AnomalyAlert,
  type IoTMetrics,
  type NetworkTopology,
  type Sensor,
} from './iot-sensor-networks';
