/**
 * Plugin System - Auto-detect Hardware Security
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

// ========== Types ==========

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

// ========== Plugin Registry ==========

class PluginRegistry {
  private plugins: Map<string, SecurityPlugin> = new Map();
  private detectedHardware: HardwareInfo | null = null;
  private activePlugin: SecurityPlugin | null = null;

  register(plugin: SecurityPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  async autoDetect(): Promise<HardwareInfo> {
    if (this.detectedHardware) return this.detectedHardware;

    const arch = process.arch as "x64" | "arm64";
    const info: HardwareInfo = {
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
        } catch (err) {
          console.warn(`[Capsule] ${name} detection failed:`, err);
        }
      }
    }

    this.detectedHardware = info;
    return info;
  }

  async autoInit(): Promise<void> {
    if (this.activePlugin) {
      const info = await this.autoDetect();
      await this.activePlugin.init(info);
    } else {
      console.log("[Capsule] No hardware security, using process isolation (L1)");
    }
  }

  getActivePlugin(): SecurityPlugin | null {
    return this.activePlugin;
  }
}

export const pluginRegistry = new PluginRegistry();

// ========== Load Plugins ==========

export async function loadPlugins(): Promise<void> {
  const arch = process.arch;
  
  if (arch === "x64") {
    try {
      const x86 = await import("./x86/index.js");
      pluginRegistry.register(x86.default);
    } catch (err) {
      console.warn("[Capsule] x86 plugin unavailable");
    }
  }
  
  if (arch === "arm64") {
    try {
      const arm = await import("./arm/index.js");
      pluginRegistry.register(arm.default);
    } catch (err) {
      console.warn("[Capsule] ARM plugin unavailable");
    }
  }

  await pluginRegistry.autoInit();
}