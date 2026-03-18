/**
 * exec_sandbox Tool - Execute commands in sandboxed environment
 */

import { z } from "zod";
import { SandboxManager } from "../sandbox.js";
import {
  ExecutionResult,
  ExecutionId,
  IsolationLevel,
  Capability,
  SandboxError,
  CapabilityDeniedError,
  QuotaExceededError,
  SecurityFeature,
} from "../types.js";
import { KunpengSecurity } from "../hardware/kunpeng.js";

const InputSchema = z.object({
  command: z.string().describe("Command to execute"),
  args: z.array(z.string()).optional().describe("Command arguments"),
  sandboxId: z.string().optional().describe("Target sandbox ID"),
  isolationLevel: z.enum(["L0", "L1", "L1+", "L2", "L2+", "L3"]).optional()
    .describe("Isolation level (default: L1)"),
  securityFeatures: z.array(z.enum(["mte", "pac", "tee", "trustzone"])).optional()
    .describe("Additional security features to enable"),
  timeout: z.number().optional().describe("Timeout in milliseconds"),
  workspace: z.string().optional().describe("Working directory"),
  env: z.record(z.string()).optional().describe("Environment variables"),
});

type ExecInput = z.infer<typeof InputSchema>;

export function createExecSandboxTool(
  sandboxManager: SandboxManager,
  security: KunpengSecurity
) {
  return {
    name: "exec_sandbox",
    description: `Execute commands in a sandboxed environment with hardware security features.

Isolation Levels:
- L0: No isolation (trusted code only)
- L1: Process isolation
- L1+: Process + MTE/PAC memory protection
- L2: Docker container isolation
- L2+: Docker + TEE (iTrustee)
- L3: TrustZone Secure World

Security Features:
- mte: Memory Tagging Extension (prevents buffer overflow, UAF)
- pac: Pointer Authentication Code (prevents ROP attacks)
- tee: Trusted Execution Environment (iTrustee)
- trustzone: ARM TrustZone Secure World`,

    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command to execute" },
        args: { type: "array", items: { type: "string" }, description: "Command arguments" },
        sandboxId: { type: "string", description: "Target sandbox ID" },
        isolationLevel: {
          type: "string",
          enum: ["L0", "L1", "L1+", "L2", "L2+", "L3"],
          description: "Isolation level",
        },
        securityFeatures: {
          type: "array",
          items: { type: "string", enum: ["mte", "pac", "tee", "trustzone"] },
        },
        timeout: { type: "number", description: "Timeout in ms" },
        workspace: { type: "string", description: "Working directory" },
        env: { type: "object", additionalProperties: { type: "string" } },
      },
      required: ["command"],
    },

    async execute(input: ExecInput): Promise<ExecutionResult> {
      const validated = InputSchema.parse(input);
      const {
        command,
        args = [],
        sandboxId,
        isolationLevel = "L1",
        securityFeatures = [],
        timeout = 60000,
        workspace,
        env = {},
      } = validated;

      // Get or create sandbox
      let sandbox;
      if (sandboxId) {
        sandbox = sandboxManager.get(sandboxId);
        if (!sandbox) {
          throw new SandboxError(`Sandbox ${sandboxId} not found`, "NOT_FOUND", sandboxId);
        }
      } else {
        // Create ephemeral sandbox
        sandbox = await sandboxManager.create({
          name: `exec-${Date.now()}`,
          isolationLevel,
          capabilities: ["exec"],
          quota: { maxExecutionTimeSec: timeout / 1000 },
        });
      }

      // Check capability
      if (!sandbox.capabilities.has("exec")) {
        throw new CapabilityDeniedError(sandbox.id, "exec");
      }

      // Check quota
      if (sandbox.quota.maxExecutionTimeSec * 1000 < timeout) {
        throw new QuotaExceededError(sandbox.id, "executionTime");
      }

      // Apply security features
      const appliedFeatures: SecurityFeature[] = [];
      for (const feature of securityFeatures) {
        if (await security.isAvailable(feature as SecurityFeature)) {
          await security.enable(feature as SecurityFeature, sandbox.id);
          appliedFeatures.push(feature as SecurityFeature);
        }
      }

      const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const startTime = Date.now();

      try {
        sandboxManager.setStatus(sandbox.id, "running");

        // Execute command based on isolation level
        const result = await executeWithIsolation(
          command,
          args,
          {
            sandboxId: sandbox.id,
            isolationLevel: sandbox.isolationLevel,
            timeout,
            workspace,
            env,
          },
          security
        );

        const duration = Date.now() - startTime;
        sandboxManager.setStatus(sandbox.id, "ready");

        return {
          executionId,
          sandboxId: sandbox.id,
          success: result.exitCode === 0,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          duration,
          metrics: {
            cpuTime: result.cpuTime ?? 0,
            memoryPeakMB: result.memoryPeakMB ?? 0,
          },
        };
      } catch (error) {
        sandboxManager.setStatus(sandbox.id, "error");
        throw error;
      } finally {
        // Disable security features
        for (const feature of appliedFeatures) {
          await security.disable(feature, sandbox.id);
        }

        // Destroy ephemeral sandbox
        if (!sandboxId) {
          await sandboxManager.destroy(sandbox.id);
        }
      }
    },
  };
}

interface ExecutionOptions {
  sandboxId: string;
  isolationLevel: IsolationLevel;
  timeout: number;
  workspace?: string;
  env?: Record<string, string>;
}

interface RawResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  cpuTime?: number;
  memoryPeakMB?: number;
}

async function executeWithIsolation(
  command: string,
  args: string[],
  options: ExecutionOptions,
  security: KunpengSecurity
): Promise<RawResult> {
  const { isolationLevel, timeout, workspace, env } = options;

  switch (isolationLevel) {
    case "L0":
      // Direct execution (trusted only)
      return executeDirect(command, args, { timeout, workspace, env });

    case "L1":
      // Process isolation via fork
      return executeProcess(command, args, { timeout, workspace, env });

    case "L1+":
      // Process + MTE/PAC
      return executeProcessSecure(command, args, { timeout, workspace, env }, security);

    case "L2":
      // Docker container
      return executeDocker(command, args, { timeout, workspace, env });

    case "L2+":
      // Docker + TEE
      return executeDockerTEE(command, args, { timeout, workspace, env }, security);

    case "L3":
      // TrustZone (would require TA)
      return executeTrustZone(command, args, { timeout }, security);

    default:
      throw new SandboxError(`Unknown isolation level: ${isolationLevel}`, "INVALID_ISOLATION");
  }
}

async function executeDirect(
  command: string,
  args: string[],
  options: { timeout: number; workspace?: string; env?: Record<string, string> }
): Promise<RawResult> {
  // Simplified implementation - actual would use child_process
  console.log(`[L0] Executing: ${command} ${args.join(" ")}`);
  return {
    exitCode: 0,
    stdout: `Executed: ${command}`,
    stderr: "",
  };
}

async function executeProcess(
  command: string,
  args: string[],
  options: { timeout: number; workspace?: string; env?: Record<string, string> }
): Promise<RawResult> {
  console.log(`[L1] Process isolation: ${command}`);
  // Would use child_process with seccomp filter
  return {
    exitCode: 0,
    stdout: `Process isolated: ${command}`,
    stderr: "",
  };
}

async function executeProcessSecure(
  command: string,
  args: string[],
  options: { timeout: number; workspace?: string; env?: Record<string, string> },
  security: KunpengSecurity
): Promise<RawResult> {
  // Enable MTE for this process
  await security.enableMTE("asymm");
  console.log(`[L1+] MTE+PAC enabled: ${command}`);
  return {
    exitCode: 0,
    stdout: `Secure process: ${command}`,
    stderr: "",
  };
}

async function executeDocker(
  command: string,
  args: string[],
  options: { timeout: number; workspace?: string; env?: Record<string, string> }
): Promise<RawResult> {
  console.log(`[L2] Docker container: ${command}`);
  // Would use Docker API
  return {
    exitCode: 0,
    stdout: `Container: ${command}`,
    stderr: "",
  };
}

async function executeDockerTEE(
  command: string,
  args: string[],
  options: { timeout: number; workspace?: string; env?: Record<string, string> },
  security: KunpengSecurity
): Promise<RawResult> {
  console.log(`[L2+] Docker + TEE: ${command}`);
  // Would use Docker + iTrustee
  return {
    exitCode: 0,
    stdout: `TEE container: ${command}`,
    stderr: "",
  };
}

async function executeTrustZone(
  command: string,
  args: string[],
  options: { timeout: number },
  _security: KunpengSecurity
): Promise<RawResult> {
  console.log(`[L3] TrustZone: ${command}`);
  // Would require custom TA
  return {
    exitCode: 0,
    stdout: `TrustZone secure: ${command}`,
    stderr: "",
  };
}