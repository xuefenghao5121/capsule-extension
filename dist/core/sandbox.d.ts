/**
 * Capsule Core Sandbox Manager
 *
 * 极简核心，无硬件依赖，进程级隔离
 */
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
    maxCpuPercent: number;
    maxMemoryMB: number;
    timeout: number;
    maxProcesses: number;
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
export declare class SandboxManager {
    private sandboxes;
    private processes;
    private workspaceRoot;
    constructor(workspaceRoot?: string);
    /**
     * 创建沙箱
     */
    create(config: SandboxConfig): Promise<Sandbox>;
    /**
     * 执行命令
     */
    execute(sandboxId: SandboxId, command: string, args?: string[], options?: {
        env?: Record<string, string>;
    }): Promise<ExecutionResult>;
    /**
     * 销毁沙箱
     */
    destroy(sandboxId: SandboxId): Promise<void>;
    /**
     * 获取沙箱
     */
    get(sandboxId: SandboxId): Sandbox | undefined;
    /**
     * 列出所有沙箱
     */
    list(): Sandbox[];
    /**
     * 获取统计信息
     */
    stats(): {
        total: number;
        running: number;
        byLevel: Record<IsolationLevel, number>;
    };
    private generateId;
    private executeProcess;
}
//# sourceMappingURL=sandbox.d.ts.map