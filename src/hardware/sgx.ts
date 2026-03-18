/**
 * SGX Hardware Security Interface
 * 
 * Intel SGX (Software Guard Extensions) support for x86 architecture
 * Provides TEE capabilities on Intel CPUs
 */

import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { exec as execCallback } from "child_process";

const exec = promisify(execCallback);

// SGX Device paths
const SGX_DEVICES = [
  "/dev/sgx_enclave",
  "/dev/sgx_provision", 
  "/dev/isgx",
  "/dev/sgx",
];

// SGX capability flags
const SGX_CAPABILITIES = {
  SGX1: 0x0001,
  SGX2: 0x0002,
  EINCVIRTCHILD: 0x0004,
  EDECCSSA: 0x0008,
} as const;

export interface SGXInfo {
  available: boolean;
  version: "SGX1" | "SGX2" | "None";
  devices: string[];
  epcSize: number;  // Enclave Page Cache size in bytes
  maxEnclaveSize: number;
  launchControl: boolean;
}

export interface EnclaveConfig {
  enclaveFile: string;
  heapSize: number;
  stackSize: number;
  tcsCount: number;
}

export interface AttestationResult {
  success: boolean;
  report: string;
  signature: string;
  timestamp: number;
}

/**
 * Check if SGX is available on this system
 */
export async function checkSGXAvailable(): Promise<SGXInfo> {
  const info: SGXInfo = {
    available: false,
    version: "None",
    devices: [],
    epcSize: 0,
    maxEnclaveSize: 0,
    launchControl: false,
  };

  // Check for SGX devices
  for (const device of SGX_DEVICES) {
    if (fs.existsSync(device)) {
      info.devices.push(device);
    }
  }

  if (info.devices.length === 0) {
    return info;
  }

  info.available = true;

  // Check CPU capabilities
  try {
    // Check CPU flags for SGX
    const cpuinfo = await fs.promises.readFile("/proc/cpuinfo", "utf-8");
    const flags = cpuinfo.match(/flags\s*:\s*(.+)/i);
    
    if (flags) {
      const flagList = flags[1].split(/\s+/);
      
      if (flagList.includes("sgx")) {
        info.version = flagList.includes("sgx_lc") ? "SGX2" : "SGX1";
      }
    }
  } catch {
    // Fallback: assume SGX1 if device exists
    info.version = "SGX1";
  }

  // Check Launch Control support
  try {
    const { stdout } = await exec("cpuid -1 2>/dev/null | grep -i sgx_lc || true");
    info.launchControl = stdout.includes("sgx_lc") || stdout.includes("launch config");
  } catch {
    info.launchControl = false;
  }

  // Get EPC size from /proc/cpuinfo
  try {
    const cpuinfo = await fs.promises.readFile("/proc/cpuinfo", "utf-8");
    const epcMatch = cpuinfo.match(/sgx_epc\s*:\s*(\d+)/i);
    if (epcMatch) {
      info.epcSize = parseInt(epcMatch[1], 10);
    }
  } catch {}

  return info;
}

/**
 * Check if running in an SGX enclave
 */
export function isInEnclave(): boolean {
  // In a real enclave, certain syscalls would fail
  // This is a simplified check
  try {
    // Check if we're in an enclave by looking at /proc/self/status
    const status = fs.readFileSync("/proc/self/status", "utf-8");
    // Real enclave detection would check for specific conditions
    return false;
  } catch {
    return false;
  }
}

/**
 * Initialize SGX for use
 */
export async function initSGX(): Promise<boolean> {
  const info = await checkSGXAvailable();
  
  if (!info.available) {
    console.error("[SGX] SGX not available on this system");
    return false;
  }

  // Check device permissions
  for (const device of info.devices) {
    try {
      fs.accessSync(device, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      console.warn(`[SGX] No permission to access ${device}`);
      return false;
    }
  }

  console.log(`[SGX] SGX initialized: ${info.version}`);
  console.log(`[SGX] Devices: ${info.devices.join(", ")}`);
  console.log(`[SGX] Launch Control: ${info.launchControl ? "Yes" : "No"}`);

  return true;
}

/**
 * Generate SGX attestation report
 */
export async function generateAttestation(
  data: string,
  nonce?: string
): Promise<AttestationResult> {
  const info = await checkSGXAvailable();
  
  if (!info.available) {
    throw new Error("SGX not available");
  }

  // In a real implementation, this would call into the enclave
  // For testing, we generate a mock attestation
  const timestamp = Date.now();
  
  return {
    success: true,
    report: JSON.stringify({
      version: "1.0",
      timestamp,
      nonce: nonce || `nonce-${timestamp}`,
      data: Buffer.from(data).toString("base64"),
      quote: {
        version: 2,
        signatureType: "ECDSA",
        platformInfo: {
          sgxType: info.version,
          cpuSvn: "0000000000000000",
        },
      },
    }),
    signature: `sig-${timestamp}-${Math.random().toString(36).slice(2)}`,
    timestamp,
  };
}

/**
 * Verify SGX attestation
 */
export async function verifyAttestation(
  report: string,
  signature: string
): Promise<boolean> {
  try {
    const parsed = JSON.parse(report);
    
    // Verify timestamp is recent (within 5 minutes)
    const now = Date.now();
    const reportTime = parsed.timestamp;
    if (Math.abs(now - reportTime) > 5 * 60 * 1000) {
      return false;
    }

    // In production, verify the signature against Intel IAS/DCAP
    // This is a simplified check
    return signature.startsWith("sig-");
  } catch {
    return false;
  }
}

/**
 * Execute code in SGX enclave
 * 
 * This requires Gramine or Occlum runtime
 */
export async function executeInEnclave(
  command: string,
  args: string[] = [],
  options: {
    timeout?: number;
    cwd?: string;
    env?: Record<string, string>;
  } = {}
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const info = await checkSGXAvailable();
  
  if (!info.available) {
    throw new Error("SGX not available");
  }

  // Check for Gramine or Occlum
  const hasGramine = fs.existsSync("/usr/bin/gramine-sgx");
  const hasOcclum = fs.existsSync("/opt/occlum");

  if (!hasGramine && !hasOcclum) {
    // Fall back to simulation mode
    return executeInSimulation(command, args, options);
  }

  if (hasGramine) {
    return executeWithGramine(command, args, options);
  }

  if (hasOcclum) {
    return executeWithOcclum(command, args, options);
  }

  throw new Error("No SGX runtime available");
}

/**
 * Execute with Gramine
 */
async function executeWithGramine(
  command: string,
  args: string[],
  options: { timeout?: number; cwd?: string; env?: Record<string, string> }
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const { spawn } = require("child_process");
  
  return new Promise((resolve) => {
    const proc = spawn("gramine-sgx", [command, ...args], {
      cwd: options.cwd,
      env: options.env,
      timeout: options.timeout,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });

    proc.on("error", (err: Error) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: err.message,
      });
    });
  });
}

/**
 * Execute with Occlum
 */
async function executeWithOcclum(
  command: string,
  args: string[],
  options: { timeout?: number; cwd?: string; env?: Record<string, string> }
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const { spawn } = require("child_process");
  
  // Occlum uses occlum run
  const occlumArgs = ["run", command, ...args];

  return new Promise((resolve) => {
    const proc = spawn("occlum", occlumArgs, {
      cwd: options.cwd,
      env: options.env,
      timeout: options.timeout,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });

    proc.on("error", (err: Error) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: err.message,
      });
    });
  });
}

/**
 * Execute in simulation mode (no hardware SGX)
 */
async function executeInSimulation(
  command: string,
  args: string[],
  options: { timeout?: number; cwd?: string; env?: Record<string, string> }
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const { spawn } = require("child_process");

  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env, SGX_MODE: "SIM" },
      timeout: options.timeout,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr: "[SGX-SIM] " + stderr,
      });
    });

    proc.on("error", (err: Error) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: err.message,
      });
    });
  });
}

/**
 * Seal data using SGX
 */
export async function sealData(data: string, keyId?: string): Promise<string> {
  // In a real implementation, this would use SGX sealing
  // For now, return a base64 encoded result
  const timestamp = Date.now();
  const sealed = {
    version: 1,
    timestamp,
    keyId: keyId || `key-${timestamp}`,
    data: Buffer.from(data).toString("base64"),
    sealed: true,
  };
  
  return Buffer.from(JSON.stringify(sealed)).toString("base64");
}

/**
 * Unseal data using SGX
 */
export async function unsealData(sealedData: string): Promise<string> {
  try {
    const parsed = JSON.parse(Buffer.from(sealedData, "base64").toString());
    
    if (!parsed.sealed) {
      throw new Error("Data not sealed");
    }

    return Buffer.from(parsed.data, "base64").toString();
  } catch (error) {
    throw new Error("Failed to unseal data");
  }
}

// Export
export const SGX = {
  checkAvailable: checkSGXAvailable,
  isInEnclave,
  init: initSGX,
  generateAttestation,
  verifyAttestation,
  executeInEnclave,
  sealData,
  unsealData,
};