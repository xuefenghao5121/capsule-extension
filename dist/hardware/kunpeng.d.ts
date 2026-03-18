/**
 * Kunpeng Hardware Security Interface
 */
import { SandboxId, SecurityFeature } from "../types.js";
export interface SecurityStatus {
    feature: SecurityFeature;
    available: boolean;
    enabled: boolean;
    version?: string;
}
export declare class KunpengSecurity {
    private availableFeatures;
    private enabledFeatures;
    constructor();
    /**
     * Detect available hardware security features
     */
    private detectFeatures;
    /**
     * Check if a security feature is available
     */
    isAvailable(feature: SecurityFeature): Promise<boolean>;
    /**
     * Get status of all security features
     */
    getStatus(): Map<SecurityFeature, SecurityStatus>;
    /**
     * Enable a security feature for a sandbox
     */
    enable(feature: SecurityFeature, sandboxId: SandboxId): Promise<void>;
    /**
     * Disable a security feature for a sandbox
     */
    disable(feature: SecurityFeature, sandboxId: SandboxId): Promise<void>;
    /**
     * Enable MTE with specific mode
     */
    enableMTE(mode: "sync" | "async" | "asymm"): Promise<void>;
    /**
     * Generate attestation report
     */
    generateAttestation(sandboxId: SandboxId): Promise<{
        tpm?: {
            quote: string;
            pcrs: Record<number, string>;
        };
        tee?: {
            quote: string;
            taVersion: string;
        };
    }>;
    private checkMTE;
    private checkPAC;
    private checkTEE;
    private checkTrustZone;
}
//# sourceMappingURL=kunpeng.d.ts.map