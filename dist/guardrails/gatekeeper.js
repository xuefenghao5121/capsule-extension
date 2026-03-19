/**
 * Capsule Guardrails - Gatekeeper Pattern
 *
 * 设计哲学：
 * - Guardrails ≈ Gatekeeper（守门即防护）
 * - 规则即代码（可插拔的函数）
 * - 与隔离联动（验证后才进入沙箱）
 * - 最小依赖（优先规则匹配，不依赖 LLM）
 */
// ========== Built-in Rules ==========
/**
 * Jailbreak 检测规则
 *
 * 检测试图绕过系统限制的输入
 */
export const jailbreakRule = {
    name: "jailbreak",
    description: "检测试图绕过系统限制的输入",
    risk: "critical",
    async check(ctx) {
        const content = ctx.content.toLowerCase();
        const triggeredRules = [];
        // 常见 jailbreak 模式
        const patterns = [
            { pattern: /ignore (all )?(previous|above|prior) (instructions|rules|prompts)/i, name: "ignore-instructions" },
            { pattern: /forget (all )?(previous|above|prior)/i, name: "forget-previous" },
            { pattern: /you are (now|no longer)/i, name: "role-change" },
            { pattern: /pretend (to be|you are)/i, name: "pretend" },
            { pattern: /act as (if|a|an)/i, name: "act-as" },
            { pattern: /system override/i, name: "system-override" },
            { pattern: /developer mode/i, name: "developer-mode" },
            { pattern: /ignore (your|the) (training|guidelines|ethics)/i, name: "ignore-training" },
            { pattern: /bypass (all )?(restrictions|filters|safety)/i, name: "bypass" },
            { pattern: /(your|the) (new |true |real )?(instructions|rules|directives) (are|is):/i, name: "new-instructions" },
        ];
        for (const { pattern, name } of patterns) {
            if (pattern.test(content)) {
                triggeredRules.push(name);
            }
        }
        if (triggeredRules.length > 0) {
            return {
                allowed: false,
                reason: `检测到 jailbreak 尝试: ${triggeredRules.join(", ")}`,
                confidence: 0.9,
                triggeredRules,
            };
        }
        return { allowed: true, confidence: 1.0 };
    },
};
/**
 * Prompt Injection 检测规则
 *
 * 检测试图注入恶意指令的输入
 */
export const injectionRule = {
    name: "prompt-injection",
    description: "检测试图注入恶意指令的输入",
    risk: "high",
    async check(ctx) {
        const content = ctx.content;
        const triggeredRules = [];
        // Injection 模式
        const patterns = [
            { pattern: /\{\{.*\}\}/s, name: "template-injection" },
            { pattern: /<\|.*\|>/s, name: "token-injection" },
            { pattern: /\[SYSTEM\]|\[ADMIN\]|\[ROOT\]/i, name: "role-spoofing" },
            { pattern: /```(system|instruction|prompt)/i, name: "code-block-injection" },
            { pattern: /\n\n(HUMAN|ASSISTANT|SYSTEM):/i, name: "role-injection" },
        ];
        for (const { pattern, name } of patterns) {
            if (pattern.test(content)) {
                triggeredRules.push(name);
            }
        }
        if (triggeredRules.length > 0) {
            return {
                allowed: false,
                reason: `检测到 prompt injection: ${triggeredRules.join(", ")}`,
                confidence: 0.85,
                triggeredRules,
            };
        }
        return { allowed: true, confidence: 1.0 };
    },
};
/**
 * 敏感数据检测规则
 *
 * 检测并掩码敏感数据
 */
export const sensitiveDataRule = {
    name: "sensitive-data",
    description: "检测并掩码敏感数据",
    risk: "medium",
    async check(ctx) {
        let content = ctx.content;
        const triggeredRules = [];
        // 敏感数据模式
        const patterns = [
            {
                pattern: /sk-[a-zA-Z0-9]{20,}/g,
                name: "api-key-openai",
                mask: "[API_KEY_REDACTED]"
            },
            {
                pattern: /xox[baprs]-[a-zA-Z0-9-]{10,}/g,
                name: "api-key-slack",
                mask: "[SLACK_TOKEN_REDACTED]"
            },
            {
                pattern: /ghp_[a-zA-Z0-9]{36}/g,
                name: "api-key-github",
                mask: "[GITHUB_TOKEN_REDACTED]"
            },
            {
                pattern: /AKIA[A-Z0-9]{16}/g,
                name: "api-key-aws",
                mask: "[AWS_KEY_REDACTED]"
            },
            {
                pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                name: "email",
                mask: "[EMAIL_REDACTED]"
            },
            {
                pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
                name: "credit-card",
                mask: "[CARD_REDACTED]"
            },
            {
                pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
                name: "ssn",
                mask: "[SSN_REDACTED]"
            },
            {
                pattern: /(?<![a-zA-Z0-9])[a-zA-Z0-9]{32,}(?![a-zA-Z0-9])/g,
                name: "secret-key",
                mask: "[SECRET_REDACTED]"
            },
        ];
        for (const { pattern, name, mask } of patterns) {
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
                triggeredRules.push(name);
                content = content.replace(pattern, mask);
            }
        }
        if (triggeredRules.length > 0) {
            return {
                allowed: true, // 敏感数据不阻止，只掩码
                confidence: 1.0,
                transformed: content,
                triggeredRules,
            };
        }
        return { allowed: true, confidence: 1.0 };
    },
};
/**
 * 命令注入检测规则
 *
 * 检测试图执行系统命令的输入
 */
export const commandInjectionRule = {
    name: "command-injection",
    description: "检测试图执行系统命令的输入",
    risk: "critical",
    async check(ctx) {
        const content = ctx.content;
        const triggeredRules = [];
        // 命令注入模式
        const patterns = [
            { pattern: /;\s*(rm|cat|ls|wget|curl|bash|sh|python|node|exec)/i, name: "command-chain" },
            { pattern: /\$\([^)]+\)/, name: "command-substitution" },
            { pattern: /`[^`]+`/, name: "backtick-execution" },
            { pattern: /\|\s*(sh|bash|python|node)/i, name: "pipe-execution" },
            { pattern: /&&\s*(rm|wget|curl)/i, name: "and-execution" },
            { pattern: />\s*\//, name: "file-write" },
            { pattern: /\/etc\/passwd|\/etc\/shadow/i, name: "sensitive-file-access" },
        ];
        for (const { pattern, name } of patterns) {
            if (pattern.test(content)) {
                triggeredRules.push(name);
            }
        }
        if (triggeredRules.length > 0) {
            return {
                allowed: false,
                reason: `检测到命令注入尝试: ${triggeredRules.join(", ")}`,
                confidence: 0.95,
                triggeredRules,
            };
        }
        return { allowed: true, confidence: 1.0 };
    },
};
export class Gatekeeper {
    config;
    constructor(config) {
        this.config = {
            inputRules: [
                jailbreakRule,
                injectionRule,
                sensitiveDataRule,
                commandInjectionRule,
            ],
            outputRules: [
                sensitiveDataRule,
            ],
            defaultAction: "allow",
            logging: true,
            ...config,
        };
    }
    /**
     * 检查输入
     */
    async checkInput(ctx) {
        return this.runRules(ctx, this.config.inputRules);
    }
    /**
     * 检查输出
     */
    async checkOutput(ctx) {
        return this.runRules(ctx, this.config.outputRules);
    }
    /**
     * 添加自定义规则
     */
    addInputRule(rule) {
        this.config.inputRules.push(rule);
    }
    /**
     * 添加输出规则
     */
    addOutputRule(rule) {
        this.config.outputRules.push(rule);
    }
    /**
     * 列出所有规则
     */
    listRules() {
        return {
            input: this.config.inputRules.map(r => r.name),
            output: this.config.outputRules.map(r => r.name),
        };
    }
    // ========== Private ==========
    async runRules(ctx, rules) {
        let currentContent = ctx.content;
        const allTriggeredRules = [];
        for (const rule of rules) {
            if (rule.enabled === false)
                continue;
            try {
                const ruleCtx = { ...ctx, content: currentContent };
                const result = await rule.check(ruleCtx);
                if (result.transformed) {
                    currentContent = result.transformed;
                }
                if (result.triggeredRules) {
                    allTriggeredRules.push(...result.triggeredRules.map(r => `${rule.name}:${r}`));
                }
                if (!result.allowed) {
                    this.log("deny", rule.name, result.reason);
                    return {
                        ...result,
                        transformed: currentContent,
                        triggeredRules: allTriggeredRules,
                    };
                }
            }
            catch (err) {
                console.error(`[Gatekeeper] Rule ${rule.name} error:`, err);
                // 规则出错时，根据默认行为处理
                if (this.config.defaultAction === "deny") {
                    return {
                        allowed: false,
                        reason: `规则 ${rule.name} 执行出错`,
                        confidence: 0.5,
                        triggeredRules: allTriggeredRules,
                    };
                }
            }
        }
        this.log("allow", "all", undefined);
        return {
            allowed: true,
            confidence: 1.0,
            transformed: currentContent !== ctx.content ? currentContent : undefined,
            triggeredRules: allTriggeredRules.length > 0 ? allTriggeredRules : undefined,
        };
    }
    log(action, rule, reason) {
        if (!this.config.logging)
            return;
        const timestamp = new Date().toISOString();
        if (action === "deny") {
            console.log(`[Gatekeeper] ${timestamp} DENY by ${rule}: ${reason}`);
        }
    }
}
// ========== Default Instance ==========
export const gatekeeper = new Gatekeeper();
//# sourceMappingURL=gatekeeper.js.map