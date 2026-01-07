import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import { commonTags, infraConfig } from '../config';

export interface VpcResult {
  vpc: awsx.ec2.Vpc;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;
}

export function createVpc(): VpcResult {
  // Create VPC with public and private subnets across 3 AZs
  const vpc = new awsx.ec2.Vpc(`${infraConfig.clusterName}-vpc`, {
    cidrBlock: infraConfig.vpcCidr,
    numberOfAvailabilityZones: 3,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    subnetSpecs: [
      {
        type: awsx.ec2.SubnetType.Public,
        cidrMask: 20,
        tags: {
          ...commonTags,
          [`kubernetes.io/cluster/${infraConfig.clusterName}`]: 'shared',
          'kubernetes.io/role/elb': '1',
        },
      },
      {
        type: awsx.ec2.SubnetType.Private,
        cidrMask: 20,
        tags: {
          ...commonTags,
          [`kubernetes.io/cluster/${infraConfig.clusterName}`]: 'shared',
          'kubernetes.io/role/internal-elb': '1',
        },
      },
    ],
    natGateways: {
      strategy:
        infraConfig.environment === 'prod'
          ? awsx.ec2.NatGatewayStrategy.OnePerAz
          : awsx.ec2.NatGatewayStrategy.Single,
    },
    tags: {
      ...commonTags,
      Name: `${infraConfig.clusterName}-vpc`,
    },
  });

  return {
    vpc,
    vpcId: vpc.vpcId,
    publicSubnetIds: vpc.publicSubnetIds,
    privateSubnetIds: vpc.privateSubnetIds,
  };
}
