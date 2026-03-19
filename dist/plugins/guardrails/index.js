/**
 * Guardrails Plugin (Placeholder)
 *
 * 支持：Input Rails, Output Rails, Execution Rails
 */
const guardrailsPlugin = {
    name: "guardrails",
    platform: "universal",
    features: ["input-rails", "output-rails", "execution-rails"],
    async detect() {
        return {
            architecture: process.arch,
            features: {},
            recommended: {
                isolationLevel: "L1",
                plugin: "guardrails",
            },
        };
    },
    async init(info) {
        console.log("[Capsule Guardrails] Guardrails plugin initialized");
        return false; // 暂时降级，等待集成 NeMo Guardrails
    },
};
export default guardrailsPlugin;
//# sourceMappingURL=index.js.map