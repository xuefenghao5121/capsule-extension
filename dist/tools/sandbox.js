/**
 * Sandbox Management Tools
 */
import { z } from "zod";
const CreateInputSchema = z.object({
    name: z.string().describe("Sandbox name"),
    isolationLevel: z.enum(["L0", "L1", "L1+", "L2", "L2+", "L3"]).optional()
        .default("L1").describe("Isolation level"),
    capabilities: z.array(z.enum([
        "file_read", "file_write", "exec", "network",
        "browser", "memory", "sessions", "tools", "spawn"
    ])).optional().describe("Granted capabilities"),
    quota: z.object({
        maxInferencePerHour: z.number().optional(),
        maxTokensPerDay: z.number().optional(),
        maxCpuPercent: z.number().optional(),
        maxMemoryMB: z.number().optional(),
        maxExecutionTimeSec: z.number().optional(),
        maxWorkspaceMB: z.number().optional(),
    }).optional().describe("Resource quota"),
    metadata: z.record(z.unknown()).optional().describe("Additional metadata"),
});
const DestroyInputSchema = z.object({
    sandboxId: z.string().describe("Sandbox ID to destroy"),
});
const ListInputSchema = z.object({});
export function createSandboxTools(sandboxManager) {
    return {
        sandbox_create: {
            name: "sandbox_create",
            description: `Create a new isolated sandbox.

Isolation Levels:
- L0: No isolation (trusted code only)
- L1: Process isolation (default)
- L1+: Process + MTE/PAC memory protection
- L2: Docker container isolation
- L2+: Docker + TEE (iTrustee)
- L3: TrustZone Secure World

Capabilities define what the sandbox can do:
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
                    name: { type: "string", description: "Sandbox name" },
                    isolationLevel: {
                        type: "string",
                        enum: ["L0", "L1", "L1+", "L2", "L2+", "L3"],
                        default: "L1",
                    },
                    capabilities: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"],
                        },
                    },
                    quota: {
                        type: "object",
                        properties: {
                            maxInferencePerHour: { type: "number" },
                            maxTokensPerDay: { type: "number" },
                            maxCpuPercent: { type: "number" },
                            maxMemoryMB: { type: "number" },
                            maxExecutionTimeSec: { type: "number" },
                            maxWorkspaceMB: { type: "number" },
                        },
                    },
                    metadata: { type: "object" },
                },
                required: ["name"],
            },
            async execute(input) {
                const validated = CreateInputSchema.parse(input);
                const sandbox = await sandboxManager.create({
                    name: validated.name,
                    isolationLevel: validated.isolationLevel,
                    capabilities: (validated.capabilities ?? ["file_read"]),
                    quota: validated.quota,
                    metadata: validated.metadata,
                });
                return {
                    success: true,
                    sandbox: {
                        id: sandbox.id,
                        name: sandbox.name,
                        status: sandbox.status,
                        isolationLevel: sandbox.isolationLevel,
                        capabilities: Array.from(sandbox.capabilities),
                        quota: sandbox.quota,
                        createdAt: sandbox.createdAt.toISOString(),
                    },
                };
            },
        },
        sandbox_destroy: {
            name: "sandbox_destroy",
            description: "Destroy a sandbox and release all resources.",
            inputSchema: {
                type: "object",
                properties: {
                    sandboxId: { type: "string", description: "Sandbox ID to destroy" },
                },
                required: ["sandboxId"],
            },
            async execute(input) {
                const validated = DestroyInputSchema.parse(input);
                await sandboxManager.destroy(validated.sandboxId);
                return {
                    success: true,
                    message: `Sandbox ${validated.sandboxId} destroyed`,
                };
            },
        },
        sandbox_list: {
            name: "sandbox_list",
            description: "List all active sandboxes.",
            inputSchema: {
                type: "object",
                properties: {},
            },
            async execute() {
                const sandboxes = sandboxManager.list();
                const stats = sandboxManager.getStats();
                return {
                    total: stats.total,
                    byStatus: stats.byStatus,
                    byIsolation: stats.byIsolation,
                    sandboxes: sandboxes.map((s) => ({
                        id: s.id,
                        name: s.name,
                        status: s.status,
                        isolationLevel: s.isolationLevel,
                        capabilities: Array.from(s.capabilities),
                        createdAt: s.createdAt.toISOString(),
                    })),
                };
            },
        },
    };
}
//# sourceMappingURL=sandbox.js.map