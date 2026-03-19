/**
 * Capsule - Sandbox + Hardware Security
 * 
 * 核心设计：
 * 1. Sandbox Manager - 沙箱管理
 * 2. Hardware Security - 硬件安全特性
 */

// Core
export {
  SandboxManager,
  type Sandbox,
  type SandboxConfig,
  type SandboxId,
  type IsolationLevel,
  type SandboxStatus,
  type ResourceQuota,
  type ExecutionResult,
} from "./core/sandbox.js";

// Plugins
export { 
  pluginRegistry, 
  loadPlugins, 
  type HardwareInfo, 
  type SecurityPlugin 
} from "./plugins/index.js";

// ========== Capsule Instance ==========

import { SandboxManager, Sandbox, SandboxConfig, ExecutionResult, IsolationLevel } from "./core/sandbox.js";
import { pluginRegistry, loadPlugins, HardwareInfo, SecurityPlugin } from "./plugins/index.js";

export interface CapsuleConfig {
  workspaceRoot?: string;
  autoDetect?: boolean;
}

export class Capsule {
  private sandboxManager: SandboxManager;
  private hardwareInfo: HardwareInfo | null = null;
  private initialized = false;

  constructor(config: CapsuleConfig = {}) {
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
  async init(): Promise<void> {
    if (this.initialized) return;

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
  async createSandbox(config: SandboxConfig): Promise<Sandbox> {
    await this.ensureInit();
    return this.sandboxManager.create(config);
  }

  /**
   * 执行命令
   */
  async execute(sandboxId: string, command: string, args: string[] = []): Promise<ExecutionResult> {
    await this.ensureInit();
    return this.sandboxManager.execute(sandboxId, command, args);
  }

  /**
   * 销毁沙箱
   */
  async destroySandbox(sandboxId: string): Promise<void> {
    return this.sandboxManager.destroy(sandboxId);
  }

  /**
   * 获取硬件信息
   */
  getHardwareInfo(): HardwareInfo | null {
    return this.hardwareInfo;
  }

  /**
   * 列出沙箱
   */
  listSandboxes(): Sandbox[] {
    return this.sandboxManager.list();
  }

  // ========== Private ==========

  private async ensureInit(): Promise<void> {
    if (!this.initialized) await this.init();
  }

  private printHardwareInfo(): void {
    if (!this.hardwareInfo) return;

    const { architecture, vendor, features, recommended } = this.hardwareInfo;
    
    console.log();
    console.log("┌─ Hardware Security ─────────────────────┐");
    console.log(`│ Arch:    ${architecture.padEnd(30)}│`);
    if (vendor) console.log(`│ Vendor:  ${vendor.padEnd(30)}│`);
    console.log("├───────────────────────────────────────────┤");
    
    if (architecture === "x64") {
      console.log(`│ SGX:     ${this.formatFeature(features.sgx, `v${(features.sgx as any)?.version}`)}│`);
      console.log(`│ TDX:     ${this.formatFeature(features.tdx)}│`);
      console.log(`│ SEV:     ${this.formatFeature(features.sev, `v${(features.sev as any)?.version}`)}│`);
    } else {
      console.log(`│ MTE:     ${this.formatFeature(features.mte)}│`);
      console.log(`│ PAC:     ${this.formatFeature(features.pac)}│`);
      console.log(`│ TEE:     ${this.formatFeature(features.tee, (features.tee as any)?.type)}│`);
    }
    
    console.log("├───────────────────────────────────────────┤");
    console.log(`│ Max Isolation: ${recommended.isolationLevel.padEnd(23)}│`);
    console.log("└───────────────────────────────────────────┘");
  }

  private formatFeature(value: any, detail?: string): string {
    if (!value) return "❌".padEnd(29);
    if (detail) return `✅ ${detail}`.padEnd(29);
    return "✅".padEnd(29);
  }
}

// Default instance
export const capsule = new Capsule({ autoDetect: true });