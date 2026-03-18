/**
 * Capsule Extension - Hardware Security Enablement
 * 
 * 核心目标：让 OpenClaw 能够利用硬件安全特性
 * 
 * 提供的能力：
 * 1. 检测 - 检测硬件安全特性
 * 2. 使能 - 启用硬件安全特性
 * 3. 验证 - 证明环境安全
 * 4. 执行 - 在安全环境中执行
 */

import { SandboxManager } from "./sandbox.js";
import { detectHardwareSecurity } from "./isolation/executor.js";
import { createDetectTool } from "./tools/detect.js";
import { createEnableTool } from "./tools/enable.js";
import { createAttestTool } from "./tools/attest.js";
import { createExecTool } from "./tools/exec.js";

// Export types
export * from "./types.js";

// Extension configuration
export interface CapsuleConfig {
  autoDetect?: boolean;  // 自动检测硬件
  defaultIsolation?: "L1" | "L2" | "L3";
  enableAttestation?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: CapsuleConfig = {
  autoDetect: true,
  defaultIsolation: "L1",
  enableAttestation: true,
};

// Tool interface
interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  execute: (input: any) => Promise<any>;
}

// Extension interface
interface Extension {
  name: string;
  version: string;
  description: string;
  tools: Tool[];
  initialize?: () => Promise<void>;
  shutdown?: () => Promise<void>;
}

// Hardware security info (cached)
interface HardwareSecurityCache {
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

/**
 * Create Capsule Extension
 * 
 * @example
 * const extension = await createCapsuleExtension();
 * openclaw.registerExtension(extension);
 */
export async function createCapsuleExtension(config: CapsuleConfig = {}): Promise<Extension> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Initialize sandbox manager
  const sandboxManager = new SandboxManager();
  
  // Hardware security cache
  const hwCache: HardwareSecurityCache = { detected: false };
  
  // Auto-detect hardware if configured
  if (finalConfig.autoDetect) {
    const hwInfo = await detectHardwareSecurity();
    hwCache.detected = true;
    hwCache.architecture = hwInfo.architecture;
    hwCache.teeType = hwInfo.hasSGX ? "sgx" : "none";
    hwCache.teeVersion = hwInfo.sgxInfo?.version;
    hwCache.features = {
      attestation: hwInfo.hasSGX,
      sealedStorage: hwInfo.hasSGX,
      memoryEncryption: hwInfo.hasSGX,
    };
  }

  // Create tools focused on hardware security enablement
  const tools: Tool[] = [
    // 1. 检测硬件安全特性
    createDetectTool(hwCache),
    
    // 2. 启用硬件安全特性
    createEnableTool(hwCache),
    
    // 3. 证明/验证
    createAttestTool(hwCache),
    
    // 4. 安全执行
    createExecTool(sandboxManager, hwCache, finalConfig),
  ];

  return {
    name: "capsule",
    version: "2.0.0",
    description: "Hardware Security Enablement for OpenClaw (SGX/TrustZone)",
    
    tools,
    
    async initialize() {
      console.log("[Capsule] Hardware Security Enablement Extension");
      console.log("[Capsule] Architecture:", hwCache.architecture || "unknown");
      console.log("[Capsule] TEE:", hwCache.teeType || "none", hwCache.teeVersion || "");
      console.log("[Capsule] Features:", JSON.stringify(hwCache.features));
    },
    
    async shutdown() {
      const sandboxes = sandboxManager.list();
      for (const sandbox of sandboxes) {
        try {
          await sandboxManager.destroy(sandbox.id);
        } catch {}
      }
      console.log("[Capsule] Shutdown complete");
    },
  };
}

export default createCapsuleExtension;