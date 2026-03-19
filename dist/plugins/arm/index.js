/**
 * ARM Security Plugin (Placeholder)
 *
 * 支持：MTE, PAC, TEE, SVE
 */
const armPlugin = {
    name: "arm-security",
    platform: "arm",
    features: ["mte", "pac", "tee", "sve"],
    async detect() {
        // TODO: 实现 ARM 硬件检测
        return {
            architecture: "arm64",
            features: {},
            recommended: {
                isolationLevel: "L1",
                plugin: "arm-security",
            },
        };
    },
    async init(info) {
        console.log("[Capsule ARM] ARM security plugin initialized");
        return false; // 暂时降级到核心模式
    },
};
export default armPlugin;
//# sourceMappingURL=index.js.map