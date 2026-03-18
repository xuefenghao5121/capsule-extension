/**
 * Capsule Extension - Secure Sandbox for OpenClaw
 *
 * Provides hardware-enforced isolation for skill execution:
 * - L1: Process isolation
 * - L1+: Process + cgroups resource limits
 * - L2: Docker container isolation
 * - L2+/L3: SGX Enclave (x86) / TrustZone (ARM)
 *
 * Supports:
 * - x86: Intel SGX
 * - ARM: Kunpeng/TrustZone
 */
import type { Extension } from "@openclaw/plugin-sdk";
export * from "./types.js";
export * from "./isolation/executor.js";
export interface CapsuleConfig {
    defaultIsolationLevel?: "L1" | "L1+" | "L2" | "L2+" | "L3";
    enableSGX?: boolean;
    enableAttestation?: boolean;
    maxSandboxCount?: number;
}
/**
 * Create Capsule Extension
 */
export declare function createCapsuleExtension(config?: CapsuleConfig): Promise<Extension>;
export default createCapsuleExtension;
//# sourceMappingURL=index.d.ts.map