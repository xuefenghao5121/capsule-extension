/**
 * Capsule - Sandbox + Hardware Security
 *
 * 核心设计：
 * 1. Sandbox Manager - 沙箱管理
 * 2. Hardware Security - 硬件安全特性
 */
export { SandboxManager, type Sandbox, type SandboxConfig, type SandboxId, type IsolationLevel, type SandboxStatus, type ResourceQuota, type ExecutionResult, } from "./core/sandbox.js";
export { pluginRegistry, loadPlugins, type HardwareInfo, type SecurityPlugin } from "./plugins/index.js";
import { Sandbox, SandboxConfig, ExecutionResult } from "./core/sandbox.js";
import { HardwareInfo } from "./plugins/index.js";
export interface CapsuleConfig {
    workspaceRoot?: string;
    autoDetect?: boolean;
}
export declare class Capsule {
    private sandboxManager;
    private hardwareInfo;
    private initialized;
    constructor(config?: CapsuleConfig);
    /**
     * 初始化：检测硬件安全特性
     */
    init(): Promise<void>;
    /**
     * 创建沙箱
     */
    createSandbox(config: SandboxConfig): Promise<Sandbox>;
    /**
     * 执行命令
     */
    execute(sandboxId: string, command: string, args?: string[]): Promise<ExecutionResult>;
    /**
     * 销毁沙箱
     */
    destroySandbox(sandboxId: string): Promise<void>;
    /**
     * 获取硬件信息
     */
    getHardwareInfo(): HardwareInfo | null;
    /**
     * 列出沙箱
     */
    listSandboxes(): Sandbox[];
    private ensureInit;
    private printHardwareInfo;
    private formatFeature;
}
export declare const capsule: Capsule;
//# sourceMappingURL=index.d.ts.map