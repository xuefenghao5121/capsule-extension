/**
 * Hardware Security Enable Tool
 *
 * 让 OpenClaw 可以启用硬件安全特性
 */
import { z } from "zod";
declare const InputSchema: z.ZodObject<{
    feature: z.ZodEnum<["sgx", "attestation", "sealedStorage", "memoryEncryption"]>;
    options: z.ZodOptional<z.ZodObject<{
        enforce: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enforce?: boolean | undefined;
    }, {
        enforce?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    feature: "sgx" | "attestation" | "sealedStorage" | "memoryEncryption";
    options?: {
        enforce?: boolean | undefined;
    } | undefined;
}, {
    feature: "sgx" | "attestation" | "sealedStorage" | "memoryEncryption";
    options?: {
        enforce?: boolean | undefined;
    } | undefined;
}>;
type EnableInput = z.infer<typeof InputSchema>;
interface HardwareCache {
    detected: boolean;
    architecture?: string;
    teeType?: string;
    teeVersion?: string;
    features?: {
        attestation: boolean;
        sealedStorage: boolean;
        memoryEncryption: boolean;
    };
    enabled?: {
        sgx: boolean;
        attestation: boolean;
        sealedStorage: boolean;
    };
}
export declare function createEnableTool(hwCache: HardwareCache): {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            feature: {
                type: string;
                enum: string[];
                description: string;
            };
            options: {
                type: string;
                properties: {
                    enforce: {
                        type: string;
                    };
                };
            };
        };
        required: string[];
    };
    execute(input: EnableInput): Promise<{
        success: boolean;
        feature: string;
        enabled: boolean;
        message: string;
    }>;
};
export {};
//# sourceMappingURL=enable.d.ts.map