---
stepsCompleted: [1]
inputDocuments:
  - /Users/chenkangping/.codex/worktrees/fe4a/infitek_erp/apps/api/src/modules/auth/auth.controller.ts
  - /Users/chenkangping/.codex/worktrees/fe4a/infitek_erp/apps/api/src/modules/auth/auth.service.ts
  - /Users/chenkangping/.codex/worktrees/fe4a/infitek_erp/apps/api/src/modules/users/entities/user.entity.ts
  - /Users/chenkangping/.codex/worktrees/fe4a/infitek_erp/apps/web/src/pages/login/index.tsx
  - /Users/chenkangping/.codex/worktrees/fe4a/infitek_erp/docs/星辰系统设计文档.md
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: '钉钉扫码登录接入方案'
research_goals: '确定钉钉应用类型、回调地址、用户匹配字段、绑定策略，并输出适用于 infitek_erp 的 1 页技术方案'
user_name: 'Friday'
date: '2026-05-29'
web_research_enabled: true
source_verification: true
---

# Research Report: technical

**Date:** 2026-05-29
**Author:** Friday
**Research Type:** technical

---

## Research Overview

本方案面向当前 `infitek_erp` 单租户 ERP 项目。现状是本地 `username + password -> JWT` 登录链路，后端入口为 `/auth/login`，前端登录页仍保留测试凭据默认值。本次目标不是替换整套认证体系，而是在保持现有 JWT、权限控制和 `@CurrentUser()` 机制不变的前提下，增加“钉钉扫码认证 -> 本系统 JWT 登录”的企业单点登录能力。

外部调研基于钉钉开放平台当前公开文档。平台文档显示网页应用属于正式支持的应用形态，开发流程包含“添加网页应用能力”“配置网页应用”“开发网页应用前后端”。钉钉能力库也明确提供“个人信息授权”能力，用于让企业系统与钉钉账号打通，实现统一账号登录。[钉钉开放平台能力中心](https://open.dingtalk.com/)、[钉钉开放能力库](https://open.dingtalk.com/list/)

## 1. 应用类型结论

**推荐选择：企业内部应用 + 网页应用能力。**

原因：
- 当前仓库是企业自用 ERP，不是面向多客户企业分发的 SaaS 应用，更符合“企业内部应用”的边界。
- 现有系统已经有自建账号、权限、审计和业务模块，钉钉更适合作为企业员工身份提供方，而不是业务主体。
- 钉钉官方当前网页应用开发指南将“配置网页应用”“开发网页应用服务端”作为标准路径，适合现有 React + NestJS 架构接入。[开发网页应用服务端](https://open.dingtalk.com/document/dingstart/develop-webapp-backend)

不建议当前阶段直接选“第三方企业应用”，除非后续明确要做多租户、多企业安装和独立授权开通。钉钉平台也区分了第三方企业应用的授权事件、suite/access_token 等专门流程，这对当前单企业 ERP 会额外增加复杂度。[第三方企业应用事件与回调流程](https://open.dingtalk.com/document/development/activate-authorized-applications)、[服务商获取第三方应用授权企业的access_token](https://open.dingtalk.com/document/development/obtain-isvapp-token)

## 2. 回调地址设计

**推荐回调落点：后端回调优先，前端只负责完成会话。**

建议地址：
- 生产钉钉 OAuth 回调地址：`https://erp.<your-domain>.com/api/auth/dingtalk/callback`
- 前端登录完成页：`https://erp.<your-domain>.com/login/dingtalk/callback`
- 开发环境回调地址：`http://localhost:<api-port>/auth/dingtalk/callback` 仅用于联调，不应写入正式开放配置

推荐时序：
1. 前端登录页点击“钉钉扫码登录”
2. 浏览器跳转钉钉授权页
3. 钉钉回调后端 `/api/auth/dingtalk/callback?code=...&state=...`
4. 后端完成 `code -> 钉钉用户身份 -> 本地用户 -> 系统 JWT`
5. 后端生成一次性 `loginTicket`，再 `302` 到前端 `/login/dingtalk/callback?ticket=...`
6. 前端用 `ticket` 调后端换正式 JWT，写入现有 `useAuthStore`

这样设计比“后端直接把 JWT 挂在 URL 上”更安全，避免系统 token 出现在浏览器历史、代理日志和 referrer 中。

## 3. 用户匹配字段结论

**运行时唯一主键：`dingtalk_union_id`。**

**辅助保留字段：`dingtalk_user_id`、`dingtalk_open_id`、`dingtalk_nick`、`dingtalk_avatar`、`dingtalk_bound_at`。**

判断依据：
- 钉钉官方存在“根据 unionid 获取用户 userid”的能力，说明 `unionid` 可作为比 `userid` 更稳定的外部身份桥接键；`userid` 更适合作为组织内/接口侧辅助字段保存。[根据unionid获取用户userid](https://open.dingtalk.com/document/development/query-a-user-by-the-union-id)
- 当前 `users` 表只有 `username/name/password/status`，没有手机号、邮箱、工号，因此现状并不适合直接做首次自动匹配。

因此推荐分两层：
- **认证主键**：`dingtalk_union_id`
- **初始化匹配字段**：优先 `mobile`，其次 `email`，最后人工绑定

落库建议：
- 在 `users` 表直接加钉钉字段即可，当前单租户阶段不必单独拆绑定表
- 若你们后续考虑多个外部 IdP，再演进为 `user_identities` 表

## 4. 绑定策略结论

**推荐策略：管理员预绑定，扫码只做认证，不自动开户。**

推荐规则：
1. 已绑定 `dingtalk_union_id` 的用户可直接扫码登录
2. 未绑定用户默认拒绝登录，提示“请联系管理员完成钉钉绑定”
3. 管理员可在用户管理页执行“绑定钉钉账号/解绑钉钉账号”
4. 首次导入时，可用手机号做一次性批量预匹配，但需要人工确认后写入绑定

不建议当前阶段启用“首次扫码自动创建 ERP 账号”，原因：
- 当前 ERP 权限模型明显是内部强权限模型，自动开户容易绕过岗位/角色分配流程
- `users` 表当前缺少能稳定承接 HR 主数据的字段，自动创建后身份质量不可控
- 审计链路目前以本地 `username` 为核心，预绑定比自动开户更易追踪

## 5. 对当前仓库的最小改造范围

后端：
- 在 `users` 表新增钉钉字段，并为 `dingtalk_union_id` 建唯一索引
- 在 `AuthController` 新增钉钉登录入口与回调接口
- 在 `AuthService` 新增 `loginByDingtalk()`，但保留原 `login(username, password)`
- 增加一次性 `loginTicket` 交换接口，避免 JWT 直接经 URL 传递

前端：
- 将登录页 SSO 占位按钮改为真实钉钉登录入口
- 新增 `/login/dingtalk/callback` 页面，完成 `ticket -> JWT` 交换
- 保留账号密码登录，作为切换期兜底

管理后台：
- 在用户管理中新增钉钉绑定状态、绑定时间、解绑操作

## Final Recommendation

面向 `infitek_erp` 的最终建议是：

**采用“企业内部应用 + 网页应用 + 后端 OAuth 回调 + 本地 JWT 签发 + 管理员预绑定”的方案。**

这是对当前代码侵入最小、上线风险最低、后续可扩展性也最好的路径。若后续业务演进为多企业 SaaS，再评估切换到“第三方企业应用”模式。

## Sources

- [钉钉开放平台能力中心](https://open.dingtalk.com/)
- [钉钉开放能力库](https://open.dingtalk.com/list/)
- [开发网页应用服务端](https://open.dingtalk.com/document/dingstart/develop-webapp-backend)
- [根据unionid获取用户userid](https://open.dingtalk.com/document/development/query-a-user-by-the-union-id)
- [第三方企业应用事件与回调流程](https://open.dingtalk.com/document/development/activate-authorized-applications)
- [服务商获取第三方应用授权企业的access_token](https://open.dingtalk.com/document/development/obtain-isvapp-token)
