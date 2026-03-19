/**
 * x86 Security Plugin
 *
 * 检测：Intel SGX, Intel TDX, AMD SEV-SNP
 */
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";
// ========== Hardware Detection ==========
function detectCPU() {
    try {
        const cpuinfo = readFileSync("/proc/cpuinfo", "utf-8");
        let vendor = "unknown";
        const flags = [];
        for (const line of cpuinfo.split("\n")) {
            if (line.startsWith("vendor_id")) {
                const v = line.split(":")[1].trim();
                if (v === "GenuineIntel")
                    vendor = "intel";
                else if (v === "AuthenticAMD")
                    vendor = "amd";
            }
            if (line.startsWith("flags")) {
                flags.push(...line.split(":")[1].trim().split(" "));
            }
        }
        return { vendor, flags };
    }
    catch {
        return { vendor: "unknown", flags: [] };
    }
}
function detectSGX() {
    const { vendor, flags } = detectCPU();
    if (vendor !== "intel")
        return { available: false };
    const hasSGX = flags.includes("sgx");
    const hasSGXLC = flags.includes("sgx_lc");
    if (!hasSGX)
        return { available: false };
    // Check devices
    const devices = ["/dev/sgx_enclave", "/dev/sgx_provision"];
    const hasDevices = devices.some(d => existsSync(d));
    return {
        available: hasDevices,
        version: hasSGXLC ? "2" : "1",
    };
}
function detectTDX() {
    try {
        if (existsSync("/sys/firmware/tdx/tdx_module"))
            return true;
        const dmesg = execSync("dmesg 2>/dev/null | grep -i tdx || true", { encoding: "utf-8" });
        return dmesg.toLowerCase().includes("tdx");
    }
    catch {
        return false;
    }
}
function detectSEV() {
    const { vendor, flags } = detectCPU();
    if (vendor !== "amd")
        return { available: false };
    const hasSEV = flags.includes("sev");
    const hasSEVES = flags.includes("sev_es");
    const hasSEVSnp = flags.includes("sev_snp");
    if (hasSEVSnp)
        return { available: true, version: "snp" };
    if (hasSEVES)
        return { available: true, version: "2" };
    if (hasSEV)
        return { available: true, version: "1" };
    return { available: false };
}
// ========== Plugin ==========
const x86Plugin = {
    name: "x86-security",
    platform: "x86",
    features: ["sgx", "tdx", "sev"],
    async detect() {
        const { vendor } = detectCPU();
        const sgx = detectSGX();
        const tdx = detectTDX();
        const sev = detectSEV();
        const hasHWSecurity = sgx.available || tdx || sev.available;
        return {
            architecture: "x64",
            vendor,
            features: {
                sgx: sgx.available ? { version: sgx.version } : undefined,
                tdx,
                sev: sev.available ? { version: sev.version } : undefined,
            },
            recommended: {
                isolationLevel: hasHWSecurity ? "L3" : "L1",
                plugin: hasHWSecurity ? "x86-security" : "core",
            },
        };
    },
    async init(info) {
        const { sgx, tdx, sev } = info.features;
        if (sgx)
            console.log(`[Capsule x86] SGX ${sgx.version} detected`);
        if (tdx)
            console.log("[Capsule x86] TDX detected");
        if (sev)
            console.log(`[Capsule x86] SEV ${sev.version} detected`);
        return !!(sgx || tdx || sev);
    },
};
export default x86Plugin;
//# sourceMappingURL=index.js.map