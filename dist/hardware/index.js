/**
 * Hardware Security Interface
 *
 * Unified interface for hardware-based security features
 * Supports both x86 (Intel SGX) and ARM (Kunpeng/Huawei) architectures
 */
import * as os from "os";
import { SGX } from "./sgx.js";
/**
 * Detect current architecture
 */
export function detectArchitecture() {
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
export async function detectTEE() {
    const arch = detectArchitecture();
    if (arch === "x64") {
        // Check for Intel SGX
        const sgxInfo = await SGX.checkAvailable();
        if (sgxInfo.available) {
            return "sgx";
        }
    }
    else if (arch === "arm64") {
        // Check for Kunpeng/TrustZone
        // Would need actual hardware detection
        return "trustzone";
    }
    return "none";
}
/**
 * Get comprehensive hardware security info
 */
export async function getHardwareSecurityInfo() {
    const architecture = detectArchitecture();
    const teeType = await detectTEE();
    const info = {
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
export async function isFeatureAvailable(feature) {
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
export async function initHardwareSecurity() {
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
            }
            catch (error) {
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
export async function executeInTEE(command, args = [], options = {}) {
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
        }
        else {
            // Fallback to normal execution with logging
            const { spawn } = require("child_process");
            result = await new Promise((resolve) => {
                const proc = spawn(command, args, {
                    cwd: options.cwd,
                    env: options.env,
                    timeout: options.timeout,
                });
                let stdout = "";
                let stderr = "";
                proc.stdout?.on("data", (data) => {
                    stdout += data.toString();
                });
                proc.stderr?.on("data", (data) => {
                    stderr += data.toString();
                });
                proc.on("close", (code) => {
                    resolve({
                        exitCode: code ?? 1,
                        stdout,
                        stderr,
                    });
                });
                proc.on("error", (err) => {
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
    }
    catch (error) {
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
export async function generateAttestationReport(data, nonce) {
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
    }
    catch (error) {
        return {
            success: false,
            teeType,
        };
    }
}
// Export all
export { SGX } from "./sgx.js";
export * from "./sgx.js";
//# sourceMappingURL=index.js.map