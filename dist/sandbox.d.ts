/**
 * Sandbox Manager - Core sandbox lifecycle management
 */
import { SandboxId, Sandbox, SandboxConfig, SandboxStatus, IsolationLevel, Capability } from "./types.js";
export declare class SandboxManager {
    private sandboxes;
    private workspaceRoot;
    private maxSandboxes;
    private securityEnabled;
    constructor(config: {
        workspaceRoot: string;
        maxSandboxes?: number;
        securityEnabled?: boolean;
    });
    /**
     * Create a new sandbox
     */
    create(config: SandboxConfig): Promise<Sandbox>;
    /**
     * Get sandbox by ID
     */
    get(sandboxId: SandboxId): Sandbox | undefined;
    /**
     * List all sandboxes
     */
    list(): Sandbox[];
    /**
     * Destroy a sandbox
     */
    destroy(sandboxId: SandboxId): Promise<void>;
    /**
     * Update sandbox status
     */
    setStatus(sandboxId: SandboxId, status: SandboxStatus): void;
    /**
     * Grant capability to sandbox
     */
    grantCapability(sandboxId: SandboxId, capability: Capability): void;
    /**
     * Revoke capability from sandbox
     */
    revokeCapability(sandboxId: SandboxId, capability: Capability): void;
    /**
     * Check if sandbox has capability
     */
    hasCapability(sandboxId: SandboxId, capability: Capability): boolean;
    /**
     * Get statistics
     */
    getStats(): {
        total: number;
        byStatus: Record<SandboxStatus, number>;
        byIsolation: Record<IsolationLevel, number>;
    };
    private generateId;
    private initializeIsolation;
    private cleanupIsolation;
    private initMTE;
    private initPAC;
    private initTEE;
}
//# sourceMappingURL=sandbox.d.ts.map