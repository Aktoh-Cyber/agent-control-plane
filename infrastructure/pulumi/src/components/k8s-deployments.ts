import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { infraConfig } from '../config';

export interface K8sDeploymentsResult {
  namespace: k8s.core.v1.Namespace;
  federationHubDeployment: k8s.apps.v1.Deployment;
  federationHubService: k8s.core.v1.Service;
  ingress: k8s.networking.v1.Ingress;
}

export function createK8sDeployments(
  k8sProvider: k8s.Provider,
  federationHubRepoUrl: pulumi.Output<string>,
  agentRepoUrl: pulumi.Output<string>
): K8sDeploymentsResult {
  const appLabels = {
    app: 'agent-control-plane',
    environment: infraConfig.environment,
  };

  // Create namespace
  const namespace = new k8s.core.v1.Namespace(
    'acp-namespace',
    {
      metadata: {
        name: 'agent-control-plane',
        labels: appLabels,
      },
    },
    { provider: k8sProvider }
  );

  // ConfigMap for federation hub configuration
  const hubConfigMap = new k8s.core.v1.ConfigMap(
    'federation-hub-config',
    {
      metadata: {
        name: 'federation-hub-config',
        namespace: namespace.metadata.name,
      },
      data: {
        NODE_ENV: 'production',
        FEDERATION_HUB_PORT: '8443',
        FEDERATION_HTTP_PORT: '8444',
        FEDERATION_MAX_AGENTS: '1000',
        DEBUG_LEVEL: 'DETAILED',
        DEBUG_FORMAT: 'json',
      },
    },
    { provider: k8sProvider }
  );

  // Federation Hub Deployment
  const federationHubDeployment = new k8s.apps.v1.Deployment(
    'federation-hub',
    {
      metadata: {
        name: 'federation-hub',
        namespace: namespace.metadata.name,
        labels: {
          ...appLabels,
          component: 'federation-hub',
        },
      },
      spec: {
        replicas: infraConfig.environment === 'prod' ? 3 : 2,
        selector: {
          matchLabels: {
            app: 'federation-hub',
          },
        },
        template: {
          metadata: {
            labels: {
              app: 'federation-hub',
              component: 'federation-hub',
            },
          },
          spec: {
            containers: [
              {
                name: 'federation-hub',
                image: pulumi.interpolate`${federationHubRepoUrl}:latest`,
                ports: [
                  { name: 'websocket', containerPort: 8443 },
                  { name: 'http', containerPort: 8444 },
                ],
                envFrom: [
                  {
                    configMapRef: {
                      name: hubConfigMap.metadata.name,
                    },
                  },
                ],
                env: [
                  {
                    name: 'FEDERATION_DB_PATH',
                    value: '/data/hub.db',
                  },
                ],
                resources: {
                  requests: {
                    cpu: '100m',
                    memory: '256Mi',
                  },
                  limits: {
                    cpu: '500m',
                    memory: '512Mi',
                  },
                },
                livenessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 8444,
                  },
                  initialDelaySeconds: 15,
                  periodSeconds: 10,
                  timeoutSeconds: 5,
                  failureThreshold: 3,
                },
                readinessProbe: {
                  httpGet: {
                    path: '/health',
                    port: 8444,
                  },
                  initialDelaySeconds: 5,
                  periodSeconds: 5,
                  timeoutSeconds: 3,
                  failureThreshold: 3,
                },
                volumeMounts: [
                  {
                    name: 'data',
                    mountPath: '/data',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'data',
                emptyDir: {},
              },
            ],
          },
        },
      },
    },
    { provider: k8sProvider }
  );

  // Federation Hub Service
  const federationHubService = new k8s.core.v1.Service(
    'federation-hub-service',
    {
      metadata: {
        name: 'federation-hub',
        namespace: namespace.metadata.name,
        labels: {
          ...appLabels,
          component: 'federation-hub',
        },
      },
      spec: {
        type: 'ClusterIP',
        selector: {
          app: 'federation-hub',
        },
        ports: [
          {
            name: 'websocket',
            port: 8443,
            targetPort: 8443,
            protocol: 'TCP',
          },
          {
            name: 'http',
            port: 8444,
            targetPort: 8444,
            protocol: 'TCP',
          },
        ],
      },
    },
    { provider: k8sProvider }
  );

  // ALB Ingress for external access
  const ingress = new k8s.networking.v1.Ingress(
    'federation-hub-ingress',
    {
      metadata: {
        name: 'federation-hub-ingress',
        namespace: namespace.metadata.name,
        annotations: {
          'kubernetes.io/ingress.class': 'alb',
          'alb.ingress.kubernetes.io/scheme': 'internet-facing',
          'alb.ingress.kubernetes.io/target-type': 'ip',
          'alb.ingress.kubernetes.io/healthcheck-path': '/health',
          'alb.ingress.kubernetes.io/healthcheck-port': '8444',
          // HTTP only for dev - add certificate for HTTPS in prod
          'alb.ingress.kubernetes.io/listen-ports': '[{"HTTP": 80}]',
          // WebSocket support
          'alb.ingress.kubernetes.io/target-group-attributes':
            'stickiness.enabled=true,stickiness.lb_cookie.duration_seconds=3600',
        },
        labels: appLabels,
      },
      spec: {
        ingressClassName: 'alb',
        rules: [
          {
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: federationHubService.metadata.name,
                      port: {
                        number: 8443,
                      },
                    },
                  },
                },
                {
                  path: '/health',
                  pathType: 'Exact',
                  backend: {
                    service: {
                      name: federationHubService.metadata.name,
                      port: {
                        number: 8444,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    { provider: k8sProvider }
  );

  return {
    namespace,
    federationHubDeployment,
    federationHubService,
    ingress,
  };
}

// Create HorizontalPodAutoscaler for Federation Hub
export function createHpa(
  k8sProvider: k8s.Provider,
  namespace: k8s.core.v1.Namespace,
  deployment: k8s.apps.v1.Deployment
): k8s.autoscaling.v2.HorizontalPodAutoscaler {
  return new k8s.autoscaling.v2.HorizontalPodAutoscaler(
    'federation-hub-hpa',
    {
      metadata: {
        name: 'federation-hub-hpa',
        namespace: namespace.metadata.name,
      },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: deployment.metadata.name,
        },
        minReplicas: infraConfig.environment === 'prod' ? 3 : 2,
        maxReplicas: infraConfig.environment === 'prod' ? 10 : 5,
        metrics: [
          {
            type: 'Resource',
            resource: {
              name: 'cpu',
              target: {
                type: 'Utilization',
                averageUtilization: 70,
              },
            },
          },
          {
            type: 'Resource',
            resource: {
              name: 'memory',
              target: {
                type: 'Utilization',
                averageUtilization: 80,
              },
            },
          },
        ],
      },
    },
    { provider: k8sProvider }
  );
}
