/**
 * Capsule Plugin System
 *
 * 自动检测硬件 → 自动加载插件 → 自动使能安全特性
 */
export interface SecurityPlugin {
    name: string;
    platform: "x86" | "arm" | "universal";
    features: string[];
    /** 检测硬件是否支持 */
    detect(): Promise<HardwareInfo>;
    /** 初始化安全特性 */
    init(info: HardwareInfo): Promise<boolean>;
    /** 创建隔离执行环境 */
    createSecureContext?(config: SecureContextConfig): Promise<SecureContext>;
    /** 销毁隔离环境 */
    destroySecureContext?(contextId: string): Promise<void>;
    /** 执行命令（可选，用于硬件加速隔离） */
    executeSecure?(context: SecureContext, command: string, args: string[]): Promise<ExecutionResult>;
}
export interface HardwareInfo {
    architecture: "x64" | "arm64";
    vendor?: "intel" | "amd" | "huawei" | "apple" | "unknown";
    features: {
        sgx?: {
            version: "1" | "2";
            epcSize?: number;
        };
        tdx?: boolean;
        sev?: {
            version: "1" | "2" | "snp";
        };
        mte?: boolean;
        pac?: boolean;
        sve?: {
            width: number;
        };
        tee?: {
            type: "trustzone" | "itrustee";
        };
    };
    recommended: {
        isolationLevel: IsolationLevel;
        plugin: string;
    };
}
export interface SecureContextConfig {
    isolationLevel: IsolationLevel;
    capabilities: string[];
    quota: ResourceQuota;
}
export interface SecureContext {
    id: string;
    plugin: string;
    isolationLevel: IsolationLevel;
    features: string[];
}
export interface ExecutionResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
}
export type IsolationLevel = "L1" | "L2" | "L2+" | "L3";
export interface ResourceQuota {
    maxCpuPercent: number;
    maxMemoryMB: number;
    timeout: number;
}
declare class PluginRegistry {
    private plugins;
    private detectedHardware;
    private activePlugin;
    /**
     * 注册插件
     */
    register(plugin: SecurityPlugin): void;
    /**
     * 自动检测硬件并选择最佳插件
     */
    autoDetect(): Promise<HardwareInfo>;
    /**
     * 初始化最佳插件
     */
    autoInit(): Promise<boolean>;
    /**
     * 获取当前活动插件
     */
    getActivePlugin(): SecurityPlugin | null;
    /**
     * 获取硬件信息
     */
    getHardwareInfo(): HardwareInfo | null;
    /**
     * 列出所有插件
     */
    listPlugins(): string[];
}
export declare const pluginRegistry: PluginRegistry;
export declare function loadPlugins(): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map