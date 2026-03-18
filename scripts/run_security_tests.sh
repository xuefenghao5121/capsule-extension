#!/bin/bash
# run_security_tests.sh
# 运行完整的安全测试套件

set -e

echo "=========================================="
echo "  Capsule Security Test Suite"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL=0
PASSED=0
FAILED=0

run_test() {
    local name=$1
    local level=$2
    local expected=$3
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing [$level] $name... "
    
    # 运行测试
    if npm test -- --run --reporter=verbose --testNamePattern="$name" 2>/dev/null | grep -q "passed"; then
        echo -e "${GREEN}PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
}

echo "=== Memory Safety Tests (MTE) ==="
run_test "Buffer Overflow" "L1+" "SIGSEGV"
run_test "Use-After-Free" "L1+" "SIGSEGV"

echo ""
echo "=== Control Flow Tests (PAC) ==="
run_test "Function Pointer Protection" "L1+" "PAC_FAIL"

echo ""
echo "=== TEE Isolation Tests ==="
run_test "Memory Isolation" "L2+" "ACCESS_DENIED"
run_test "Key Protection" "L2+" "ENCRYPTED"

echo ""
echo "=== Data Protection Tests ==="
run_test "Sensitive Data Leak" "L2+" "REDACTED"

echo ""
echo "=== Permission Boundary Tests ==="
run_test "Capability Escape" "L2+" "ENFORCED"

echo ""
echo "=== Attack Simulation Tests ==="
run_test "Malicious Agent Behavior" "L2+" "BLOCKED"

echo ""
echo "=== Attestation Tests ==="
run_test "Attestation Report" "L2+" "VALID"

echo ""
echo "=========================================="
echo "  Test Results Summary"
echo "=========================================="
echo -e "Total:  $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All security tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Review security posture.${NC}"
    exit 1
fi