/**
 * Plugin System - Auto-detect Hardware Security
 */
export interface SecurityPlugin {
    name: string;
    platform: "x86" | "arm";
    features: string[];
    detect(): Promise<HardwareInfo>;
    init(info: HardwareInfo): Promise<boolean>;
}
export interface HardwareInfo {
    architecture: "x64" | "arm64";
    vendor?: "intel" | "amd" | "huawei" | "unknown";
    features: Record<string, any>;
    recommended: {
        isolationLevel: "L1" | "L2" | "L2+" | "L3";
        plugin: string;
    };
}
declare class PluginRegistry {
    private plugins;
    private detectedHardware;
    private activePlugin;
    register(plugin: SecurityPlugin): void;
    autoDetect(): Promise<HardwareInfo>;
    autoInit(): Promise<void>;
    getActivePlugin(): SecurityPlugin | null;
}
export declare const pluginRegistry: PluginRegistry;
export declare function loadPlugins(): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map