# Capsule Extension 设计目标

> 核心目标：让 OpenClaw 能够利用硬件安全特性

---

## 设计理念

### 硬件安全使能 (Hardware Security Enablement)

Capsule Extension 的核心使命是**使能** OpenClaw 使用底层硬件安全特性：

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenClaw 用户                             │
│                           │                                  │
│                           ▼                                  │
│              ┌─────────────────────────┐                    │
│              │   Capsule Extension     │                    │
│              │   (使能层)               │                    │
│              └─────────────────────────┘                    │
│                           │                                  │
│         ┌─────────────────┼─────────────────┐               │
│         ▼                 ▼                 ▼               │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐        │
│   │Intel SGX  │     │ARM TrustZone│   │ AMD SEV   │        │
│   │  (x86)    │     │   (ARM)     │   │  (x86)    │        │
│   └───────────┘     └───────────┘     └───────────┘        │
│         │                 │                 │               │
│         ▼                 ▼                 ▼               │
│   ┌─────────────────────────────────────────────────┐      │
│   │              硬件安全特性                         │      │
│   │  - 安全飞地 (Enclave)                            │      │
│   │  - 远程证明 (Attestation)                        │      │
│   │  - 密封存储 (Sealed Storage)                     │      │
│   │  - 内存加密 (Memory Encryption)                  │      │
│   └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心能力

### 1. 硬件检测 (Detection)

让 OpenClaw 知道当前系统支持哪些硬件安全特性：

```typescript
// 用户调用
const hwInfo = await capsule.detectHardware();

// 返回
{
  architecture: "x64",
  tee: {
    type: "sgx",
    version: "SGX2",
    available: true
  },
  features: {
    attestation: true,
    sealedStorage: true,
    memoryEncryption: true
  }
}
```

### 2. 特性使能 (Enablement)

让 OpenClaw 可以启用硬件安全特性：

```typescript
// 启用 SGX
await capsule.enableSGX({
  enableAttestation: true,
  enableSealing: true,
});

// 启用隔离执行
await capsule.enableIsolation({
  level: "L3",  // SGX Enclave
  enforce: true
});
```

### 3. 安全校验 (Verification)

让 OpenClaw 可以验证当前环境的安全性：

```typescript
// 生成证明报告
const report = await capsule.generateAttestation({
  data: "challenge-data",
  nonce: "random-nonce"
});

// 验证环境
const verified = await capsule.verifyEnvironment({
  requireSGX: true,
  requireAttestation: true
});
```

### 4. 安全执行 (Secure Execution)

让 OpenClaw 可以在安全环境中执行代码：

```typescript
// 在 SGX Enclave 中执行
const result = await capsule.executeSecure(
  "process-sensitive-data",
  args,
  {
    isolation: "L3",
    attestBefore: true,  // 执行前证明
    sealOutput: true     // 输出密封
  }
);
```

---

## 用户接口设计

### Tool 1: `capsule_detect`

检测硬件安全特性

```typescript
{
  name: "capsule_detect",
  description: "检测系统硬件安全特性",
  input: {},
  output: {
    architecture: "x64" | "arm64",
    tee: {
      type: "sgx" | "trustzone" | "sev" | "none",
      version: string,
      available: boolean
    },
    features: {
      attestation: boolean,
      sealedStorage: boolean,
      memoryEncryption: boolean
    }
  }
}
```

### Tool 2: `capsule_enable`

启用硬件安全特性

```typescript
{
  name: "capsule_enable",
  description: "启用指定的硬件安全特性",
  input: {
    feature: "sgx" | "trustzone" | "memoryEncryption",
    options: {
      attestation: boolean,
      sealing: boolean
    }
  },
  output: {
    success: boolean,
    message: string
  }
}
```

### Tool 3: `capsule_attest`

生成/验证证明

```typescript
{
  name: "capsule_attest",
  description: "生成或验证硬件证明",
  input: {
    action: "generate" | "verify",
    data?: string,
    report?: string
  },
  output: {
    valid: boolean,
    report?: string,
    signature?: string
  }
}
```

### Tool 4: `capsule_exec`

安全执行命令

```typescript
{
  name: "capsule_exec",
  description: "在安全隔离环境中执行命令",
  input: {
    command: string,
    args: string[],
    isolation: "L1" | "L2" | "L3",
    attestBefore?: boolean
  },
  output: {
    exitCode: number,
    stdout: string,
    stderr: string,
    attestation?: string
  }
}
```

---

## 使能场景

### 场景 1: 安全配置管理

用户想要安全地存储 API Key：

```typescript
// 1. 检测硬件
const hw = await capsule_detect();

// 2. 如果支持 SGX，使用密封存储
if (hw.tee.type === "sgx") {
  await capsule_seal({
    key: "OPENAI_API_KEY",
    value: "sk-xxx"
  });
}
```

### 场景 2: 安全代码执行

用户想要安全地执行不受信任的代码：

```typescript
// 1. 启用隔离
await capsule_enable({ feature: "sgx" });

// 2. 在 Enclave 中执行
const result = await capsule_exec({
  command: "untrusted-script",
  args: [],
  isolation: "L3",
  attestBefore: true
});

// 3. 验证执行结果
if (result.attestation) {
  const verified = await capsule_attest({
    action: "verify",
    report: result.attestation
  });
}
```

### 场景 3: 远程验证

用户想要证明自己在安全环境中运行：

```typescript
// 生成证明报告
const attestation = await capsule_attest({
  action: "generate",
  data: "challenge-from-verifier"
});

// 发送给验证方
sendToVerifier(attestation);
```

---

## 架构对比

### 传统方式

```
用户代码 → OpenClaw → 无隔离执行
```

### Capsule 使能后

```
用户代码 → OpenClaw → Capsule → 硬件安全特性 → 安全执行
                              ↓
                        SGX/TrustZone
                        证明/密封
                        内存加密
```

---

## 关键差异

| 方面 | 传统 OpenClaw | Capsule 使能 |
|------|--------------|--------------|
| 硬件检测 | 无 | ✅ 检测 SGX/TrustZone |
| 安全执行 | 无隔离 | ✅ 硬件隔离 |
| 数据保护 | 明文 | ✅ 密封存储 |
| 环境证明 | 无 | ✅ 远程证明 |
| 内存保护 | 无 | ✅ 硬件加密 |

---

## 核心价值

**让 OpenClaw 用户能够：**

1. **知道** - 系统支持哪些硬件安全特性
2. **启用** - 按需启用这些特性
3. **使用** - 通过简单接口使用硬件安全功能
4. **验证** - 证明代码在安全环境中执行

---

*设计目标: 硬件安全特性使能*