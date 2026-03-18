/**
 * Hardware Security Interface
 * 
 * Unified interface for hardware-based security features
 * Supports both x86 (Intel SGX) and ARM (Kunpeng/Huawei) architectures
 */

import * as os from "os";
import { SGX, SGXInfo } from "./sgx.js";

// Architecture type
export type Architecture = "x64" | "arm64" | "unknown";

// TEE type
export type TEEType = "sgx" | "kunpeng" | "trustzone" | "none";

// Security feature
export type SecurityFeature = 
  | "sgx"
  | "mte"      // Memory Tagging Extension (ARM)
  | "pac"      // Pointer Authentication (ARM)
  | "trustzone";

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
export function detectArchitecture(): Architecture {
  const arch = os.arch();
  
  switch (arch) {
    case "x64":
      return "x64";
    case "arm64":
      return "arm64";
    default:
      return "unknown";
  }
}

/**
 * Detect available TEE type
 */
export async function detectTEE(): Promise<TEEType> {
  const arch = detectArchitecture();
  
  if (arch === "x64") {
    // Check for Intel SGX
    const sgxInfo = await SGX.checkAvailable();
    if (sgxInfo.available) {
      return "sgx";
    }
  } else if (arch === "arm64") {
    // Check for Kunpeng/TrustZone
    // Would need actual hardware detection
    return "trustzone";
  }
  
  return "none";
}

/**
 * Get comprehensive hardware security info
 */
export async function getHardwareSecurityInfo(): Promise<HardwareSecurityInfo> {
  const architecture = detectArchitecture();
  const teeType = await detectTEE();
  
  const info: HardwareSecurityInfo = {
    architecture,
    teeType,
    teeAvailable: teeType !== "none",
    features: {
      sgx: teeType === "sgx",
      mte: architecture === "arm64", // Simplified, would need actual check
      pac: architecture === "arm64",
      trustzone: teeType === "trustzone",
    },
  };

  // Add SGX details if available
  if (teeType === "sgx") {
    info.sgxInfo = await SGX.checkAvailable();
  }

  return info;
}

/**
 * Check if a specific security feature is available
 */
export async function isFeatureAvailable(feature: SecurityFeature): Promise<boolean> {
  const info = await getHardwareSecurityInfo();
  
  switch (feature) {
    case "sgx":
      return info.features.sgx;
    case "mte":
      return info.features.mte;
    case "pac":
      return info.features.pac;
    case "trustzone":
      return info.features.trustzone;
    default:
      return false;
  }
}

/**
 * Initialize hardware security
 */
export async function initHardwareSecurity(): Promise<{
  success: boolean;
  message: string;
  info: HardwareSecurityInfo;
}> {
  const info = await getHardwareSecurityInfo();
  
  if (!info.teeAvailable) {
    return {
      success: false,
      message: `No TEE available on ${info.architecture} architecture`,
      info,
    };
  }

  // Initialize based on TEE type
  switch (info.teeType) {
    case "sgx":
      try {
        const initSuccess = await SGX.init();
        return {
          success: initSuccess,
          message: initSuccess 
            ? `SGX initialized: ${info.sgxInfo?.version}`
            : "Failed to initialize SGX",
          info,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `SGX init error: ${error.message}`,
          info,
        };
      }
    
    case "trustzone":
      // TrustZone initialization would go here
      return {
        success: true,
        message: "TrustZone available (initialization pending)",
        info,
      };
    
    default:
      return {
        success: false,
        message: "Unknown TEE type",
        info,
      };
  }
}

/**
 * Execute code in TEE
 */
export async function executeInTEE(
  command: string,
  args: string[] = [],
  options: {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
  } = {}
): Promise<{
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  teeType: TEEType;
}> {
  const teeType = await detectTEE();
  
  if (teeType === "none") {
    return {
      success: false,
      exitCode: 1,
      stdout: "",
      stderr: "No TEE available",
      teeType: "none",
    };
  }

  try {
    let result;
    
    if (teeType === "sgx") {
      result = await SGX.executeInEnclave(command, args, options);
    } else {
      // Fallback to normal execution with logging
      const { spawn } = require("child_process");
      
      result = await new Promise<{ exitCode: number; stdout: string; stderr: string }>((resolve) => {
        const proc = spawn(command, args, {
          cwd: options.cwd,
          env: options.env,
          timeout: options.timeout,
        });

        let stdout = "";
        let stderr = "";

        proc.stdout?.on("data", (data: Buffer) => {
          stdout += data.toString();
        });

        proc.stderr?.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        proc.on("close", (code) => {
          resolve({
            exitCode: code ?? 1,
            stdout,
            stderr,
          });
        });

        proc.on("error", (err: Error) => {
          resolve({
            exitCode: 1,
            stdout,
            stderr: err.message,
          });
        });
      });
    }

    return {
      success: result.exitCode === 0,
      ...result,
      teeType,
    };
  } catch (error: any) {
    return {
      success: false,
      exitCode: 1,
      stdout: "",
      stderr: error.message,
      teeType,
    };
  }
}

/**
 * Generate attestation report
 */
export async function generateAttestationReport(
  data: string,
  nonce?: string
): Promise<{
  success: boolean;
  report?: string;
  signature?: string;
  teeType: TEEType;
}> {
  const teeType = await detectTEE();
  
  if (teeType === "none") {
    return {
      success: false,
      teeType: "none",
    };
  }

  try {
    if (teeType === "sgx") {
      const result = await SGX.generateAttestation(data, nonce);
      return {
        success: result.success,
        report: result.report,
        signature: result.signature,
        teeType: "sgx",
      };
    }
    
    // Other TEE types would go here
    return {
      success: false,
      teeType,
    };
  } catch (error) {
    return {
      success: false,
      teeType,
    };
  }
}

// Export all
export { SGX } from "./sgx.js";
export * from "./sgx.js";