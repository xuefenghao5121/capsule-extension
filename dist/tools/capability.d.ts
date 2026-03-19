/**
 * Capability Management Tools
 */
import { z } from "zod";
import { SandboxManager } from "../sandbox.js";
import { Capability } from "../types.js";
declare const CheckInputSchema: z.ZodObject<{
    sandboxId: z.ZodString;
    capability: z.ZodEnum<["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"]>;
}, "strip", z.ZodTypeAny, {
    sandboxId: string;
    capability: "exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools";
}, {
    sandboxId: string;
    capability: "exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools";
}>;
declare const GrantInputSchema: z.ZodObject<{
    sandboxId: z.ZodString;
    capabilities: z.ZodArray<z.ZodEnum<["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"]>, "many">;
}, "strip", z.ZodTypeAny, {
    capabilities: ("exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools")[];
    sandboxId: string;
}, {
    capabilities: ("exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools")[];
    sandboxId: string;
}>;
declare const RevokeInputSchema: z.ZodObject<{
    sandboxId: z.ZodString;
    capabilities: z.ZodArray<z.ZodEnum<["file_read", "file_write", "exec", "network", "browser", "memory", "sessions", "tools", "spawn"]>, "many">;
}, "strip", z.ZodTypeAny, {
    capabilities: ("exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools")[];
    sandboxId: string;
}, {
    capabilities: ("exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools")[];
    sandboxId: string;
}>;
export declare function createCapabilityTools(sandboxManager: SandboxManager): {
    capability_check: {
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
        execute(input: z.infer<typeof CheckInputSchema>): Promise<{
            sandboxId: string;
            capability: "exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools";
            granted: boolean;
        }>;
    };
    capability_grant: {
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
        execute(input: z.infer<typeof GrantInputSchema>): Promise<{
            success: boolean;
            sandboxId: string;
            granted: ("exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools")[];
            currentCapabilities: Capability[];
        }>;
    };
    capability_revoke: {
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
        execute(input: z.infer<typeof RevokeInputSchema>): Promise<{
            success: boolean;
            sandboxId: string;
            revoked: ("exec" | "file_read" | "file_write" | "spawn" | "network" | "browser" | "memory" | "sessions" | "tools")[];
            currentCapabilities: Capability[];
        }>;
    };
};
export {};
//# sourceMappingURL=capability.d.ts.map