/**
 * Guardrails Plugin
 * 
 * Capsule 自研 Guardrails 系统
 * 设计哲学：Guardrails ≈ Gatekeeper
 */

import { SecurityPlugin, HardwareInfo } from "../index.js";
import { Gatekeeper, GateContext, gatekeeper } from "../../guardrails/gatekeeper.js";

const guardrailsPlugin: SecurityPlugin = {
  name: "guardrails",
  platform: "universal",
  features: ["input-gate", "output-gate", "jailbreak-detection", "injection-detection", "sensitive-data"],
  
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
    console.log("[Capsule Guardrails] Gatekeeper initialized");
    console.log("[Capsule Guardrails] Input rules:", gatekeeper.listRules().input.join(", "));
    console.log("[Capsule Guardrails] Output rules:", gatekeeper.listRules().output.join(", "));
    return true;
  },
};

export default guardrailsPlugin;
export { Gatekeeper, GateContext, gatekeeper };