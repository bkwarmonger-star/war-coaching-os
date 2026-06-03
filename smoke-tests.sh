#!/bin/bash

# W.A.R. Coaching OS - Smoke Test Suite
# Usage: ./smoke-tests.sh [BASE_URL]
# Default BASE_URL: http://localhost:3000

set -e

BASE_URL="${1:-http://localhost:3000}"
PASS_COUNT=0
FAIL_COUNT=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local expected_status=$4
  
  echo -n "Testing $name... "
  
  response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
    ((PASS_COUNT++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
    echo "Response: $body"
    ((FAIL_COUNT++))
    return 1
  fi
}

test_health() {
  local name=$1
  
  echo -n "Testing $name... "
  
  response=$(curl -s "$BASE_URL/health")
  
  if echo "$response" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "Response: $response"
    ((PASS_COUNT++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Response: $response"
    ((FAIL_COUNT++))
    return 1
  fi
}

# Header
echo ""
echo "==========================================="
echo "W.A.R. Coaching OS - Smoke Test Suite"
echo "==========================================="
echo "Testing: $BASE_URL"
echo ""

# Wait for server to be ready
echo "Waiting for server to be ready..."
for i in {1..30}; do
  if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}Server is ready!${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}Server did not respond after 30 seconds${NC}"
    exit 1
  fi
  echo -n "."
  sleep 1
done

echo ""
echo "Running tests..."
echo ""

# Health Check Tests
echo "${YELLOW}=== Health Checks ===${NC}"
test_health "Server Health"
test_endpoint "Health Endpoint" "GET" "/health" "200"

echo ""
echo "${YELLOW}=== API Endpoints ===${NC}"

# Frontend Assets
test_endpoint "Index HTML" "GET" "/" "200"
test_endpoint "CSS Bundle" "GET" "/assets/index-*.css" "200" || true
test_endpoint "JS Bundle" "GET" "/assets/index-*.js" "200" || true

echo ""
echo "${YELLOW}=== Results ===${NC}"
echo ""
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "Manual verification checklist:"
  echo "  [ ] OAuth login flow works"
  echo "  [ ] Dashboard loads correctly"
  echo "  [ ] Can create/view clients"
  echo "  [ ] Can create/assign programs"
  echo "  [ ] AI generators produce output"
  echo "  [ ] File uploads work"
  echo "  [ ] Stripe integration (if configured)"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
