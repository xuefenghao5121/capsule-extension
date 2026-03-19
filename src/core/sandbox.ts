/**
 * Capsule Core Sandbox Manager
 * 
 * 极简核心，无硬件依赖，进程级隔离
 */

import { spawn, ChildProcess } from "child_process";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync, rmSync } from "fs";
import * as path from "path";

// ========== Types ==========

export type SandboxId = string;
export type IsolationLevel = "L1" | "L2" | "L2+" | "L3";
export type SandboxStatus = "creating" | "ready" | "running" | "stopped" | "error";

export interface SandboxConfig {
  name: string;
  isolationLevel?: IsolationLevel;
  capabilities?: string[];
  quota?: Partial<ResourceQuota>;
  workspace?: string;
}

export interface ResourceQuota {
  maxCpuPercent: number;      // CPU 限制百分比
  maxMemoryMB: number;        // 内存限制 MB
  timeout: number;            // 执行超时 ms
  maxProcesses: number;       // 最大进程数
}

export interface Sandbox {
  id: SandboxId;
  name: string;
  status: SandboxStatus;
  isolationLevel: IsolationLevel;
  capabilities: Set<string>;
  quota: ResourceQuota;
  workspace: string;
  createdAt: Date;
  pid?: number;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  timedOut: boolean;
}

// ========== Defaults ==========

const DEFAULT_QUOTA: ResourceQuota = {
  maxCpuPercent: 50,
  maxMemoryMB: 512,
  timeout: 60000,
  maxProcesses: 10,
};

const DEFAULT_CAPABILITIES = [
  "exec",
  "file_read",
  "file_write",
];

// ========== Sandbox Manager ==========

export class SandboxManager {
  private sandboxes: Map<SandboxId, Sandbox> = new Map();
  private processes: Map<SandboxId, ChildProcess> = new Map();
  private workspaceRoot: string;

  constructor(workspaceRoot: string = "/tmp/capsule-sandboxes") {
    this.workspaceRoot = workspaceRoot;
    if (!existsSync(workspaceRoot)) {
      mkdirSync(workspaceRoot, { recursive: true });
    }
  }

  /**
   * 创建沙箱
   */
  async create(config: SandboxConfig): Promise<Sandbox> {
    const id = this.generateId();
    const workspace = config.workspace || path.join(this.workspaceRoot, id);
    
    // 创建工作目录
    if (!existsSync(workspace)) {
      mkdirSync(workspace, { recursive: true });
    }
    
    const sandbox: Sandbox = {
      id,
      name: config.name,
      status: "creating",
      isolationLevel: config.isolationLevel || "L1",
      capabilities: new Set(config.capabilities || DEFAULT_CAPABILITIES),
      quota: { ...DEFAULT_QUOTA, ...config.quota },
      workspace,
      createdAt: new Date(),
    };
    
    this.sandboxes.set(id, sandbox);
    sandbox.status = "ready";
    
    console.log(`[Capsule] Sandbox created: ${id} (${sandbox.isolationLevel})`);
    return sandbox;
  }

  /**
   * 执行命令
   */
  async execute(
    sandboxId: SandboxId, 
    command: string, 
    args: string[] = [],
    options: { env?: Record<string, string> } = {}
  ): Promise<ExecutionResult> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }
    
    // 检查能力
    if (!sandbox.capabilities.has("exec")) {
      throw new Error(`Sandbox ${sandboxId} does not have 'exec' capability`);
    }
    
    sandbox.status = "running";
    const start = Date.now();
    
    try {
      const result = await this.executeProcess(
        sandbox,
        command,
        args,
        options.env || {}
      );
      
      sandbox.status = "ready";
      return result;
    } catch (err) {
      sandbox.status = "error";
      throw err;
    }
  }

  /**
   * 销毁沙箱
   */
  async destroy(sandboxId: SandboxId): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return;
    
    // 终止运行的进程
    const proc = this.processes.get(sandboxId);
    if (proc) {
      proc.kill();
      this.processes.delete(sandboxId);
    }
    
    // 清理工作目录
    try {
      if (sandbox.workspace.startsWith(this.workspaceRoot)) {
        rmSync(sandbox.workspace, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
    
    this.sandboxes.delete(sandboxId);
    console.log(`[Capsule] Sandbox destroyed: ${sandboxId}`);
  }

  /**
   * 获取沙箱
   */
  get(sandboxId: SandboxId): Sandbox | undefined {
    return this.sandboxes.get(sandboxId);
  }

  /**
   * 列出所有沙箱
   */
  list(): Sandbox[] {
    return Array.from(this.sandboxes.values());
  }

  /**
   * 获取统计信息
   */
  stats(): { total: number; running: number; byLevel: Record<IsolationLevel, number> } {
    let running = 0;
    const byLevel: Record<IsolationLevel, number> = { L1: 0, L2: 0, "L2+": 0, L3: 0 };
    
    for (const sandbox of this.sandboxes.values()) {
      if (sandbox.status === "running") running++;
      byLevel[sandbox.isolationLevel]++;
    }
    
    return { total: this.sandboxes.size, running, byLevel };
  }

  // ========== Private ==========

  private generateId(): SandboxId {
    return `sbx-${randomUUID().slice(0, 8)}`;
  }

  private executeProcess(
    sandbox: Sandbox,
    command: string,
    args: string[],
    env: Record<string, string>
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const start = Date.now();
      let timedOut = false;
      
      const proc = spawn(command, args, {
        cwd: sandbox.workspace,
        env: { ...process.env, ...env },
        timeout: sandbox.quota.timeout,
      });
      
      this.processes.set(sandbox.id, proc);
      sandbox.pid = proc.pid;
      
      let stdout = "";
      let stderr = "";
      
      proc.stdout?.on("data", (data) => { stdout += data; });
      proc.stderr?.on("data", (data) => { stderr += data; });
      
      proc.on("close", (code) => {
        this.processes.delete(sandbox.id);
        sandbox.pid = undefined;
        
        resolve({
          exitCode: code ?? 1,
          stdout,
          stderr,
          duration: Date.now() - start,
          timedOut,
        });
      });
      
      proc.on("error", (err) => {
        this.processes.delete(sandbox.id);
        sandbox.pid = undefined;
        
        resolve({
          exitCode: 1,
          stdout,
          stderr: err.message,
          duration: Date.now() - start,
          timedOut,
        });
      });
    });
  }
}