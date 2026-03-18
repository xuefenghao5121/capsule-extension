# Capsule OpenClaw Extension

> **Sandbox-centric Security for OpenClaw** - 鲲鹏硬件优化版

## 安装

```bash
# 从本地安装
cd /root/.openclaw/extensions
git clone https://github.com/xuefenghao5121/capsule-extension.git capsule

# 安装依赖
cd capsule
npm install

# 构建
npm run build
```

## 配置

```yaml
# openclaw.config.yaml
extensions:
  capsule:
    enabled: true
    config:
      workspaceRoot: "./capsule-workspace"
      maxSandboxes: 100
      securityEnabled: true
      defaultIsolation: "L1"
```

## 工具列表

### 沙箱管理

| 工具 | 说明 |
|------|------|
| `sandbox_create` | 创建隔离沙箱 |
| `sandbox_destroy` | 销毁沙箱 |
| `sandbox_list` | 列出所有沙箱 |

### 安全执行

| 工具 | 说明 |
|------|------|
| `exec_sandbox` | 在沙箱中安全执行命令 |

### 能力管理

| 工具 | 说明 |
|------|------|
| `capability_check` | 检查能力 |
| `capability_grant` | 授予权限 |
| `capability_revoke` | 撤销权限 |

### 配额管理

| 工具 | 说明 |
|------|------|
| `quota_check` | 检查配额 |
| `quota_record` | 记录使用 |

### 证明

| 工具 | 说明 |
|------|------|
| `attestation` | 生成/验证证明报告 |

## 隔离级别

| 级别 | 隔离方式 | 硬件特性 | 适用场景 |
|------|----------|----------|----------|
| **L0** | 无隔离 | PAC | 可信代码 |
| **L1** | 进程级 | - | 常规执行 |
| **L1+** | 进程 + MTE/PAC | MTE, PAC | 安全增强 |
| **L2** | Docker | - | 容器隔离 |
| **L2+** | Docker + TEE | iTrustee | 机密计算 |
| **L3** | TrustZone | Secure World | 最高安全 |

## 使用示例

### 创建沙箱

```typescript
// 创建 L1+ 隔离沙箱
const result = await capsule.tools.sandbox_create.execute({
  name: "my-agent",
  isolationLevel: "L1+",
  capabilities: ["file_read", "file_write", "exec"],
  quota: {
    maxInferencePerHour: 100,
    maxTokensPerDay: 10000,
    maxMemoryMB: 512,
  },
});

console.log(result.sandbox.id); // sbx-xxxxxx
```

### 安全执行命令

```typescript
// 在沙箱中执行命令
const result = await capsule.tools.exec_sandbox.execute({
  command: "npm install",
  sandboxId: "sbx-xxxxxx",
  isolationLevel: "L1+",
  securityFeatures: ["mte", "pac"],
  timeout: 60000,
});
```

### 能力管理

```typescript
// 检查能力
const check = await capsule.tools.capability_check.execute({
  sandboxId: "sbx-xxxxxx",
  capability: "exec",
});

// 授予能力
await capsule.tools.capability_grant.execute({
  sandboxId: "sbx-xxxxxx",
  capabilities: ["network", "browser"],
});
```

### 远程证明

```typescript
// 生成证明报告
const report = await capsule.tools.attestation.execute({
  action: "generate",
  sandboxId: "sbx-xxxxxx",
  nonce: "random-nonce-123",
});

// 验证证明
const verify = await capsule.tools.attestation.execute({
  action: "verify",
  report: report.report,
});
```

## 硬件安全特性

### MTE (Memory Tagging Extension)

```bash
# 启用 MTE
exec_sandbox({
  command: "node app.js",
  securityFeatures: ["mte"],
  isolationLevel: "L1+"
})
```

### PAC (Pointer Authentication)

```bash
# 启用 PAC
exec_sandbox({
  command: "node app.js",
  securityFeatures: ["pac"],
  isolationLevel: "L1+"
})
```

### TEE (iTrustee)

```bash
# 使用 TEE 隔离
exec_sandbox({
  command: "process-sensitive-data",
  isolationLevel: "L2+"
})
```

## 项目结构

```
src/
├── index.ts           # 入口
├── types.ts           # 类型定义
├── sandbox.ts         # 沙箱管理器
├── tools/
│   ├── exec_sandbox.ts  # 安全执行
│   ├── sandbox.ts       # 沙箱管理
│   ├── capability.ts    # 能力管理
│   ├── quota.ts         # 配额管理
│   └── attestation.ts   # 远程证明
└── hardware/
    └── kunpeng.ts       # 鲲鹏安全接口
```

## 许可证

MIT License