/**
 * Hardware Security Enable Tool
 * 
 * 让 OpenClaw 可以启用硬件安全特性
 */

import { z } from "zod";

const InputSchema = z.object({
  feature: z.enum(["sgx", "attestation", "sealedStorage", "memoryEncryption"])
    .describe("要启用的安全特性"),
  options: z.object({
    enforce: z.boolean().optional().describe("是否强制启用"),
  }).optional(),
});

type EnableInput = z.infer<typeof InputSchema>;

interface HardwareCache {
  detected: boolean;
  architecture?: string;
  teeType?: string;
  teeVersion?: string;
  features?: {
    attestation: boolean;
    sealedStorage: boolean;
    memoryEncryption: boolean;
  };
  enabled?: {
    sgx: boolean;
    attestation: boolean;
    sealedStorage: boolean;
  };
}

export function createEnableTool(hwCache: HardwareCache) {
  // Initialize enabled state
  if (!hwCache.enabled) {
    hwCache.enabled = {
      sgx: false,
      attestation: false,
      sealedStorage: false,
    };
  }

  return {
    name: "capsule_enable",
    description: `启用指定的硬件安全特性

可启用的特性：
- sgx: Intel SGX 安全飞地
- attestation: 远程证明
- sealedStorage: 密封存储
- memoryEncryption: 内存加密

前置条件：
- 需要先调用 capsule_detect 检测硬件
- 硬件必须支持对应的特性

返回：
- success: 是否成功启用
- message: 状态信息`,

    inputSchema: {
      type: "object",
      properties: {
        feature: {
          type: "string",
          enum: ["sgx", "attestation", "sealedStorage", "memoryEncryption"],
          description: "要启用的安全特性",
        },
        options: {
          type: "object",
          properties: {
            enforce: { type: "boolean" },
          },
        },
      },
      required: ["feature"],
    },

    async execute(input: EnableInput): Promise<{
      success: boolean;
      feature: string;
      enabled: boolean;
      message: string;
    }> {
      const { feature, options } = InputSchema.parse(input);
      
      // Check if hardware was detected
      if (!hwCache.detected) {
        return {
          success: false,
          feature,
          enabled: false,
          message: "请先调用 capsule_detect 检测硬件",
        };
      }

      // Check hardware support
      if (feature === "sgx" && hwCache.teeType !== "sgx") {
        return {
          success: false,
          feature,
          enabled: false,
          message: `当前系统不支持 SGX (检测到: ${hwCache.teeType})`,
        };
      }

      if (feature === "attestation" && !hwCache.features?.attestation) {
        return {
          success: false,
          feature,
          enabled: false,
          message: "当前系统不支持远程证明",
        };
      }

      if (feature === "sealedStorage" && !hwCache.features?.sealedStorage) {
        return {
          success: false,
          feature,
          enabled: false,
          message: "当前系统不支持密封存储",
        };
      }

      if (feature === "memoryEncryption" && !hwCache.features?.memoryEncryption) {
        return {
          success: false,
          feature,
          enabled: false,
          message: "当前系统不支持内存加密",
        };
      }

      // Enable the feature
      switch (feature) {
        case "sgx":
          hwCache.enabled!.sgx = true;
          break;
        case "attestation":
          // SGX must be enabled first
          if (!hwCache.enabled!.sgx && hwCache.teeType === "sgx") {
            hwCache.enabled!.sgx = true;
          }
          hwCache.enabled!.attestation = true;
          break;
        case "sealedStorage":
          // SGX must be enabled first
          if (!hwCache.enabled!.sgx && hwCache.teeType === "sgx") {
            hwCache.enabled!.sgx = true;
          }
          hwCache.enabled!.sealedStorage = true;
          break;
        case "memoryEncryption":
          // Memory encryption is implicit with SGX
          if (hwCache.teeType === "sgx") {
            hwCache.enabled!.sgx = true;
          }
          break;
      }

      return {
        success: true,
        feature,
        enabled: true,
        message: `${feature} 已成功启用`,
      };
    },
  };
}