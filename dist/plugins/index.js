/**
 * Plugin System - Auto-detect Hardware Security
 */
// ========== Plugin Registry ==========
class PluginRegistry {
    plugins = new Map();
    detectedHardware = null;
    activePlugin = null;
    register(plugin) {
        this.plugins.set(plugin.name, plugin);
    }
    async autoDetect() {
        if (this.detectedHardware)
            return this.detectedHardware;
        const arch = process.arch;
        const info = {
            architecture: arch,
            features: {},
            recommended: { isolationLevel: "L1", plugin: "core" },
        };
        for (const [name, plugin] of this.plugins) {
            if ((arch === "x64" && plugin.platform === "x86") ||
                (arch === "arm64" && plugin.platform === "arm")) {
                try {
                    const pluginInfo = await plugin.detect();
                    Object.assign(info.features, pluginInfo.features);
                    if (pluginInfo.recommended.isolationLevel !== "L1") {
                        info.recommended = pluginInfo.recommended;
                        this.activePlugin = plugin;
                    }
                }
                catch (err) {
                    console.warn(`[Capsule] ${name} detection failed:`, err);
                }
            }
        }
        this.detectedHardware = info;
        return info;
    }
    async autoInit() {
        if (this.activePlugin) {
            const info = await this.autoDetect();
            await this.activePlugin.init(info);
        }
        else {
            console.log("[Capsule] No hardware security, using process isolation (L1)");
        }
    }
    getActivePlugin() {
        return this.activePlugin;
    }
}
export const pluginRegistry = new PluginRegistry();
// ========== Load Plugins ==========
export async function loadPlugins() {
    const arch = process.arch;
    if (arch === "x64") {
        try {
            const x86 = await import("./x86/index.js");
            pluginRegistry.register(x86.default);
        }
        catch (err) {
            console.warn("[Capsule] x86 plugin unavailable");
        }
    }
    if (arch === "arm64") {
        try {
            const arm = await import("./arm/index.js");
            pluginRegistry.register(arm.default);
        }
        catch (err) {
            console.warn("[Capsule] ARM plugin unavailable");
        }
    }
    await pluginRegistry.autoInit();
}
//# sourceMappingURL=index.js.map