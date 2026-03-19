/**
 * Guardrails Plugin
 *
 * Capsule 自研 Guardrails 系统
 * 设计哲学：Guardrails ≈ Gatekeeper
 */
import { SecurityPlugin } from "../index.js";
import { Gatekeeper, GateContext, gatekeeper } from "../../guardrails/gatekeeper.js";
declare const guardrailsPlugin: SecurityPlugin;
export default guardrailsPlugin;
export { Gatekeeper, GateContext, gatekeeper };
//# sourceMappingURL=index.d.ts.map