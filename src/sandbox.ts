/**
 * Sandbox Manager - Core sandbox lifecycle management
 */

import { randomUUID } from "crypto";
import {
  SandboxId,
  Sandbox,
  SandboxConfig,
  SandboxStatus,
  IsolationLevel,
  Capability,
  ResourceQuota,
  SecurityConfig,
  SandboxError,
} from "./types.js";

const DEFAULT_QUOTA: ResourceQuota = {
  maxInferencePerHour: 100,
  maxTokensPerDay: 10000,
  maxCpuPercent: 50,
  maxMemoryMB: 512,
  maxExecutionTimeSec: 60,
  maxWorkspaceMB: 100,
};

const ISOLATION_SECURITY: Record<IsolationLevel, SecurityConfig> = {
  L0: {},
  L1: {},
  "L1+": {
    mte: { enabled: true, mode: "asymm" },
    pac: { enabled: true, keys: ["IA", "IB"] },
  },
  L2: {},
  "L2+": {
    tee: { enabled: true, provider: "itrustee" },
  },
  L3: {
    mte: { enabled: true, mode: "sync" },
    pac: { enabled: true, keys: ["IA", "IB", "DA", "DB"] },
    tee: { enabled: true, provider: "itrustee" },
  },
};

export class SandboxManager {
  private sandboxes: Map<SandboxId, Sandbox> = new Map();
  private workspaceRoot: string;
  private maxSandboxes: number;
  private securityEnabled: boolean;

  constructor(config: { workspaceRoot: string; maxSandboxes?: number; securityEnabled?: boolean }) {
    this.workspaceRoot = config.workspaceRoot;
    this.maxSandboxes = config.maxSandboxes ?? 100;
    this.securityEnabled = config.securityEnabled ?? true;
  }

  /**
   * Create a new sandbox
   */
  async create(config: SandboxConfig): Promise<Sandbox> {
    if (this.sandboxes.size >= this.maxSandboxes) {
      throw new SandboxError("Maximum sandboxes reached", "MAX_SANDBOXES");
    }

    const id = this.generateId();
    const quota = { ...DEFAULT_QUOTA, ...config.quota };

    const sandbox: Sandbox = {
      id,
      name: config.name,
      status: "creating",
      isolationLevel: config.isolationLevel,
      capabilities: new Set(config.capabilities),
      quota,
      createdAt: new Date(),
      metadata: config.metadata,
    };

    this.sandboxes.set(id, sandbox);

    // Initialize isolation based on level
    await this.initializeIsolation(sandbox);

    sandbox.status = "ready";
    return sandbox;
  }

  /**
   * Get sandbox by ID
   */
  get(sandboxId: SandboxId): Sandbox | undefined {
    return this.sandboxes.get(sandboxId);
  }

  /**
   * List all sandboxes
   */
  list(): Sandbox[] {
    return Array.from(this.sandboxes.values());
  }

  /**
   * Destroy a sandbox
   */
  async destroy(sandboxId: SandboxId): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`, "NOT_FOUND", sandboxId);
    }

    // Cleanup isolation resources
    await this.cleanupIsolation(sandbox);

    this.sandboxes.delete(sandboxId);
  }

  /**
   * Update sandbox status
   */
  setStatus(sandboxId: SandboxId, status: SandboxStatus): void {
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) {
      sandbox.status = status;
    }
  }

  /**
   * Grant capability to sandbox
   */
  grantCapability(sandboxId: SandboxId, capability: Capability): void {
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) {
      sandbox.capabilities.add(capability);
    }
  }

  /**
   * Revoke capability from sandbox
   */
  revokeCapability(sandboxId: SandboxId, capability: Capability): void {
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) {
      sandbox.capabilities.delete(capability);
    }
  }

  /**
   * Check if sandbox has capability
   */
  hasCapability(sandboxId: SandboxId, capability: Capability): boolean {
    const sandbox = this.sandboxes.get(sandboxId);
    return sandbox?.capabilities.has(capability) ?? false;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byStatus: Record<SandboxStatus, number>;
    byIsolation: Record<IsolationLevel, number>;
  } {
    const byStatus: Record<SandboxStatus, number> = {
      creating: 0,
      ready: 0,
      running: 0,
      paused: 0,
      stopped: 0,
      error: 0,
    };

    const byIsolation: Record<IsolationLevel, number> = {
      L0: 0,
      L1: 0,
      "L1+": 0,
      L2: 0,
      "L2+": 0,
      L3: 0,
    };

    for (const sandbox of this.sandboxes.values()) {
      byStatus[sandbox.status]++;
      byIsolation[sandbox.isolationLevel]++;
    }

    return {
      total: this.sandboxes.size,
      byStatus,
      byIsolation,
    };
  }

  // ========== Private ==========

  private generateId(): SandboxId {
    return `sbx-${randomUUID().slice(0, 8)}`;
  }

  private async initializeIsolation(sandbox: Sandbox): Promise<void> {
    const security = ISOLATION_SECURITY[sandbox.isolationLevel];

    if (this.securityEnabled && security.mte?.enabled) {
      // Initialize MTE for this sandbox
      await this.initMTE(sandbox, security.mte.mode);
    }

    if (this.securityEnabled && security.pac?.enabled) {
      // Initialize PAC for this sandbox
      await this.initPAC(sandbox, security.pac.keys);
    }

    if (this.securityEnabled && security.tee?.enabled) {
      // Initialize TEE session
      await this.initTEE(sandbox, security.tee.provider);
    }
  }

  private async cleanupIsolation(sandbox: Sandbox): Promise<void> {
    // Cleanup resources based on isolation level
    if (sandbox.isolationLevel === "L2" || sandbox.isolationLevel === "L2+") {
      // Stop container if running
    }

    if (sandbox.isolationLevel === "L3") {
      // Close TrustZone session
    }
  }

  private async initMTE(sandbox: Sandbox, mode: string): Promise<void> {
    // MTE initialization would be done via prctl in actual implementation
    console.log(`[Capsule] Initializing MTE for ${sandbox.id} (mode: ${mode})`);
  }

  private async initPAC(sandbox: Sandbox, keys: string[]): Promise<void> {
    // PAC is usually enabled at compile time
    console.log(`[Capsule] PAC enabled for ${sandbox.id} (keys: ${keys.join(",")})`);
  }

  private async initTEE(sandbox: Sandbox, provider: string): Promise<void> {
    // Initialize TEE session via libteec
    console.log(`[Capsule] Initializing TEE session for ${sandbox.id} (provider: ${provider})`);
  }
}