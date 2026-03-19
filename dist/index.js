/**
 * Capsule - Sandbox + Hardware Security
 *
 * 核心设计：
 * 1. Sandbox Manager - 沙箱管理
 * 2. Hardware Security - 硬件安全特性
 */
// Core
export { SandboxManager, } from "./core/sandbox.js";
// Plugins
export { pluginRegistry, loadPlugins } from "./plugins/index.js";
// ========== Capsule Instance ==========
import { SandboxManager } from "./core/sandbox.js";
import { pluginRegistry, loadPlugins } from "./plugins/index.js";
export class Capsule {
    sandboxManager;
    hardwareInfo = null;
    initialized = false;
    constructor(config = {}) {
        this.sandboxManager = new SandboxManager(config.workspaceRoot);
        if (config.autoDetect !== false) {
            this.init().catch(err => {
                console.warn("[Capsule] Auto-init failed:", err);
            });
        }
    }
    /**
     * 初始化：检测硬件安全特性
     */
    async init() {
        if (this.initialized)
            return;
        console.log("╔══════════════════════════════════════════╗");
        console.log("║         Capsule Security System          ║");
        console.log("║      Sandbox + Hardware Security         ║");
        console.log("╚══════════════════════════════════════════╝");
        await loadPlugins();
        this.hardwareInfo = await pluginRegistry.autoDetect();
        this.printHardwareInfo();
        this.initialized = true;
        console.log("[Capsule] ✅ Ready!");
    }
    /**
     * 创建沙箱
     */
    async createSandbox(config) {
        await this.ensureInit();
        return this.sandboxManager.create(config);
    }
    /**
     * 执行命令
     */
    async execute(sandboxId, command, args = []) {
        await this.ensureInit();
        return this.sandboxManager.execute(sandboxId, command, args);
    }
    /**
     * 销毁沙箱
     */
    async destroySandbox(sandboxId) {
        return this.sandboxManager.destroy(sandboxId);
    }
    /**
     * 获取硬件信息
     */
    getHardwareInfo() {
        return this.hardwareInfo;
    }
    /**
     * 列出沙箱
     */
    listSandboxes() {
        return this.sandboxManager.list();
    }
    // ========== Private ==========
    async ensureInit() {
        if (!this.initialized)
            await this.init();
    }
    printHardwareInfo() {
        if (!this.hardwareInfo)
            return;
        const { architecture, vendor, features, recommended } = this.hardwareInfo;
        console.log();
        console.log("┌─ Hardware Security ─────────────────────┐");
        console.log(`│ Arch:    ${architecture.padEnd(30)}│`);
        if (vendor)
            console.log(`│ Vendor:  ${vendor.padEnd(30)}│`);
        console.log("├───────────────────────────────────────────┤");
        if (architecture === "x64") {
            console.log(`│ SGX:     ${this.formatFeature(features.sgx, `v${features.sgx?.version}`)}│`);
            console.log(`│ TDX:     ${this.formatFeature(features.tdx)}│`);
            console.log(`│ SEV:     ${this.formatFeature(features.sev, `v${features.sev?.version}`)}│`);
        }
        else {
            console.log(`│ MTE:     ${this.formatFeature(features.mte)}│`);
            console.log(`│ PAC:     ${this.formatFeature(features.pac)}│`);
            console.log(`│ TEE:     ${this.formatFeature(features.tee, features.tee?.type)}│`);
        }
        console.log("├───────────────────────────────────────────┤");
        console.log(`│ Max Isolation: ${recommended.isolationLevel.padEnd(23)}│`);
        console.log("└───────────────────────────────────────────┘");
    }
    formatFeature(value, detail) {
        if (!value)
            return "❌".padEnd(29);
        if (detail)
            return `✅ ${detail}`.padEnd(29);
        return "✅".padEnd(29);
    }
}
// Default instance
export const capsule = new Capsule({ autoDetect: true });
//# sourceMappingURL=index.js.map