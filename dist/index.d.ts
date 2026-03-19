/**
 * Capsule - Sandbox-centric Security for AI Agents
 *
 * 安装即用，自动检测硬件安全特性
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
    private activePlugin;
    private initialized;
    constructor(config?: CapsuleConfig);
    /**
     * 初始化 Capsule
     * - 自动检测硬件
     * - 自动加载插件
     * - 自动使能安全特性
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
     * 获取推荐的隔离级别
     */
    getRecommendedIsolation(): string;
    /**
     * 列出所有沙箱
     */
    listSandboxes(): Sandbox[];
    private ensureInit;
    private recommendIsolation;
    private printHardwareInfo;
    private formatFeature;
}
export declare const capsule: Capsule;
export declare function quickStart(): Promise<Capsule>;
//# sourceMappingURL=index.d.ts.map