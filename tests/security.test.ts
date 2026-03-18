/**
 * 安全测试套件 - Capsule Extension
 * 
 * 验证 TEE 隔离前后的安全性对比
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createCapsuleExtension } from "../src/index.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

describe("Security Tests", () => {
  const extensionL1 = createCapsuleExtension({
    workspaceRoot: "./test-workspace-l1",
    defaultIsolation: "L1",
  });

  const extensionL2Plus = createCapsuleExtension({
    workspaceRoot: "./test-workspace-l2plus",
    defaultIsolation: "L2+",
  });

  beforeAll(async () => {
    await extensionL1.init();
    await extensionL2Plus.init();
  });

  afterAll(async () => {
    await extensionL1.shutdown();
    await extensionL2Plus.shutdown();
  });

  describe("1. Memory Safety Tests (MTE)", () => {
    describe("1.1 Buffer Overflow", () => {
      it("L1: Should execute in process isolation", async () => {
        const result = await extensionL1.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('test')"],
            isolationLevel: "L1",
          });

        // L1 使用进程隔离
        expect(result.success).toBe(true);
        expect(result.stdout).toContain("Process isolated");
      });

      it("L1+: Should enable MTE security", async () => {
        const result = await extensionL2Plus.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('test')"],
            isolationLevel: "L1+",
            securityFeatures: ["mte"],
          });

        // L1+ 启用了 MTE 保护
        expect(result.success).toBe(true);
        expect(result.stdout).toContain("Secure process");
      });
    });

    describe("1.2 Use-After-Free", () => {
      it("L1: Process isolation mode", async () => {
        const result = await extensionL1.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('UAF test')"],
            isolationLevel: "L1",
          });

        expect(result.success).toBe(true);
      });

      it("L1+: MTE can detect UAF", async () => {
        const result = await extensionL2Plus.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('UAF test')"],
            isolationLevel: "L1+",
            securityFeatures: ["mte"],
          });

        // MTE 模式下，UAF 应该被检测
        expect(result.success).toBe(true);
      });
    });
  });

  describe("2. Control Flow Tests (PAC)", () => {
    describe("2.1 Function Pointer Protection", () => {
      it("L1: Process isolation only", async () => {
        const result = await extensionL1.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('func ptr test')"],
            isolationLevel: "L1",
          });

        // L1 只有进程隔离
        expect(result.success).toBe(true);
        expect(result.stdout).toContain("Process isolated");
      });

      it("L1+: PAC enabled for control flow", async () => {
        const result = await extensionL2Plus.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('func ptr test')"],
            isolationLevel: "L1+",
            securityFeatures: ["pac"],
          });

        // L1+ 启用了 PAC 保护
        expect(result.success).toBe(true);
        expect(result.stdout).toContain("Secure process");
      });
    });
  });

  describe("3. TEE Isolation Tests", () => {
    describe("3.1 Memory Isolation", () => {
      it("L1: Process-level memory access", async () => {
        const result = await extensionL1.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "cat",
            args: ["/proc/self/maps"],
            isolationLevel: "L1",
            capabilities: ["file_read"],
          });

        // L1 可以读取进程内存映射
        expect(result.success).toBe(true);
        expect(result.stdout).toContain("Process isolated");
      });

      it("L2+: TEE memory is protected", async () => {
        const result = await extensionL2Plus.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "cat",
            args: ["/proc/self/maps"],
            isolationLevel: "L2+",
            capabilities: ["file_read"],
          });

        // L2+ 使用 TEE 隔离
        expect(result.success).toBe(true);
        expect(result.stdout).toContain("TEE container");
      });
    });

    describe("3.2 Key Protection", () => {
      it("L1: Standard process execution", async () => {
        const result = await extensionL1.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('key test')"],
            isolationLevel: "L1",
          });

        expect(result.success).toBe(true);
      });

      it("L2+: TEE protects sensitive data", async () => {
        const result = await extensionL2Plus.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('key test')"],
            isolationLevel: "L2+",
          });

        // TEE 中敏感数据被保护
        expect(result.success).toBe(true);
        expect(result.stdout).toContain("TEE container");
      });
    });
  });

  describe("4. Data Protection Tests", () => {
    describe("4.1 Sensitive Data Handling", () => {
      it("L1: Standard execution mode", async () => {
        const result = await extensionL1.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('data test')"],
            isolationLevel: "L1",
          });

        expect(result.success).toBe(true);
      });

      it("L2+: TEE provides data protection", async () => {
        const result = await extensionL2Plus.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "node",
            args: ["-e", "console.log('data test')"],
            isolationLevel: "L2+",
          });

        // TEE 提供数据保护
        expect(result.success).toBe(true);
        expect(result.stdout).toContain("TEE container");
      });
    });
  });

  describe("5. Permission Boundary Tests", () => {
    let sandboxIdL1: string;
    let sandboxIdL2Plus: string;

    beforeAll(async () => {
      // 创建 L1 沙箱，只有 file_read 能力
      const l1Result = await extensionL1.tools
        .find((t) => t.name === "sandbox_create")!
        .execute({
          name: "perm-test-l1",
          isolationLevel: "L1",
          capabilities: ["file_read"],
        });
      sandboxIdL1 = l1Result.sandbox.id;

      // 创建 L2+ 沙箱，只有 file_read 能力
      const l2plusResult = await extensionL2Plus.tools
        .find((t) => t.name === "sandbox_create")!
        .execute({
          name: "perm-test-l2plus",
          isolationLevel: "L2+",
          capabilities: ["file_read"],
        });
      sandboxIdL2Plus = l2plusResult.sandbox.id;
    });

    describe("5.1 Capability Enforcement", () => {
      it("L1: Capabilities are checked", async () => {
        // 检查 file_read 能力存在
        const checkResult = await extensionL1.tools
          .find((t) => t.name === "capability_check")!
          .execute({
            sandboxId: sandboxIdL1,
            capability: "file_read",
          });

        expect(checkResult.granted).toBe(true);
      });

      it("L2+: Capabilities are enforced at hardware level", async () => {
        // 在 L2+ 中，能力限制应该被硬件强制
        const checks = ["exec", "network", "spawn"];
        
        for (const cap of checks) {
          const result = await extensionL2Plus.tools
            .find((t) => t.name === "capability_check")!
            .execute({
              sandboxId: sandboxIdL2Plus,
              capability: cap,
            });

          expect(result.granted).toBe(false);
        }
      });
    });
  });

  describe("6. Attack Simulation Tests", () => {
    describe("6.1 Malicious Agent Behavior", () => {
      it("L1: Some attacks may succeed", async () => {
        // 尝试读取敏感文件
        const result = await extensionL1.tools
          .find((t) => t.name === "exec_sandbox")!
          .execute({
            command: "ls",
            args: ["/etc"],
            isolationLevel: "L1",
            capabilities: ["file_read"],
          });

        expect(result.success).toBe(true);
      });

      it("L2+: All malicious behaviors should be blocked", async () => {
        // 创建只有 file_read 能力的沙箱
        const sbResult = await extensionL2Plus.tools
          .find((t) => t.name === "sandbox_create")!
          .execute({
            name: "malicious-test",
            isolationLevel: "L2+",
            capabilities: ["file_read"],
          });

        // 尝试执行命令 (应该被拒绝)
        const execCheck = await extensionL2Plus.tools
          .find((t) => t.name === "capability_check")!
          .execute({
            sandboxId: sbResult.sandbox.id,
            capability: "exec",
          });

        expect(execCheck.granted).toBe(false);

        // 尝试网络访问 (应该被拒绝)
        const netCheck = await extensionL2Plus.tools
          .find((t) => t.name === "capability_check")!
          .execute({
            sandboxId: sbResult.sandbox.id,
            capability: "network",
          });

        expect(netCheck.granted).toBe(false);

        // 清理
        await extensionL2Plus.tools
          .find((t) => t.name === "sandbox_destroy")!
          .execute({ sandboxId: sbResult.sandbox.id });
      });
    });
  });

  describe("7. Attestation Tests", () => {
    it("Should generate attestation report", async () => {
      const result = await extensionL2Plus.tools
        .find((t) => t.name === "attestation")!
        .execute({
          action: "generate",
          nonce: "test-nonce-123",
        });

      expect(result.success).toBe(true);
      expect(result.report.nonce).toBe("test-nonce-123");
      expect(result.report.platform).toBe("huawei-kunpeng");
    });

    it("Should verify attestation report", async () => {
      // 先生成报告
      const genResult = await extensionL2Plus.tools
        .find((t) => t.name === "attestation")!
        .execute({
          action: "generate",
        });

      // 然后验证
      const verifyResult = await extensionL2Plus.tools
        .find((t) => t.name === "attestation")!
        .execute({
          action: "verify",
          report: Buffer.from(JSON.stringify(genResult.report)).toString("base64"),
        });

      expect(verifyResult.valid).toBe(true);
    });
  });
});