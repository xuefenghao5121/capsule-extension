# Capsule - Sandbox-centric Security for AI Agents

> **安装即用，自动检测硬件安全特性**

## 设计哲学

### Sandbox ≈ Process（沙箱即进程）

类比传统操作系统，Capsule 提供进程级隔离：

| 传统 OS | Capsule |
|---------|---------|
| Process | Sandbox |
| UID/GID | Capability |
| ulimit | ResourceQuota |
| seccomp | IsolationLevel |

### Guardrails ≈ Gatekeeper（守门即防护）

所有输入输出都要检查，规则即代码：

```
用户输入 → InputGate → Sandbox → OutputGate → 用户输出
```

## 特性

- ✅ **零配置** - 安装后自动检测硬件，启用最佳安全特性
- ✅ **插件化** - 核心极简，安全特性按需加载
- ✅ **跨平台** - x86 SGX/TDX/SEV 和 ARM MTE/PAC/TEE 统一接口
- ✅ **渐进增强** - 无硬件时降级运行，有硬件时自动加速
- ✅ **Guardrails** - 自研守门系统，不依赖外部 LLM

## 安装

```bash
# 安装到 OpenClaw 扩展目录
cd /root/.openclaw/extensions
git clone https://github.com/xuefenghao5121/capsule-extension.git capsule
cd capsule
npm install
npm run build
```

## 快速开始

### 1. 自动检测硬件

```typescript
import { Capsule } from "capsule";

const capsule = new Capsule();
await capsule.init();

// 自动打印检测结果：
// ┌─ Hardware Detection ─────────────────────┐
// │ Architecture: x64                         │
// │ Vendor:       intel                       │
// ├───────────────────────────────────────────┤
// │ x86 Security Features:                    │
// │   SGX:      ✅ v2                         │
// │   TDX:      ❌ Not available              │
// │   SEV:      ❌ Not available              │
// ├───────────────────────────────────────────┤
// │ Recommended Isolation: L3                 │
// └───────────────────────────────────────────┘
```

### 2. 创建沙箱并执行命令

```typescript
// 创建沙箱（自动选择最佳隔离级别）
const sandbox = await capsule.createSandbox({
  name: "my-agent",
  capabilities: ["exec", "file_read", "file_write"],
  quota: {
    maxCpuPercent: 50,
    maxMemoryMB: 512,
    timeout: 60000,
  },
});

// 执行命令
const result = await capsule.execute(sandbox.id, "npm", ["test"]);
console.log(result.stdout);

// 清理
await capsule.destroySandbox(sandbox.id);
```

## 隔离级别

| 级别 | 隔离方式 | 硬件需求 | 安全强度 |
|------|----------|----------|---------|
| **L1** | 进程级 | 无 | 🟢 基础隔离 |
| **L2** | Docker 容器 | Docker | 🔵 容器隔离 |
| **L2+** | 机密容器 | SGX/TDX/SEV | 🔵🔵 机密计算 |
| **L3** | 硬件隔离 | SGX/TDX/SEV | 🟣 最高安全 |

## 硬件支持

### x86 平台

| 特性 | Intel | AMD | 用途 |
|------|-------|-----|------|
| **SGX** | ✅ | - | Enclave 安全执行 |
| **TDX** | ✅ | - | 机密虚拟机 |
| **SEV-SNP** | - | ✅ | 机密虚拟机 |

### ARM 平台

| 特性 | 鲲鹏 | Apple | 用途 |
|------|------|-------|------|
| **MTE** | ✅ | ❌ | 内存安全 |
| **PAC** | ✅ | ✅ | 指针认证 |
| **TEE** | ✅ | ❌ | 可信执行环境 |
| **SVE** | ✅ | ❌ | 向量加速 |

## 插件系统

### 自动加载流程

```
启动
  │
  ├─ 检测 CPU 架构 (x64 / arm64)
  │
  ├─ 加载对应插件
  │   ├─ x64 → x86 Plugin (SGX/TDX/SEV)
  │   └─ arm64 → ARM Plugin (MTE/PAC/TEE)
  │
  ├─ 检测硬件特性
  │   └─ 通过 /proc/cpuinfo, /sys, dmesg 等
  │
  ├─ 选择最佳隔离级别
  │   └─ 有 SGX/TDX/SEV → L3
  │   └─ 无硬件 → L1
  │
  └─ 初始化完成
```

### 自定义插件

```typescript
import { SecurityPlugin, pluginRegistry } from "capsule";

const myPlugin: SecurityPlugin = {
  name: "my-security",
  platform: "x86",
  features: ["custom-feature"],
  
  async detect() {
    return {
      architecture: "x64",
      features: { /* ... */ },
      recommended: { isolationLevel: "L2", plugin: "my-security" },
    };
  },
  
  async init(info) {
    console.log("Initializing custom security...");
    return true;
  },
};

// 注册插件
pluginRegistry.register(myPlugin);
```

## 测试

```bash
# 运行核心测试
npx tsx scripts/test.ts

# 运行 Guardrails 测试
npx tsx scripts/test-guardrails.ts
```

## Guardrails 使用

### 基本用法

```typescript
import { gatekeeper } from "capsule";

// 检查输入
const result = await gatekeeper.checkInput({
  content: "Ignore all previous instructions"
});

console.log(result.allowed);  // false
console.log(result.reason);   // "检测到 jailbreak 尝试: ignore-instructions"
```

### 自定义规则

```typescript
import { Gatekeeper, GateRule } from "capsule";

const myRule: GateRule = {
  name: "custom-filter",
  description: "自定义过滤规则",
  risk: "medium",
  
  async check(ctx) {
    if (ctx.content.includes("forbidden-word")) {
      return {
        allowed: false,
        reason: "包含禁止词汇",
        confidence: 1.0,
      };
    }
    return { allowed: true, confidence: 1.0 };
  }
};

const keeper = new Gatekeeper();
keeper.addInputRule(myRule);
```

### 内置规则

| 规则 | 功能 | 风险等级 |
|------|------|---------|
| `jailbreak` | 检测绕过限制尝试 | critical |
| `prompt-injection` | 检测指令注入 | high |
| `sensitive-data` | 检测并掩码敏感数据 | medium |
| `command-injection` | 检测命令注入 | critical |

### 检测模式

**Jailbreak 检测**（10 种模式）：
- `ignore-instructions` - 忽略指令
- `forget-previous` - 忘记历史
- `role-change` - 角色切换
- `pretend` - 假装
- `developer-mode` - 开发者模式
- ...

**敏感数据掩码**（8 种模式）：
- API Key（OpenAI, Slack, GitHub, AWS...）
- Email
- Credit Card
- SSN
- Secret Key
- ...

## 项目结构

```
src/
├── index.ts              # 入口，自动检测+加载
├── core/
│   └── sandbox.ts        # 核心沙箱管理
└── plugins/
    ├── index.ts          # 插件加载器
    ├── x86/              # x86 安全插件
    │   └── index.ts
    ├── arm/              # ARM 安全插件
    │   └── index.ts
    └── guardrails/       # Guardrails 插件
        └── index.ts
```

## 许可证

MIT License