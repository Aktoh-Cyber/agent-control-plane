import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags, infraConfig } from '../config';

export interface EcrResult {
  federationHubRepo: aws.ecr.Repository;
  agentRepo: aws.ecr.Repository;
  federationHubRepoUrl: pulumi.Output<string>;
  agentRepoUrl: pulumi.Output<string>;
}

export function createEcrRepositories(): EcrResult {
  // ECR Repository for Federation Hub
  const federationHubRepo = new aws.ecr.Repository(`${infraConfig.clusterName}-federation-hub`, {
    name: `${infraConfig.clusterName}/federation-hub`,
    imageTagMutability: 'MUTABLE',
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    tags: {
      ...commonTags,
      Component: 'federation-hub',
    },
  });

  // ECR Repository for Agents
  const agentRepo = new aws.ecr.Repository(`${infraConfig.clusterName}-agent`, {
    name: `${infraConfig.clusterName}/agent`,
    imageTagMutability: 'MUTABLE',
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    tags: {
      ...commonTags,
      Component: 'agent',
    },
  });

  // Lifecycle policy to clean up old images
  const lifecyclePolicy = JSON.stringify({
    rules: [
      {
        rulePriority: 1,
        description: 'Keep last 10 images',
        selection: {
          tagStatus: 'any',
          countType: 'imageCountMoreThan',
          countNumber: 10,
        },
        action: {
          type: 'expire',
        },
      },
    ],
  });

  new aws.ecr.LifecyclePolicy(`${infraConfig.clusterName}-federation-hub-lifecycle`, {
    repository: federationHubRepo.name,
    policy: lifecyclePolicy,
  });

  new aws.ecr.LifecyclePolicy(`${infraConfig.clusterName}-agent-lifecycle`, {
    repository: agentRepo.name,
    policy: lifecyclePolicy,
  });

  return {
    federationHubRepo,
    agentRepo,
    federationHubRepoUrl: federationHubRepo.repositoryUrl,
    agentRepoUrl: agentRepo.repositoryUrl,
  };
}
