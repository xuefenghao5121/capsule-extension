/**
 * SGX Hardware Security Interface
 *
 * Intel SGX (Software Guard Extensions) support for x86 architecture
 * Provides TEE capabilities on Intel CPUs
 */
export interface SGXInfo {
    available: boolean;
    version: "SGX1" | "SGX2" | "None";
    devices: string[];
    epcSize: number;
    maxEnclaveSize: number;
    launchControl: boolean;
}
export interface EnclaveConfig {
    enclaveFile: string;
    heapSize: number;
    stackSize: number;
    tcsCount: number;
}
export interface AttestationResult {
    success: boolean;
    report: string;
    signature: string;
    timestamp: number;
}
/**
 * Check if SGX is available on this system
 */
export declare function checkSGXAvailable(): Promise<SGXInfo>;
/**
 * Check if running in an SGX enclave
 */
export declare function isInEnclave(): boolean;
/**
 * Initialize SGX for use
 */
export declare function initSGX(): Promise<boolean>;
/**
 * Generate SGX attestation report
 */
export declare function generateAttestation(data: string, nonce?: string): Promise<AttestationResult>;
/**
 * Verify SGX attestation
 */
export declare function verifyAttestation(report: string, signature: string): Promise<boolean>;
/**
 * Execute code in SGX enclave
 *
 * This requires Gramine or Occlum runtime
 */
export declare function executeInEnclave(command: string, args?: string[], options?: {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
}): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
}>;
/**
 * Seal data using SGX
 */
export declare function sealData(data: string, keyId?: string): Promise<string>;
/**
 * Unseal data using SGX
 */
export declare function unsealData(sealedData: string): Promise<string>;
export declare const SGX: {
    checkAvailable: typeof checkSGXAvailable;
    isInEnclave: typeof isInEnclave;
    init: typeof initSGX;
    generateAttestation: typeof generateAttestation;
    verifyAttestation: typeof verifyAttestation;
    executeInEnclave: typeof executeInEnclave;
    sealData: typeof sealData;
    unsealData: typeof unsealData;
};
//# sourceMappingURL=sgx.d.ts.map