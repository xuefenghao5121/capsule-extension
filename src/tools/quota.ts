/**
 * Quota Management Tools
 */

import { z } from "zod";
import { SandboxManager } from "../sandbox.js";
import { SandboxError, QuotaUsage } from "../types.js";

const CheckInputSchema = z.object({
  sandboxId: z.string().describe("Sandbox ID"),
  inferences: z.number().optional().describe("Inferences to check"),
  tokens: z.number().optional().describe("Tokens to check"),
  cpuSeconds: z.number().optional().describe("CPU seconds to check"),
  memoryMB: z.number().optional().describe("Memory MB to check"),
});

const RecordInputSchema = z.object({
  sandboxId: z.string().describe("Sandbox ID"),
  inferences: z.number().optional().describe("Inferences used"),
  tokens: z.number().optional().describe("Tokens used"),
  cpuSeconds: z.number().optional().describe("CPU seconds used"),
  memoryMB: z.number().optional().describe("Memory MB used"),
});

export function createQuotaTools(sandboxManager: SandboxManager) {
  // Track usage per sandbox
  const usage: Map<string, { inferences: number; tokens: number; cpuSeconds: number; memoryMB: number }> = new Map();

  return {
    quota_check: {
      name: "quota_check",
      description: `Check if a sandbox has enough quota for the requested resources.

Quota Types:
- inferences: Number of AI inferences
- tokens: Number of tokens used
- cpuSeconds: CPU time in seconds
- memoryMB: Memory usage in MB`,

      inputSchema: {
        type: "object",
        properties: {
          sandboxId: { type: "string", description: "Sandbox ID" },
          inferences: { type: "number", description: "Inferences to check" },
          tokens: { type: "number", description: "Tokens to check" },
          cpuSeconds: { type: "number", description: "CPU seconds to check" },
          memoryMB: { type: "number", description: "Memory MB to check" },
        },
        required: ["sandboxId"],
      },

      async execute(input: z.infer<typeof CheckInputSchema>) {
        const validated = CheckInputSchema.parse(input);
        const sandbox = sandboxManager.get(validated.sandboxId);

        if (!sandbox) {
          throw new SandboxError(
            `Sandbox ${validated.sandboxId} not found`,
            "NOT_FOUND",
            validated.sandboxId
          );
        }

        const currentUsage = usage.get(validated.sandboxId) ?? {
          inferences: 0,
          tokens: 0,
          cpuSeconds: 0,
          memoryMB: 0,
        };

        const quota = sandbox.quota;
        const checks: { resource: string; allowed: boolean; remaining: number }[] = [];

        // Check inferences
        if (validated.inferences !== undefined) {
          const remaining = quota.maxInferencePerHour - currentUsage.inferences;
          checks.push({
            resource: "inferences",
            allowed: remaining >= validated.inferences,
            remaining,
          });
        }

        // Check tokens
        if (validated.tokens !== undefined) {
          const remaining = quota.maxTokensPerDay - currentUsage.tokens;
          checks.push({
            resource: "tokens",
            allowed: remaining >= validated.tokens,
            remaining,
          });
        }

        // Check CPU
        if (validated.cpuSeconds !== undefined) {
          const remaining = quota.maxExecutionTimeSec - currentUsage.cpuSeconds;
          checks.push({
            resource: "cpuSeconds",
            allowed: remaining >= validated.cpuSeconds,
            remaining,
          });
        }

        // Check memory
        if (validated.memoryMB !== undefined) {
          checks.push({
            resource: "memoryMB",
            allowed: validated.memoryMB <= quota.maxMemoryMB,
            remaining: quota.maxMemoryMB - currentUsage.memoryMB,
          });
        }

        const allowed = checks.every((c) => c.allowed);

        return {
          sandboxId: validated.sandboxId,
          allowed,
          checks,
          currentUsage,
          quota,
        };
      },
    },

    quota_record: {
      name: "quota_record",
      description: "Record resource usage for a sandbox.",

      inputSchema: {
        type: "object",
        properties: {
          sandboxId: { type: "string", description: "Sandbox ID" },
          inferences: { type: "number", description: "Inferences used" },
          tokens: { type: "number", description: "Tokens used" },
          cpuSeconds: { type: "number", description: "CPU seconds used" },
          memoryMB: { type: "number", description: "Memory MB used" },
        },
        required: ["sandboxId"],
      },

      async execute(input: z.infer<typeof RecordInputSchema>) {
        const validated = RecordInputSchema.parse(input);
        const sandbox = sandboxManager.get(validated.sandboxId);

        if (!sandbox) {
          throw new SandboxError(
            `Sandbox ${validated.sandboxId} not found`,
            "NOT_FOUND",
            validated.sandboxId
          );
        }

        // Get or initialize usage
        let current = usage.get(validated.sandboxId);
        if (!current) {
          current = { inferences: 0, tokens: 0, cpuSeconds: 0, memoryMB: 0 };
          usage.set(validated.sandboxId, current);
        }

        // Update usage
        if (validated.inferences !== undefined) current.inferences += validated.inferences;
        if (validated.tokens !== undefined) current.tokens += validated.tokens;
        if (validated.cpuSeconds !== undefined) current.cpuSeconds += validated.cpuSeconds;
        if (validated.memoryMB !== undefined) current.memoryMB = Math.max(current.memoryMB, validated.memoryMB);

        return {
          success: true,
          sandboxId: validated.sandboxId,
          recorded: {
            inferences: validated.inferences,
            tokens: validated.tokens,
            cpuSeconds: validated.cpuSeconds,
            memoryMB: validated.memoryMB,
          },
          totalUsage: current,
        };
      },
    },
  };
}