/**
 * Real Isolation Implementation with SGX Support
 *
 * 实现真实的隔离执行：
 * - L1: 进程隔离 (child_process)
 * - L1+: 进程隔离 + 资源限制 (cgroups)
 * - L2: Docker 容器隔离
 * - L2+/L3: SGX Enclave 隔离 (x86) / TrustZone (ARM)
 */
import { SGXInfo } from "../hardware/sgx.js";
export interface ExecutionOptions {
    command: string;
    args: string[];
    timeout: number;
    workspace?: string;
    env?: Record<string, string>;
    uid?: number;
    gid?: number;
}
export interface ExecutionResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
    isolated: boolean;
    isolationLevel: string;
}
export interface IsolationConfig {
    level: "L1" | "L1+" | "L2" | "L2+" | "L3";
    cpuQuota?: number;
    memoryMB?: number;
    networkDisabled?: boolean;
    filesystemRoot?: string;
}
/**
 * 检测硬件安全特性
 */
export declare function detectHardwareSecurity(): Promise<{
    hasSGX: boolean;
    sgxInfo?: SGXInfo;
    architecture: string;
}>;
/**
 * L1 进程隔离 - 使用 child_process
 */
export declare function executeL1(options: ExecutionOptions): Promise<ExecutionResult>;
/**
 * L1+ 进程隔离 + cgroups 资源限制
 */
export declare function executeL1Plus(options: ExecutionOptions, config: IsolationConfig): Promise<ExecutionResult>;
/**
 * L2 Docker 容器隔离
 */
export declare function executeL2(options: ExecutionOptions, config: IsolationConfig): Promise<ExecutionResult>;
/**
 * L2+/L3 SGX Enclave 隔离
 *
 * 使用 Intel SGX 在安全飞地中执行代码
 */
export declare function executeSGX(options: ExecutionOptions, config: IsolationConfig): Promise<ExecutionResult>;
/**
 * 统一的隔离执行接口
 */
export declare function executeIsolated(level: "L1" | "L1+" | "L2" | "L2+" | "L3", options: ExecutionOptions, config?: IsolationConfig): Promise<ExecutionResult>;
/**
 * 检查并强制执行能力限制
 */
export declare function enforceCapabilities(capabilities: string[], command: string): {
    allowed: boolean;
    reason?: string;
};
export declare const IsolationExecutor: {
    executeL1: typeof executeL1;
    executeL1Plus: typeof executeL1Plus;
    executeL2: typeof executeL2;
    executeSGX: typeof executeSGX;
    executeIsolated: typeof executeIsolated;
    enforceCapabilities: typeof enforceCapabilities;
    detectHardwareSecurity: typeof detectHardwareSecurity;
};
//# sourceMappingURL=executor.d.ts.map