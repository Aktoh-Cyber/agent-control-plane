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
  // Create EKS cluster
  const cluster = new eks.Cluster(infraConfig.clusterName, {
    name: infraConfig.clusterName,
    vpcId: vpcId,
    publicSubnetIds: publicSubnetIds,
    privateSubnetIds: privateSubnetIds,
    instanceType: infraConfig.nodeInstanceType,
    desiredCapacity: infraConfig.desiredCapacity,
    minSize: infraConfig.minSize,
    maxSize: infraConfig.maxSize,
    nodeAssociatePublicIpAddress: false,
    endpointPrivateAccess: true,
    endpointPublicAccess: true,
    version: '1.29',
    enabledClusterLogTypes: ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'],
    tags: commonTags,
    nodeRootVolumeSize: 50,
    createOidcProvider: true,
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
            'ec2:DescribeSubnets',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeInstances',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DescribeTags',
            'ec2:GetCoipPoolUsage',
            'ec2:DescribeCoipPools',
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
