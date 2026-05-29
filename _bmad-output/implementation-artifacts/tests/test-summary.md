# Test Automation Summary

## Generated Tests

### API Tests
- [x] `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts` - 通过 Playwright request fixture 调用真实后端 API，发现并断言当前环境中的 Epic 6-8 主履约链路数据。

### E2E Tests
- [x] `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts` - 已发货链路：出库单 -> 物流单 -> 发货需求，断言状态、关联单据、SKU/数量和操作记录展示。
- [x] `apps/web/e2e/epic-6-8-fulfillment-chain.spec.ts` - 采购收货链路：采购订单 -> 收货入库单 -> 发货需求，断言状态、入库数量、库存批次和关联跳转展示。

## Coverage

- P0 已发货链路：1/1 覆盖，固定 `confirmed -> shipped` 物流状态、发货需求 `shipped`、销售订单 `shipped`。
- P0 采购收货链路：1/1 覆盖，固定采购单 `received`、收货单 `confirmed`、采购/发货需求入库数量一致。
- 风险覆盖：R-001 跨单据数量一致性、R-002 状态机回归、R-004 页面展示一致性、R-007 前端 E2E 交易主链缺口。

## Verification

- [x] `pnpm --filter web exec playwright test e2e/epic-6-8-fulfillment-chain.spec.ts --project=chromium`
- Result: 2 passed.

## Notes

- 测试使用真实运行环境，默认 API 地址为 `http://localhost:3000/api`，可通过 `E2E_API_URL` 覆盖。
- 登录默认使用 `admin / Admin@123`，可通过 `E2E_ADMIN_USERNAME`、`E2E_ADMIN_PASSWORD` 覆盖。
- 本地当前只验证 Chromium；Firefox/WebKit 浏览器二进制未安装，完整浏览器矩阵需要先执行 Playwright browser install。
