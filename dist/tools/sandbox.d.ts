/**
 * Sandbox Management Tools
 */
import { z } from "zod";
import { SandboxManager } from "../sandbox.js";
import { IsolationLevel, Capability, ResourceQuota } from "../types.js";
declare const CreateInputSchema: z.ZodObject<{
    name: z.ZodString;
    isolationLevel: z.ZodDefault<z.ZodOptional<z.ZodEnum<["L0", "L1", "L1+", "L2", "L2+", "L3"]>>>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodEnum<["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"]>, "many">>;
    quota: z.ZodOptional<z.ZodObject<{
        maxInferencePerHour: z.ZodOptional<z.ZodNumber>;
        maxTokensPerDay: z.ZodOptional<z.ZodNumber>;
        maxCpuPercent: z.ZodOptional<z.ZodNumber>;
        maxMemoryMB: z.ZodOptional<z.ZodNumber>;
        maxExecutionTimeSec: z.ZodOptional<z.ZodNumber>;
        maxWorkspaceMB: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxCpuPercent?: number | undefined;
        maxMemoryMB?: number | undefined;
        maxInferencePerHour?: number | undefined;
        maxTokensPerDay?: number | undefined;
        maxExecutionTimeSec?: number | undefined;
        maxWorkspaceMB?: number | undefined;
    }, {
        maxCpuPercent?: number | undefined;
        maxMemoryMB?: number | undefined;
        maxInferencePerHour?: number | undefined;
        maxTokensPerDay?: number | undefined;
        maxExecutionTimeSec?: number | undefined;
        maxWorkspaceMB?: number | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    isolationLevel: "L1" | "L2" | "L2+" | "L3" | "L0" | "L1+";
    name: string;
    capabilities?: ("exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools")[] | undefined;
    quota?: {
        maxCpuPercent?: number | undefined;
        maxMemoryMB?: number | undefined;
        maxInferencePerHour?: number | undefined;
        maxTokensPerDay?: number | undefined;
        maxExecutionTimeSec?: number | undefined;
        maxWorkspaceMB?: number | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    name: string;
    isolationLevel?: "L1" | "L2" | "L2+" | "L3" | "L0" | "L1+" | undefined;
    capabilities?: ("exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools")[] | undefined;
    quota?: {
        maxCpuPercent?: number | undefined;
        maxMemoryMB?: number | undefined;
        maxInferencePerHour?: number | undefined;
        maxTokensPerDay?: number | undefined;
        maxExecutionTimeSec?: number | undefined;
        maxWorkspaceMB?: number | undefined;
    } | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
declare const DestroyInputSchema: z.ZodObject<{
    sandboxId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sandboxId: string;
}, {
    sandboxId: string;
}>;
export declare function createSandboxTools(sandboxManager: SandboxManager): {
    sandbox_create: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                name: {
                    type: string;
                    description: string;
                };
                isolationLevel: {
                    type: string;
                    enum: string[];
                    default: string;
                };
                capabilities: {
                    type: string;
                    items: {
                        type: string;
                        enum: string[];
                    };
                };
                quota: {
                    type: string;
                    properties: {
                        maxInferencePerHour: {
                            type: string;
                        };
                        maxTokensPerDay: {
                            type: string;
                        };
                        maxCpuPercent: {
                            type: string;
                        };
                        maxMemoryMB: {
                            type: string;
                        };
                        maxExecutionTimeSec: {
                            type: string;
                        };
                        maxWorkspaceMB: {
                            type: string;
                        };
                    };
                };
                metadata: {
                    type: string;
                };
            };
            required: string[];
        };
        execute(input: z.infer<typeof CreateInputSchema>): Promise<{
            success: boolean;
            sandbox: {
                id: string;
                name: string;
                status: import("../types.js").SandboxStatus;
                isolationLevel: IsolationLevel;
                capabilities: Capability[];
                quota: ResourceQuota;
                createdAt: string;
            };
        }>;
    };
    sandbox_destroy: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                sandboxId: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        execute(input: z.infer<typeof DestroyInputSchema>): Promise<{
            success: boolean;
            message: string;
        }>;
    };
    sandbox_list: {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {};
        };
        execute(): Promise<{
            total: number;
            byStatus: Record<import("../types.js").SandboxStatus, number>;
            byIsolation: Record<IsolationLevel, number>;
            sandboxes: {
                id: string;
                name: string;
                status: import("../types.js").SandboxStatus;
                isolationLevel: IsolationLevel;
                capabilities: Capability[];
                createdAt: string;
            }[];
        }>;
    };
};
export {};
//# sourceMappingURL=sandbox.d.ts.map