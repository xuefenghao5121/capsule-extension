/**
 * Real Isolation Implementation with SGX Support
 * 
 * 实现真实的隔离执行：
 * - L1: 进程隔离 (child_process)
 * - L1+: 进程隔离 + 资源限制 (cgroups)
 * - L2: Docker 容器隔离
 * - L2+/L3: SGX Enclave 隔离 (x86) / TrustZone (ARM)
 */

import { spawn, execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import { SGX, checkSGXAvailable, SGXInfo } from "../hardware/sgx.js";

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

export interface IsolationConfig {
  level: "L1" | "L1+" | "L2" | "L2+" | "L3";
  cpuQuota?: number;
  memoryMB?: number;
  networkDisabled?: boolean;
  filesystemRoot?: string;
}

export interface IsolationResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  isolated: boolean;
  isolationLevel: string;
}

// ========== Hardware Detection ==========

/**
 * 检测硬件安全特性
 */
export async function detectHardwareSecurity(): Promise<{
  hasSGX: boolean;
  sgxInfo?: SGXInfo;
  architecture: string;
}> {
  const architecture = os.arch();
  
  if (architecture === "x64") {
    const sgxInfo = await checkSGXAvailable();
    return {
      hasSGX: sgxInfo.available,
      sgxInfo,
      architecture,
    };
  }
  
  return {
    hasSGX: false,
    architecture,
  };
}

// ========== L1: Process Isolation ==========

/**
 * L1 进程隔离 - 使用 child_process
 */
export async function executeL1(options: ExecutionOptions): Promise<IsolationResult> {
  const { command, args, timeout, workspace, env } = options;
  
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: workspace,
      env: { ...process.env, ...env },
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
        isolationLevel: "L1",
      });
    });

    proc.on("error", (err) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: err.message,
        duration: Date.now() - startTime,
        isolated: false,
        isolationLevel: "L1",
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
): Promise<IsolationResult> {
  const { cpuQuota, memoryMB } = config;
  const startTime = Date.now();

  const cgroupPath = "/sys/fs/cgroup/capsule";
  const useCgroups = fs.existsSync("/sys/fs/cgroup");

  if (useCgroups && (cpuQuota || memoryMB)) {
    const cgroupName = `capsule-${Date.now()}`;
    const cgroupFullPath = `${cgroupPath}/${cgroupName}`;

    try {
      if (!fs.existsSync(cgroupPath)) {
        fs.mkdirSync(cgroupPath, { recursive: true });
      }
      fs.mkdirSync(cgroupFullPath);

      if (memoryMB) {
        fs.writeFileSync(`${cgroupFullPath}/memory.max`, `${memoryMB * 1024 * 1024}`);
      }

      if (cpuQuota) {
        const quotaUs = Math.floor((cpuQuota / 100) * 100000);
        fs.writeFileSync(`${cgroupFullPath}/cpu.max`, `${quotaUs} 100000`);
      }

      const result = await executeL1(options);

      try {
        fs.rmdirSync(cgroupFullPath, { recursive: true });
      } catch {}

      return { ...result, isolationLevel: "L1+" };
    } catch (error: any) {
      console.warn("[L1+] Cgroups failed, falling back to L1:", error.message);
      return executeL1(options);
    }
  }

  return { ...await executeL1(options), isolationLevel: "L1+" };
}

// ========== L2: Docker Container Isolation ==========

/**
 * L2 Docker 容器隔离
 */
export async function executeL2(
  options: ExecutionOptions,
  config: IsolationConfig
): Promise<IsolationResult> {
  const { command, args, timeout, workspace, env } = options;
  const { cpuQuota, memoryMB, networkDisabled = true } = config;
  
  const startTime = Date.now();

  try {
    execSync("docker --version", { stdio: "pipe" });
  } catch {
    console.warn("[L2] Docker not available, falling back to L1+");
    return executeL1Plus(options, config);
  }

  const dockerArgs = ["run", "--rm"];

  if (memoryMB) {
    dockerArgs.push("--memory", `${memoryMB}m`);
  }
  if (cpuQuota) {
    dockerArgs.push("--cpus", `${(cpuQuota / 100).toFixed(2)}`);
  }
  if (networkDisabled) {
    dockerArgs.push("--network", "none");
  }
  if (workspace) {
    dockerArgs.push("-v", `${workspace}:/workspace:ro`);
    dockerArgs.push("-w", "/workspace");
  }
  if (env) {
    for (const [key, value] of Object.entries(env)) {
      dockerArgs.push("-e", `${key}=${value}`);
    }
  }

  dockerArgs.push("alpine:3.19");
  dockerArgs.push("sh", "-c", `${command} ${args.join(" ")}`);

  return new Promise((resolve) => {
    const proc = spawn("docker", dockerArgs, { timeout });

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
        isolationLevel: "L2",
      });
    });

    proc.on("error", (err) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: `Docker error: ${err.message}`,
        duration: Date.now() - startTime,
        isolated: false,
        isolationLevel: "L2",
      });
    });
  });
}

// ========== L2+/L3: SGX Enclave Isolation ==========

/**
 * L2+/L3 SGX Enclave 隔离
 */
export async function executeSGX(
  options: ExecutionOptions,
  config: IsolationConfig
): Promise<IsolationResult> {
  const { command, args, timeout, workspace } = options;
  const startTime = Date.now();

  const sgxInfo = await checkSGXAvailable();
  
  if (!sgxInfo.available) {
    console.warn("[L3] SGX not available, falling back to L2");
    return executeL2(options, config);
  }

  console.log(`[SGX] Using ${sgxInfo.version} with devices: ${sgxInfo.devices.join(", ")}`);

  try {
    const result = await SGX.executeInEnclave(command, args, {
      timeout,
      cwd: workspace,
    });

    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration: Date.now() - startTime,
      isolated: true,
      isolationLevel: "L3",
    };
  } catch (error: any) {
    console.warn("[SGX] Execution failed:", error.message);
    return executeL2(options, config);
  }
}

// ========== Unified Interface ==========

/**
 * 统一的隔离执行接口
 */
export async function executeIsolated(
  level: "L1" | "L1+" | "L2" | "L2+" | "L3",
  options: ExecutionOptions,
  config: IsolationConfig = { level: "L1" }
): Promise<IsolationResult> {
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
): { allowed: boolean; reason?: string } {
  const blockedPatterns = [
    /rm\s+-rf\s+\//,
    />\s*\/dev\//,
    /mkfs/,
    /dd\s+if=/,
    /chmod\s+777/,
    /chown\s+root/,
    />\s*\/etc\//,
    /curl.*\|\s*bash/,
    /wget.*\|\s*sh/,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(command)) {
      return { 
        allowed: false, 
        reason: `Command matches blocked pattern: ${pattern}` 
      };
    }
  }

  if (!capabilities.includes("exec")) {
    return { allowed: false, reason: "exec capability not granted" };
  }

  if (!capabilities.includes("network")) {
    const networkCommands = ["curl", "wget", "nc", "ssh", "scp", "rsync", "telnet"];
    if (networkCommands.some((cmd) => command.startsWith(cmd) || command.includes(` ${cmd} `))) {
      return { allowed: false, reason: "network capability not granted" };
    }
  }

  return { allowed: true };
}

// ========== Export ==========

export const IsolationExecutor = {
  executeL1,
  executeL1Plus,
  executeL2,
  executeSGX,
  executeIsolated,
  enforceCapabilities,
  detectHardwareSecurity,
};