import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { infraConfig } from '../config';

export function installAwsLoadBalancerController(
  k8sProvider: k8s.Provider,
  clusterName: pulumi.Output<string>,
  albIngressRole: aws.iam.Role,
  vpcId: pulumi.Output<string>
): k8s.helm.v3.Release {
  // Install AWS Load Balancer Controller via Helm
  const awsLbController = new k8s.helm.v3.Release(
    'aws-load-balancer-controller',
    {
      chart: 'aws-load-balancer-controller',
      version: '1.6.2',
      namespace: 'kube-system',
      repositoryOpts: {
        repo: 'https://aws.github.io/eks-charts',
      },
      values: {
        clusterName: clusterName,
        serviceAccount: {
          create: true,
          name: 'aws-load-balancer-controller',
          annotations: {
            'eks.amazonaws.com/role-arn': albIngressRole.arn,
          },
        },
        region: infraConfig.awsRegion,
        vpcId: vpcId,
        enableShield: false,
        enableWaf: false,
        enableWafv2: false,
      },
    },
    { provider: k8sProvider }
  );

  return awsLbController;
}
