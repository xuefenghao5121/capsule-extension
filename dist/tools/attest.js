/**
 * Attestation Tool
 *
 * 让 OpenClaw 可以生成和验证硬件证明
 */
import { z } from "zod";
import { SGX } from "../hardware/sgx.js";
const InputSchema = z.object({
    action: z.enum(["generate", "verify"])
        .describe("动作: generate 生成证明, verify 验证证明"),
    data: z.string().optional()
        .describe("要包含在证明中的数据 (generate 时使用)"),
    nonce: z.string().optional()
        .describe("防重放攻击的随机数"),
    report: z.string().optional()
        .describe("要验证的证明报告 (verify 时使用)"),
    signature: z.string().optional()
        .describe("证明签名 (verify 时使用)"),
});
export function createAttestTool(hwCache) {
    return {
        name: "capsule_attest",
        description: `生成或验证硬件证明

动作：
- generate: 生成证明报告，证明代码在安全环境中运行
- verify: 验证证明报告的真实性

使用场景：
1. 向远程方证明代码在 SGX Enclave 中执行
2. 验证远程方的执行环境
3. 建立安全通信信道

输出：
- generate: 返回 report 和 signature
- verify: 返回 valid 状态`,
        inputSchema: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    enum: ["generate", "verify"],
                    description: "动作",
                },
                data: {
                    type: "string",
                    description: "要证明的数据",
                },
                nonce: {
                    type: "string",
                    description: "随机数",
                },
                report: {
                    type: "string",
                    description: "证明报告",
                },
                signature: {
                    type: "string",
                    description: "签名",
                },
            },
            required: ["action"],
        },
        async execute(input) {
            const { action, data, nonce, report, signature } = InputSchema.parse(input);
            // Check if attestation is enabled
            if (!hwCache.enabled?.attestation) {
                return {
                    success: false,
                    action,
                    error: "证明功能未启用，请先调用 capsule_enable({ feature: 'attestation' })",
                };
            }
            // Check hardware support
            if (hwCache.teeType !== "sgx") {
                return {
                    success: false,
                    action,
                    error: `当前系统不支持证明 (TEE: ${hwCache.teeType})`,
                };
            }
            switch (action) {
                case "generate": {
                    if (!data) {
                        return {
                            success: false,
                            action,
                            error: "generate 需要提供 data 参数",
                        };
                    }
                    try {
                        const result = await SGX.generateAttestation(data, nonce);
                        return {
                            success: result.success,
                            action,
                            report: result.report,
                            signature: result.signature,
                            timestamp: result.timestamp,
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            action,
                            error: `生成证明失败: ${error.message}`,
                        };
                    }
                }
                case "verify": {
                    if (!report || !signature) {
                        return {
                            success: false,
                            action,
                            error: "verify 需要提供 report 和 signature 参数",
                        };
                    }
                    try {
                        const valid = await SGX.verifyAttestation(report, signature);
                        return {
                            success: true,
                            action,
                            valid,
                            timestamp: Date.now(),
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            action,
                            error: `验证证明失败: ${error.message}`,
                            valid: false,
                        };
                    }
                }
                default:
                    return {
                        success: false,
                        action,
                        error: `未知动作: ${action}`,
                    };
            }
        },
    };
}
//# sourceMappingURL=attest.js.map