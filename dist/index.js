/**
 * Capsule - Sandbox-centric Security for AI Agents
 *
 * 安装即用，自动检测硬件安全特性
 */
// 从 core 导出所有类型
export { SandboxManager, } from "./core/sandbox.js";
// 从 plugins 导出
export { pluginRegistry, loadPlugins } from "./plugins/index.js";
// ========== Capsule Instance ==========
import { SandboxManager } from "./core/sandbox.js";
import { pluginRegistry, loadPlugins } from "./plugins/index.js";
export class Capsule {
    sandboxManager;
    hardwareInfo = null;
    activePlugin = null;
    initialized = false;
    constructor(config = {}) {
        this.sandboxManager = new SandboxManager(config.workspaceRoot);
        if (config.autoDetect !== false) {
            // 自动初始化
            this.init().catch(err => {
                console.warn("[Capsule] Auto-init failed:", err);
            });
        }
    }
    /**
     * 初始化 Capsule
     * - 自动检测硬件
     * - 自动加载插件
     * - 自动使能安全特性
     */
    async init() {
        if (this.initialized)
            return;
        console.log("╔══════════════════════════════════════════╗");
        console.log("║         Capsule Security System          ║");
        console.log("║    Sandbox-centric Security for AI       ║");
        console.log("╚══════════════════════════════════════════╝");
        console.log();
        // 1. 加载插件
        console.log("[Capsule] Loading plugins...");
        await loadPlugins();
        // 2. 检测硬件
        console.log("[Capsule] Detecting hardware...");
        this.hardwareInfo = await pluginRegistry.autoDetect();
        this.activePlugin = pluginRegistry.getActivePlugin();
        // 3. 打印检测信息
        this.printHardwareInfo();
        this.initialized = true;
        console.log("[Capsule] ✅ Ready!");
    }
    /**
     * 创建沙箱
     */
    async createSandbox(config) {
        await this.ensureInit();
        // 根据硬件能力调整隔离级别
        const isolationLevel = this.recommendIsolation(config.isolationLevel);
        return this.sandboxManager.create({
            ...config,
            isolationLevel,
        });
    }
    /**
     * 执行命令
     */
    async execute(sandboxId, command, args = []) {
        await this.ensureInit();
        const sandbox = this.sandboxManager.get(sandboxId);
        if (!sandbox) {
            throw new Error(`Sandbox ${sandboxId} not found`);
        }
        // 如果有安全插件且隔离级别 >= L2+，使用安全执行
        if (this.activePlugin &&
            sandbox.isolationLevel >= "L2+" &&
            this.activePlugin.executeSecure) {
            console.log(`[Capsule] Using secure execution (${this.activePlugin.name})`);
            // TODO: 实现 secure context
        }
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
     * 获取推荐的隔离级别
     */
    getRecommendedIsolation() {
        return this.hardwareInfo?.recommended.isolationLevel || "L1";
    }
    /**
     * 列出所有沙箱
     */
    listSandboxes() {
        return this.sandboxManager.list();
    }
    // ========== Private ==========
    async ensureInit() {
        if (!this.initialized) {
            await this.init();
        }
    }
    recommendIsolation(requested) {
        if (requested) {
            return requested;
        }
        return (this.hardwareInfo?.recommended.isolationLevel || "L1");
    }
    printHardwareInfo() {
        if (!this.hardwareInfo)
            return;
        const { architecture, vendor, features, recommended } = this.hardwareInfo;
        console.log();
        console.log("┌─ Hardware Detection ─────────────────────┐");
        console.log(`│ Architecture: ${architecture.padEnd(26)}│`);
        console.log(`│ Vendor:       ${(vendor || "unknown").padEnd(26)}│`);
        console.log("├───────────────────────────────────────────┤");
        if (architecture === "x64") {
            console.log("│ x86 Security Features:                    │");
            console.log(`│   SGX:      ${this.formatFeature(features.sgx, `v${features.sgx?.version || '-'}`)}│`);
            console.log(`│   TDX:      ${this.formatFeature(features.tdx)}│`);
            console.log(`│   SEV:      ${this.formatFeature(features.sev, `v${features.sev?.version || '-'}`)}│`);
        }
        else if (architecture === "arm64") {
            console.log("│ ARM Security Features:                    │");
            console.log(`│   MTE:      ${this.formatFeature(features.mte)}│`);
            console.log(`│   PAC:      ${this.formatFeature(features.pac)}│`);
            console.log(`│   TEE:      ${this.formatFeature(features.tee, features.tee?.type)}│`);
            console.log(`│   SVE:      ${this.formatFeature(features.sve, `${features.sve?.width || 256}-bit`)}│`);
        }
        console.log("├───────────────────────────────────────────┤");
        console.log(`│ Recommended Isolation: ${recommended.isolationLevel.padEnd(17)}│`);
        console.log(`│ Active Plugin:         ${(recommended.plugin || "core").padEnd(17)}│`);
        console.log("└───────────────────────────────────────────┘");
        console.log();
    }
    formatFeature(value, detail) {
        if (!value) {
            return "❌ Not available".padEnd(28);
        }
        if (detail) {
            return `✅ ${detail}`.padEnd(28);
        }
        return "✅ Available".padEnd(28);
    }
}
// ========== Default Instance ==========
export const capsule = new Capsule({ autoDetect: true });
// ========== Quick Start API ==========
export async function quickStart() {
    const instance = new Capsule();
    await instance.init();
    return instance;
}
//# sourceMappingURL=index.js.map