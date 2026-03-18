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
import { SandboxManager } from "./sandbox.js";
import { detectHardwareSecurity } from "./isolation/executor.js";
import { createExecSandboxTool } from "./tools/exec_sandbox.js";
import { createSandboxTool } from "./tools/sandbox.js";
import { createCapabilityTool } from "./tools/capability.js";
import { createQuotaTool } from "./tools/quota.js";
import { createAttestationTool } from "./tools/attestation.js";
// Export types
export * from "./types.js";
export * from "./isolation/executor.js";
// Default configuration
const DEFAULT_CONFIG = {
    defaultIsolationLevel: "L1",
    enableSGX: true,
    enableAttestation: true,
    maxSandboxCount: 100,
};
/**
 * Create Capsule Extension
 */
export async function createCapsuleExtension(config = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    // Initialize sandbox manager
    const sandboxManager = new SandboxManager();
    // Detect hardware security features
    const hwSecurity = await detectHardwareSecurity();
    console.log("[Capsule] Hardware Security Detection:");
    console.log(`  Architecture: ${hwSecurity.architecture}`);
    console.log(`  SGX Available: ${hwSecurity.hasSGX}`);
    if (hwSecurity.sgxInfo) {
        console.log(`  SGX Version: ${hwSecurity.sgxInfo.version}`);
        console.log(`  SGX Devices: ${hwSecurity.sgxInfo.devices.join(", ")}`);
    }
    // Create tools
    const tools = [
        createExecSandboxTool(sandboxManager, hwSecurity),
        createSandboxTool(sandboxManager),
        createCapabilityTool(sandboxManager),
        createQuotaTool(sandboxManager),
    ];
    // Add attestation tool if SGX is available
    if (hwSecurity.hasSGX && finalConfig.enableAttestation) {
        tools.push(createAttestationTool(hwSecurity));
    }
    return {
        name: "capsule",
        version: "2.0.0",
        description: "Secure sandbox with hardware-enforced isolation (SGX/TrustZone)",
        tools,
        async initialize() {
            console.log("[Capsule] Extension initialized");
            console.log(`[Capsule] Default isolation level: ${finalConfig.defaultIsolationLevel}`);
            console.log(`[Capsule] SGX support: ${hwSecurity.hasSGX ? "Available" : "Not available"}`);
        },
        async shutdown() {
            // Cleanup all sandboxes
            const sandboxes = sandboxManager.list();
            for (const sandbox of sandboxes) {
                try {
                    await sandboxManager.destroy(sandbox.id);
                }
                catch { }
            }
            console.log("[Capsule] Extension shutdown complete");
        },
    };
}
// Default export
export default createCapsuleExtension;
//# sourceMappingURL=index.js.map