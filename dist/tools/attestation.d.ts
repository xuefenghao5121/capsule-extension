/**
 * Attestation Tool - Remote Attestation for Platform Trust
 */
import { z } from "zod";
import { SandboxManager } from "../sandbox.js";
import { KunpengSecurity } from "../hardware/kunpeng.js";
declare const InputSchema: z.ZodObject<{
    action: z.ZodEnum<["generate", "verify"]>;
    sandboxId: z.ZodOptional<z.ZodString>;
    nonce: z.ZodOptional<z.ZodString>;
    report: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "generate" | "verify";
    sandboxId?: string | undefined;
    nonce?: string | undefined;
    report?: string | undefined;
}, {
    action: "generate" | "verify";
    sandboxId?: string | undefined;
    nonce?: string | undefined;
    report?: string | undefined;
}>;
export declare function createAttestationTool(sandboxManager: SandboxManager, security: KunpengSecurity): {
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
    execute(input: z.infer<typeof InputSchema>): Promise<{
        success: boolean;
        report: {
            signature: string;
            sandboxId: string;
            platform: string;
            timestamp: string;
            nonce: string;
            securityFeatures: {
                feature: import("../types.js").SecurityFeature;
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
};
export {};
//# sourceMappingURL=attestation.d.ts.map