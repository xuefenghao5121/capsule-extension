# Capsule - Sandbox + Hardware Security

> **OpenClaw 沙箱 + 硬件安全特性**

## 设计

```
┌─────────────────────────────────────────────────────────────┐
│                      Capsule                                │
│                                                             │
│   ┌─────────────┐          ┌─────────────┐                 │
│   │   Sandbox   │    +     │  Hardware   │                 │
│   │   Manager   │          │  Security   │                 │
│   │             │          │             │                 │
│   │  - L1 进程  │          │  x86:       │                 │
│   │  - L2 容器  │          │   - SGX     │                 │
│   │  - L3 TEE   │          │   - TDX     │                 │
│   │             │          │   - SEV     │                 │
│   │             │          │  ARM:       │                 │
│   │             │          │   - MTE     │                 │
│   │             │          │   - PAC     │                 │
│   │             │          │   - TEE     │                 │
│   └─────────────┘          └─────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 隔离级别

| 级别 | 方式 | 硬件需求 | 安全保证 |
|------|------|---------|---------|
| **L1** | 进程隔离 | 无 | 内存隔离 |
| **L2** | Docker | Docker | namespace + cgroups |
| **L3** | TEE | SGX/TDX/SEV/MTE | 硬件强制隔离 |

## 安装

```bash
git clone https://github.com/xuefenghao5121/capsule-extension.git
cd capsule-extension
npm install && npm run build
```

## 使用

```typescript
import { Capsule } from "capsule";

const capsule = new Capsule();
await capsule.init();

// 自动检测硬件安全特性
// x86: SGX v2, TDX, SEV
// ARM: MTE, PAC, TEE

// 创建沙箱
const sandbox = await capsule.createSandbox({
  name: "my-sandbox",
  capabilities: ["exec", "file_read"],
});

// 执行命令
const result = await capsule.execute(sandbox.id, "echo", ["hello"]);
console.log(result.stdout);

// 销毁沙箱
await capsule.destroySandbox(sandbox.id);
```

## 硬件支持

### x86

| 特性 | Intel | AMD | 说明 |
|------|-------|-----|------|
| **SGX** | ✅ | - | Enclave 隔离 |
| **TDX** | ✅ | - | 机密虚拟机 |
| **SEV-SNP** | - | ✅ | 机密虚拟机 |

### ARM

| 特性 | 鲲鹏 | 说明 |
|------|------|------|
| **MTE** | ✅ | 内存标记 |
| **PAC** | ✅ | 指针认证 |
| **TEE** | ✅ | 可信执行环境 |

## 测试

```bash
npx tsx scripts/test.ts
```

## 项目结构

```
src/
├── index.ts          # 入口
├── core/
│   └── sandbox.ts    # 沙箱管理
└── plugins/
    ├── index.ts      # 插件加载器
    ├── x86/          # x86 硬件检测
    └── arm/          # ARM 硬件检测
```

## 许可证

MIT