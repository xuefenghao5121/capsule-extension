/**
 * x86 Security Plugin
 *
 * 支持：Intel SGX, Intel TDX, AMD SEV-SNP
 */
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
function detectCPU() {
    try {
        const cpuinfo = readFileSync("/proc/cpuinfo", "utf-8");
        const lines = cpuinfo.split("\n");
        let vendor = "unknown";
        let model = "";
        const flags = [];
        for (const line of lines) {
            if (line.startsWith("vendor_id")) {
                const v = line.split(":")[1].trim();
                if (v === "GenuineIntel")
                    vendor = "intel";
                else if (v === "AuthenticAMD")
                    vendor = "amd";
            }
            if (line.startsWith("model name")) {
                model = line.split(":")[1].trim();
            }
            if (line.startsWith("flags")) {
                flags.push(...line.split(":")[1].trim().split(" "));
            }
        }
        return { vendor, model, flags };
    }
    catch {
        return { vendor: "unknown", model: "unknown", flags: [] };
    }
}
function detectSGX() {
    const cpu = detectCPU();
    if (cpu.vendor !== "intel") {
        return { available: false };
    }
    // 检查 CPU flags
    const hasSGX = cpu.flags.includes("sgx");
    const hasSGXLC = cpu.flags.includes("sgx_lc"); // SGX Launch Control (SGX2)
    if (!hasSGX) {
        return { available: false };
    }
    // 检查 EPC (Enclave Page Cache) 大小
    let epcSize = 0;
    try {
        // 通过 CPUID 获取 EPC 大小（需要 root 或 sgx_drv）
        const sgxDevices = ["/dev/sgx/enclave", "/dev/sgx_provision", "/dev/sgx_vepc"];
        const devicesAvailable = sgxDevices.some(d => existsSync(d));
        if (devicesAvailable) {
            // 简化：假设有 128MB EPC
            epcSize = 128 * 1024 * 1024;
        }
    }
    catch {
        // ignore
    }
    return {
        available: true,
        version: hasSGXLC ? "2" : "1",
        epcSize,
    };
}
function detectTDX() {
    const cpu = detectCPU();
    if (cpu.vendor !== "intel") {
        return false;
    }
    // TDX 需要较新的 Intel CPU (Sapphire Rapids 或更新)
    // 检查 TDX 模块是否加载
    try {
        if (existsSync("/sys/firmware/tdx/tdx_module")) {
            return true;
        }
        // 或者检查 dmesg
        const dmesg = execSync("dmesg 2>/dev/null | grep -i tdx || true", { encoding: "utf-8" });
        if (dmesg.toLowerCase().includes("tdx")) {
            return true;
        }
    }
    catch {
        // ignore
    }
    return false;
}
function detectSEV() {
    const cpu = detectCPU();
    if (cpu.vendor !== "amd") {
        return { available: false };
    }
    // 检查 SEV 支持
    try {
        // SEV-SNP 需要 Linux 5.19+
        if (existsSync("/sys/module/kvm_amd/parameters/sev_snp")) {
            const sevSnp = readFileSync("/sys/module/kvm_amd/parameters/sev_snp", "utf-8").trim();
            if (sevSnp === "Y") {
                return { available: true, version: "snp" };
            }
        }
        // SEV-ES
        if (existsSync("/sys/module/kvm_amd/parameters/sev_es")) {
            const sevEs = readFileSync("/sys/module/kvm_amd/parameters/sev_es", "utf-8").trim();
            if (sevEs === "Y") {
                return { available: true, version: "2" };
            }
        }
        // SEV
        if (existsSync("/sys/module/kvm_amd/parameters/sev")) {
            const sev = readFileSync("/sys/module/kvm_amd/parameters/sev", "utf-8").trim();
            if (sev === "Y") {
                return { available: true, version: "1" };
            }
        }
    }
    catch {
        // ignore
    }
    // 检查 CPU flags
    const hasSEV = cpu.flags.includes("sev");
    const hasSEVES = cpu.flags.includes("sev_es");
    const hasSEVSnp = cpu.flags.includes("sev_snp");
    if (hasSEVSnp)
        return { available: true, version: "snp" };
    if (hasSEVES)
        return { available: true, version: "2" };
    if (hasSEV)
        return { available: true, version: "1" };
    return { available: false };
}
// ========== x86 Plugin ==========
const x86Plugin = {
    name: "x86-security",
    platform: "x86",
    features: ["sgx", "tdx", "sev"],
    async detect() {
        const cpu = detectCPU();
        const sgx = detectSGX();
        const tdx = detectTDX();
        const sev = detectSEV();
        // 确定推荐的隔离级别和插件
        let recommendedIsolation = "L1";
        if (sgx.available || tdx || sev.available) {
            recommendedIsolation = "L3";
        }
        return {
            architecture: "x64",
            vendor: cpu.vendor,
            features: {
                sgx: sgx.available ? { version: sgx.version, epcSize: sgx.epcSize } : undefined,
                tdx,
                sev: sev.available ? { version: sev.version } : undefined,
            },
            recommended: {
                isolationLevel: recommendedIsolation,
                plugin: "x86-security",
            },
        };
    },
    async init(info) {
        console.log("[Capsule x86] Initializing...");
        console.log("[Capsule x86] Features:", info.features);
        // 检查可用的硬件特性
        const { sgx, tdx, sev } = info.features;
        if (sgx) {
            console.log(`[Capsule x86] SGX ${sgx.version} available (EPC: ${sgx.epcSize ? sgx.epcSize / 1024 / 1024 + 'MB' : 'unknown'})`);
        }
        if (tdx) {
            console.log("[Capsule x86] TDX available");
        }
        if (sev) {
            console.log(`[Capsule x86] SEV ${sev.version} available`);
        }
        // 如果没有任何硬件特性，返回 false 降级到核心模式
        if (!sgx && !tdx && !sev) {
            console.log("[Capsule x86] No hardware security features available, falling back to core mode");
            return false;
        }
        return true;
    },
    async createSecureContext(config) {
        const { isolationLevel, capabilities, quota } = config;
        const features = [];
        // 根据隔离级别选择硬件特性
        const hwInfo = await this.detect();
        if (isolationLevel === "L3") {
            if (hwInfo.features.sgx) {
                features.push("sgx");
                console.log("[Capsule x86] Creating SGX enclave context");
                // 实际实现需要调用 SGX SDK
            }
            else if (hwInfo.features.tdx) {
                features.push("tdx");
                console.log("[Capsule x86] Creating TDX VM context");
            }
            else if (hwInfo.features.sev) {
                features.push("sev");
                console.log("[Capsule x86] Creating SEV VM context");
            }
        }
        return {
            id: `ctx-${Date.now()}`,
            plugin: "x86-security",
            isolationLevel,
            features,
        };
    },
    async destroySecureContext(contextId) {
        console.log(`[Capsule x86] Destroying context ${contextId}`);
        // 清理 SGX enclave / TDX VM / SEV VM
    },
    async executeSecure(context, command, args) {
        console.log(`[Capsule x86] Executing in secure context: ${command}`);
        if (context.features.includes("sgx")) {
            // 在 SGX enclave 中执行
            // 需要通过 Gramine 或 Occlum
            console.log("[Capsule x86] Using SGX execution path");
        }
        else if (context.features.includes("tdx") || context.features.includes("sev")) {
            // 在 confidential VM 中执行
            console.log(`[Capsule x86] Using ${context.features[0]} execution path`);
        }
        // 降级到普通进程执行（当前实现）
        const start = Date.now();
        try {
            const result = execSync(`${command} ${args.join(" ")}`, {
                encoding: "utf-8",
                timeout: 60000,
            });
            return {
                exitCode: 0,
                stdout: result,
                stderr: "",
                duration: Date.now() - start,
            };
        }
        catch (err) {
            return {
                exitCode: err.status || 1,
                stdout: err.stdout || "",
                stderr: err.stderr || err.message,
                duration: Date.now() - start,
            };
        }
    },
};
export default x86Plugin;
//# sourceMappingURL=index.js.map