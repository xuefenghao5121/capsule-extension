/**
 * Secure Execution Tool
 *
 * 让 OpenClaw 可以在安全隔离环境中执行代码
 */
import { z } from "zod";
import { executeIsolated, } from "../isolation/executor.js";
import { SGX } from "../hardware/sgx.js";
const InputSchema = z.object({
    command: z.string().describe("要执行的命令"),
    args: z.array(z.string()).optional().describe("命令参数"),
    isolation: z.enum(["L1", "L2", "L3"]).optional()
        .describe("隔离级别: L1=进程, L2=容器, L3=SGX Enclave"),
    workspace: z.string().optional().describe("工作目录"),
    env: z.record(z.string()).optional().describe("环境变量"),
    timeout: z.number().optional().describe("超时时间(毫秒)"),
    attestBefore: z.boolean().optional()
        .describe("执行前是否生成证明 (仅 L3)"),
});
export function createExecTool(sandboxManager, hwCache, config) {
    return {
        name: "capsule_exec",
        description: `在安全隔离环境中执行命令

隔离级别：
- L1: 进程隔离 (基础保护)
- L2: Docker 容器隔离 (网络隔离)
- L3: SGX Enclave (硬件级保护)

硬件要求：
- L1/L2: 无特殊要求
- L3: 需要 Intel SGX 硬件支持

使用场景：
1. 执行不可信代码
2. 处理敏感数据
3. 在隔离环境中运行任务

证明功能：
- 设置 attestBefore=true 可在执行前生成证明
- 证明可用于验证代码在安全环境中执行`,
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", description: "要执行的命令" },
                args: { type: "array", items: { type: "string" } },
                isolation: {
                    type: "string",
                    enum: ["L1", "L2", "L3"],
                    description: "隔离级别",
                },
                workspace: { type: "string" },
                env: { type: "object", additionalProperties: { type: "string" } },
                timeout: { type: "number" },
                attestBefore: { type: "boolean" },
            },
            required: ["command"],
        },
        async execute(input) {
            const { command, args = [], isolation = config.defaultIsolation || "L1", workspace, env, timeout = 60000, attestBefore = false, } = InputSchema.parse(input);
            // Check if L3 is requested but not available
            if (isolation === "L3" && hwCache.teeType !== "sgx") {
                return {
                    success: false,
                    exitCode: 1,
                    stdout: "",
                    stderr: `SGX 不可用，无法使用 L3 隔离 (当前 TEE: ${hwCache.teeType})`,
                    duration: 0,
                    isolation: "N/A",
                    error: "SGX_NOT_AVAILABLE",
                };
            }
            // Check if L3 is enabled
            if (isolation === "L3" && !hwCache.enabled?.sgx) {
                return {
                    success: false,
                    exitCode: 1,
                    stdout: "",
                    stderr: "SGX 未启用，请先调用 capsule_enable({ feature: 'sgx' })",
                    duration: 0,
                    isolation: "N/A",
                    error: "SGX_NOT_ENABLED",
                };
            }
            const startTime = Date.now();
            // Generate attestation before execution if requested
            let attestation;
            if (attestBefore && isolation === "L3" && hwCache.enabled?.attestation) {
                try {
                    const attResult = await SGX.generateAttestation(`exec:${command}`, `nonce-${startTime}`);
                    attestation = {
                        report: attResult.report,
                        signature: attResult.signature,
                    };
                }
                catch (error) {
                    console.warn("[Capsule] Failed to generate attestation:", error.message);
                }
            }
            try {
                // Execute with isolation
                const result = await executeIsolated(isolation, {
                    command,
                    args,
                    timeout,
                    workspace,
                    env,
                }, {
                    level: isolation,
                    networkDisabled: true,
                });
                return {
                    success: result.exitCode === 0,
                    exitCode: result.exitCode,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    duration: result.duration,
                    isolation,
                    attestation,
                };
            }
            catch (error) {
                return {
                    success: false,
                    exitCode: 1,
                    stdout: "",
                    stderr: error.message,
                    duration: Date.now() - startTime,
                    isolation,
                    error: error.message,
                };
            }
        },
    };
}
//# sourceMappingURL=exec.js.map