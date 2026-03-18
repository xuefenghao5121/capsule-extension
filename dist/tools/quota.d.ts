/**
 * Quota Management Tools
 */
import { z } from "zod";
import { SandboxManager } from "../sandbox.js";
declare const CheckInputSchema: z.ZodObject<{
    sandboxId: z.ZodString;
    inferences: z.ZodOptional<z.ZodNumber>;
    tokens: z.ZodOptional<z.ZodNumber>;
    cpuSeconds: z.ZodOptional<z.ZodNumber>;
    memoryMB: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
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
}>;
declare const RecordInputSchema: z.ZodObject<{
    sandboxId: z.ZodString;
    inferences: z.ZodOptional<z.ZodNumber>;
    tokens: z.ZodOptional<z.ZodNumber>;
    cpuSeconds: z.ZodOptional<z.ZodNumber>;
    memoryMB: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
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
}>;
export declare function createQuotaTools(sandboxManager: SandboxManager): {
    quota_check: {
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
        execute(input: z.infer<typeof CheckInputSchema>): Promise<{
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
            quota: import("../types.js").ResourceQuota;
        }>;
    };
    quota_record: {
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
        execute(input: z.infer<typeof RecordInputSchema>): Promise<{
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
    };
};
export {};
//# sourceMappingURL=quota.d.ts.map