/**
 * Capsule Plugin System
 *
 * 自动检测硬件 → 自动加载插件 → 自动使能安全特性
 */
// ========== Plugin Registry ==========
class PluginRegistry {
    plugins = new Map();
    detectedHardware = null;
    activePlugin = null;
    /**
     * 注册插件
     */
    register(plugin) {
        this.plugins.set(plugin.name, plugin);
        console.log(`[Capsule] Plugin registered: ${plugin.name} (${plugin.platform})`);
    }
    /**
     * 自动检测硬件并选择最佳插件
     */
    async autoDetect() {
        if (this.detectedHardware) {
            return this.detectedHardware;
        }
        const arch = process.arch;
        const info = {
            architecture: arch,
            features: {},
            recommended: {
                isolationLevel: "L1",
                plugin: "core",
            },
        };
        // 遍历所有插件，让它们检测硬件
        for (const [name, plugin] of this.plugins) {
            try {
                const pluginInfo = await plugin.detect();
                // 合并检测结果
                Object.assign(info.features, pluginInfo.features);
                // 如果插件平台匹配，更新推荐
                const platformMatch = (arch === "x64" && plugin.platform === "x86") ||
                    (arch === "arm64" && plugin.platform === "arm") ||
                    plugin.platform === "universal";
                if (platformMatch) {
                    const levels = { L1: 1, L2: 2, "L2+": 3, L3: 4 };
                    if (levels[pluginInfo.recommended.isolationLevel] > levels[info.recommended.isolationLevel]) {
                        info.recommended = pluginInfo.recommended;
                        this.activePlugin = plugin;
                    }
                }
                console.log(`[Capsule] Detected by ${name}:`, pluginInfo.features);
            }
            catch (err) {
                console.warn(`[Capsule] Detection failed for ${name}:`, err);
            }
        }
        this.detectedHardware = info;
        console.log(`[Capsule] Auto-detected hardware:`, info);
        console.log(`[Capsule] Recommended: ${info.recommended.plugin} (${info.recommended.isolationLevel})`);
        return info;
    }
    /**
     * 初始化最佳插件
     */
    async autoInit() {
        const info = await this.autoDetect();
        if (this.activePlugin) {
            try {
                const success = await this.activePlugin.init(info);
                if (success) {
                    console.log(`[Capsule] Plugin ${this.activePlugin.name} initialized successfully`);
                    return true;
                }
            }
            catch (err) {
                console.warn(`[Capsule] Failed to init ${this.activePlugin.name}:`, err);
            }
        }
        // 降级到核心模式
        console.log(`[Capsule] Running in core mode (no hardware acceleration)`);
        return false;
    }
    /**
     * 获取当前活动插件
     */
    getActivePlugin() {
        return this.activePlugin;
    }
    /**
     * 获取硬件信息
     */
    getHardwareInfo() {
        return this.detectedHardware;
    }
    /**
     * 列出所有插件
     */
    listPlugins() {
        return Array.from(this.plugins.keys());
    }
}
// ========== Global Registry ==========
export const pluginRegistry = new PluginRegistry();
// ========== Auto-load Plugins ==========
export async function loadPlugins() {
    // 检测架构
    const arch = process.arch;
    // 加载 x86 插件
    if (arch === "x64") {
        try {
            const x86Plugin = await import("./x86/index.js");
            pluginRegistry.register(x86Plugin.default);
        }
        catch (err) {
            console.warn("[Capsule] x86 plugin not available:", err);
        }
    }
    // 加载 ARM 插件
    if (arch === "arm64") {
        try {
            const armPlugin = await import("./arm/index.js");
            pluginRegistry.register(armPlugin.default);
        }
        catch (err) {
            console.warn("[Capsule] ARM plugin not available:", err);
        }
    }
    // 加载 Guardrails 插件（跨平台）
    try {
        const guardrailsPlugin = await import("./guardrails/index.js");
        pluginRegistry.register(guardrailsPlugin.default);
    }
    catch (err) {
        console.warn("[Capsule] Guardrails plugin not available:", err);
    }
    // 自动初始化
    await pluginRegistry.autoInit();
}
//# sourceMappingURL=index.js.map