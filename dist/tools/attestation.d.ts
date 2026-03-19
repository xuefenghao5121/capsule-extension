/**
 * Attestation Tool - SGX Remote Attestation
 *
 * Generate and verify SGX attestation reports
 */
import { z } from "zod";
import { SGXInfo } from "../hardware/sgx.js";
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
type AttestationInput = z.infer<typeof InputSchema>;
interface HardwareSecurity {
    hasSGX: boolean;
    sgxInfo?: SGXInfo;
    architecture: string;
}
export declare function createAttestationTool(hwSecurity: HardwareSecurity): {
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
    execute(input: AttestationInput): Promise<{
        success: boolean;
        error: string;
        sgxAvailable: boolean;
        report?: undefined;
        signature?: undefined;
        timestamp?: undefined;
        sgxVersion?: undefined;
        valid?: undefined;
    } | {
        success: boolean;
        report: string;
        signature: string;
        timestamp: number;
        sgxVersion: "SGX1" | "SGX2" | "None" | undefined;
        error?: undefined;
        sgxAvailable?: undefined;
        valid?: undefined;
    } | {
        success: boolean;
        error: any;
        sgxAvailable?: undefined;
        report?: undefined;
        signature?: undefined;
        timestamp?: undefined;
        sgxVersion?: undefined;
        valid?: undefined;
    } | {
        success: boolean;
        valid: boolean;
        timestamp: number;
        error?: undefined;
        sgxAvailable?: undefined;
        report?: undefined;
        signature?: undefined;
        sgxVersion?: undefined;
    } | {
        success: boolean;
        error: any;
        valid: boolean;
        sgxAvailable?: undefined;
        report?: undefined;
        signature?: undefined;
        timestamp?: undefined;
        sgxVersion?: undefined;
    }>;
};
export {};
//# sourceMappingURL=attestation.d.ts.map