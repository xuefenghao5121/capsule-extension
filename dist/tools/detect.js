/**
 * Hardware Detection Tool
 *
 * 让 OpenClaw 知道当前系统支持哪些硬件安全特性
 */
import { z } from "zod";
import { detectHardwareSecurity } from "../isolation/executor.js";
const InputSchema = z.object({});
export function createDetectTool(hwCache) {
    return {
        name: "capsule_detect",
        description: `检测系统硬件安全特性

返回信息：
- architecture: CPU 架构 (x64/arm64)
- tee: 可信执行环境类型 (sgx/trustzone/sev/none)
- version: TEE 版本 (SGX1/SGX2)
- features: 支持的安全特性

使用场景：
1. 了解当前系统硬件安全能力
2. 决定可以使用哪些安全特性
3. 在启动安全功能前检查硬件支持`,
        inputSchema: {
            type: "object",
            properties: {},
        },
        async execute(input) {
            // Re-detect hardware (in case it changed)
            const hwInfo = await detectHardwareSecurity();
            // Update cache
            hwCache.detected = true;
            hwCache.architecture = hwInfo.architecture;
            hwCache.teeType = hwInfo.hasSGX ? "sgx" : "none";
            hwCache.teeVersion = hwInfo.sgxInfo?.version;
            const result = {
                success: true,
                architecture: hwInfo.architecture,
                tee: {
                    type: hwInfo.hasSGX ? "sgx" : "none",
                    version: hwInfo.sgxInfo?.version || "N/A",
                    available: hwInfo.hasSGX,
                },
                features: {
                    attestation: hwInfo.hasSGX,
                    sealedStorage: hwInfo.hasSGX,
                    memoryEncryption: hwInfo.hasSGX,
                },
                devices: hwInfo.sgxInfo?.devices,
            };
            // Update cache features
            hwCache.features = result.features;
            return result;
        },
    };
}
//# sourceMappingURL=detect.js.map