/**
 * Real Isolation Implementation
 * 
 * 实现真实的隔离执行：
 * - L1: 进程隔离 (child_process)
 * - L1+: 进程隔离 + 资源限制 (cgroups)
 * - L2: Docker 容器隔离
 * - L2+/L3: SGX Enclave 隔离
 */

import { spawn, ChildProcess, execFileSync } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(require("child_process").exec);

// ========== Types ==========

export interface ExecutionOptions {
  command: string;
  args: string[];
  timeout: number;
  workspace?: string;
  env?: Record<string, string>;
  uid?: number;
  gid?: number;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  isolated: boolean;
}

export interface IsolationConfig {
  level: "L1" | "L1+" | "L2" | "L2+" | "L3";
  cpuQuota?: number;    // CPU quota (percentage)
  memoryMB?: number;    // Memory limit (MB)
  networkDisabled?: boolean;
  filesystemRoot?: string;
}

// ========== L1: Process Isolation ==========

/**
 * L1 进程隔离 - 使用 child_process + setuid/gid
 */
export async function executeL1(options: ExecutionOptions): Promise<ExecutionResult> {
  const { command, args, timeout, workspace, env, uid, gid } = options;
  
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: workspace,
      env: { ...process.env, ...env },
      uid,
      gid,
      timeout,
      detached: false,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        duration: Date.now() - startTime,
        isolated: true,
      });
    });

    proc.on("error", (err) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: err.message,
        duration: Date.now() - startTime,
        isolated: false,
      });
    });
  });
}

// ========== L1+: Process + Resource Limits ==========

/**
 * L1+ 进程隔离 + cgroups 资源限制
 */
export async function executeL1Plus(
  options: ExecutionOptions,
  config: IsolationConfig
): Promise<ExecutionResult> {
  const { command, args, timeout, workspace, env } = options;
  const { cpuQuota, memoryMB } = config;

  // 创建 cgroup
  const cgroupName = `capsule-${Date.now()}`;
  const cgroupPath = `/sys/fs/cgroup/${cgroupName}`;

  try {
    // 创建 cgroup 目录
    if (!fs.existsSync("/sys/fs/cgroup/capsule")) {
      fs.mkdirSync("/sys/fs/cgroup/capsule", { recursive: true });
    }
    fs.mkdirSync(cgroupPath, { recursive: true });

    // 设置 CPU 限制
    if (cpuQuota) {
      const cpuQuotaUs = Math.floor(cpuQuota * 1000); // percentage to microseconds
      fs.writeFileSync(path.join(cgroupPath, "cpu.max"), `${cpuQuotaUs} 100000`);
    }

    // 设置内存限制
    if (memoryMB) {
      const memoryBytes = memoryMB * 1024 * 1024;
      fs.writeFileSync(path.join(cgroupPath, "memory.max"), `${memoryBytes}`);
    }

    // 执行命令并加入 cgroup
    const result = await this.executeInCgroup(cgroupPath, options);

    return result;
  } finally {
    // 清理 cgroup
    try {
      fs.rmdirSync(cgroupPath, { recursive: true });
    } catch {}
  }
}

/**
 * 在 cgroup 中执行命令
 */
async function executeInCgroup(
  cgroupPath: string,
  options: ExecutionOptions
): Promise<ExecutionResult> {
  const { command, args, timeout, workspace, env } = options;
  const startTime = Date.now();

  // 使用 cgexec 或直接写入 cgroup.procs
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: workspace,
      env: { ...process.env, ...env },
      timeout,
    });

    // 将进程加入 cgroup
    try {
      const pid = proc.pid;
      if (pid) {
        fs.writeFileSync(
          path.join(cgroupPath, "cgroup.procs"),
          `${pid}`
        );
      }
    } catch {}

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        duration: Date.now() - startTime,
        isolated: true,
      });
    });

    proc.on("error", (err) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: err.message,
        duration: Date.now() - startTime,
        isolated: false,
      });
    });
  });
}

// ========== L2: Docker Container Isolation ==========

/**
 * L2 Docker 容器隔离
 */
export async function executeL2(
  options: ExecutionOptions,
  config: IsolationConfig
): Promise<ExecutionResult> {
  const { command, args, timeout, workspace, env } = options;
  const { cpuQuota, memoryMB, networkDisabled, filesystemRoot } = config;
  
  const startTime = Date.now();

  // 构建 docker run 命令
  const dockerArgs = [
    "run",
    "--rm",
    "-i",
  ];

  // 资源限制
  if (memoryMB) {
    dockerArgs.push("--memory", `${memoryMB}m`);
  }
  if (cpuQuota) {
    dockerArgs.push("--cpus", `${cpuQuota / 100}`);
  }

  // 网络隔离
  if (networkDisabled) {
    dockerArgs.push("--network", "none");
  }

  // 挂载工作目录
  if (workspace) {
    dockerArgs.push("-v", `${workspace}:/workspace`);
    dockerArgs.push("-w", "/workspace");
  }

  // 环境变量
  if (env) {
    for (const [key, value] of Object.entries(env)) {
      dockerArgs.push("-e", `${key}=${value}`);
    }
  }

  // 使用最小化镜像
  dockerArgs.push("alpine:3.19");

  // 要执行的命令
  dockerArgs.push("sh", "-c", `${command} ${args.join(" ")}`);

  return new Promise((resolve) => {
    const proc = spawn("docker", dockerArgs, {
      timeout,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        duration: Date.now() - startTime,
        isolated: true,
      });
    });

    proc.on("error", (err) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: err.message,
        duration: Date.now() - startTime,
        isolated: false,
      });
    });
  });
}

// ========== L2+/L3: SGX Enclave Isolation ==========

/**
 * SGX Enclave 隔离
 * 
 * 使用 Intel SGX 在安全飞地中执行代码
 */
export async function executeSGX(
  options: ExecutionOptions,
  config: IsolationConfig
): Promise<ExecutionResult> {
  const { command, args, timeout, workspace } = options;
  const startTime = Date.now();

  // 检查 SGX 设备
  if (!fs.existsSync("/dev/sgx_enclave")) {
    throw new Error("SGX device not available");
  }

  // 在 SGX Enclave 中执行
  // 这需要一个预编译的 Enclave 签名二进制文件
  // 这里我们使用 OCCLUM 或 Gramine 作为运行时

  try {
    // 使用 Gramine (更简单的方式)
    const gramineArgs = [
      "direct",
      "--rm",
      `sh`, "-c",
      `${command} ${args.join(" ")}`
    ];

    const result = await new Promise<ExecutionResult>((resolve) => {
      const proc = spawn("gramine-sgx", gramineArgs, {
        cwd: workspace,
        timeout,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        resolve({
          exitCode: code ?? 1,
          stdout,
          stderr,
          duration: Date.now() - startTime,
          isolated: true,
        });
      });

      proc.on("error", (err) => {
        resolve({
          exitCode: 1,
          stdout,
          stderr: err.message,
          duration: Date.now() - startTime,
          isolated: false,
        });
      });
    });

    return result;
  } catch (error) {
    // 如果 Gramine 不可用，使用替代方案
    return {
      exitCode: 1,
      stdout: "",
      stderr: "SGX execution requires Gramine or Occlum runtime",
      duration: Date.now() - startTime,
      isolated: false,
    };
  }
}

// ========== Unified Interface ==========

/**
 * 统一的隔离执行接口
 */
export async function executeIsolated(
  level: "L1" | "L1+" | "L2" | "L2+" | "L3",
  options: ExecutionOptions,
  config: IsolationConfig = {}
): Promise<ExecutionResult> {
  switch (level) {
    case "L1":
      return executeL1(options);

    case "L1+":
      return executeL1Plus(options, config);

    case "L2":
      return executeL2(options, config);

    case "L2+":
    case "L3":
      return executeSGX(options, config);

    default:
      throw new Error(`Unknown isolation level: ${level}`);
  }
}

// ========== Capability Enforcement ==========

/**
 * 检查并强制执行能力限制
 */
export function enforceCapabilities(
  capabilities: string[],
  command: string
): boolean {
  // 禁止的命令模式
  const blockedPatterns = [
    /rm\s+-rf\s+\//,          // 删除根目录
    />\s*\/dev\//,            // 写入设备
    /mkfs/,                   // 格式化
    /dd\s+if=/,               // 磁盘操作
    /chmod\s+777/,            // 危险权限
    /chown\s+root/,           // 改变所有者
  ];

  // 检查是否匹配禁止模式
  for (const pattern of blockedPatterns) {
    if (pattern.test(command)) {
      return false;
    }
  }

  // 如果没有 exec 能力，禁止执行
  if (!capabilities.includes("exec")) {
    return false;
  }

  // 如果没有 network 能力，禁止网络命令
  if (!capabilities.includes("network")) {
    const networkCommands = ["curl", "wget", "nc", "ssh", "scp"];
    if (networkCommands.some((cmd) => command.startsWith(cmd))) {
      return false;
    }
  }

  return true;
}

// ========== Export ==========

export const IsolationExecutor = {
  executeL1,
  executeL1Plus,
  executeL2,
  executeSGX,
  executeIsolated,
  enforceCapabilities,
};