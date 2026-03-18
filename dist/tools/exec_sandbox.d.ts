/**
 * exec_sandbox Tool - Execute commands in sandboxed environment
 */
import { z } from "zod";
import { SandboxManager } from "../sandbox.js";
import { ExecutionResult } from "../types.js";
import { KunpengSecurity } from "../hardware/kunpeng.js";
declare const InputSchema: z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sandboxId: z.ZodOptional<z.ZodString>;
    isolationLevel: z.ZodOptional<z.ZodEnum<["L0", "L1", "L1+", "L2", "L2+", "L3"]>>;
    securityFeatures: z.ZodOptional<z.ZodArray<z.ZodEnum<["mte", "pac", "tee", "trustzone"]>, "many">>;
    timeout: z.ZodOptional<z.ZodNumber>;
    workspace: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    command: string;
    args?: string[] | undefined;
    sandboxId?: string | undefined;
    isolationLevel?: "L0" | "L1" | "L1+" | "L2" | "L2+" | "L3" | undefined;
    securityFeatures?: ("mte" | "pac" | "tee" | "trustzone")[] | undefined;
    timeout?: number | undefined;
    workspace?: string | undefined;
    env?: Record<string, string> | undefined;
}, {
    command: string;
    args?: string[] | undefined;
    sandboxId?: string | undefined;
    isolationLevel?: "L0" | "L1" | "L1+" | "L2" | "L2+" | "L3" | undefined;
    securityFeatures?: ("mte" | "pac" | "tee" | "trustzone")[] | undefined;
    timeout?: number | undefined;
    workspace?: string | undefined;
    env?: Record<string, string> | undefined;
}>;
type ExecInput = z.infer<typeof InputSchema>;
export declare function createExecSandboxTool(sandboxManager: SandboxManager, security: KunpengSecurity): {
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
    execute(input: ExecInput): Promise<ExecutionResult>;
};
export {};
//# sourceMappingURL=exec_sandbox.d.ts.map