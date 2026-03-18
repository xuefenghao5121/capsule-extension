/**
 * Capsule Extension - Main Entry Point
 *
 * OpenClaw extension for sandbox-centric security with Kunpeng hardware optimization
 */
import { SandboxManager } from "./sandbox.js";
import { KunpengSecurity } from "./hardware/kunpeng.js";
import { createExecSandboxTool } from "./tools/exec_sandbox.js";
import { createSandboxTools } from "./tools/sandbox.js";
import { createCapabilityTools } from "./tools/capability.js";
import { createQuotaTools } from "./tools/quota.js";
import { createAttestationTool } from "./tools/attestation.js";
// Export types
export * from "./types.js";
export { SandboxManager } from "./sandbox.js";
export { KunpengSecurity } from "./hardware/kunpeng.js";
const DEFAULT_CONFIG = {
    workspaceRoot: "./capsule-workspace",
    maxSandboxes: 100,
    securityEnabled: true,
    defaultIsolation: "L1",
};
/**
 * Create the Capsule extension
 */
export function createCapsuleExtension(config = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    // Initialize components
    const sandboxManager = new SandboxManager({
        workspaceRoot: finalConfig.workspaceRoot,
        maxSandboxes: finalConfig.maxSandboxes,
        securityEnabled: finalConfig.securityEnabled,
    });
    const security = new KunpengSecurity();
    // Create tools
    const execSandbox = createExecSandboxTool(sandboxManager, security);
    const sandboxTools = createSandboxTools(sandboxManager);
    const capabilityTools = createCapabilityTools(sandboxManager);
    const quotaTools = createQuotaTools(sandboxManager);
    const attestationTool = createAttestationTool(sandboxManager, security);
    // Combine all tools
    const tools = [
        execSandbox,
        ...Object.values(sandboxTools),
        ...Object.values(capabilityTools),
        ...Object.values(quotaTools),
        attestationTool,
    ];
    return {
        id: "capsule",
        version: "1.0.0",
        description: "Sandbox-centric security extension with Kunpeng hardware optimization",
        tools,
        // Lifecycle hooks
        async init() {
            console.log("[Capsule] Initializing extension...");
            const status = security.getStatus();
            console.log("[Capsule] Security features:", Object.fromEntries(Array.from(status.entries()).map(([k, v]) => [k, v.available])));
        },
        async shutdown() {
            console.log("[Capsule] Shutting down extension...");
            // Destroy all sandboxes
            for (const sandbox of sandboxManager.list()) {
                await sandboxManager.destroy(sandbox.id);
            }
        },
        // Export internals for advanced usage
        internals: {
            sandboxManager,
            security,
        },
    };
}
// Default export for OpenClaw
export default createCapsuleExtension;
//# sourceMappingURL=index.js.map