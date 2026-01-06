/**
 * K6 Load Testing Configuration
 * Comprehensive configuration for load and stress testing agent-control-plane
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_TOKEN = __ENV.API_TOKEN || '';

// Test execution stages
export const stages = {
  // Warm-up: Gradually increase load
  warmup: { duration: '2m', target: 10 },

  // Ramp-up: Increase to moderate load
  rampup: { duration: '5m', target: 100 },

  // Sustained load: Maintain steady state
  sustained: { duration: '10m', target: 100 },

  // Peak load: Maximum expected traffic
  peak: { duration: '3m', target: 200 },

  // Spike test: Sudden traffic surge
  spike: { duration: '2m', target: 500 },

  // Recovery: Back to sustained
  recovery: { duration: '2m', target: 100 },

  // Cool-down: Gradual decrease
  cooldown: { duration: '2m', target: 0 },
};

// Stress test stages - push until failure
export const stressStages = [
  { duration: '2m', target: 100 },
  { duration: '2m', target: 200 },
  { duration: '2m', target: 300 },
  { duration: '2m', target: 400 },
  { duration: '2m', target: 500 },
  { duration: '2m', target: 600 },
  { duration: '2m', target: 700 },
  { duration: '2m', target: 800 },
  { duration: '2m', target: 900 },
  { duration: '2m', target: 1000 },
  { duration: '5m', target: 1000 }, // Hold at max
  { duration: '2m', target: 0 },
];

// Soak test stages - long duration
export const soakStages = [
  { duration: '5m', target: 50 },
  { duration: '1h', target: 50 }, // 1 hour sustained load
  { duration: '5m', target: 0 },
];

// Performance thresholds
export const thresholds = {
  // HTTP request duration
  http_req_duration: [
    'p(50)<200', // 50% of requests should complete in <200ms
    'p(90)<500', // 90% of requests should complete in <500ms
    'p(95)<1000', // 95% of requests should complete in <1s
    'p(99)<2000', // 99% of requests should complete in <2s
  ],

  // Request failure rate
  http_req_failed: [
    'rate<0.01', // Less than 1% failure rate
  ],

  // Requests per second
  http_reqs: [
    'rate>100', // At least 100 requests per second
  ],

  // Custom metrics
  agent_spawn_duration: ['p(95)<3000'],
  swarm_init_duration: ['p(95)<1000'],
  task_execution_duration: ['p(95)<5000'],
  memory_operation_duration: ['p(95)<100'],
  vector_search_duration: ['p(95)<500'],
};

// Stress test thresholds - more lenient
export const stressThresholds = {
  http_req_duration: ['p(95)<5000'],
  http_req_failed: ['rate<0.05'], // Allow up to 5% failure
};

// Load test options
export const options = {
  stages: Object.values(stages),
  thresholds: thresholds,

  // Resource limits
  vus: 500, // Maximum virtual users
  maxVUs: 1000, // Absolute maximum

  // Network settings
  insecureSkipTLSVerify: true,
  noConnectionReuse: false,

  // Results
  summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max'],

  // Export results
  out: ['json=tests/load/reports/results.json'],
};

// Stress test options
export const stressOptions = {
  stages: stressStages,
  thresholds: stressThresholds,
  vus: 1000,
  maxVUs: 1500,
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max'],
  out: ['json=tests/load/reports/stress-results.json'],
};

// Soak test options
export const soakOptions = {
  stages: soakStages,
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  vus: 50,
  maxVUs: 100,
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max'],
  out: ['json=tests/load/reports/soak-results.json'],
};

// Test data generators
export function generateTaskData() {
  const types = ['coding', 'testing', 'review', 'research', 'planning'];
  const languages = ['typescript', 'javascript', 'python', 'rust', 'go'];

  return {
    type: types[Math.floor(Math.random() * types.length)],
    description: `Load test task ${Math.random().toString(36).substring(7)}`,
    language: languages[Math.floor(Math.random() * languages.length)],
    timeout: 30000,
    priority: Math.random() > 0.5 ? 'high' : 'normal',
  };
}

export function generateAgentConfig() {
  const types = ['coder', 'tester', 'reviewer', 'planner', 'researcher'];

  return {
    type: types[Math.floor(Math.random() * types.length)],
    role: `role-${Math.random().toString(36).substring(7)}`,
    maxConcurrentTasks: Math.floor(Math.random() * 5) + 1,
  };
}

export function generateSwarmConfig() {
  const topologies = ['mesh', 'hierarchical', 'pipeline'];

  return {
    topology: topologies[Math.floor(Math.random() * topologies.length)],
    maxAgents: Math.floor(Math.random() * 20) + 5,
    coordinationStrategy: 'distributed',
  };
}

export function generateMemoryData() {
  return {
    key: `test-key-${Math.random().toString(36).substring(7)}`,
    value: JSON.stringify({
      data: new Array(100).fill(0).map(() => Math.random()),
      timestamp: Date.now(),
    }),
    namespace: 'load-test',
  };
}

// Request helpers
export function getHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: API_TOKEN ? `Bearer ${API_TOKEN}` : '',
  };
}

// Metrics collection
export function recordCustomMetric(name, value) {
  // Custom metrics tracking
  return {
    name,
    value,
    timestamp: Date.now(),
  };
}
