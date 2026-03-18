# Capsule Extension - SGX Support

> Version 2.0.0 | Updated: 2026-03-19

## SGX Support for x86 Architecture

Capsule Extension now supports Intel SGX (Software Guard Extensions) for hardware-enforced isolation on x86 systems.

---

## Hardware Requirements

| Requirement | Details |
|-------------|---------|
| **Architecture** | x86_64 |
| **CPU** | Intel CPU with SGX support |
| **SGX Version** | SGX1 or SGX2 |
| **Devices** | `/dev/sgx_enclave`, `/dev/sgx_provision` |
| **Runtime** | Gramine or Occlum (optional) |

---

## Checking SGX Availability

```bash
# Check SGX devices
ls -la /dev/sgx*

# Check CPU support
cpuid -1 | grep -i sgx
```

Expected output:
```
SGX: Software Guard Extensions supported = true
SGX1 supported = true
SGX2 supported = true
```

---

## Isolation Levels

| Level | Description | SGX Required |
|-------|-------------|--------------|
| **L1** | Process isolation | No |
| **L1+** | Process + cgroups | No |
| **L2** | Docker container | No |
| **L2+** | Docker + SGX | Yes (fallback to L2) |
| **L3** | SGX Enclave | Yes (fallback to L2) |

---

## Features

### SGX Detection

```typescript
import { SGX } from "capsule-extension";

const info = await SGX.checkAvailable();
console.log(info);
// {
//   available: true,
//   version: "SGX2",
//   devices: ["/dev/sgx_enclave", "/dev/sgx_provision"],
//   launchControl: true
// }
```

### Execute in Enclave

```typescript
const result = await SGX.executeInEnclave("node", ["script.js"], {
  timeout: 30000,
  cwd: "/workspace"
});
```

### Remote Attestation

```typescript
// Generate attestation
const attestation = await SGX.generateAttestation("my data", "nonce-123");

// Verify attestation
const valid = await SGX.verifyAttestation(
  attestation.report,
  attestation.signature
);
```

---

## SGX Runtime Options

### Gramine (Recommended)

```bash
# Install Gramine
sudo apt install gramine

# Execute in SGX
gramine-sgx your-app
```

### Occlum

```bash
# Install Occlum
# See: https://github.com/occlum/occlum

# Initialize Occlum instance
occlum init
occlum build
occlum run your-app
```

### Simulation Mode

If no SGX runtime is available, Capsule falls back to simulation mode:

```typescript
// Automatic fallback
const result = await executeIsolated("L3", options, config);
// Falls back to L2 if SGX runtime not available
```

---

## Architecture Support

| Architecture | TEE Support |
|--------------|-------------|
| **x86_64** | Intel SGX ✅ |
| **arm64** | Kunpeng/TrustZone (planned) |

---

## API Reference

### `SGX.checkAvailable()`

Check if SGX is available on the system.

```typescript
interface SGXInfo {
  available: boolean;
  version: "SGX1" | "SGX2" | "None";
  devices: string[];
  epcSize: number;
  maxEnclaveSize: number;
  launchControl: boolean;
}
```

### `SGX.executeInEnclave(command, args, options)`

Execute a command in an SGX enclave.

```typescript
interface ExecutionOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
}

interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}
```

### `SGX.generateAttestation(data, nonce?)`

Generate an SGX attestation report.

```typescript
interface AttestationResult {
  success: boolean;
  report: string;
  signature: string;
  timestamp: number;
}
```

### `SGX.sealData(data, keyId?)`

Seal data using SGX sealing.

```typescript
const sealed = await SGX.sealData("sensitive data");
```

---

## Security Considerations

1. **Device Permissions**: User must have read/write access to `/dev/sgx_*`
2. **Launch Control**: SGX2 with Launch Control provides better security
3. **Attestation**: Always verify attestation reports from remote parties
4. **Resource Limits**: EPC (Enclave Page Cache) is limited

---

## Troubleshooting

### SGX devices not found

```bash
# Check kernel modules
lsmod | grep sgx

# Load SGX driver
sudo modprobe intel_sgx
```

### Permission denied

```bash
# Add user to sgx group
sudo usermod -a -G sgx $USER

# Logout and login again
```

### Gramine not found

```bash
# Install Gramine
curl -L https://github.com/gramineproject/gramine/releases/latest/download/gramine_latest.tar.gz | tar xz
cd gramine-*
sudo make install
```

---

## GitHub

https://github.com/xuefenghao5121/capsule-extension

---

*Capsule Extension v2.0.0 - SGX Support*