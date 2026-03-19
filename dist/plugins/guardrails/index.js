/**
 * Guardrails Plugin
 *
 * Capsule 自研 Guardrails 系统
 * 设计哲学：Guardrails ≈ Gatekeeper
 */
import { Gatekeeper, gatekeeper } from "../../guardrails/gatekeeper.js";
const guardrailsPlugin = {
    name: "guardrails",
    platform: "universal",
    features: ["input-gate", "output-gate", "jailbreak-detection", "injection-detection", "sensitive-data"],
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
        console.log("[Capsule Guardrails] Gatekeeper initialized");
        console.log("[Capsule Guardrails] Input rules:", gatekeeper.listRules().input.join(", "));
        console.log("[Capsule Guardrails] Output rules:", gatekeeper.listRules().output.join(", "));
        return true;
    },
};
export default guardrailsPlugin;
export { Gatekeeper, gatekeeper };
//# sourceMappingURL=index.js.map