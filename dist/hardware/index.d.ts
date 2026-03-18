/**
 * Hardware Security Interface
 *
 * Unified interface for hardware-based security features
 * Supports both x86 (Intel SGX) and ARM (Kunpeng/Huawei) architectures
 */
import { SGXInfo } from "./sgx.js";
export type Architecture = "x64" | "arm64" | "unknown";
export type TEEType = "sgx" | "kunpeng" | "trustzone" | "none";
export type SecurityFeature = "sgx" | "mte" | "pac" | "trustzone";
export interface HardwareSecurityInfo {
    architecture: Architecture;
    teeType: TEEType;
    teeAvailable: boolean;
    features: Record<SecurityFeature, boolean>;
    sgxInfo?: SGXInfo;
}
/**
 * Detect current architecture
 */
export declare function detectArchitecture(): Architecture;
/**
 * Detect available TEE type
 */
export declare function detectTEE(): Promise<TEEType>;
/**
 * Get comprehensive hardware security info
 */
export declare function getHardwareSecurityInfo(): Promise<HardwareSecurityInfo>;
/**
 * Check if a specific security feature is available
 */
export declare function isFeatureAvailable(feature: SecurityFeature): Promise<boolean>;
/**
 * Initialize hardware security
 */
export declare function initHardwareSecurity(): Promise<{
    success: boolean;
    message: string;
    info: HardwareSecurityInfo;
}>;
/**
 * Execute code in TEE
 */
export declare function executeInTEE(command: string, args?: string[], options?: {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
}): Promise<{
    success: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
    teeType: TEEType;
}>;
/**
 * Generate attestation report
 */
export declare function generateAttestationReport(data: string, nonce?: string): Promise<{
    success: boolean;
    report?: string;
    signature?: string;
    teeType: TEEType;
}>;
export { SGX } from "./sgx.js";
export * from "./sgx.js";
//# sourceMappingURL=index.d.ts.map