import { describe, it, expect, beforeAll } from "vitest";
import { createCapsuleExtension } from "../src/index.js";

describe("Capsule Extension", () => {
  const extension = createCapsuleExtension({
    workspaceRoot: "./test-workspace",
    maxSandboxes: 10,
  });

  beforeAll(async () => {
    await extension.init();
  });

  describe("Sandbox Tools", () => {
    it("should create a sandbox", async () => {
      const result = await extension.tools
        .find((t) => t.name === "sandbox_create")!
        .execute({
          name: "test-sandbox",
          isolationLevel: "L1",
          capabilities: ["file_read", "exec"],
        });

      expect(result.success).toBe(true);
      expect(result.sandbox.name).toBe("test-sandbox");
      expect(result.sandbox.isolationLevel).toBe("L1");
    });

    it("should list sandboxes", async () => {
      const result = await extension.tools
        .find((t) => t.name === "sandbox_list")!
        .execute({});

      expect(result.total).toBeGreaterThan(0);
      expect(result.sandboxes).toBeInstanceOf(Array);
    });

    it("should destroy a sandbox", async () => {
      // First create one
      const createResult = await extension.tools
        .find((t) => t.name === "sandbox_create")!
        .execute({
          name: "to-destroy",
          isolationLevel: "L0",
        });

      // Then destroy it
      const result = await extension.tools
        .find((t) => t.name === "sandbox_destroy")!
        .execute({
          sandboxId: createResult.sandbox.id,
        });

      expect(result.success).toBe(true);
    });
  });

  describe("Capability Tools", () => {
    let sandboxId: string;

    beforeAll(async () => {
      const result = await extension.tools
        .find((t) => t.name === "sandbox_create")!
        .execute({
          name: "capability-test",
          isolationLevel: "L1",
          capabilities: ["file_read"],
        });
      sandboxId = result.sandbox.id;
    });

    it("should check capability", async () => {
      const result = await extension.tools
        .find((t) => t.name === "capability_check")!
        .execute({
          sandboxId,
          capability: "file_read",
        });

      expect(result.granted).toBe(true);
    });

    it("should grant capability", async () => {
      const result = await extension.tools
        .find((t) => t.name === "capability_grant")!
        .execute({
          sandboxId,
          capabilities: ["exec"],
        });

      expect(result.success).toBe(true);
      expect(result.currentCapabilities).toContain("exec");
    });

    it("should revoke capability", async () => {
      const result = await extension.tools
        .find((t) => t.name === "capability_revoke")!
        .execute({
          sandboxId,
          capabilities: ["exec"],
        });

      expect(result.success).toBe(true);
      expect(result.currentCapabilities).not.toContain("exec");
    });
  });

  describe("Quota Tools", () => {
    let sandboxId: string;

    beforeAll(async () => {
      const result = await extension.tools
        .find((t) => t.name === "sandbox_create")!
        .execute({
          name: "quota-test",
          isolationLevel: "L1",
          quota: {
            maxInferencePerHour: 100,
            maxTokensPerDay: 10000,
          },
        });
      sandboxId = result.sandbox.id;
    });

    it("should check quota", async () => {
      const result = await extension.tools
        .find((t) => t.name === "quota_check")!
        .execute({
          sandboxId,
          inferences: 10,
          tokens: 1000,
        });

      expect(result.allowed).toBe(true);
    });

    it("should record usage", async () => {
      const result = await extension.tools
        .find((t) => t.name === "quota_record")!
        .execute({
          sandboxId,
          inferences: 5,
          tokens: 500,
        });

      expect(result.success).toBe(true);
      expect(result.totalUsage.inferences).toBe(5);
    });

    it("should reject over-quota request", async () => {
      const result = await extension.tools
        .find((t) => t.name === "quota_check")!
        .execute({
          sandboxId,
          inferences: 1000, // Exceeds quota
        });

      expect(result.allowed).toBe(false);
    });
  });

  describe("Attestation Tool", () => {
    it("should generate attestation report", async () => {
      const result = await extension.tools
        .find((t) => t.name === "attestation")!
        .execute({
          action: "generate",
          nonce: "test-nonce-123",
        });

      expect(result.success).toBe(true);
      expect(result.report.nonce).toBe("test-nonce-123");
    });
  });

  describe("exec_sandbox Tool", () => {
    it("should execute command in sandbox", async () => {
      const result = await extension.tools
        .find((t) => t.name === "exec_sandbox")!
        .execute({
          command: "echo",
          args: ["hello"],
          isolationLevel: "L1",
        });

      expect(result.success).toBe(true);
      expect(result.sandboxId).toBeDefined();
    });
  });
});