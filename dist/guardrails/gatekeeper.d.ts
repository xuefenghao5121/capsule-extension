/**
 * Capsule Guardrails - Gatekeeper Pattern
 *
 * 设计哲学：
 * - Guardrails ≈ Gatekeeper（守门即防护）
 * - 规则即代码（可插拔的函数）
 * - 与隔离联动（验证后才进入沙箱）
 * - 最小依赖（优先规则匹配，不依赖 LLM）
 */
export interface GateResult {
    /** 是否放行 */
    allowed: boolean;
    /** 原因（拒绝时） */
    reason?: string;
    /** 置信度 0-1 */
    confidence: number;
    /** 转换后的内容（如掩码后） */
    transformed?: string;
    /** 触发的规则 */
    triggeredRules?: string[];
}
export interface GateContext {
    /** 输入内容 */
    content: string;
    /** 沙箱 ID */
    sandboxId?: string;
    /** 能力列表 */
    capabilities?: string[];
    /** 元数据 */
    metadata?: Record<string, unknown>;
}
export interface GateRule {
    /** 规则名称 */
    name: string;
    /** 规则描述 */
    description: string;
    /** 风险等级 */
    risk: "low" | "medium" | "high" | "critical";
    /** 检测函数 */
    check: (ctx: GateContext) => Promise<GateResult>;
    /** 是否启用 */
    enabled?: boolean;
}
/**
 * Jailbreak 检测规则
 *
 * 检测试图绕过系统限制的输入
 */
export declare const jailbreakRule: GateRule;
/**
 * Prompt Injection 检测规则
 *
 * 检测试图注入恶意指令的输入
 */
export declare const injectionRule: GateRule;
/**
 * 敏感数据检测规则
 *
 * 检测并掩码敏感数据
 */
export declare const sensitiveDataRule: GateRule;
/**
 * 命令注入检测规则
 *
 * 检测试图执行系统命令的输入
 */
export declare const commandInjectionRule: GateRule;
export interface GatekeeperConfig {
    /** 输入规则 */
    inputRules: GateRule[];
    /** 输出规则 */
    outputRules: GateRule[];
    /** 默认行为：放行还是阻止 */
    defaultAction: "allow" | "deny";
    /** 是否记录日志 */
    logging: boolean;
}
export declare class Gatekeeper {
    private config;
    constructor(config?: Partial<GatekeeperConfig>);
    /**
     * 检查输入
     */
    checkInput(ctx: GateContext): Promise<GateResult>;
    /**
     * 检查输出
     */
    checkOutput(ctx: GateContext): Promise<GateResult>;
    /**
     * 添加自定义规则
     */
    addInputRule(rule: GateRule): void;
    /**
     * 添加输出规则
     */
    addOutputRule(rule: GateRule): void;
    /**
     * 列出所有规则
     */
    listRules(): {
        input: string[];
        output: string[];
    };
    private runRules;
    private log;
}
export declare const gatekeeper: Gatekeeper;
//# sourceMappingURL=gatekeeper.d.ts.map