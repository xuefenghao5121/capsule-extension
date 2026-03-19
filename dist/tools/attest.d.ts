/**
 * Attestation Tool
 *
 * 让 OpenClaw 可以生成和验证硬件证明
 */
import { z } from "zod";
declare const InputSchema: z.ZodObject<{
    action: z.ZodEnum<["generate", "verify"]>;
    data: z.ZodOptional<z.ZodString>;
    nonce: z.ZodOptional<z.ZodString>;
    report: z.ZodOptional<z.ZodString>;
    signature: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "generate" | "verify";
    data?: string | undefined;
    signature?: string | undefined;
    report?: string | undefined;
    nonce?: string | undefined;
}, {
    action: "generate" | "verify";
    data?: string | undefined;
    signature?: string | undefined;
    report?: string | undefined;
    nonce?: string | undefined;
}>;
type AttestInput = z.infer<typeof InputSchema>;
interface HardwareCache {
    detected: boolean;
    teeType?: string;
    teeVersion?: string;
    enabled?: {
        sgx: boolean;
        attestation: boolean;
        sealedStorage: boolean;
    };
}
export declare function createAttestTool(hwCache: HardwareCache): {
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
            data: {
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
            signature: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute(input: AttestInput): Promise<{
        success: boolean;
        action: string;
        report?: string;
        signature?: string;
        valid?: boolean;
        timestamp?: number;
        error?: string;
    }>;
};
export {};
//# sourceMappingURL=attest.d.ts.map