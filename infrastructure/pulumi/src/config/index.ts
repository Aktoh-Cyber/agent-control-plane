import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('agent-control-plane');
const awsConfig = new pulumi.Config('aws');

export interface InfraConfig {
  environment: string;
  clusterName: string;
  vpcCidr: string;
  nodeInstanceType: string;
  desiredCapacity: number;
  minSize: number;
  maxSize: number;
  awsRegion: string;
  awsProfile?: string;
}

export const infraConfig: InfraConfig = {
  environment: config.require('environment'),
  clusterName: config.require('clusterName'),
  vpcCidr: config.require('vpcCidr'),
  nodeInstanceType: config.require('nodeInstanceType'),
  desiredCapacity: config.requireNumber('desiredCapacity'),
  minSize: config.requireNumber('minSize'),
  maxSize: config.requireNumber('maxSize'),
  awsRegion: awsConfig.require('region'),
  awsProfile: awsConfig.get('profile'),
};

// Common tags for all resources
export const commonTags = {
  Project: 'agent-control-plane',
  Environment: infraConfig.environment,
  ManagedBy: 'pulumi',
};
