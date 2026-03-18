/**
 * Capsule Extension - Main Entry Point
 *
 * OpenClaw extension for sandbox-centric security with Kunpeng hardware optimization
 */
import { SandboxManager } from "./sandbox.js";
import { KunpengSecurity } from "./hardware/kunpeng.js";
export * from "./types.js";
export { SandboxManager } from "./sandbox.js";
export { KunpengSecurity } from "./hardware/kunpeng.js";
/**
 * Extension configuration
 */
export interface CapsuleConfig {
    workspaceRoot: string;
    maxSandboxes?: number;
    securityEnabled?: boolean;
    defaultIsolation?: "L0" | "L1" | "L1+" | "L2" | "L2+" | "L3";
}
/**
 * Create the Capsule extension
 */
export declare function createCapsuleExtension(config?: Partial<CapsuleConfig>): {
    id: string;
    version: string;
    description: string;
    tools: ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                command: {
                    type: string;
                    description: string;
                };
                args: {
                    type: string;
                    items: {
                        type: string;
                    };
                    description: string;
                };
                sandboxId: {
                    type: string;
                    description: string;
                };
                isolationLevel: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                securityFeatures: {
                    type: string;
                    items: {
                        type: string;
                        enum: string[];
                    };
                };
                timeout: {
                    type: string;
                    description: string;
                };
                workspace: {
                    type: string;
                    description: string;
                };
                env: {
                    type: string;
                    additionalProperties: {
                        type: string;
                    };
                };
            };
            required: string[];
        };
        execute(input: {
            command: string;
            args?: string[] | undefined;
            sandboxId?: string | undefined;
            isolationLevel?: "L0" | "L1" | "L1+" | "L2" | "L2+" | "L3" | undefined;
            securityFeatures?: ("mte" | "pac" | "tee" | "trustzone")[] | undefined;
            timeout?: number | undefined;
            workspace?: string | undefined;
            env?: Record<string, string> | undefined;
        }): Promise<import("./types.js").ExecutionResult>;
    } | {
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
        execute(input: import("zod").TypeOf<import("zod").ZodObject<{
            name: import("zod").ZodString;
            isolationLevel: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["L0", "L1", "L1+", "L2", "L2+", "L3"]>>>;
            capabilities: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEnum<["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"]>, "many">>;
            quota: import("zod").ZodOptional<import("zod").ZodObject<{
                maxInferencePerHour: import("zod").ZodOptional<import("zod").ZodNumber>;
                maxTokensPerDay: import("zod").ZodOptional<import("zod").ZodNumber>;
                maxCpuPercent: import("zod").ZodOptional<import("zod").ZodNumber>;
                maxMemoryMB: import("zod").ZodOptional<import("zod").ZodNumber>;
                maxExecutionTimeSec: import("zod").ZodOptional<import("zod").ZodNumber>;
                maxWorkspaceMB: import("zod").ZodOptional<import("zod").ZodNumber>;
            }, "strip", import("zod").ZodTypeAny, {
                maxInferencePerHour?: number | undefined;
                maxTokensPerDay?: number | undefined;
                maxCpuPercent?: number | undefined;
                maxMemoryMB?: number | undefined;
                maxExecutionTimeSec?: number | undefined;
                maxWorkspaceMB?: number | undefined;
            }, {
                maxInferencePerHour?: number | undefined;
                maxTokensPerDay?: number | undefined;
                maxCpuPercent?: number | undefined;
                maxMemoryMB?: number | undefined;
                maxExecutionTimeSec?: number | undefined;
                maxWorkspaceMB?: number | undefined;
            }>>;
            metadata: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>;
        }, "strip", import("zod").ZodTypeAny, {
            isolationLevel: "L0" | "L1" | "L1+" | "L2" | "L2+" | "L3";
            name: string;
            capabilities?: ("file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn")[] | undefined;
            quota?: {
                maxInferencePerHour?: number | undefined;
                maxTokensPerDay?: number | undefined;
                maxCpuPercent?: number | undefined;
                maxMemoryMB?: number | undefined;
                maxExecutionTimeSec?: number | undefined;
                maxWorkspaceMB?: number | undefined;
            } | undefined;
            metadata?: Record<string, unknown> | undefined;
        }, {
            name: string;
            isolationLevel?: "L0" | "L1" | "L1+" | "L2" | "L2+" | "L3" | undefined;
            capabilities?: ("file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn")[] | undefined;
            quota?: {
                maxInferencePerHour?: number | undefined;
                maxTokensPerDay?: number | undefined;
                maxCpuPercent?: number | undefined;
                maxMemoryMB?: number | undefined;
                maxExecutionTimeSec?: number | undefined;
                maxWorkspaceMB?: number | undefined;
            } | undefined;
            metadata?: Record<string, unknown> | undefined;
        }>>): Promise<{
            success: boolean;
            sandbox: {
                id: string;
                name: string;
                status: import("./types.js").SandboxStatus;
                isolationLevel: import("./types.js").IsolationLevel;
                capabilities: import("./types.js").Capability[];
                quota: import("./types.js").ResourceQuota;
                createdAt: string;
            };
        }>;
    } | {
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
        execute(input: import("zod").TypeOf<import("zod").ZodObject<{
            sandboxId: import("zod").ZodString;
        }, "strip", import("zod").ZodTypeAny, {
            sandboxId: string;
        }, {
            sandboxId: string;
        }>>): Promise<{
            success: boolean;
            message: string;
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {};
        };
        execute(): Promise<{
            total: number;
            byStatus: Record<import("./types.js").SandboxStatus, number>;
            byIsolation: Record<import("./types.js").IsolationLevel, number>;
            sandboxes: {
                id: string;
                name: string;
                status: import("./types.js").SandboxStatus;
                isolationLevel: import("./types.js").IsolationLevel;
                capabilities: import("./types.js").Capability[];
                createdAt: string;
            }[];
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                sandboxId: {
                    type: string;
                    description: string;
                };
                capability: {
                    type: string;
                    enum: string[];
                    description: string;
                };
            };
            required: string[];
        };
        execute(input: import("zod").TypeOf<import("zod").ZodObject<{
            sandboxId: import("zod").ZodString;
            capability: import("zod").ZodEnum<["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"]>;
        }, "strip", import("zod").ZodTypeAny, {
            sandboxId: string;
            capability: "file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn";
        }, {
            sandboxId: string;
            capability: "file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn";
        }>>): Promise<{
            sandboxId: string;
            capability: "file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn";
            granted: boolean;
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                sandboxId: {
                    type: string;
                    description: string;
                };
                capabilities: {
                    type: string;
                    items: {
                        type: string;
                        enum: string[];
                    };
                    description: string;
                };
            };
            required: string[];
        };
        execute(input: import("zod").TypeOf<import("zod").ZodObject<{
            sandboxId: import("zod").ZodString;
            capabilities: import("zod").ZodArray<import("zod").ZodEnum<["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"]>, "many">;
        }, "strip", import("zod").ZodTypeAny, {
            sandboxId: string;
            capabilities: ("file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn")[];
        }, {
            sandboxId: string;
            capabilities: ("file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn")[];
        }>>): Promise<{
            success: boolean;
            sandboxId: string;
            granted: ("file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn")[];
            currentCapabilities: import("./types.js").Capability[];
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                sandboxId: {
                    type: string;
                    description: string;
                };
                capabilities: {
                    type: string;
                    items: {
                        type: string;
                        enum: string[];
                    };
                    description: string;
                };
            };
            required: string[];
        };
        execute(input: import("zod").TypeOf<import("zod").ZodObject<{
            sandboxId: import("zod").ZodString;
            capabilities: import("zod").ZodArray<import("zod").ZodEnum<["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"]>, "many">;
        }, "strip", import("zod").ZodTypeAny, {
            sandboxId: string;
            capabilities: ("file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn")[];
        }, {
            sandboxId: string;
            capabilities: ("file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn")[];
        }>>): Promise<{
            success: boolean;
            sandboxId: string;
            revoked: ("file_read" | "file_write" | "exec" | "network" | "browser" | "memory" | "sessions" | "tools" | "spawn")[];
            currentCapabilities: import("./types.js").Capability[];
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                sandboxId: {
                    type: string;
                    description: string;
                };
                inferences: {
                    type: string;
                    description: string;
                };
                tokens: {
                    type: string;
                    description: string;
                };
                cpuSeconds: {
                    type: string;
                    description: string;
                };
                memoryMB: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        execute(input: import("zod").TypeOf<import("zod").ZodObject<{
            sandboxId: import("zod").ZodString;
            inferences: import("zod").ZodOptional<import("zod").ZodNumber>;
            tokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cpuSeconds: import("zod").ZodOptional<import("zod").ZodNumber>;
            memoryMB: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, "strip", import("zod").ZodTypeAny, {
            sandboxId: string;
            inferences?: number | undefined;
            tokens?: number | undefined;
            cpuSeconds?: number | undefined;
            memoryMB?: number | undefined;
        }, {
            sandboxId: string;
            inferences?: number | undefined;
            tokens?: number | undefined;
            cpuSeconds?: number | undefined;
            memoryMB?: number | undefined;
        }>>): Promise<{
            sandboxId: string;
            allowed: boolean;
            checks: {
                resource: string;
                allowed: boolean;
                remaining: number;
            }[];
            currentUsage: {
                inferences: number;
                tokens: number;
                cpuSeconds: number;
                memoryMB: number;
            };
            quota: import("./types.js").ResourceQuota;
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                sandboxId: {
                    type: string;
                    description: string;
                };
                inferences: {
                    type: string;
                    description: string;
                };
                tokens: {
                    type: string;
                    description: string;
                };
                cpuSeconds: {
                    type: string;
                    description: string;
                };
                memoryMB: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        execute(input: import("zod").TypeOf<import("zod").ZodObject<{
            sandboxId: import("zod").ZodString;
            inferences: import("zod").ZodOptional<import("zod").ZodNumber>;
            tokens: import("zod").ZodOptional<import("zod").ZodNumber>;
            cpuSeconds: import("zod").ZodOptional<import("zod").ZodNumber>;
            memoryMB: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, "strip", import("zod").ZodTypeAny, {
            sandboxId: string;
            inferences?: number | undefined;
            tokens?: number | undefined;
            cpuSeconds?: number | undefined;
            memoryMB?: number | undefined;
        }, {
            sandboxId: string;
            inferences?: number | undefined;
            tokens?: number | undefined;
            cpuSeconds?: number | undefined;
            memoryMB?: number | undefined;
        }>>): Promise<{
            success: boolean;
            sandboxId: string;
            recorded: {
                inferences: number | undefined;
                tokens: number | undefined;
                cpuSeconds: number | undefined;
                memoryMB: number | undefined;
            };
            totalUsage: {
                inferences: number;
                tokens: number;
                cpuSeconds: number;
                memoryMB: number;
            };
        }>;
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                action: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                sandboxId: {
                    type: string;
                    description: string;
                };
                nonce: {
                    type: string;
                    description: string;
                };
                report: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        execute(input: import("zod").TypeOf<import("zod").ZodObject<{
            action: import("zod").ZodEnum<["generate", "verify"]>;
            sandboxId: import("zod").ZodOptional<import("zod").ZodString>;
            nonce: import("zod").ZodOptional<import("zod").ZodString>;
            report: import("zod").ZodOptional<import("zod").ZodString>;
        }, "strip", import("zod").ZodTypeAny, {
            action: "generate" | "verify";
            sandboxId?: string | undefined;
            nonce?: string | undefined;
            report?: string | undefined;
        }, {
            action: "generate" | "verify";
            sandboxId?: string | undefined;
            nonce?: string | undefined;
            report?: string | undefined;
        }>>): Promise<{
            success: boolean;
            report: {
                signature: string;
                sandboxId: string;
                platform: string;
                timestamp: string;
                nonce: string;
                securityFeatures: {
                    feature: import("./types.js").SecurityFeature;
                    available: boolean;
                    enabled: boolean;
                    version: string | undefined;
                }[];
                tpm: {
                    quote: string;
                    pcrs: Record<number, string>;
                } | undefined;
                tee: {
                    quote: string;
                    taVersion: string;
                } | undefined;
            };
        } | {
            valid: boolean;
            report: any;
            checks: {
                tpm: boolean;
                tee: boolean;
                signature: boolean;
                freshness: boolean;
            };
            message: string;
            error?: undefined;
        } | {
            valid: boolean;
            error: string;
            report?: undefined;
            checks?: undefined;
            message?: undefined;
        }>;
    })[];
    init(): Promise<void>;
    shutdown(): Promise<void>;
    internals: {
        sandboxManager: SandboxManager;
        security: KunpengSecurity;
    };
};
export default createCapsuleExtension;
//# sourceMappingURL=index.d.ts.map