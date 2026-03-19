/**
 * Hardware Detection Tool
 *
 * 让 OpenClaw 知道当前系统支持哪些硬件安全特性
 */
import { z } from "zod";
declare const InputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
type DetectInput = z.infer<typeof InputSchema>;
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
}
export declare function createDetectTool(hwCache: HardwareCache): {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {};
    };
    execute(input: DetectInput): Promise<{
        success: boolean;
        architecture: string;
        tee: {
            type: string;
            version: string;
            available: boolean;
        };
        features: {
            attestation: boolean;
            sealedStorage: boolean;
            memoryEncryption: boolean;
        };
        devices?: string[];
    }>;
};
export {};
//# sourceMappingURL=detect.d.ts.map