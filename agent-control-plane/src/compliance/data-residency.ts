/**
 * Data Residency Configuration
 * Per-org region settings for data storage and processing.
 *
 * Provides an in-memory store for managing which cloud regions an
 * organisation's data is allowed to reside in, whether cross-border
 * transfers are permitted, and what data-classification level applies.
 * A future phase will back this with a persistent database.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataRegion =
  | 'us-east-1'
  | 'us-west-2'
  | 'eu-west-1'
  | 'eu-central-1'
  | 'ap-southeast-1'
  | 'ap-northeast-1';

export type DataClassification = 'standard' | 'sensitive' | 'restricted';

export interface DataResidencyConfig {
  orgId: string;
  primaryRegion: DataRegion;
  allowedRegions: DataRegion[];
  dataClassification: DataClassification;
  encryptionRequired: boolean;
  crossBorderTransferAllowed: boolean;
  retentionOverrideDays?: number;
  updatedAt: Date;
  updatedBy: string;
}

export interface DataResidencyInput {
  primaryRegion?: DataRegion;
  allowedRegions?: DataRegion[];
  dataClassification?: DataClassification;
  encryptionRequired?: boolean;
  crossBorderTransferAllowed?: boolean;
  retentionOverrideDays?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_REGIONS: DataRegion[] = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
];

const DEFAULT_PRIMARY_REGION: DataRegion = 'us-east-1';

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export class DataResidencyStore {
  private configs: Map<string, DataResidencyConfig> = new Map();

  /** Return the residency config for an org, or a sensible default. */
  getConfig(orgId: string): DataResidencyConfig {
    return this.configs.get(orgId) ?? this.getDefaultConfig(orgId);
  }

  /** Upsert the residency config for an org. */
  setConfig(orgId: string, input: DataResidencyInput, updatedBy: string): DataResidencyConfig {
    const existing = this.configs.get(orgId);

    const primaryRegion = input.primaryRegion ?? existing?.primaryRegion ?? DEFAULT_PRIMARY_REGION;
    const allowedRegions = input.allowedRegions ?? existing?.allowedRegions ?? [primaryRegion];

    // Ensure the primary region is always included in the allowed list.
    const regionSet = new Set(allowedRegions);
    regionSet.add(primaryRegion);

    const config: DataResidencyConfig = {
      orgId,
      primaryRegion,
      allowedRegions: Array.from(regionSet),
      dataClassification: input.dataClassification ?? existing?.dataClassification ?? 'standard',
      encryptionRequired: input.encryptionRequired ?? existing?.encryptionRequired ?? false,
      crossBorderTransferAllowed:
        input.crossBorderTransferAllowed ?? existing?.crossBorderTransferAllowed ?? true,
      retentionOverrideDays: input.retentionOverrideDays ?? existing?.retentionOverrideDays,
      updatedAt: new Date(),
      updatedBy,
    };

    this.configs.set(orgId, config);
    return config;
  }

  /** Remove the residency config for an org (reverts to defaults). */
  deleteConfig(orgId: string): boolean {
    return this.configs.delete(orgId);
  }

  /** List every stored residency config. */
  listConfigs(): DataResidencyConfig[] {
    return Array.from(this.configs.values());
  }

  /** Build a default config for an org that has no explicit entry. */
  getDefaultConfig(orgId: string): DataResidencyConfig {
    return {
      orgId,
      primaryRegion: DEFAULT_PRIMARY_REGION,
      allowedRegions: [DEFAULT_PRIMARY_REGION],
      dataClassification: 'standard',
      encryptionRequired: false,
      crossBorderTransferAllowed: true,
      retentionOverrideDays: undefined,
      updatedAt: new Date(),
      updatedBy: 'system',
    };
  }

  /** Check whether processing data in `region` is permitted for `orgId`. */
  isRegionAllowed(orgId: string, region: DataRegion): boolean {
    const config = this.getConfig(orgId);
    return config.allowedRegions.includes(region);
  }

  /**
   * Validate whether a cross-border data transfer from `sourceOrg` into
   * `targetRegion` is permitted. Returns an object describing the outcome.
   */
  validateCrossBorderTransfer(
    sourceOrg: string,
    targetRegion: DataRegion
  ): { allowed: boolean; reason: string } {
    const config = this.getConfig(sourceOrg);

    // If the target region is already in the allowed list, no cross-border
    // concern applies.
    if (config.allowedRegions.includes(targetRegion)) {
      return { allowed: true, reason: 'Target region is in the allowed list' };
    }

    // If cross-border transfers are explicitly disallowed, deny.
    if (!config.crossBorderTransferAllowed) {
      return {
        allowed: false,
        reason: `Cross-border transfer to ${targetRegion} is not allowed for org ${sourceOrg}`,
      };
    }

    // Cross-border is allowed and the target is a valid region.
    if ((ALL_REGIONS as string[]).includes(targetRegion)) {
      return {
        allowed: true,
        reason: 'Cross-border transfer is permitted by org policy',
      };
    }

    return { allowed: false, reason: `Unknown target region: ${targetRegion}` };
  }
}

export const dataResidencyStore = new DataResidencyStore();
