#!/usr/bin/env npx tsx
/**
 * Capsule Quick Test
 * 
 * 验证硬件检测和沙箱功能
 */

import { Capsule } from "../src/index.js";

async function main() {
  console.log("🦞 Capsule Security System - Quick Test\n");

  // 创建 Capsule 实例（自动检测硬件）
  const capsule = new Capsule();
  await capsule.init();

  // 创建沙箱
  console.log("\n📦 Creating sandbox...");
  const sandbox = await capsule.createSandbox({
    name: "test-sandbox",
    capabilities: ["exec", "file_read", "file_write"],
  });

  console.log(`   ID: ${sandbox.id}`);
  console.log(`   Isolation: ${sandbox.isolationLevel}`);
  console.log(`   Workspace: ${sandbox.workspace}`);

  // 执行命令
  console.log("\n🔧 Executing command...");
  const result = await capsule.execute(sandbox.id, "echo", ["Hello from Capsule!"]);
  
  console.log(`   Exit Code: ${result.exitCode}`);
  console.log(`   Output: ${result.stdout.trim()}`);
  console.log(`   Duration: ${result.duration}ms`);

  // 清理
  console.log("\n🧹 Cleaning up...");
  await capsule.destroySandbox(sandbox.id);

  console.log("\n✅ Test completed!");
  
  // 打印硬件信息摘要
  const hw = capsule.getHardwareInfo();
  if (hw) {
    console.log(`\n📊 Max isolation level: ${hw.recommended.isolationLevel}`);
  }
}

main().catch(console.error);