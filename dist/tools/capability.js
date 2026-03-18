/**
 * Capability Management Tools
 */
import { z } from "zod";
import { SandboxError } from "../types.js";
const CheckInputSchema = z.object({
    sandboxId: z.string().describe("Sandbox ID"),
    capability: z.enum([
        "file_read", "file_write", "exec", "network",
        "browser", "memory", "sessions", "tools", "spawn"
    ]).describe("Capability to check"),
});
const GrantInputSchema = z.object({
    sandboxId: z.string().describe("Sandbox ID"),
    capabilities: z.array(z.enum([
        "file_read", "file_write", "exec", "network",
        "browser", "memory", "sessions", "tools", "spawn"
    ])).describe("Capabilities to grant"),
});
const RevokeInputSchema = z.object({
    sandboxId: z.string().describe("Sandbox ID"),
    capabilities: z.array(z.enum([
        "file_read", "file_write", "exec", "network",
        "browser", "memory", "sessions", "tools", "spawn"
    ])).describe("Capabilities to revoke"),
});
export function createCapabilityTools(sandboxManager) {
    return {
        capability_check: {
            name: "capability_check",
            description: `Check if a sandbox has a specific capability.

Capabilities:
- file_read: Read files
- file_write: Write files
- exec: Execute commands
- network: Network access
- browser: Browser automation
- memory: Memory management
- sessions: Session management
- tools: Tool management
- spawn: Create child processes`,
            inputSchema: {
                type: "object",
                properties: {
                    sandboxId: { type: "string", description: "Sandbox ID" },
                    capability: {
                        type: "string",
                        enum: ["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"],
                        description: "Capability to check",
                    },
                },
                required: ["sandboxId", "capability"],
            },
            async execute(input) {
                const validated = CheckInputSchema.parse(input);
                const sandbox = sandboxManager.get(validated.sandboxId);
                if (!sandbox) {
                    throw new SandboxError(`Sandbox ${validated.sandboxId} not found`, "NOT_FOUND", validated.sandboxId);
                }
                const hasCapability = sandboxManager.hasCapability(validated.sandboxId, validated.capability);
                return {
                    sandboxId: validated.sandboxId,
                    capability: validated.capability,
                    granted: hasCapability,
                };
            },
        },
        capability_grant: {
            name: "capability_grant",
            description: "Grant capabilities to a sandbox.",
            inputSchema: {
                type: "object",
                properties: {
                    sandboxId: { type: "string", description: "Sandbox ID" },
                    capabilities: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"],
                        },
                        description: "Capabilities to grant",
                    },
                },
                required: ["sandboxId", "capabilities"],
            },
            async execute(input) {
                const validated = GrantInputSchema.parse(input);
                const sandbox = sandboxManager.get(validated.sandboxId);
                if (!sandbox) {
                    throw new SandboxError(`Sandbox ${validated.sandboxId} not found`, "NOT_FOUND", validated.sandboxId);
                }
                for (const cap of validated.capabilities) {
                    sandboxManager.grantCapability(validated.sandboxId, cap);
                }
                return {
                    success: true,
                    sandboxId: validated.sandboxId,
                    granted: validated.capabilities,
                    currentCapabilities: Array.from(sandbox.capabilities),
                };
            },
        },
        capability_revoke: {
            name: "capability_revoke",
            description: "Revoke capabilities from a sandbox.",
            inputSchema: {
                type: "object",
                properties: {
                    sandboxId: { type: "string", description: "Sandbox ID" },
                    capabilities: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"],
                        },
                        description: "Capabilities to revoke",
                    },
                },
                required: ["sandboxId", "capabilities"],
            },
            async execute(input) {
                const validated = RevokeInputSchema.parse(input);
                const sandbox = sandboxManager.get(validated.sandboxId);
                if (!sandbox) {
                    throw new SandboxError(`Sandbox ${validated.sandboxId} not found`, "NOT_FOUND", validated.sandboxId);
                }
                for (const cap of validated.capabilities) {
                    sandboxManager.revokeCapability(validated.sandboxId, cap);
                }
                return {
                    success: true,
                    sandboxId: validated.sandboxId,
                    revoked: validated.capabilities,
                    currentCapabilities: Array.from(sandbox.capabilities),
                };
            },
        },
    };
}
//# sourceMappingURL=capability.js.map