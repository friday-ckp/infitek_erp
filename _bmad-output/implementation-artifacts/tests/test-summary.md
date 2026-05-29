# Test Automation Summary

## Generated Tests

### API Tests
- [ ] Story 9.3 本轮未新增独立 API 自动化；前端回调换票行为通过 Playwright 的 `page.route()` mock 后端契约进行验证。

### E2E Tests
- [x] `apps/web/e2e/dingtalk-login.spec.ts` - 覆盖登录页钉钉扫码按钮真实跳转到 `/api/auth/dingtalk/login`，并保留登录后 redirect。
- [x] `apps/web/e2e/dingtalk-login.spec.ts` - 覆盖 ticket 交换成功后写入 JWT/用户信息并跳转到 redirect 目标页。
- [x] `apps/web/e2e/dingtalk-login.spec.ts` - 覆盖未绑定与 ticket 过期场景的页面级错误提示、回到密码登录和重新扫码入口。
- [x] `apps/web/e2e/dingtalk-login.spec.ts` - 覆盖 exchange 失败时仅展示映射后的友好文案，不泄露原始后端异常或重复 toast。
- [x] `apps/web/e2e/dingtalk-login.spec.ts` - 保留密码登录成功后跳转到 redirect 目标页的兼容性验证。

## Coverage

- UI 流程: 5/5 关键登录路径已覆盖。
- 成功路径: 2/2 覆盖，包含密码登录与钉钉 ticket 登录。
- 失败路径: 3/3 覆盖，包含未绑定、ticket 过期、OAuth 交换失败且错误脱敏。
- 登录入口: 1/1 覆盖，确认前端不再停留在“暂未开发”占位态。

## Verification

- [x] `pnpm --filter web build`
- [ ] `pnpm --filter web test:e2e apps/web/e2e/dingtalk-login.spec.ts`
- Result: Playwright 未执行用例本身；沙箱禁止本地 dev server 监听 `::1:5173`，`config.webServer` 启动阶段即报 `listen EPERM`。

## Notes

- 本轮按 `bmad-qa-generate-e2e-tests` workflow 执行，并根据 Story 9.3 已有实现直接补齐自动化测试缺口。
- 已自动修补的测试缺口包括：
  - 登录页钉钉按钮真实跳转断言
  - 回调 exchange 失败时的原始异常脱敏断言
- 当前环境无法完成浏览器级运行验证，不是测试脚本断言失败；待允许本地端口监听后，直接执行上面的 Playwright 命令即可完成最终校验。
