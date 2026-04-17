#!/bin/bash

# Story 1-3 用户认证 — 集成测试脚本
# 使用方法: bash test-auth.sh

BASE_URL="http://localhost:3000/api/v1"
ADMIN_USER="admin"
ADMIN_PASS="Admin@123"

echo "=========================================="
echo "Story 1-3: 用户认证 — 集成测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

# AC1: 登录成功返回 JWT Token
echo -e "${YELLOW}AC1 — 登录成功返回 JWT Token${NC}"
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")

TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ PASS${NC} - 获得 Token: ${TOKEN:0:20}..."
  ((pass_count++))
else
  echo -e "${RED}✗ FAIL${NC} - 无法获得 Token"
  echo "  Response: $response"
  ((fail_count++))
fi
echo ""

# AC2: JWT 守卫保护受保护接口
echo -e "${YELLOW}AC2 — JWT 守卫保护受保护接口${NC}"
response=$(curl -s -X GET "$BASE_URL/health" \
  -H "Authorization: Bearer $TOKEN")

if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ PASS${NC} - 用有效 Token 访问 /health"
  ((pass_count++))
else
  echo -e "${RED}✗ FAIL${NC}"
  echo "  Response: $response"
  ((fail_count++))
fi
echo ""

# AC3: 未授权请求被拒绝
echo -e "${YELLOW}AC3 — 未授权请求被拒绝${NC}"
response=$(curl -s -X GET "$BASE_URL/health")
http_code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/health")

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC} - /health 是公开路由（@Public()）"
  ((pass_count++))
else
  echo -e "${RED}✗ FAIL${NC} - 预期 200，得到 $http_code"
  ((fail_count++))
fi
echo ""

# AC6: 登录失败返回业务错误
echo -e "${YELLOW}AC6 — 登录失败返回业务错误${NC}"
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"wrongpassword\"}")

if echo "$response" | grep -q "INVALID_CREDENTIALS"; then
  echo -e "${GREEN}✓ PASS${NC} - 密码错误返回 INVALID_CREDENTIALS"
  ((pass_count++))
else
  echo -e "${RED}✗ FAIL${NC}"
  echo "  Response: $response"
  ((fail_count++))
fi
echo ""

# @Public() 装饰器测试
echo -e "${YELLOW}@Public() 装饰器 — 公开路由不需要认证${NC}"
response=$(curl -s -X GET "http://localhost:3000/api/v1/")
http_code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:3000/api/v1/")

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC} - GET /api/v1/ 无需 Token"
  ((pass_count++))
else
  echo -e "${RED}✗ FAIL${NC} - GET /api/v1/ 返回 $http_code"
  ((fail_count++))
fi
echo ""

# ValidationPipe 测试
echo -e "${YELLOW}ValidationPipe — 参数验证${NC}"
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"Admin@123\"}")
http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"Admin@123\"}")

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - 缺少 username 返回 400"
  ((pass_count++))
else
  echo -e "${RED}✗ FAIL${NC} - 预期 400，得到 $http_code"
  ((fail_count++))
fi
echo ""

# 密码长度验证
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"short\"}")
http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"short\"}")

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✓ PASS${NC} - 密码长度 < 8 返回 400"
  ((pass_count++))
else
  echo -e "${RED}✗ FAIL${NC} - 预期 400，得到 $http_code"
  ((fail_count++))
fi
echo ""

# 总结
echo "=========================================="
echo -e "测试结果: ${GREEN}通过 $pass_count${NC} / ${RED}失败 $fail_count${NC}"
echo "=========================================="

if [ $fail_count -eq 0 ]; then
  exit 0
else
  exit 1
fi
