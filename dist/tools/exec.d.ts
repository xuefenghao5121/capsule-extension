/**
 * Secure Execution Tool
 *
 * 让 OpenClaw 可以在安全隔离环境中执行代码
 */
import { z } from "zod";
import { SandboxManager } from "../sandbox.js";
declare const InputSchema: z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isolation: z.ZodOptional<z.ZodEnum<["L1", "L2", "L3"]>>;
    workspace: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    attestBefore: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    command: string;
    timeout?: number | undefined;
    args?: string[] | undefined;
    workspace?: string | undefined;
    env?: Record<string, string> | undefined;
    isolation?: "L1" | "L2" | "L3" | undefined;
    attestBefore?: boolean | undefined;
}, {
    command: string;
    timeout?: number | undefined;
    args?: string[] | undefined;
    workspace?: string | undefined;
    env?: Record<string, string> | undefined;
    isolation?: "L1" | "L2" | "L3" | undefined;
    attestBefore?: boolean | undefined;
}>;
type ExecInput = z.infer<typeof InputSchema>;
interface HardwareCache {
    detected: boolean;
    architecture?: string;
    teeType?: string;
    enabled?: {
        sgx: boolean;
        attestation: boolean;
        sealedStorage: boolean;
    };
}
interface CapsuleConfig {
    defaultIsolation?: "L1" | "L2" | "L3";
}
export declare function createExecTool(sandboxManager: SandboxManager, hwCache: HardwareCache, config: CapsuleConfig): {
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
            };
            isolation: {
                type: string;
                enum: string[];
                description: string;
            };
            workspace: {
                type: string;
            };
            env: {
                type: string;
                additionalProperties: {
                    type: string;
                };
            };
            timeout: {
                type: string;
            };
            attestBefore: {
                type: string;
            };
        };
        required: string[];
    };
    execute(input: ExecInput): Promise<{
        success: boolean;
        exitCode: number;
        stdout: string;
        stderr: string;
        duration: number;
        isolation: string;
        attestation?: {
            report: string;
            signature: string;
        };
        error?: string;
    }>;
};
export {};
//# sourceMappingURL=exec.d.ts.map