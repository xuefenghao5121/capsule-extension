/**
 * TEE Demo - 演示 Capsule 中 TEE 模拟器的使用
 */

import { TEESimulator, TEEIsolatedExecutor, teeExecutor } from "../src/tee/simulator.js";

async function main() {
  console.log("===========================================");
  console.log("  Capsule TEE Simulator Demo");
  console.log("===========================================\n");

  // ========== 1. 基础 TEE 操作 ==========
  console.log("1. Basic TEE Operations\n");
  console.log("-------------------------------------------");

  const tee = new TEESimulator();

  // 初始化
  await tee.initializeContext("demo");

  // 打开会话
  const session = await tee.openSession(
    "demo-app-12345678-1234-1234-1234-123456789abc"
  );

  // 安全存储 API Key
  console.log("\n[Demo] Storing API key securely...");
  await tee.invokeCommand(session, "SECURE_STORE", {
    key: "openai_api_key",
    value: "sk-demo-key-12345678",
  });

  // 安全读取
  console.log("\n[Demo] Loading API key...");
  const loadResult = await tee.invokeCommand(session, "SECURE_LOAD", {
    key: "openai_api_key",
  });
  console.log(`  Loaded value: ${loadResult.output}`);

  // ========== 2. 密钥管理 ==========
  console.log("\n\n2. Key Management\n");
  console.log("-------------------------------------------");

  // 生成密钥
  console.log("\n[Demo] Generating encryption key in TEE...");
  const keyResult = await tee.invokeCommand(session, "GENERATE_KEY", {});
  const keyId = keyResult.output;
  console.log(`  Key ID: ${keyId}`);

  // 使用密钥加密
  console.log("\n[Demo] Encrypting data...");
  const encryptResult = await tee.invokeCommand(session, "ENCRYPT", {
    data: "sensitive-data-123",
    keyId,
  });
  console.log(`  Encrypted: ${JSON.stringify(encryptResult.output).slice(0, 100)}...`);

  // 解密
  console.log("\n[Demo] Decrypting data...");
  const decryptResult = await tee.invokeCommand(session, "DECRYPT", {
    data: encryptResult.output,
    keyId,
  });
  console.log(`  Decrypted: ${decryptResult.output}`);

  // ========== 3. 远程证明 ==========
  console.log("\n\n3. Remote Attestation\n");
  console.log("-------------------------------------------");

  console.log("\n[Demo] Generating attestation report...");
  const attestResult = await tee.invokeCommand(session, "ATTEST", {
    nonce: "challenge-12345",
  });
  console.log("  Attestation report:");
  console.log(`    Platform: ${attestResult.output.platform}`);
  console.log(`    Timestamp: ${attestResult.output.timestamp}`);
  console.log(`    Nonce: ${attestResult.output.nonce}`);
  console.log(`    Signature: ${attestResult.output.signature.slice(0, 32)}...`);

  // ========== 4. 安全执行 ==========
  console.log("\n\n4. Secure Execution\n");
  console.log("-------------------------------------------");

  console.log("\n[Demo] Executing command in TEE-isolated environment...");
  const execResult = await tee.invokeCommand(session, "EXECUTE_SECURE", {
    command: "echo",
    args: ["Hello from TEE!"],
    timeout: 5000,
  });
  console.log(`  Success: ${execResult.success}`);
  console.log(`  Output: ${execResult.output?.stdout?.trim()}`);
  console.log(`  Isolated: ${execResult.output?.isolated}`);

  // 关闭会话
  await tee.closeSession(session);

  // ========== 5. Capsule 集成演示 ==========
  console.log("\n\n5. Capsule Integration Demo\n");
  console.log("-------------------------------------------");

  console.log("\n[Demo] Using TEEIsolatedExecutor...");

  // 存储 API Key
  console.log("\n  Storing API key...");
  await teeExecutor.secureStore("anthropic_api_key", "sk-ant-demo-123");
  console.log("  ✓ Stored");

  // 读取
  console.log("\n  Loading API key...");
  const apiKey = await teeExecutor.secureLoad("anthropic_api_key");
  console.log(`  ✓ Loaded: ${apiKey}`);

  // 证明
  console.log("\n  Generating attestation...");
  const attest = await teeExecutor.attestation("capsule-test");
  console.log(`  ✓ Attestation: ${attest.platform} @ ${attest.timestamp}`);

  // 安全执行
  console.log("\n  Executing command securely...");
  const result = await teeExecutor.executeSecure("node", ["-e", "console.log('TEE Test')"]);
  console.log(`  ✓ Result: ${result.stdout.trim()}`);
  console.log(`  ✓ Isolated: ${result.isolated}`);

  // 清理
  await teeExecutor.stop();

  console.log("\n\n===========================================");
  console.log("  Demo Complete!");
  console.log("===========================================");
}

main().catch(console.error);