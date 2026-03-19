/**
 * ARM Security Plugin
 * 
 * 检测：MTE, PAC, TEE, SVE
 */

import { SecurityPlugin, HardwareInfo } from "../index.js";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

function detectARMFeatures(): { mte: boolean; pac: boolean; sve: boolean; tee: boolean } {
  try {
    const cpuinfo = readFileSync("/proc/cpuinfo", "utf-8");
    const lines = cpuinfo.split("\n");
    
    let mte = false;
    let pac = false;
    let sve = false;
    
    for (const line of lines) {
      if (line.startsWith("Features")) {
        const features = line.split(":")[1].trim().split(" ");
        mte = features.includes("mte") || features.includes("mte3");
        pac = features.includes("paca") || features.includes("pacg");
        sve = features.includes("sve");
        break;
      }
    }
    
    // 检测 TEE (iTrustee)
    const tee = existsSync("/dev/itrustee") || existsSync("/dev/teepriv");
    
    return { mte, pac, sve, tee };
  } catch {
    return { mte: false, pac: false, sve: false, tee: false };
  }
}

const armPlugin: SecurityPlugin = {
  name: "arm-security",
  platform: "arm",
  features: ["mte", "pac", "tee", "sve"],
  
  async detect(): Promise<HardwareInfo> {
    const { mte, pac, sve, tee } = detectARMFeatures();
    const hasHWSecurity = mte || pac || tee;
    
    return {
      architecture: "arm64",
      vendor: "huawei", // 鲲鹏
      features: {
        mte,
        pac,
        sve: sve ? { width: 256 } : undefined,
        tee: tee ? { type: "itrustee" } : undefined,
      },
      recommended: {
        isolationLevel: hasHWSecurity ? "L3" : "L1",
        plugin: hasHWSecurity ? "arm-security" : "core",
      },
    };
  },
  
  async init(info: HardwareInfo): Promise<boolean> {
    const { mte, pac, tee, sve } = info.features;
    
    if (mte) console.log("[Capsule ARM] MTE detected");
    if (pac) console.log("[Capsule ARM] PAC detected");
    if (sve) console.log("[Capsule ARM] SVE detected");
    if (tee) console.log("[Capsule ARM] TEE detected");
    
    return !!(mte || pac || tee);
  },
};

export default armPlugin;