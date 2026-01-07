import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as pulumi from '@pulumi/pulumi';
import { commonTags, infraConfig } from '../config';

export interface EksResult {
  cluster: eks.Cluster;
  kubeconfig: pulumi.Output<string>;
  clusterName: pulumi.Output<string>;
  clusterEndpoint: pulumi.Output<string>;
  oidcProviderArn: pulumi.Output<string>;
  oidcProviderUrl: pulumi.Output<string>;
}

export function createEksCluster(
  vpcId: pulumi.Output<string>,
  publicSubnetIds: pulumi.Output<string[]>,
  privateSubnetIds: pulumi.Output<string[]>
): EksResult {
  // Create IAM Role for EKS Node Group
  const nodeGroupRole = new aws.iam.Role(`${infraConfig.clusterName}-nodegroup-role`, {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: commonTags,
  });

  // Attach required managed policies for EKS node group
  const nodeGroupPolicies = [
    'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
    'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
    'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
  ];

  nodeGroupPolicies.forEach((policyArn, index) => {
    new aws.iam.RolePolicyAttachment(`${infraConfig.clusterName}-nodegroup-policy-${index}`, {
      role: nodeGroupRole.name,
      policyArn: policyArn,
    });
  });

  // Create EKS cluster with managed node groups (instead of deprecated Launch Configurations)
  const cluster = new eks.Cluster(infraConfig.clusterName, {
    name: infraConfig.clusterName,
    vpcId: vpcId,
    publicSubnetIds: publicSubnetIds,
    privateSubnetIds: privateSubnetIds,
    // Use managed node groups instead of self-managed nodes (AWS deprecated Launch Configurations)
    skipDefaultNodeGroup: true,
    // Register the node role so the cluster can authorize nodes
    instanceRoles: [nodeGroupRole],
    endpointPrivateAccess: true,
    endpointPublicAccess: true,
    version: '1.29',
    enabledClusterLogTypes: ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'],
    tags: commonTags,
    createOidcProvider: true,
  });

  // Create EKS Managed Node Group (uses Launch Templates instead of deprecated Launch Configurations)
  const managedNodeGroup = new eks.ManagedNodeGroup(`${infraConfig.clusterName}-ng`, {
    cluster: cluster,
    nodeGroupName: `${infraConfig.clusterName}-managed-ng`,
    nodeRole: nodeGroupRole,
    instanceTypes: [infraConfig.nodeInstanceType],
    scalingConfig: {
      desiredSize: infraConfig.desiredCapacity,
      minSize: infraConfig.minSize,
      maxSize: infraConfig.maxSize,
    },
    subnetIds: privateSubnetIds,
    diskSize: 50,
    amiType: 'AL2023_x86_64_STANDARD', // Amazon Linux 2023
    capacityType: 'ON_DEMAND',
    labels: {
      'nodegroup-type': 'managed',
    },
    tags: commonTags,
  });

  // Get OIDC provider for IRSA (IAM Roles for Service Accounts)
  const oidcProviderArn = cluster.core.oidcProvider!.arn;
  const oidcProviderUrl = cluster.core.oidcProvider!.url;

  return {
    cluster,
    kubeconfig: cluster.kubeconfigJson,
    clusterName: pulumi.output(infraConfig.clusterName),
    clusterEndpoint: cluster.eksCluster.endpoint,
    oidcProviderArn,
    oidcProviderUrl,
  };
}

// Create IAM role for ALB Ingress Controller
export function createAlbIngressRole(
  clusterName: string,
  oidcProviderArn: pulumi.Output<string>,
  oidcProviderUrl: pulumi.Output<string>
): aws.iam.Role {
  const albIngressRole = new aws.iam.Role(`${clusterName}-alb-ingress-role`, {
    assumeRolePolicy: pulumi.all([oidcProviderArn, oidcProviderUrl]).apply(([arn, url]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Federated: arn,
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringEquals: {
                [`${url}:sub`]: 'system:serviceaccount:kube-system:aws-load-balancer-controller',
                [`${url}:aud`]: 'sts.amazonaws.com',
              },
            },
          },
        ],
      })
    ),
    tags: commonTags,
  });

  // Attach the AWS Load Balancer Controller policy
  const albPolicy = new aws.iam.Policy(`${clusterName}-alb-policy`, {
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'iam:CreateServiceLinkedRole',
            'ec2:DescribeAccountAttributes',
            'ec2:DescribeAddresses',
            'ec2:DescribeAvailabilityZones',
            'ec2:DescribeInternetGateways',
            'ec2:DescribeVpcs',
            'ec2:DescribeVpcPeeringConnections',
            'ec2:DescribeSubnets',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeInstances',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DescribeTags',
            'ec2:GetCoipPoolUsage',
            'ec2:DescribeCoipPools',
            'ec2:GetSecurityGroupsForVpc',
            'elasticloadbalancing:*',
            'cognito-idp:DescribeUserPoolClient',
            'acm:ListCertificates',
            'acm:DescribeCertificate',
            'iam:ListServerCertificates',
            'iam:GetServerCertificate',
            'waf-regional:*',
            'wafv2:*',
            'shield:*',
            'ec2:AuthorizeSecurityGroupIngress',
            'ec2:RevokeSecurityGroupIngress',
            'ec2:CreateSecurityGroup',
            'ec2:CreateTags',
            'ec2:DeleteTags',
            'ec2:DeleteSecurityGroup',
          ],
          Resource: '*',
        },
      ],
    }),
    tags: commonTags,
  });

  new aws.iam.RolePolicyAttachment(`${clusterName}-alb-policy-attachment`, {
    role: albIngressRole.name,
    policyArn: albPolicy.arn,
  });

  return albIngressRole;
}
