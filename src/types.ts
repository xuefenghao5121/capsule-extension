/**
 * Capsule Types - Core type definitions
 */

// ========== Sandbox ==========

export type SandboxId = string;

export type IsolationLevel = "L0" | "L1" | "L1+" | "L2" | "L2+" | "L3";

export type SandboxStatus = "creating" | "ready" | "running" | "paused" | "stopped" | "error";

export type Capability =
  | "file_read"
  | "file_write"
  | "exec"
  | "network"
  | "browser"
  | "memory"
  | "sessions"
  | "tools"
  | "spawn";

export interface ResourceQuota {
  maxInferencePerHour: number;
  maxTokensPerDay: number;
  maxCpuPercent: number;
  maxMemoryMB: number;
  maxExecutionTimeSec: number;
  maxWorkspaceMB: number;
}

export interface SandboxConfig {
  name: string;
  isolationLevel: IsolationLevel;
  capabilities: Capability[];
  quota: Partial<ResourceQuota>;
  metadata?: Record<string, unknown>;
}

export interface Sandbox {
  id: SandboxId;
  name: string;
  status: SandboxStatus;
  isolationLevel: IsolationLevel;
  capabilities: Set<Capability>;
  quota: ResourceQuota;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

// ========== Security Features ==========

export type SecurityFeature = "mte" | "pac" | "tee" | "trustzone";

export interface SecurityConfig {
  mte?: {
    enabled: boolean;
    mode: "sync" | "async" | "asymm";
  };
  pac?: {
    enabled: boolean;
    keys: ("IA" | "IB" | "DA" | "DB")[];
  };
  tee?: {
    enabled: boolean;
    provider: "itrustee";
  };
}

// ========== Execution ==========

export type ExecutionId = string;

export interface ExecutionContext {
  sandboxId: SandboxId;
  workspace: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface ExecutionResult {
  executionId: ExecutionId;
  sandboxId: SandboxId;
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  metrics: {
    cpuTime: number;
    memoryPeakMB: number;
  };
}

// ========== Quota ==========

export interface QuotaUsage {
  inferences: number;
  tokens: number;
  cpuSeconds: number;
  memoryMB: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: Partial<ResourceQuota>;
  reason?: string;
}

// ========== Attestation ==========

export interface AttestationReport {
  sandboxId: SandboxId;
  platform: string;
  timestamp: string;
  tpm?: {
    quote: string;
    pcrs: Record<number, string>;
  };
  tee?: {
    quote: string;
    taVersion: string;
  };
  signature: string;
}

export interface AttestationResult {
  valid: boolean;
  report: AttestationReport;
  checks: {
    tpm: boolean;
    tee: boolean;
    signature: boolean;
  };
}

// ========== Tool Definitions ==========

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  riskLevel: "low" | "medium" | "high" | "critical";
  requiredCapabilities: Capability[];
}

// ========== Errors ==========

export class SandboxError extends Error {
  constructor(
    message: string,
    public code: string,
    public sandboxId?: SandboxId
  ) {
    super(message);
    this.name = "SandboxError";
  }
}

export class QuotaExceededError extends SandboxError {
  constructor(sandboxId: SandboxId, resource: string) {
    super(`Quota exceeded: ${resource}`, "QUOTA_EXCEEDED", sandboxId);
    this.name = "QuotaExceededError";
  }
}

export class CapabilityDeniedError extends SandboxError {
  constructor(sandboxId: SandboxId, capability: Capability) {
    super(`Capability denied: ${capability}`, "CAPABILITY_DENIED", sandboxId);
    this.name = "CapabilityDeniedError";
  }
}

export class IsolationError extends SandboxError {
  constructor(message: string, sandboxId: SandboxId) {
    super(message, "ISOLATION_ERROR", sandboxId);
    this.name = "IsolationError";
  }
}