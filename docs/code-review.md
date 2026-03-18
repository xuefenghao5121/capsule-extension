# Capsule Extension 代码审查报告

> 审查日期: 2026-03-19
> 审查目标: 重新审视实现，识别问题，提出改进方案

---

## 一、架构概览

```
src/
├── index.ts           # 入口点，创建扩展
├── types.ts           # 类型定义
├── sandbox.ts         # 沙箱管理器
├── hardware/
│   └── kunpeng.ts     # 硬件安全接口
├── security/          # (空目录)
└── tools/
    ├── exec_sandbox.ts    # 安全执行工具
    ├── sandbox.ts         # 沙箱管理工具
    ├── capability.ts      # 能力管理工具
    ├── quota.ts           # 配额管理工具
    └── attestation.ts     # 远程证明工具
```

---

## 二、核心模块审查

### 2.1 SandboxManager (sandbox.ts)

**功能**: 沙箱生命周期管理

**优点**:
- ✅ 清晰的沙箱状态管理
- ✅ 能力检查机制完整
- ✅ 资源配额支持

**问题**:
| 问题 | 严重程度 | 说明 |
|------|----------|------|
| ❌ 无真实隔离 | 高 | 所有隔离级别都是模拟输出 |
| ❌ 无资源限制 | 高 | 配额检查只是返回值，不实际限制 |
| ⚠️ 内存泄漏风险 | 中 | 沙箱可能未正确清理 |

**代码示例**:
```typescript
// 当前实现: 只是打印日志
private async initMTE(sandbox: Sandbox, mode: string): Promise<void> {
  console.log(`[Capsule] Initializing MTE for ${sandbox.id} (mode: ${mode})`);
  // 没有真实的 MTE 初始化
}
```

### 2.2 KunpengSecurity (hardware/kunpeng.ts)

**功能**: 硬件安全特性检测和管理

**优点**:
- ✅ 安全特性检测接口清晰
- ✅ 支持多种硬件特性

**问题**:
| 问题 | 严重程度 | 说明 |
|------|----------|------|
| ❌ 检测逻辑错误 | 高 | `process.arch === "arm64"` 在 x86 上总是返回 false |
| ❌ 无真实启用逻辑 | 高 | enable/disable 只是设置标志位 |
| ⚠️ 证明是假的 | 高 | 返回硬编码的假数据 |

**代码示例**:
```typescript
// 当前实现: 错误的检测逻辑
private async checkMTE(): Promise<boolean> {
  const isArm = process.arch === "arm64";  // 在 x86 上总是 false
  return isArm;
}
```

### 2.3 exec_sandbox Tool (tools/exec_sandbox.ts)

**功能**: 在沙箱中安全执行命令

**优点**:
- ✅ 工具接口设计良好
- ✅ 输入验证完整
- ✅ 错误处理规范

**问题**:
| 问题 | 严重程度 | 说明 |
|------|----------|------|
| ❌ 无真实执行 | 严重 | 所有执行函数都返回假数据 |
| ❌ 无进程隔离 | 严重 | L1 应该使用 child_process + seccomp |
| ❌ 无容器隔离 | 严重 | L2 应该调用 Docker API |
| ⚠️ 无资源限制 | 高 | 超时检查无效 |

**代码示例**:
```typescript
// 当前实现: 只是打印日志
async function executeDirect(...): Promise<RawResult> {
  console.log(`[L0] Executing: ${command} ${args.join(" ")}`);
  return {
    exitCode: 0,  // 总是返回 0
    stdout: `Executed: ${command}`,  // 假数据
    stderr: "",
  };
}
```

### 2.4 类型定义 (types.ts)

**优点**:
- ✅ 类型定义清晰
- ✅ 错误类设计合理

**问题**:
| 问题 | 严重程度 | 说明 |
|------|----------|------|
| ⚠️ SecurityConfig 不完整 | 低 | L3 配置缺少 trustzone 字段 |

---

## 三、测试审查

### 3.1 测试通过情况

| 测试类别 | 通过 | 失败 | 问题 |
|----------|------|------|------|
| 扩展测试 | 11/11 | 0 | ✅ 接口正确 |
| 风险验证 | 32/32 | 0 | ⚠️ 假设 TEE 工作正常 |
| 安全测试 | 10/19 | 9 | ❌ 输出断言失败 |

### 3.2 失败原因

所有失败都是因为:
1. **模拟输出与预期不匹配** - 测试期望真实输出，代码返回假数据
2. **证明验证失败** - 假证明无法通过真实验证

---

## 四、核心问题汇总

### 4.1 无真实隔离 (严重)

**问题描述**:
- L0-L3 所有隔离级别都只打印日志，无实际隔离

**影响**:
- 安全性声明不真实
- 测试结果是假设性的

**改进方案**:

```typescript
// L1: 使用 child_process + seccomp
import { spawn } from "child_process";

async function executeProcess(command: string, args: string[], options): Promise<RawResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.workspace,
      env: options.env,
      timeout: options.timeout,
    });
    
    // 设置 seccomp 限制 (Linux)
    // 实际需要使用 node-seccomp 或原生模块
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => { stdout += data; });
    proc.stderr.on("data", (data) => { stderr += data; });
    
    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
    
    proc.on("error", reject);
  });
}
```

### 4.2 无资源限制 (严重)

**问题描述**:
- 配额检查只是返回 true/false
- 无实际限制资源使用

**改进方案**:

```typescript
// 使用 cgroups 限制资源 (Linux)
import { writeFileSync } from "fs";

function applyResourceLimits(sandboxId: string, quota: ResourceQuota): void {
  const cgroupPath = `/sys/fs/cgroup/capsule/${sandboxId}`;
  
  // 创建 cgroup
  writeFileSync(`${cgroupPath}/cpu.max`, `${quota.maxCpuPercent * 1000} 100000`);
  writeFileSync(`${cgroupPath}/memory.max`, `${quota.maxMemoryMB * 1024 * 1024}`);
}
```

### 4.3 假硬件检测 (高)

**问题描述**:
- 检测逻辑只检查 arch，不检查真实硬件支持

**改进方案**:

```typescript
private async checkMTE(): Promise<boolean> {
  try {
    // 检查内核配置
    const cpuinfo = await fs.promises.readFile("/proc/cpuinfo", "utf-8");
    return cpuinfo.includes("mte");
  } catch {
    return false;
  }
}

private async checkTEE(): Promise<boolean> {
  // 检查 TEE 设备
  return fs.existsSync("/dev/tee0") || fs.existsSync("/dev/teepriv0");
}
```

### 4.4 假证明 (高)

**问题描述**:
- 证明报告是硬编码的假数据

**改进方案**:

```typescript
async generateAttestation(sandboxId: SandboxId): Promise<AttestationReport> {
  // 使用真实 TEE API
  if (await this.isAvailable("tee")) {
    // 调用 tee-supplicant
    const result = await execAsync("tee-attest --generate");
    return JSON.parse(result.stdout);
  }
  
  // 使用 TPM
  if (fs.existsSync("/dev/tpm0")) {
    const result = await execAsync("tpm2_quote");
    return this.parseTPMQuote(result.stdout);
  }
  
  throw new Error("No attestation capability available");
}
```

---

## 五、改进优先级

| 优先级 | 问题 | 工作量 | 影响 |
|--------|------|--------|------|
| **P0** | 实现真实进程隔离 (L1) | 中 | 核心功能 |
| **P0** | 实现真实命令执行 | 中 | 核心功能 |
| **P1** | 实现资源限制 | 中 | 安全保证 |
| **P1** | 修复硬件检测 | 低 | 正确性 |
| **P2** | 实现容器隔离 (L2) | 高 | 增强 |
| **P2** | 实现真实证明 | 高 | 安全验证 |
| **P3** | 支持 TEE (L2+/L3) | 高 | 可选增强 |

---

## 六、建议行动计划

### Phase 1: 核心功能修复 (1-2 天)

1. **实现真实命令执行**
   - 使用 child_process 执行命令
   - 捕获真实输出和退出码
   - 处理超时和错误

2. **修复硬件检测**
   - 检查 /proc/cpuinfo
   - 检查 /dev 设备
   - 正确报告可用特性

### Phase 2: 安全增强 (1-2 天)

1. **实现进程隔离 (L1)**
   - 使用 seccomp 限制系统调用
   - 使用 namespace 隔离资源

2. **实现资源限制**
   - 使用 cgroups 限制 CPU/内存
   - 强制执行配额

### Phase 3: 高级特性 (可选)

1. **容器隔离 (L2)** - 调用 Docker API
2. **TEE 集成 (L2+/L3)** - 对接真实 TEE

---

## 七、结论

### 当前状态

| 方面 | 评价 |
|------|------|
| **接口设计** | ✅ 良好 |
| **类型系统** | ✅ 完整 |
| **错误处理** | ✅ 规范 |
| **真实隔离** | ❌ 缺失 |
| **资源限制** | ❌ 缺失 |
| **硬件检测** | ❌ 错误 |

### 建议

1. **先实现核心功能** - 真实的命令执行和进程隔离
2. **再考虑高级特性** - TEE 集成需要真实硬件
3. **保持接口稳定** - 当前接口设计良好，只需替换实现

---

*审查完成: 2026-03-19*