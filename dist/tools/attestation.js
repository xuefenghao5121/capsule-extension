/**
 * Attestation Tool - SGX Remote Attestation
 *
 * Generate and verify SGX attestation reports
 */
import { z } from "zod";
import { SGX } from "../hardware/sgx.js";
const InputSchema = z.object({
    action: z.enum(["generate", "verify"]).describe("Action to perform"),
    data: z.string().optional().describe("Data to include in attestation"),
    nonce: z.string().optional().describe("Nonce for replay protection"),
    report: z.string().optional().describe("Report to verify"),
    signature: z.string().optional().describe("Signature to verify"),
});
export function createAttestationTool(hwSecurity) {
    return {
        name: "attestation",
        description: `SGX Remote Attestation tool.

Provides hardware-backed proof of code execution in an SGX enclave.

Actions:
- generate: Create an attestation report
- verify: Verify an attestation report

Hardware Status:
- SGX: ${hwSecurity.hasSGX ? `Available (${hwSecurity.sgxInfo?.version})` : "Not available"}

Use Cases:
- Prove code ran in a secure enclave
- Verify remote party's enclave identity
- Establish secure communication channels`,
        inputSchema: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    enum: ["generate", "verify"],
                    description: "Action to perform",
                },
                data: { type: "string", description: "Data to include in attestation" },
                nonce: { type: "string", description: "Nonce for replay protection" },
                report: { type: "string", description: "Report to verify" },
                signature: { type: "string", description: "Signature to verify" },
            },
            required: ["action"],
        },
        async execute(input) {
            const { action, data, nonce, report, signature } = InputSchema.parse(input);
            if (!hwSecurity.hasSGX) {
                return {
                    success: false,
                    error: "SGX not available on this system",
                    sgxAvailable: false,
                };
            }
            switch (action) {
                case "generate": {
                    if (!data) {
                        return {
                            success: false,
                            error: "data is required for generate action",
                        };
                    }
                    try {
                        const result = await SGX.generateAttestation(data, nonce);
                        return {
                            success: result.success,
                            report: result.report,
                            signature: result.signature,
                            timestamp: result.timestamp,
                            sgxVersion: hwSecurity.sgxInfo?.version,
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            error: error.message,
                        };
                    }
                }
                case "verify": {
                    if (!report || !signature) {
                        return {
                            success: false,
                            error: "report and signature are required for verify action",
                        };
                    }
                    try {
                        const valid = await SGX.verifyAttestation(report, signature);
                        return {
                            success: true,
                            valid,
                            timestamp: Date.now(),
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            error: error.message,
                            valid: false,
                        };
                    }
                }
                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}`,
                    };
            }
        },
    };
}
//# sourceMappingURL=attestation.js.map