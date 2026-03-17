import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

import {
  createAlbIngressRole,
  createEcrRepositories,
  createEksCluster,
  createHpa,
  createK8sDeployments,
  createVpc,
  installAwsLoadBalancerController,
} from './components';
import { infraConfig } from './config';

// Validate AWS profile is set and display current identity
const callerIdentity = aws.getCallerIdentity({});
const currentRegion = aws.getRegion({});

// Export AWS account info for validation
export const awsAccountId = callerIdentity.then((id) => id.accountId);
export const awsArn = callerIdentity.then((id) => id.arn);
export const awsUserId = callerIdentity.then((id) => id.userId);
export const region = currentRegion.then((r) => r.name);

// Log the AWS identity being used (happens during preview/up)

// 1. Create VPC
const { vpc, vpcId, publicSubnetIds, privateSubnetIds } = createVpc();

// 2. Create ECR Repositories
const { federationHubRepo, agentRepo, federationHubRepoUrl, agentRepoUrl } =
  createEcrRepositories();

// 3. Create EKS Cluster
const { cluster, kubeconfig, clusterName, clusterEndpoint, oidcProviderArn, oidcProviderUrl } =
  createEksCluster(vpcId, publicSubnetIds, privateSubnetIds);

// 4. Create ALB Ingress Controller IAM Role
const albIngressRole = createAlbIngressRole(
  infraConfig.clusterName,
  oidcProviderArn,
  oidcProviderUrl
);

// 5. Create Kubernetes provider
const k8sProvider = new k8s.Provider('k8s-provider', {
  kubeconfig: kubeconfig,
});

// 6. Install AWS Load Balancer Controller
const albController = installAwsLoadBalancerController(
  k8sProvider,
  clusterName,
  albIngressRole,
  vpcId
);

// 7. Create Kubernetes deployments (depends on ALB controller)
const { namespace, federationHubDeployment, federationHubService, ingress } = createK8sDeployments(
  k8sProvider,
  federationHubRepoUrl,
  agentRepoUrl,
  oidcProviderArn,
  oidcProviderUrl
);

// 8. Create HPA for auto-scaling
const hpa = createHpa(k8sProvider, namespace, federationHubDeployment);

// ============ Exports ============

// VPC outputs
export const vpcIdOutput = vpcId;
export const publicSubnetIdsOutput = publicSubnetIds;
export const privateSubnetIdsOutput = privateSubnetIds;

// ECR outputs
export const federationHubEcrUrl = federationHubRepoUrl;
export const agentEcrUrl = agentRepoUrl;

// EKS outputs
export const eksClusterName = clusterName;
export const eksClusterEndpoint = clusterEndpoint;
export const kubeconfigOutput = pulumi.secret(kubeconfig);

// Kubernetes outputs
export const k8sNamespace = namespace.metadata.name;
export const federationHubServiceName = federationHubService.metadata.name;

// Ingress outputs (ALB DNS will be available after deployment)
export const ingressHostname = ingress.status.loadBalancer.ingress[0].hostname;
