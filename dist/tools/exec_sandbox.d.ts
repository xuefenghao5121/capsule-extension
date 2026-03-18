/**
 * exec_sandbox Tool - Execute commands in sandboxed environment
 *
 * Real isolation implementation with SGX support
 */
import { z } from "zod";
import { SandboxManager } from "../sandbox.js";
import { ExecutionResult } from "../isolation/executor.js";
import { SGXInfo } from "../hardware/sgx.js";
declare const InputSchema: z.ZodObject<{
    command: z.ZodString;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sandboxId: z.ZodOptional<z.ZodString>;
    isolationLevel: z.ZodOptional<z.ZodEnum<["L1", "L1+", "L2", "L2+", "L3"]>>;
    timeout: z.ZodOptional<z.ZodNumber>;
    workspace: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    command: string;
    args?: string[] | undefined;
    timeout?: number | undefined;
    workspace?: string | undefined;
    env?: Record<string, string> | undefined;
    isolationLevel?: "L1" | "L1+" | "L2" | "L2+" | "L3" | undefined;
    sandboxId?: string | undefined;
}, {
    command: string;
    args?: string[] | undefined;
    timeout?: number | undefined;
    workspace?: string | undefined;
    env?: Record<string, string> | undefined;
    isolationLevel?: "L1" | "L1+" | "L2" | "L2+" | "L3" | undefined;
    sandboxId?: string | undefined;
}>;
type ExecInput = z.infer<typeof InputSchema>;
interface HardwareSecurity {
    hasSGX: boolean;
    sgxInfo?: SGXInfo;
    architecture: string;
}
export declare function createExecSandboxTool(sandboxManager: SandboxManager, hwSecurity: HardwareSecurity): {
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
            sandboxId: {
                type: string;
            };
            isolationLevel: {
                type: string;
                enum: string[];
            };
            timeout: {
                type: string;
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
        };
        required: string[];
    };
    execute(input: ExecInput): Promise<ExecutionResult>;
};
export {};
//# sourceMappingURL=exec_sandbox.d.ts.map