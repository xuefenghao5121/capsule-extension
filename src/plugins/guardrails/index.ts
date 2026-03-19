/**
 * Guardrails Plugin (Placeholder)
 * 
 * 支持：Input Rails, Output Rails, Execution Rails
 */

import { SecurityPlugin, HardwareInfo } from "../index.js";

const guardrailsPlugin: SecurityPlugin = {
  name: "guardrails",
  platform: "universal",
  features: ["input-rails", "output-rails", "execution-rails"],
  
  async detect(): Promise<HardwareInfo> {
    return {
      architecture: process.arch as "x64" | "arm64",
      features: {},
      recommended: {
        isolationLevel: "L1",
        plugin: "guardrails",
      },
    };
  },
  
  async init(info: HardwareInfo): Promise<boolean> {
    console.log("[Capsule Guardrails] Guardrails plugin initialized");
    return false; // 暂时降级，等待集成 NeMo Guardrails
  },
};

export default guardrailsPlugin;