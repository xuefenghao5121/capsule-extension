/**
 * Capsule Types - Core type definitions
 */
// ========== Errors ==========
export class SandboxError extends Error {
    code;
    sandboxId;
    constructor(message, code, sandboxId) {
        super(message);
        this.code = code;
        this.sandboxId = sandboxId;
        this.name = "SandboxError";
    }
}
export class QuotaExceededError extends SandboxError {
    constructor(sandboxId, resource) {
        super(`Quota exceeded: ${resource}`, "QUOTA_EXCEEDED", sandboxId);
        this.name = "QuotaExceededError";
    }
}
export class CapabilityDeniedError extends SandboxError {
    constructor(sandboxId, capability) {
        super(`Capability denied: ${capability}`, "CAPABILITY_DENIED", sandboxId);
        this.name = "CapabilityDeniedError";
    }
}
export class IsolationError extends SandboxError {
    constructor(message, sandboxId) {
        super(message, "ISOLATION_ERROR", sandboxId);
        this.name = "IsolationError";
    }
}
//# sourceMappingURL=types.js.map