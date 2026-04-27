---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# infitek_erp - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for infitek_erp, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-A01: 系统支持多用户账号管理：系统内置初始管理员账号（用户名 + 密码），管理员可在系统设置中创建其他用户账号；MVP 阶段所有账号具有相同的全系统操作权限，无角色分配、无权限差异
FR-A02: 用户账号密码以不可逆加密方式存储，不存储明文；用户可在个人设置中修改自己账号的密码；管理员可重置其他账号的密码
FR-A03: 系统管理员可在设置页面创建、查看、编辑、停用用户账号（用户名、姓名、账号状态）；停用账号立即失效，持有的 Token 在下次请求时被拒绝；所有业务操作自动记录操作账号（created_by / updated_by）
FR01: 产品专员可创建、查看列表、查看详情、编辑三级产品分类（最多三级层级）
FR02: 产品专员可在产品分类下创建、查看列表、查看详情、编辑 SPU（品名、品牌、基础描述）
FR03: 产品专员可在 SPU 下创建、查看列表、查看详情、编辑多个 SKU 变体，含规格、重量、体积、HS 码、报关品名（中英文）、申报价值参考
FR04: 产品专员可为产品创建和维护 FAQ 条目（问题 + 回答）
FR05: 产品专员可在产品证书库中创建、查看列表、查看详情、编辑证书记录，含证书类型（CE/FCC 等）、有效期、发证机构、适用 SPU 关联
FR06: 产品专员可在产品资料库中创建、查看列表、查看详情、编辑资料记录（说明书、规格书等），含文件上传和关联 SPU/SKU
FR07: 采购员可创建、查看列表、查看详情、编辑供应商档案，含公司名称、联系人、账期（天数）、付款方式、开户行信息
FR08: 采购员可为供应商关联一个或多个采购品类
FR09: 授权用户可创建、查看列表、查看详情、编辑合同条款范本（条款名称 + 内容文本），状态字段含草稿 / 已审批两个值；已审批状态的条款范本方可被采购订单引用
FR10: 授权用户可创建、查看列表、查看详情、编辑港口信息（港口名称、国家、港口代码）
FR11: 授权用户可创建、查看列表、查看详情、编辑物流供应商档案（名称、联系方式、服务类型）
FR12: 授权用户可创建、查看列表、查看详情、编辑客户主数据，含公司名称、联系信息、开票需求、客户所在国家
FR13: 授权用户可创建、查看列表、查看详情、编辑公司主体信息，含纳税人识别号、海关备案号、检疫备案号、开户行/银行账号/SWIFT CODE、默认币种、签订地点
FR14: 系统管理员可管理单位信息（新增、编辑、启用/禁用）
FR15: 系统管理员可管理仓库信息（名称、地址、启用/禁用）
FR16: 系统管理员可管理币种信息（币种代码、名称、启用/禁用）
FR17: 系统管理员可管理国家/地区参考数据（名称、代码）
FR18: 授权用户可在任意主数据模块内按关键字搜索记录（至少匹配名称字段）
FR19: 授权用户可通过多个条件组合筛选主数据列表
FR20: 所有列表页支持分页加载
FR21: 授权用户可通过表单创建销售订单（创建时状态为"待提交"），填写完整后可提交审核并审核通过；需关联客户，添加订单行（每行关联 SKU、数量和单价），选择订单币种；订单类型字段（普通/售后/样品），MVP 仅启用普通订单
FR22: 销售订单遵循"待提交→审核中→审核通过/已驳回"状态流；一经创建不支持撤销至草稿；审核通过后才能进入发货需求生成
FR23: 授权用户可查看销售订单列表（按状态、客户筛选）和订单详情
FR24: 系统在销售订单审核通过后由授权用户在详情页手动生成发货需求单，包含所有 SKU 及应发数量；发货需求唯一来源为销售订单；生成时自动查询每个 SKU 可用库存
FR25: 系统在关联发货出库单全部确认后，自动将销售订单状态更新为"已发货"
FR26: 发货需求详情展示每个 SKU 行的应发数量及可用库存；每个 SKU 行含履行类型字段（全部采购/部分采购/使用现有库存）；选择"使用现有库存"或"部分采购"时展开内联仓库分配区，按 FIFO 自动跨批次完成库存锁定
FR27: 授权用户可从发货需求单创建采购订单；仅包含"全部采购"或"部分采购"的 SKU；请购型采购订单收货后自动触发库存锁定；一个发货需求可创建多张采购订单（按供应商分组）
FR28: 授权用户可从发货需求单创建物流单
FR29: 授权用户可查看发货需求单列表（按状态、关联销售订单筛选）和详情
FR30: 发货需求单状态随关联出库确认自动更新：部分出库后状态变为"部分发货"，全部 SKU 出库完成后状态变为"已发货"
FR31: 授权用户可创建物流单，关联发货需求单；字段分组：基本信息（物流供应商/运输方式/公司主体/起运港/目的港/运抵国）、物流跟踪（ETD/ETA/订舱号/船司/船名航次/SO号/实际离港日期，确认后补填）、装箱信息子行（SKU/箱数/每箱数量/长宽高/毛重）、报关信息（选填）、备注
FR32: 物流单通过提交表单直接创建为"已确认"状态（草稿不入库）；物流跟踪字段在确认后可随时补填更新
FR33: 授权用户可从物流单创建发货出库单
FR34: 授权用户可查看物流单列表（按状态筛选）和详情
FR35: 授权用户可通过表单创建采购订单（草稿不入库），填写完整后提交直接创建为"已确认"状态；可从发货需求预填 SKU 和数量（请购型）；关联供应商补充单价；合同条款默认关联该供应商已审批的第一条范本；类型字段标注"请购型"或"备货型"
FR36: 采购订单通过表单提交直接创建为"已确认"状态；一经创建不支持撤销至草稿
FR37: 授权用户可查看采购订单列表（按状态、供应商筛选）和订单详情
FR38: 系统在关联收货入库单确认后，自动将采购订单状态更新为"已收货"
FR39: 系统以双层结构维护库存：汇总层（SKU+仓库，三字段：实际库存/锁定量/可用库存）+ 批次层（SKU+仓库+入库批次，含入库日期/来源单据/批次数量/批次锁定量）；两层数据须保持一致
FR40: 系统管理员可录入/覆盖期初库存数量，用于系统上线初始化；期初录入在批次层创建"期初录入"来源的批次记录；支持重复提交覆盖
FR41: 系统在发货出库确认后，实时扣减实际库存并释放锁定量
FR42: 系统自动记录每次库存变动流水（变动类型/SKU/仓库/数量变化/操作人/操作时间）；变动类型：期初录入/采购入库/发货出库/锁定/解锁
FR43: 授权用户可按 SKU 或仓库查询当前库存数量（实际/锁定/可用）及历史变动流水
FR44: 授权用户可创建收货入库单，关联已确认采购订单，逐行填写实际收货数量和目标仓库；收货确认后创建批次记录
FR45: 收货确认后系统自动触发：① 创建批次记录并更新汇总层；② 请购型按 FIFO 自动锁定至对应发货需求，备货型仅增加实际库存不锁定；③ 采购订单状态更新为"已收货"
FR46: 授权用户可从物流单创建发货出库单，逐行填写实际发货数量（允许部分发货）和来源仓库
FR47: 系统校验出库数量不超过该仓库中该 SKU 被本发货需求锁定的数量；超出时阻止提交并提示
FR48: 发货确认后系统自动扣减实际库存并释放锁定量
FR49: 授权用户可对"待分配库存"状态的发货需求执行作废操作；处于"采购中"及之后状态不允许作废；作废需二次确认；作废后自动释放锁定库存、销售订单状态回退为"审核通过"、展示"重新生成发货需求"按钮

### NonFunctional Requirements

NFR-P1: 主数据列表页首屏加载时间 < 2 秒（标准网络，100 条以内数据）
NFR-P2: 主数据详情页加载时间 < 1.5 秒
NFR-P3: 搜索和筛选操作响应时间 < 1 秒
NFR-P4: 销售订单、采购订单提交（状态变更）响应时间 < 2 秒
NFR-P5: 收货入库、发货出库确认操作（含库存更新）响应时间 < 3 秒
NFR-P6: 库存查询（当前库存数量）响应时间 < 1 秒
NFR-S1: 所有数据传输使用 HTTPS 加密
NFR-S2: 用户密码以不可逆加密方式存储，不存储明文
NFR-S3: 用户连续无操作超过 8 小时后自动登出（时长可配置）
NFR-S4: 所有接口须通过身份验证，系统拒绝未授权请求
NFR-R1: 系统目标可用性 99%（允许计划内维护窗口）
NFR-R2: 数据每日自动备份，支持按需恢复
NFR-U1: 系统面向桌面浏览器优先，支持 Chrome / Edge 最新两个主版本
NFR-U2: 所有用户操作的错误提示须清晰说明出错原因，不暴露技术错误码或堆栈信息
NFR-U3: 发货出库库存不足的校验提示须明确显示当前可用库存数量
NFR-F1: 产品资料库和产品证书库的文件上传及读取使用阿里云 OSS
NFR-F2: 文件删除执行物理删除（从 OSS 永久删除），需二次确认

### Additional Requirements

- 项目使用 pnpm Monorepo 结构初始化（apps/api + apps/web + packages/shared）
- 后端技术栈：NestJS 11 + TypeORM 0.3.x + MySQL 8.x
- 前端技术栈：React 19 + Vite 6 + Ant Design 5.x + TanStack Query 5 + Zustand 4 + React Router 7
- 共享类型包 packages/shared 定义所有枚举/DTO/状态机常量，前后端同时引用
- 全局 BaseEntity 含 created_at / updated_at / created_by / updated_by 审计字段，所有实体继承
- JWT 认证：Access Token 8h，NestJS JwtAuthGuard 全局注册，白名单豁免 /auth/login
- 密码加密：bcrypt rounds=12
- 统一 API 响应格式：{ success, data, message, code }
- 分页方式：Offset 分页（page + pageSize，默认 pageSize=20）
- API 版本化前缀：/api/v1/
- NestJS Swagger 自动生成 OpenAPI 文档，路径 /api/docs
- 库存并发控制：TypeORM QueryRunner 事务 + SELECT ... FOR UPDATE 行锁
- 库存死锁重试：指数退避最多 3 次，超限抛 ConflictException({ code: 'CONCURRENT_UPDATE' })
- 数据库迁移：TypeORM Migrations 显式迁移文件，生产环境禁止 synchronize: true
- 软删除：@DeleteDateColumn（TypeORM 内置）
- ClassSerializer 三件套：main.ts 全局注册 ClassSerializerInterceptor + Entity @Expose() + @Column({ name }) 显式指定列名
- 后端模块结构标准：module / controller / service / repository / entity / dto / tests 7 文件
- 前端页面结构标准：index（列表）/ detail（详情）/ form（表单）3 文件
- 状态机变更必须通过专用动作端点（如 POST /:id/confirm），不通过通用 PATCH
- 前端禁止在组件内直接调用 axios，必须通过 api/ 层函数
- 所有枚举值必须定义在 packages/shared，禁止前后端独立定义
- 部署方式：Docker + Docker Compose（api + web + mysql 三容器）
- Nginx 反向代理终止 TLS（满足 NFR-S1）
- 健康检查端点：GET /api/health（返回 DB 连接状态）
- 数据备份：MySQL 容器 cron 每日 mysqldump
- 数据库连接池：connectionLimit: 20
- 测试分层：单元测试（Service）+ 集成测试（Controller）+ 并发测试（仅库存模块）
- 前端测试：MVP 阶段关键表单组件渲染快照测试（Vitest + Testing Library）

### UX Design Requirements

UX-DR01: 全局布局框架 -- ProLayout 左侧白色侧边栏（展开 220px / 折叠 64px）+ 顶栏（56px）+ 内容区；7 大一级模块导航（销售/商务/采购/产品/库存/财务/基础数据）+ 二级子功能；底部用户信息区（头像+姓名+角色+设置/退出）
UX-DR02: 侧边栏响应行为 -- >= 1440px 默认展开，1280-1439px 默认折叠（64px 图标模式），折叠态 hover 展示 Tooltip，点击展开子菜单浮层；< 1280px 显示提示"请使用 1280px 以上分辨率"
UX-DR03: 面包屑导航 -- 内容区顶部完整路径（如 产品管理 > SKU 列表 > SKU-00123），每层可点击返回，末级灰色不可点
UX-DR04: 列表页标准模式（适用 15 类主数据 + 6 类交易单据）-- ① 页面标题 + 操作按钮；② 快捷搜索栏（debounce 300ms）+ 可折叠高级筛选区 + 已选筛选条件 Tag 化展示（可单独删除 + "清除全部"）；③ 固定表头数据表格（行高 48px，首列单据编号蓝色链接，状态列彩色 Tag，操作列固定右侧）；④ 底部分页器（10/20/50 可切换）+ "共 N 条记录"
UX-DR05: 详情页标准模式 -- ① 顶部操作区（面包屑 + 按钮组）；② 状态信息栏（编号 + 状态 Tag + FlowProgress 进度条 + SmartButton 计数器）；③ KPI 摘要行（StatCard 3-5 个核心指标）；④ 信息分组卡片（ProDescriptions 两列布局，核心卡片默认展开）；⑤ 操作记录（ActivityTimeline 时间线）
UX-DR06: 表单页标准模式 -- 简单表单（<10 字段）单卡片 2 列；中等表单（10-30 字段）分组卡片 2 列；复杂表单（>30 字段）分组卡片 + 可折叠；必填字段红色星号；关联实体使用 EntitySearchSelect 组件；子表格可编辑（添加行/删除行）；金额自动计算
UX-DR07: 状态色彩映射（全系统统一）-- 草稿=灰色 default、已确认/进行中=蓝色 processing、警告/待处理=橙色 warning、已完成=绿色 success、已作废/异常=红色 error；所有状态同时以色彩 + 文字双重编码
UX-DR08: FlowProgress 流程进度条组件 -- 白色圆角卡片，步骤圆形 dot（36px，done=绿色+勾号/active=蓝色+数字+光环/pending=灰色+数字），连接线（done=绿色/其他=灰色），步骤名称标签；适用发货需求 7 步流程（需求创建→库存检查→采购备货→库存锁定→创建物流→出库发货→完成）
UX-DR09: SmartButton 关联单据计数器组件 -- 圆角按钮（图标+标签+计数 badge），default 白底灰框/hover 蓝框蓝字/zero 灰色 badge；适用发货需求详情页（采购订单 N | 物流单 N | 出库单 N），点击跳转关联列表页（预设筛选）
UX-DR10: InventoryIndicator SKU 库存状态指示器组件 -- Pill 形状标签显示库存数字；available >= required 绿色/0 < available < required 橙色/available === 0 红色；适用发货需求产品明细表
UX-DR11: PurchaseGroupPreview 采购分组预览面板组件 -- Drawer 侧面板（520px），按供应商+跟单人分组展示卡片（SKU 列表+可编辑数量），底部操作栏（取消 + 确认创建 N 个采购订单）
UX-DR12: StatCard KPI 统计卡片组件 -- 白色圆角卡片（标签 12px 灰色 + 数值 22px 粗体语义色 + 副标题 11px），颜色支持 blue/green/orange/red/default
UX-DR13: ActivityTimeline 操作记录时间线组件 -- 基于 Antd Timeline 扩展，色彩圆点（10px）+ 操作描述（含可点击链接）+ 时间戳；最新操作蓝色圆点在顶部，历史灰色
UX-DR14: EntitySearchSelect 关联实体搜索选择器组件 -- 输入框触发搜索面板（Modal/Popover），搜索框+结果表格（编码/名称/关键属性），选中后回调返回完整实体对象供自动填充
UX-DR15: 按钮层级体系 -- Primary 蓝色实心（每页最多 1 个）、Secondary 白底灰框、Text 蓝色无框（表格行操作）、Danger 红色（不可逆操作）、Dashed 虚线（添加类）；操作区排列：Danger 最左 / Primary 最右
UX-DR16: 二次确认规则 -- 创建/保存无需确认；状态推进用 Popconfirm 气泡；不可逆操作用 Modal+输入确认；批量操作用 Modal+数量提示
UX-DR17: 反馈机制分级 -- 轻量成功 Message.success 3秒、重要成功 Notification.success 5秒（含关联单据链接）、轻量失败 Message.error 5秒、重要失败 Notification.error 手动关闭（含具体业务数据）、警告 Message.warning 5秒、表单校验内联红色提示
UX-DR18: 跨单据导航 -- 单据编号蓝色链接点击跳转详情（支持浏览器后退）；Smart Button 跳转关联列表页（预设筛选）；列表页筛选条件存入 URL query 参数
UX-DR19: 视觉设计基础 -- 主色 #4C6FFF、卡片圆角 10px + 阴影 0 2px 8px rgba(0,0,0,.06) + 1px #f0f2f5 边框、页面背景 #F5F7FA、间距体系 8px 基础单位、字体 Ant Design 默认栈、数字等宽 tabular-nums
UX-DR20: 无障碍设计 -- WCAG 2.1 AA 合规；文字对比度 >= 4.5:1；键盘导航（Ctrl+K 全局搜索 / Ctrl+S 保存 / Tab 跳转 / ESC 关闭）；焦点管理（2px #4C6FFF outline + 弹窗焦点陷阱）；语义化 HTML（nav/main/header/table/label + aria 标注）
UX-DR21: 加载状态 -- 首次加载 Skeleton 骨架屏、表格加载 Spin 遮罩、按钮操作中 loading 旋转+禁用、搜索加载右侧 Spin
UX-DR22: 空状态 -- 列表无数据（无筛选）空插图+"新建"按钮、列表无数据（有筛选）空插图+"清除筛选"链接、子表为空灰色文字+"添加"虚线按钮
UX-DR23: 错误状态 -- 页面加载失败错误插图+"重新加载"、接口超时 Message.error、权限不足 403 页面
UX-DR24: 弹窗层级规则 -- 严禁弹窗嵌套；Modal 最大 720px / Drawer 最大 520px；遮罩 rgba(0,0,0,0.45) 可点击关闭（危险操作除外）；ESC 可关闭
UX-DR25: 表格列规范 -- 默认不超过 8 列；数字列右对齐 tabular-nums；金额显示千分位+币种符号；日期格式 YYYY-MM-DD；超长文本截断+Tooltip；首列和操作列固定；水平滚动支持
UX-DR26: 发货需求枢纽页核心体验 -- 一屏展示所有决策信息：顶部流程进度条 + Smart Button + KPI 行，中部产品明细表（每行 SKU 含库存色彩指示 + 履行类型选择），操作按钮直达（锁定库存/创建采购订单/创建物流单）
UX-DR27: 单据间智能创建交互 -- 从发货需求创建采购订单时自动按供应商分组预览 → 确认后批量生成 → SKU/数量自动预填；从发货需求创建物流单/从物流单创建出库单同样一键直达数据自动预填
UX-DR28: SKU 信息即查即用 -- 搜索 SKU 后 HS 码、报关品名、重量体积、产品证书等全部信息在详情页一屏可见
UX-DR29: 表单自动填充 -- 选择 SKU 后自动带入产品名称/规格/单位/重量体积；选择供应商后自动带入联系方式/账期；自动填充字段灰色底不可编辑 + Tooltip 说明来源
UX-DR30: Design Token 主题定制 -- 基于 Ant Design 5 Design Token：主色 #4C6FFF / Hover #3D5CE0 / Light #EEF2FF；语义色 Success #52C41A / Processing #1890FF / Warning #FAAD14 / Error #FF4D4F / Default #D9D9D9；中性色 Text Primary #1F1F1F / Secondary #666666 / Background #F5F7FA

### FR Coverage Map

FR-A01: Epic 1 - 多用户账号管理，内置初始管理员
FR-A02: Epic 1 - 密码不可逆加密存储，用户改密，管理员重置
FR-A03: Epic 1 - 管理员创建/查看/编辑/停用用户账号，审计字段记录操作人
NFR-F1: Epic 1 Story 1.6 - 阿里云 OSS 文件上传/下载服务（FilesModule 全局注册，Epic 3 的证书库和资料库直接调用）
NFR-F2: Epic 1 Story 1.6 + Epic 3 - OSS 物理删除在 Story 1.6 服务层实现；业务层二次确认 Modal 在 Story 3.5/3.6 落地
FR01: Epic 3 - 三级产品分类 CRUD
FR02: Epic 3 - SPU CRUD（品名、品牌、基础描述）
FR03: Epic 3 - SKU 变体 CRUD（规格、重量、体积、HS 码、报关品名）
FR04: Epic 3 - 产品 FAQ 条目维护
FR05: Epic 3 - 产品证书库 CRUD（证书类型、有效期、发证机构、SPU 关联）
FR06: Epic 3 - 产品资料库 CRUD（文件上传、SPU/SKU 关联）
FR07: Epic 4 - 供应商档案 CRUD（联系人、账期、付款方式、开户行）
FR08: Epic 4 - 供应商采购品类关联
FR09: Epic 4 - 合同条款范本 CRUD（草稿/已审批状态）
FR10: Epic 4 - 港口信息 CRUD
FR11: Epic 4 - 物流供应商档案 CRUD
FR12: Epic 4 - 客户主数据 CRUD
FR13: Epic 2 - 公司主体信息 CRUD（纳税人识别号、海关备案号等合规字段）
FR14: Epic 2 - 单位信息管理（新增、编辑、启用/禁用）
FR15: Epic 2 - 仓库信息管理（名称、地址、启用/禁用）
FR16: Epic 2 - 币种信息管理（币种代码、名称、启用/禁用）
FR17: Epic 2 - 国家/地区参考数据管理
FR18: Epic 2 - 模块内关键字搜索（横切能力，首次在 Epic 2 落地，后续复用）
FR19: Epic 2 - 多条件组合筛选（横切能力，首次在 Epic 2 落地，后续复用）
FR20: Epic 2 - 列表页分页加载（横切能力，首次在 Epic 2 落地，后续复用）
FR21: Epic 5 - 创建销售订单（待提交/审核中/审核通过状态流，关联客户+SKU 行项+币种+订单类型）
FR22: Epic 5 - 销售订单创建后进入审核流，无草稿持久化；审核通过后可生成发货需求
FR23: Epic 5 - 销售订单列表（按状态/客户筛选）和详情查看
FR24: Epic 5 - 销售订单审核通过后在详情页手动生成发货需求单（含 SKU 应发量+库存查询）
FR25: Epic 7 - 关联出库全部确认后销售订单状态自动更新为"已发货"
FR26: Epic 5 - 发货需求详情 SKU 行展示+库存状态+履行类型 UI；FIFO 跨批次库存锁定（含集中确认分配按钮）完整实现于 Story 5.4
FR27: Epic 6 - 从发货需求创建采购订单（请购型，按供应商分组，多张 PO）
FR28: Epic 5 - 从发货需求创建物流单入口
FR29: Epic 5 - 发货需求列表（按状态/销售订单筛选）和详情查看
FR30: Epic 7 - 发货需求状态随出库确认自动更新为"部分发货/已发货"
FR31: Epic 7 - 物流单创建（基本信息/物流跟踪/装箱信息子行/报关信息/备注）
FR32: Epic 7 - 物流单提交即确认，物流跟踪字段确认后补填
FR33: Epic 7 - 从物流单创建发货出库单
FR34: Epic 7 - 物流单列表和详情查看
FR35: Epic 6 - 采购订单创建（草稿不入库，发货需求预填，供应商关联，合同条款默认，请购型/备货型）
FR36: Epic 6 - 采购订单创建即确认
FR37: Epic 6 - 采购订单列表（按状态/供应商筛选）和详情查看
FR38: Epic 6 - 收货确认后采购订单状态自动更新为"已收货"
FR39: Epic 5 Story 5.0 - 库存双层结构数据模型建立（汇总层 inventory_summary + 批次层 inventory_batch）；数据库迁移在 Story 5.0 中随期初录入功能一并落地，作为 Story 5.2 生成发货需求前置能力
FR40: Epic 5 Story 5.0 - 期初库存录入/覆盖（批次层创建"期初录入"记录），用于 Story 5.2 及后续发货需求库存展示的真实数据来源
FR41: Epic 7 - 发货出库确认后扣减实际库存并释放锁定量
FR42: Epic 6 - 库存变动流水自动记录（期初/采购入库/发货出库/锁定/解锁）
FR43: Epic 5 Story 5.0 + Epic 6 Story 6.2 - 可用库存查询接口在 Story 5.0 随数据模型一并建立；历史变动流水查询在 Story 6.2 落地
FR44: Epic 6 - 收货入库单创建（关联采购订单，逐行填写收货数量和目标仓库）
FR45: Epic 6 - 收货确认自动触发：创建批次+更新汇总层+请购型 FIFO 锁定+采购订单状态更新
FR46: Epic 7 - 发货出库单创建（从物流单，逐行填写实际发货数量+来源仓库，允许部分发货）
FR47: Epic 7 - 出库数量校验（不超过本发货需求锁定量，超出阻止并提示）
FR48: Epic 7 - 发货确认后自动扣减实际库存并释放锁定量
FR49: Epic 5 - 发货需求作废完整实现于 Story 5.5（UI 入口+释放锁定库存+销售订单回退+重新生成按钮）

## Epic List

### Epic 1: 项目基础设施与用户认证
用户可以登录系统、管理账号密码，系统具备完整的技术基础设施（Monorepo、数据库连接、JWT 认证、全局守卫、统一响应格式、错误处理、Docker 部署、阿里云 OSS 文件服务）和全局 UI 框架（侧边栏导航、面包屑、Design Token 主题），为所有后续模块提供开发基础。
**FRs covered:** FR-A01, FR-A02, FR-A03
**NFRs addressed:** NFR-S1, NFR-S2, NFR-S3, NFR-S4, NFR-R1, NFR-R2, NFR-U1, NFR-U2, NFR-F1, NFR-F2
**UX-DRs addressed:** UX-DR01, UX-DR02, UX-DR03, UX-DR07, UX-DR15, UX-DR16, UX-DR17, UX-DR19, UX-DR20, UX-DR21, UX-DR22, UX-DR23, UX-DR24, UX-DR30

### Epic 2: 基础参考数据与公司主体管理
系统管理员可以初始化系统运行所需的基础参考数据（单位、仓库、币种、国家/地区）和公司主体信息（纳税人识别号、海关备案号等合规字段），为后续主数据和交易模块提供数据基础。同时落地标准 CRUD 组件模板（列表页/详情页/表单页三态），全系统复用。
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20
**NFRs addressed:** NFR-P1, NFR-P2, NFR-P3
**UX-DRs addressed:** UX-DR04, UX-DR05, UX-DR06, UX-DR25

### Epic 3: 产品体系管理
产品专员可以建立完整的产品档案体系 -- 三级产品分类树、SPU 基础信息、SKU 变体（含 HS 码和报关信息）、产品 FAQ、产品证书库（含有效期和 SPU 关联）、产品资料库（含文件上传和 SPU/SKU 关联），实现"HS 码终于有统一来源了"的产品数据单一来源。
**FRs covered:** FR01, FR02, FR03, FR04, FR05, FR06
**NFRs addressed:** NFR-F1, NFR-F2
**UX-DRs addressed:** UX-DR14, UX-DR28, UX-DR29

### Epic 4: 供应链参考数据管理
采购员可以维护完整的供应商档案（含账期、品类关联），授权用户可管理合同条款范本（草稿/已审批状态）、港口信息、物流供应商和客户主数据，实现"供应商信息不用再问人了"的供应链数据单一来源。
**FRs covered:** FR07, FR08, FR09, FR10, FR11, FR12
**UX-DRs addressed:** UX-DR14, UX-DR29

### Epic 5: 销售订单与发货需求管理
销售员可以按已落地状态机创建销售订单并完成提交审核/审核通过流转。系统先在 Story 5.0 前置建立 shared 交易状态枚举、库存双层结构、可用库存查询接口与期初库存录入；随后销售员可在审核通过的销售订单详情页手动触发生成发货需求单（含 SKU 应发量和真实库存查询）。商务跟单可以在发货需求枢纽详情页完成完整的库存决策——设置履行类型（全部采购/部分采购/使用现有库存），集中确认后系统按 FIFO 自动跨批次完成库存锁定，以及执行发货需求作废操作（释放锁定库存、销售订单回退、支持重新生成）。
**FRs covered:** FR21, FR22, FR23, FR24, FR26（完整实现）, FR28, FR29, FR30, FR39（基础模型）, FR40（期初录入）, FR43（可用库存查询）, FR49（完整实现）
**NFRs addressed:** NFR-P4, NFR-P6
**UX-DRs addressed:** UX-DR08, UX-DR09, UX-DR10, UX-DR12, UX-DR13, UX-DR15, UX-DR16, UX-DR18, UX-DR26, UX-DR27

### Epic 6: 采购订单与收货入库
库存双层数据模型、期初录入和可用库存查询接口已在 Epic 5 Story 5.0 前置落地。Epic 6 不再重复创建库存基础表和查询接口，而是在采购订单、收货入库、请购型收货自动锁定、库存变动流水中消费同一 InventoryModule。采购分组预览面板（按供应商分组确认）同时落地。
**FRs covered:** FR27, FR35, FR36, FR37, FR38, FR42, FR43（历史变动流水查询）, FR44, FR45
**NFRs addressed:** NFR-P5, NFR-P6, NFR-U3
**UX-DRs addressed:** UX-DR11, UX-DR27, UX-DR29

### Epic 7: 物流单与发货出库
商务跟单可以创建物流单（基本信息+物流跟踪+装箱信息+报关信息），仓管可以从物流单创建发货出库单确认发货（含库存锁定量校验）。发货确认后库存自动扣减并释放锁定量，发货需求状态自动更新为"部分发货/已发货"，销售订单状态自动更新为"部分发货/已发货" -- 完成端到端业务闭环。
**FRs covered:** FR25, FR30, FR31, FR32, FR33, FR34, FR41, FR46, FR47, FR48
**NFRs addressed:** NFR-P5, NFR-U3
**UX-DRs addressed:** UX-DR27

### Epic 8: 发货需求状态自动流转
发货需求状态根据库存分配进展（履行类型集中确认保存、所有 SKU 锁定完成、物流单出库确认）自动推进，FlowProgress 进度条实时反映当前阶段，商务跟单无需手动更新状态。
**FRs covered:** （状态机自动流转，依赖 FR26/FR49 在 Epic 5 完整实现后触发）
**UX-DRs addressed:** UX-DR08

## Epic 1: 项目基础设施与用户认证

用户可以登录系统、管理账号密码，系统具备完整的技术基础设施（Monorepo、数据库连接、JWT 认证、全局守卫、统一响应格式、错误处理、Docker 部署）和全局 UI 框架（侧边栏导航、面包屑、Design Token 主题），为所有后续模块提供开发基础。

### Story 1.1: Monorepo 项目初始化与开发环境搭建

As a 开发者,
I want 完整的 pnpm Monorepo 项目脚手架（apps/api + apps/web + packages/shared）已就绪，含数据库连接、Docker 编排和基础开发命令,
So that 我可以在统一的项目结构中开发前后端代码，一条命令启动开发环境。

**Acceptance Criteria:**

**Given** 开发者克隆代码仓库
**When** 执行 `pnpm install && pnpm dev`
**Then** 前端 Vite 开发服务器和后端 NestJS 服务同时启动
**And** 后端成功连接 MySQL 数据库

**Given** 项目结构已初始化
**When** 查看目录结构
**Then** 存在 `apps/api`（NestJS 11）、`apps/web`（React 19 + Vite 6）、`packages/shared` 三个工作区
**And** `packages/shared` 包含 `src/enums/` 和 `src/types/` 目录及 `index.ts` 导出入口
**And** `pnpm-workspace.yaml` 正确配置 `apps/*` 和 `packages/*`

**Given** Docker Compose 配置已就绪
**When** 执行 `docker-compose up`
**Then** api、web、mysql 三个容器正常启动并互联
**And** mysql 容器挂载了数据卷用于持久化

**Given** 后端项目已配置
**When** 查看后端代码
**Then** `BaseEntity` 已定义（含 `id`, `created_at`, `updated_at`, `created_by`, `updated_by`）
**And** TypeORM 数据源配置使用 `.env` 文件，`synchronize: false`，`connectionLimit: 20`
**And** 第一个空的 TypeORM Migration 文件存在
**And** `tsconfig.base.json` 在 workspace 根目录配置共享的 TypeScript 基础选项

### Story 1.2: 后端 API 基础设施（统一响应、错误处理、Swagger 文档）

As a 开发者,
I want 后端 API 具备统一的响应格式、全局错误处理和自动生成的 API 文档,
So that 所有 API 接口遵循一致的通信模式，前端可以统一处理响应和错误。

**Acceptance Criteria:**

**Given** 后端服务已启动
**When** 调用任意成功接口
**Then** 响应体格式为 `{ success: true, data: T, message: "操作成功", code: "OK" }`

**Given** 后端服务已启动
**When** 调用接口触发业务异常（如 BadRequestException）
**Then** 响应体格式为 `{ success: false, data: null, message: "具体错误原因", code: "BUSINESS_ERROR_CODE" }`
**And** 不暴露技术堆栈信息（满足 NFR-U2）

**Given** 后端服务已启动
**When** 调用分页列表接口
**Then** 响应体为 `{ success: true, data: { list: [], total: N, page: N, pageSize: N }, message: "OK", code: "OK" }`
**And** 默认 pageSize=20

**Given** 后端服务已启动
**When** 访问 `/api/docs`
**Then** 显示 Swagger UI 界面，展示所有已注册的 API 端点

**Given** 后端服务已启动
**When** 访问 `GET /api/health`
**Then** 返回 `{ success: true, data: { db: "connected" }, ... }`（满足 NFR-R1）

**Given** `main.ts` 已配置
**When** 查看全局注册项
**Then** `ClassSerializerInterceptor` 已全局注册
**And** `ResponseInterceptor` 已全局注册
**And** `HttpExceptionFilter` 已全局注册
**And** API 前缀为 `/api/v1`
**And** CORS 已配置前端域名白名单

### Story 1.3: 用户认证（登录、JWT 守卫、Token 过期）

As a 系统用户,
I want 通过用户名和密码登录系统，获取 JWT Token 访问受保护的接口,
So that 我的操作有身份标识，系统拒绝未授权访问。

**Acceptance Criteria:**

**Given** 系统已初始化内置管理员账号（用户名 admin）
**When** 用正确的用户名和密码调用 `POST /api/v1/auth/login`
**Then** 返回 JWT Access Token（有效期 8 小时）
**And** Token payload 包含用户 ID 和用户名

**Given** 用户持有有效 JWT Token
**When** 调用任意受保护接口并在 Authorization Header 携带 Token
**Then** 请求正常通过，接口返回预期数据

**Given** 用户未携带 Token 或 Token 无效/过期
**When** 调用任意受保护接口（非 `/auth/login`）
**Then** 返回 401 Unauthorized 错误
**And** 响应格式遵循统一错误格式

**Given** 用户 Token 已超过 8 小时
**When** 使用过期 Token 调用接口
**Then** 返回 401 错误，提示 Token 已过期（满足 NFR-S3）

**Given** 数据库中 users 表已创建
**When** 查看 admin 用户记录
**Then** 密码字段为 bcrypt 哈希值（rounds=12），不存储明文（满足 NFR-S2）

### Story 1.4: 用户账号管理（创建、查看、编辑、停用、改密）

As a 系统管理员,
I want 在系统设置中创建、查看、编辑和停用用户账号,
So that 我可以为团队成员分配系统访问权限，并在人员变动时及时停用账号。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** 调用 `POST /api/v1/users` 提供用户名、姓名、初始密码
**Then** 系统创建新用户账号，密码以 bcrypt 加密存储
**And** 新用户可使用该账号登录系统

**Given** 管理员已登录
**When** 调用 `GET /api/v1/users` 查看用户列表
**Then** 返回所有用户账号（用户名、姓名、账号状态），支持分页
**And** 密码字段不在响应中返回

**Given** 管理员已登录
**When** 调用 `PATCH /api/v1/users/:id` 修改用户姓名
**Then** 用户信息更新成功

**Given** 管理员已登录
**When** 调用 `POST /api/v1/users/:id/disable` 停用某用户账号
**Then** 该用户账号状态变为"已停用"
**And** 该用户下次使用任何现有 Token 请求接口时被拒绝（返回 401）

**Given** 管理员已登录
**When** 调用 `POST /api/v1/users/:id/reset-password` 重置某用户密码
**Then** 该用户密码被重置为管理员指定的新密码（bcrypt 加密）

**Given** 用户已登录
**When** 调用 `POST /api/v1/auth/change-password` 提供旧密码和新密码
**Then** 旧密码验证通过后，密码更新为新密码
**And** 旧密码错误时返回业务错误提示

### Story 1.5: 前端全局框架（布局、导航、登录页、主题）

As a 系统用户,
I want 打开系统看到专业的登录界面，登录后进入带侧边栏导航和面包屑的主界面,
So that 我可以通过清晰的导航结构访问系统各模块。

**Acceptance Criteria:**

**Given** 用户未登录
**When** 访问系统任意页面
**Then** 自动跳转到登录页
**And** 登录页包含用户名和密码输入框及登录按钮

**Given** 用户在登录页
**When** 输入正确的用户名和密码点击登录
**Then** 调用登录 API 获取 Token，存储到本地，跳转到系统主页
**And** axios 实例自动在后续请求中携带 Authorization Header

**Given** 用户已登录
**When** 进入系统主界面
**Then** 左侧显示白色侧边栏（展开 220px），包含 7 大一级模块导航（销售管理/商务管理/采购管理/产品管理/库存管理/财务管理/基础数据）
**And** 每个一级模块可展开显示二级子功能列表
**And** 侧边栏底部显示当前用户头像、姓名、角色及设置/退出操作
**And** 内容区顶部显示面包屑导航，每层可点击返回（满足 UX-DR01, UX-DR03）

**Given** 浏览器宽度 >= 1440px
**When** 查看侧边栏
**Then** 侧边栏默认展开（220px）

**Given** 浏览器宽度在 1280-1439px 之间
**When** 查看侧边栏
**Then** 侧边栏默认折叠（64px 图标模式），hover 展示 Tooltip（满足 UX-DR02）

**Given** 用户已登录
**When** 查看系统整体视觉
**Then** 主色为 #4C6FFF，页面背景 #F5F7FA，卡片圆角 10px + 阴影
**And** Ant Design Design Token 已按 UX-DR30 配置（主色/语义色/中性色）

**Given** 用户已登录
**When** 点击侧边栏底部"退出登录"
**Then** 清除本地 Token，跳转回登录页

**Given** 前端 API 层已配置
**When** 调用接口返回错误
**Then** axios 拦截器统一弹出 antd Message 错误提示（满足 UX-DR17）
**And** 401 错误自动跳转登录页

### Story 1.6: 阿里云 OSS 文件上传服务集成

As a 开发者,
I want 后端具备统一的 OSS 文件上传/下载/删除服务模块,
So that 后续 Story 3.5（产品证书库）和 Story 3.6（产品资料库）可以直接调用，无需重复集成 OSS SDK。

**Acceptance Criteria:**

**Given** 开发者安装后端依赖
**When** 执行 `pnpm add ali-oss @types/ali-oss @nestjs/platform-express multer @types/multer`
**Then** 依赖正确写入 `apps/api/package.json`

**Given** 环境变量已配置（OSS_REGION、OSS_ACCESS_KEY_ID、OSS_ACCESS_KEY_SECRET、OSS_BUCKET）
**When** 应用启动
**Then** OssService 成功初始化 OSS 客户端，无启动报错

**Given** 授权用户携带有效 JWT Token
**When** POST `/api/files/upload`，请求体为 `multipart/form-data`，字段名 `file`，查询参数 `folder=certificates`
**Then** 返回 `{ success: true, data: { key: "prod/certificates/2026-04/uuid.pdf", filename: "cert.pdf", size: 12345 } }`
**And** 文件已物理写入阿里云 OSS Bucket

**Given** 文件类型不在白名单（jpg / png / webp / pdf）
**When** 上传任意其他 MIME 类型文件
**Then** 返回 400 错误，提示"不支持的文件类型"

**Given** 文件大小超过 50MB
**When** 尝试上传超大文件
**Then** 返回 400 错误，提示"文件大小不能超过 50MB"

**Given** 数据库中存储了某文件的 OSS key
**When** GET `/api/files/signed-url?key=prod/certificates/2026-04/uuid.pdf`
**Then** 返回有效的签名 URL（有效期 1 小时），浏览器可通过该 URL 直接访问文件

**Given** 授权用户确认删除某文件
**When** DELETE `/api/files`，请求体 `{ "key": "prod/certificates/2026-04/uuid.pdf" }`
**Then** OSS 对应对象被物理删除
**And** 再次访问该 key 的签名 URL 返回 404

**Given** 后端模块结构
**When** 查看 `apps/api/src/files/`
**Then** 包含 `files.module.ts`（全局注册）、`files.service.ts`（upload/getSignedUrl/delete 方法）、`files.controller.ts`（upload/signed-url/delete 三个端点）

---

## Epic 2: 基础参考数据与公司主体管理

系统管理员可以初始化系统运行所需的基础参考数据（单位、仓库、币种、国家/地区）和公司主体信息（纳税人识别号、海关备案号等合规字段），为后续主数据和交易模块提供数据基础。同时落地标准 CRUD 组件模板（列表页/详情页/表单页三态），全系统复用。

### Story 2.1: 标准 CRUD 组件模板（前后端）

As a 开发者,
I want 一套可复用的标准 CRUD 组件模板（后端模块脚手架 + 前端列表/详情/表单三态页面模板）,
So that 后续 15 类主数据和交易单据模块可以快速复用，保证全系统交互一致性。

**Acceptance Criteria:**

**Given** 后端需要新建一个主数据模块
**When** 以"单位管理"为载体创建模块
**Then** 模块包含完整的 7 文件结构：module / controller / service / repository / entity / dto / tests
**And** Entity 继承 BaseEntity，字段使用 `@Expose()` 和 `@Column({ name })` 显式指定列名
**And** Controller 暴露标准 CRUD 端点：`GET /`（列表）、`GET /:id`（详情）、`POST /`（创建）、`PATCH /:id`（编辑）
**And** QueryDto 支持 `keyword`、`page`、`pageSize` 参数
**And** TypeORM Migration 创建对应数据库表

**Given** 前端需要新建一个主数据页面
**When** 以"单位管理"为载体创建页面
**Then** 列表页（index.tsx）使用 ProTable，包含：快捷搜索框（debounce 300ms）+ 可折叠高级筛选区 + 已选筛选条件 Tag 化展示（可单独删除 + "清除全部"）+ 固定表头数据表格（行高 48px，首列蓝色链接，操作列固定右侧）+ 底部分页器（10/20/50 可切换 + "共 N 条记录"）
**And** 详情页（detail.tsx）使用 ProDescriptions 分组卡片展示
**And** 表单页（form.tsx）使用 ProForm 分组布局，必填字段红色星号

**Given** 列表页无数据
**When** 未设置任何筛选条件
**Then** 显示空状态插图 + "暂无数据" + "新建单位"按钮（满足 UX-DR22）

**Given** 列表页无数据
**When** 已设置筛选条件
**Then** 显示空状态插图 + "未找到匹配记录" + "清除筛选条件"链接（满足 UX-DR22）

**Given** 页面正在加载数据
**When** 首次进入页面
**Then** 显示 Skeleton 骨架屏；表格区域显示 Spin 遮罩（满足 UX-DR21）

**Given** 表格展示数据
**When** 查看列内容
**Then** 数字列右对齐使用 tabular-nums，日期格式 YYYY-MM-DD，超长文本截断 + Tooltip 展示全文（满足 UX-DR25）

### Story 2.2: 基础参考数据管理（单位、仓库、币种、国家/地区）

As a 系统管理员,
I want 管理系统基础参考数据（单位、仓库、币种、国家/地区）,
So that 后续业务模块可以引用这些标准化的基础数据。

**Acceptance Criteria:**

**Given** 管理员已登录
**When** 进入单位管理页面，点击"新建"
**Then** 可填写单位名称、单位代码，提交后创建成功
**And** 列表页显示新创建的单位记录，状态为"启用"

**Given** 管理员已登录
**When** 在单位列表对某条记录点击"禁用"
**Then** 该单位状态变为"已禁用"（使用 @DeleteDateColumn 软删除）
**And** 列表中该记录状态标签变为灰色"已禁用"

**Given** 管理员已登录
**When** 进入仓库管理页面创建仓库
**Then** 可填写仓库名称、地址，提交后创建成功（FR15）

**Given** 管理员已登录
**When** 进入币种管理页面创建币种
**Then** 可填写币种代码（如 USD）、币种名称（如 美元），提交后创建成功（FR16）

**Given** 管理员已登录
**When** 进入国家/地区管理页面创建国家
**Then** 可填写国家名称、国家代码，提交后创建成功（FR17）

**Given** 以上四个模块的列表页
**When** 在搜索框输入关键字
**Then** 列表按名称字段模糊匹配，实时筛选展示结果（FR18）

**Given** 以上四个模块的列表页
**When** 使用分页器切换页码或每页条数
**Then** 列表按分页参数重新加载数据（FR20）

### Story 2.3: 公司主体信息管理

As a 授权用户,
I want 创建和管理公司主体信息（含纳税人识别号、海关备案号等合规字段）,
So that 采购订单和物流单可以关联正确的签约主体。

**Acceptance Criteria:**

**Given** 授权用户已登录
**When** 进入公司主体管理页面，点击"新建"
**Then** 表单页按分组卡片布局展示：基本信息（公司名称、签订地点）+ 银行信息（开户行、银行账号、SWIFT CODE、默认币种）+ 合规信息（纳税人识别号、海关备案号、检疫备案号）
**And** 默认币种字段为下拉选择，关联币种主数据
**And** 必填字段标注红色星号

**Given** 授权用户已登录
**When** 填写完整公司主体信息并提交
**Then** 公司主体记录创建成功
**And** 跳转至详情页，使用 ProDescriptions 分组卡片展示所有字段（FR13）

**Given** 授权用户在公司主体列表页
**When** 搜索公司名称关键字
**Then** 列表按公司名称模糊匹配筛选

**Given** 授权用户在公司主体详情页
**When** 点击"编辑"
**Then** 进入表单编辑模式，可修改所有字段并保存

### Story 2.4: 搜索、筛选与分页横切能力

As a 授权用户,
I want 在任意主数据模块内通过关键字搜索和多条件组合筛选快速定位记录,
So that 我可以在大量数据中高效找到目标信息。

**Acceptance Criteria:**

**Given** 后端需要支持通用搜索
**When** 查看 QueryDto 基类
**Then** 支持 `keyword`（模糊匹配名称字段）、`page`、`pageSize` 标准参数
**And** 支持扩展的多条件筛选参数（如 status、dateRange 等）
**And** QueryBuilder 封装为可复用的工具方法，所有列表接口统一调用

**Given** 前端需要支持通用搜索交互
**When** 查看 SearchForm 组件
**Then** 封装了搜索+高级筛选交互：折叠/展开切换、已选条件 Tag 化展示、单个删除、"清除全部"一键重置（FR19）

**Given** 用户在任意主数据列表页输入搜索关键字
**When** 搜索请求发送至后端
**Then** 响应时间 < 1 秒（NFR-P3）

**Given** 用户首次进入任意主数据列表页
**When** 页面加载完成
**Then** 首屏加载时间 < 2 秒（NFR-P1）

**Given** 用户进入任意主数据详情页
**When** 页面加载完成
**Then** 加载时间 < 1.5 秒（NFR-P2）

**Given** 已有的单位/仓库/币种/国家/公司主体模块
**When** 验证搜索和筛选功能
**Then** 所有 5 个模块均支持关键字搜索和分页加载

## Epic 3: 产品体系管理

产品专员可以建立完整的产品档案体系 -- 三级产品分类树、SPU 基础信息、SKU 变体（含 HS 码和报关信息）、产品 FAQ、产品证书库（含有效期和 SPU 关联）、产品资料库（含文件上传和 SPU/SKU 关联），实现"HS 码终于有统一来源了"的产品数据单一来源。

### Story 3.1: 三级产品分类管理

As a 产品专员,
I want 创建和维护最多三级的产品分类树（如"灯具 > 户外灯 > 洗墙灯"）,
So that 产品档案有清晰的层级分类结构，后续 SPU 可以归属到正确的分类下。

**Acceptance Criteria:**

**Given** 产品专员进入产品分类管理页面
**When** 页面加载完成
**Then** 展示产品分类树形结构（Tree + 右侧列表双面板布局）
**And** 支持展开/折叠各级分类节点

**Given** 产品专员点击"新建分类"
**When** 填写分类名称，选择父级分类（可选，不选则为一级分类）
**Then** 分类创建成功，树形结构实时刷新
**And** 最多允许三级层级，第三级分类下不允许再创建子分类（按钮禁用或隐藏）

**Given** 产品专员点击某个分类节点
**When** 查看分类详情
**Then** 展示分类名称、层级路径、下属 SPU 数量
**And** 可点击"编辑"修改分类名称

**Given** 产品专员编辑一级分类名称
**When** 保存修改
**Then** 树形结构和所有引用该分类的 SPU 详情页中分类路径同步更新

**Given** 后端分类 API
**When** 查看接口设计
**Then** 分类实体包含 id、name、parent_id、level、sort_order、created_at、updated_at、created_by、updated_by 字段
**And** 提供树形结构查询接口（一次返回完整树）和 CRUD 接口

### Story 3.2: SPU 基础信息管理

As a 产品专员,
I want 在产品分类下创建和管理 SPU（标准产品单元），记录品名、品牌和基础描述,
So that 每个产品系列有统一的基础档案，SKU 变体可以归属到正确的 SPU 下。

**Acceptance Criteria:**

**Given** 产品专员进入 SPU 列表页
**When** 页面加载完成
**Then** 展示 SPU 列表（ProTable），含列：SPU 编码、品名、品牌、所属分类、SKU 数量、创建时间
**And** 支持按分类筛选、按品名/编码关键字搜索、分页加载（复用 Epic 2 横切能力）

**Given** 产品专员点击"新建 SPU"
**When** 进入 SPU 创建表单
**Then** 表单包含：品名（必填）、品牌（必填）、基础描述（富文本或多行文本）、所属分类（必填）
**And** 所属分类字段使用树形选择器（TreeSelect），仅允许选择末级分类（FR01）

**Given** 产品专员在 SPU 表单选择所属分类
**When** 选择"灯具 > 户外灯 > 洗墙灯"
**Then** 分类路径完整展示在表单字段中
**And** 提交后 SPU 与该分类建立关联

**Given** 产品专员查看 SPU 详情页
**When** 页面加载完成
**Then** 展示 SPU 基础信息（品名、品牌、描述、分类路径）
**And** 展示该 SPU 下所有 SKU 变体列表（预留，Story 3.3 落地内容）
**And** 可点击"编辑"修改 SPU 信息

**Given** 后端 SPU API
**When** 查看实体设计
**Then** SPU 实体包含 id、spu_code（自动生成）、name、brand、description、category_id（外键）、created_at、updated_at、created_by、updated_by 字段

### Story 3.3: SKU 变体管理（含 HS 码与报关信息）

As a 产品专员,
I want 在 SPU 下创建和管理多个 SKU 变体，完整记录规格、重量、体积、HS 码、报关品名（中英文）和申报价值参考,
So that 商务和报关人员可以搜索 SKU 编号后一屏获取所有报关所需信息，不再问人或翻 Excel。

**Acceptance Criteria:**

**Given** 产品专员在 SPU 详情页查看 SKU 列表
**When** 页面加载完成
**Then** 展示该 SPU 下所有 SKU 变体列表，含列：SKU 编码、规格摘要、HS 码、重量、体积
**And** 支持关键字搜索和分页

**Given** 产品专员点击"新建 SKU"
**When** 进入 SKU 创建表单
**Then** 表单包含：规格描述（必填）、重量 kg（必填）、体积 CBM（必填）、HS 码（必填，8-10 位数字）、报关品名中文（必填）、报关品名英文（必填）、申报价值参考、单位（关联单位主数据，EntitySearchSelect）
**And** 所属 SPU 自动关联（从 SPU 详情页进入时自动填充，灰色底不可编辑，UX-DR29）
**And** SPU 的品名、品牌信息在表单顶部只读展示，供参考

**Given** 产品专员填写 HS 码
**When** 输入"9405429000"（10 位数字）
**Then** 表单校验通过
**When** 输入"ABC123"（非纯数字）
**Then** 内联校验提示"HS 码必须为 8-10 位数字"

**Given** 任意用户搜索 SKU 编码进入 SKU 详情页
**When** 页面加载完成
**Then** 一屏展示所有关键信息（UX-DR28）：规格、重量、体积、HS 码、报关品名中英文、申报价值、所属 SPU/分类路径
**And** 详情页 ProDescriptions 按分组卡片展示（基本信息卡 + 报关信息卡）

**Given** 后端 SKU 全局列表 API
**When** 授权用户在非 SPU 上下文访问 SKU 列表（如全局 SKU 管理入口）
**Then** 支持按 SKU 编码/名称关键字搜索、按分类/SPU 筛选、分页加载
**And** 列表含 SPU 名称和分类路径列，方便定位

**Given** 后端 SKU 实体设计
**When** 查看字段
**Then** 包含 id、sku_code（自动生成）、spu_id（外键）、specification、weight_kg、volume_cbm、hs_code、customs_name_cn、customs_name_en、declared_value_ref、unit_id（外键）、created_at、updated_at、created_by、updated_by

### Story 3.4: 产品 FAQ 维护

As a 产品专员,
I want 为产品创建和维护 FAQ 条目（问题 + 回答）,
So that 销售员和客户咨询时可以快速查到标准答案，减少重复沟通。

**Acceptance Criteria:**

**Given** 产品专员在 SPU 详情页
**When** 查看 FAQ 标签页
**Then** 展示该 SPU 关联的所有 FAQ 列表（问题标题 + 操作列）
**And** 支持"新增 FAQ"按钮

**Given** 产品专员点击"新增 FAQ"
**When** 填写问题（必填）和回答（必填，多行文本）
**Then** FAQ 条目创建成功，关联当前 SPU
**And** 列表实时刷新展示新条目

**Given** 产品专员点击某条 FAQ 的"编辑"
**When** 修改回答内容并保存
**Then** FAQ 条目更新成功

**Given** 产品专员点击某条 FAQ 的"删除"
**When** 系统弹出 Popconfirm 确认（UX-DR16）
**Then** 确认后 FAQ 条目删除

**Given** 后端 FAQ 实体
**When** 查看设计
**Then** 包含 id、spu_id（外键）、question、answer、sort_order、created_at、updated_at、created_by、updated_by

### Story 3.5: 产品证书库管理

As a 产品专员,
I want 在产品证书库中创建和管理证书记录（如 CE/FCC），上传证书文件，记录有效期和发证机构，并关联适用 SPU,
So that 商务人员可以在系统内直接下载最新有效证书，不再到处找文件。

**Acceptance Criteria:**

**Given** 产品专员进入产品证书库列表页
**When** 页面加载完成
**Then** 展示证书列表（ProTable），含列：证书编号、证书类型（CE/FCC 等）、适用 SPU、有效期、发证机构、状态（有效/过期）
**And** 支持按证书类型/SPU 筛选、关键字搜索、分页

**Given** 产品专员点击"新建证书"
**When** 进入证书创建表单
**Then** 表单包含：证书类型（必填，下拉选择或输入）、证书编号、有效期起始日（必填）、有效期结束日（必填）、发证机构（必填）、适用 SPU（必填，EntitySearchSelect 支持多选关联，UX-DR14）、证书文件上传（必填）
**And** 文件上传至阿里云 OSS（NFR-F1），前端展示上传进度

**Given** 产品专员上传证书文件
**When** 文件上传成功
**Then** 文件存储在阿里云 OSS，数据库记录文件 URL 和文件名
**And** 服务端不在本地磁盘持久化文件内容（NFR-F1）

**Given** 任意用户在证书详情页
**When** 点击"下载证书"
**Then** 从 OSS 获取文件并下载

**Given** 产品专员在证书详情页点击"删除文件"
**When** 系统弹出 Modal 二次确认（"删除后文件将从云存储永久删除，无法恢复"，UX-DR16 + NFR-F2）
**Then** 确认后执行 OSS 物理删除 + 数据库记录清除

**Given** 证书有效期结束日早于当前日期
**When** 查看证书列表
**Then** 该证书状态列展示"已过期"（红色标签，UX-DR07 error 状态色）

### Story 3.6: 产品资料库管理

As a 产品专员,
I want 在产品资料库中创建和管理资料记录（说明书、规格书等），上传文件并关联 SPU 或 SKU,
So that 所有产品文档有统一的存储和检索入口，不再散落在各人电脑里。

**Acceptance Criteria:**

**Given** 产品专员进入产品资料库列表页
**When** 页面加载完成
**Then** 展示资料列表（ProTable），含列：资料名称、资料类型（说明书/规格书/其他）、关联 SPU/SKU、上传时间
**And** 支持按类型/SPU 筛选、关键字搜索、分页

**Given** 产品专员点击"新建资料"
**When** 进入资料创建表单
**Then** 表单包含：资料名称（必填）、资料类型（必填，下拉）、关联 SPU（EntitySearchSelect，UX-DR14）、关联 SKU（可选，EntitySearchSelect，选择 SPU 后可进一步选择 SKU）、文件上传（必填）、备注
**And** 文件上传至阿里云 OSS（NFR-F1）

**Given** 产品专员选择关联 SPU
**When** 通过 EntitySearchSelect 搜索并选择 SPU
**Then** 关联 SKU 选择器联动更新，仅展示该 SPU 下的 SKU 列表（UX-DR29 联动）

**Given** 任意用户在资料详情页
**When** 点击"下载文件"
**Then** 从 OSS 获取文件并下载

**Given** 产品专员删除资料记录
**When** 系统弹出 Modal 二次确认（NFR-F2）
**Then** 确认后执行 OSS 文件物理删除 + 数据库记录删除

**Given** 任意用户在 SPU 详情页
**When** 查看"资料"标签页
**Then** 展示该 SPU 关联的所有资料列表，可直接下载

## Epic 4: 供应链参考数据管理

采购员可以维护完整的供应商档案（含账期、品类关联），授权用户可管理合同条款范本（草稿/已审批状态）、港口信息、物流供应商和客户主数据，实现"供应商信息不用再问人了"的供应链数据单一来源。

### Story 4.1: 供应商档案管理（含品类关联）

As a 采购员,
I want 创建和管理供应商档案，记录联系人、账期、付款方式和开户行信息，并关联采购品类,
So that 任何采购员都能在一个页面获取供应商全部信息，不再依赖同事或 Excel。

**Acceptance Criteria:**

**Given** 采购员进入供应商列表页
**When** 页面加载完成
**Then** 展示供应商列表（ProTable），含列：供应商名称、联系人、账期（天）、付款方式、采购品类、状态
**And** 支持按品类筛选、按名称/联系人关键字搜索、分页加载

**Given** 采购员点击"新建供应商"
**When** 进入供应商创建表单
**Then** 表单分组卡片展示：基本信息（公司名称-必填、联系人、联系电话、联系邮箱）、商务条件（账期天数-必填、付款方式-必填）、银行信息（开户行、银行账号）
**And** 采购品类关联字段支持多选（FR08），使用产品分类 TreeSelect 关联

**Given** 采购员查看供应商详情页
**When** 页面加载完成
**Then** ProDescriptions 分组展示所有字段
**And** 展示该供应商关联的采购品类标签
**And** 展示该供应商关联的采购订单列表（预留，Epic 6 落地）

**Given** 采购员编辑供应商信息
**When** 修改账期从 30 天改为 45 天并保存
**Then** 供应商详情更新成功，后续新建采购订单引用最新账期

**Given** 后端供应商实体
**When** 查看设计
**Then** 包含 id、name、contact_person、contact_phone、contact_email、payment_terms_days、payment_method、bank_name、bank_account、created_at、updated_at、created_by、updated_by
**And** 品类关联通过中间表 supplier_categories（supplier_id, category_id）实现多对多

### Story 4.2: 合同条款范本管理

As a 授权用户,
I want 创建和管理合同条款范本，条款有"草稿"和"已审批"两种状态，只有已审批的条款才能被采购订单引用,
So that 采购订单可以引用标准化的合同条款，确保合同内容一致性。

**Acceptance Criteria:**

**Given** 授权用户进入合同条款范本列表页
**When** 页面加载完成
**Then** 展示条款列表（ProTable），含列：条款名称、状态（草稿/已审批）、创建时间、更新时间
**And** 支持按状态筛选、关键字搜索、分页

**Given** 授权用户点击"新建条款"
**When** 填写条款名称（必填）和内容文本（必填，多行文本）
**Then** 条款创建成功，默认状态为"草稿"（灰色标签，UX-DR07）

**Given** 授权用户在草稿状态的条款详情页
**When** 点击"审批通过"
**Then** 系统弹出 Popconfirm 确认（UX-DR16 状态推进）
**And** 确认后状态变更为"已审批"（蓝色标签）

**Given** 条款处于"已审批"状态
**When** 授权用户编辑条款内容
**Then** 允许编辑并保存，状态保持"已审批"不变

**Given** 一条"已审批"状态的合同条款已被一张或多张"已确认"采购订单引用
**When** 授权用户编辑该条款内容并保存
**Then** 系统采用"引用时关联 ID"策略：已有采购订单的条款内容**不受影响**（关联的是条款 ID，详情页展示时实时拉取当前条款内容）
**And** 系统在编辑保存操作时展示提示："该条款已被 N 张采购订单引用，修改后引用方将展示最新条款内容，请确认修改内容已获相关人员知悉。"（Popconfirm 二次确认）

**Given** 后端条款实体
**When** 查看设计
**Then** 包含 id、name、content、status（draft/approved）、created_at、updated_at、created_by、updated_by

### Story 4.3: 港口信息与物流供应商管理

As a 授权用户,
I want 管理港口信息（港口名称、国家、代码）和物流供应商档案（名称、联系方式、服务类型）,
So that 创建物流单时可以直接选择港口和物流供应商，不用手动输入。

**Acceptance Criteria:**

**Given** 授权用户进入港口信息列表页
**When** 页面加载完成
**Then** 展示港口列表（ProTable），含列：港口名称、国家、港口代码
**And** 支持按国家筛选、关键字搜索、分页

**Given** 授权用户点击"新建港口"
**When** 填写港口名称（必填）、国家（必填，关联国家/地区主数据，EntitySearchSelect，UX-DR14）、港口代码（必填）
**Then** 港口记录创建成功

**Given** 授权用户进入物流供应商列表页
**When** 页面加载完成
**Then** 展示物流供应商列表（ProTable），含列：名称、联系方式、服务类型
**And** 支持按服务类型筛选、关键字搜索、分页

**Given** 授权用户点击"新建物流供应商"
**When** 填写名称（必填）、联系方式、服务类型（海运/陆运/空运/快递，多选）
**Then** 物流供应商记录创建成功

**Given** 授权用户在港口或物流供应商详情页
**When** 点击"编辑"
**Then** 可修改所有字段并保存

### Story 4.4: 客户主数据管理

As a 授权用户,
I want 创建和管理客户主数据，记录公司名称、联系信息、开票需求和客户所在国家,
So that 销售员创建订单时可以直接选择客户，客户信息有唯一数据来源。

**Acceptance Criteria:**

**Given** 授权用户进入客户列表页
**When** 页面加载完成
**Then** 展示客户列表（ProTable），含列：客户名称、联系人、国家、创建时间
**And** 支持按国家筛选、关键字搜索、分页

**Given** 授权用户点击"新建客户"
**When** 进入客户创建表单
**Then** 表单包含：公司名称（必填）、联系人、联系电话、联系邮箱、国家（必填，关联国家/地区主数据，EntitySearchSelect，UX-DR14）、开票需求（多行文本）、地址
**And** 选择国家后自动填充国家名称（UX-DR29）

**Given** 授权用户查看客户详情页
**When** 页面加载完成
**Then** ProDescriptions 展示所有客户字段
**And** 展示该客户关联的销售订单列表（预留，Epic 5 落地）

**Given** 授权用户编辑客户信息
**When** 修改联系人并保存
**Then** 客户记录更新成功

**Given** 后端客户实体
**When** 查看设计
**Then** 包含 id、company_name、contact_person、contact_phone、contact_email、country_id（外键）、billing_requirements、address、created_at、updated_at、created_by、updated_by

## Epic 5: 销售订单与发货需求管理

销售员可以按已落地状态机创建销售订单并完成提交审核/审核通过流转。系统先在 Story 5.0 前置建立 shared 交易状态枚举、库存双层结构、可用库存查询接口与期初库存录入；随后销售员可在审核通过的销售订单详情页手动触发生成发货需求单（含 SKU 应发量和真实库存查询）。商务跟单可以在发货需求枢纽详情页完成完整的库存决策——设置履行类型（全部采购/部分采购/使用现有库存），集中确认后系统按 FIFO 自动跨批次完成库存锁定，以及执行发货需求作废操作（释放锁定库存、销售订单回退、支持重新生成）。

**FRs covered:** FR21, FR22, FR23, FR24, FR26（完整实现）, FR28, FR29, FR30, FR39（基础模型）, FR40（期初录入）, FR43（可用库存查询）, FR49（完整实现）
**NFRs addressed:** NFR-P4, NFR-P6
**UX-DRs addressed:** UX-DR08, UX-DR09, UX-DR10, UX-DR12, UX-DR13, UX-DR15, UX-DR16, UX-DR18, UX-DR26, UX-DR27


### Story 5.1: 销售订单创建与确认

As a 销售员,
I want 通过表单创建销售订单（关联客户、添加 SKU 行项、选择币种和订单类型），并通过待提交/审核流完成状态流转,
So that 销售订单可以先落单、再进入后续业务处理，并保留完整操作记录。

**Acceptance Criteria:**

**Given** 销售员进入销售订单创建表单
**When** 页面加载完成
**Then** 表单展示分组卡片布局：① 基本信息（客户-必填 EntitySearchSelect、订单类型-必填下拉（普通/售后/样品，MVP 仅启用"普通"）、币种-必填 EntitySearchSelect、备注）；② 订单行项子表格（可编辑，添加行/删除行）
**And** 选择客户后自动填充客户名称、联系人（灰色底不可编辑，UX-DR29）

**Given** 销售员在订单行项子表格点击"添加行"
**When** 添加一行
**Then** 新行包含：SKU（必填，EntitySearchSelect）、数量（必填，正整数）、单价（必填，正数）、金额（自动计算 = 数量 x 单价，只读）
**And** 选择 SKU 后自动带入产品名称/规格/单位（灰色底不可编辑，UX-DR29）

**Given** 销售员填写完整订单表单
**When** 点击"提交"
**Then** 系统弹出 Popconfirm（UX-DR16 状态推进）："确认提交审核？"
**And** 确认后订单创建为"待提交"状态，订单编号自动生成（FR22）
**And** 提交响应时间 < 2 秒（NFR-P4）

**Given** 销售订单成功创建为"待提交"状态
**When** 用户按状态动作提交审核并审核通过
**Then** 订单状态按 `待提交 -> 审核中 -> 审核通过` 流转
**And** 前端跳转至订单详情页，展示 Notification.success（UX-DR17 重要成功）
**And** Story 5.2 在订单"审核通过"后展示"生成发货需求"按钮，等待用户手动触发

**Given** 后端销售订单实体
**When** 查看设计
**Then** 包含 id、order_code（自动生成）、customer_id（外键）、currency_id（外键）、order_type（普通/售后/样品）、status（待提交/审核中/审核通过/已驳回/备货中/备货完成/部分发货/已发货/已作废）、total_amount（自动汇总）、remark、created_at、updated_at、created_by、updated_by
**And** 订单行项实体：id、sales_order_id（外键）、sku_id（外键）、quantity、unit_price、amount、created_at、updated_at

### Story 5.0: 库存双层结构、可用库存查询接口与期初录入（5.2 前置）

As a 系统管理员和开发者,
I want 在生成发货需求前先建立统一的交易状态枚举、库存双层结构、期初库存录入和可用库存查询接口,
So that Story 5.2 可以基于正式库存数据生成发货需求，避免临时库存方案和后续返工。

**Acceptance Criteria:**

**Given** `packages/shared` 作为前后端共享类型包
**When** 查看交易单据相关枚举
**Then** `ShippingDemandStatus` 使用 `as const` 对象模式定义：`PENDING_ALLOCATION`（待分配库存）、`PURCHASING`（采购中）、`STOCK_READY`（已备货完成）、`PARTIALLY_SHIPPED`（部分发货）、`SHIPPED`（已发货）、`VOIDED`（已作废）
**And** 新增 `FulfillmentType`：`FULL_PURCHASE`（全部采购）、`PARTIAL_PURCHASE`（部分采购）、`USE_STOCK`（使用现有库存）
**And** 新增库存相关枚举：`InventoryBatchSourceType`（期初录入/采购入库）、`InventoryChangeType`（期初录入/采购入库/发货出库/锁定/解锁）
**And** 所有新增枚举从 `packages/shared/src/index.ts` 导出，禁止前后端重复定义

**Given** 后端库存模块
**When** 运行数据库迁移
**Then** 创建汇总层 `inventory_summary`：id、sku_id（FK）、warehouse_id（FK）、actual_quantity（默认 0）、locked_quantity（默认 0）、available_quantity（默认 0，由 Service 层维护，不使用数据库计算列）、created_at、updated_at、created_by、updated_by
**And** 创建批次层 `inventory_batch`：id、sku_id（FK）、warehouse_id（FK）、batch_quantity、batch_locked_quantity、source_type（期初录入/采购入库）、source_document_id、receipt_date（FIFO 排序依据）、created_at、updated_at、created_by、updated_by
**And** 汇总层和批次层保持一致：汇总层数量由批次层聚合及库存操作同步维护（FR39）

**Given** 系统管理员进入期初库存录入页面
**When** 选择 SKU 和仓库，填写期初数量并提交
**Then** 在批次层创建或覆盖 `source_type=INITIAL` 的期初批次
**And** 汇总层对应 SKU+仓库的 actual_quantity 与 available_quantity 同步更新（FR40）

**Given** 授权用户或 Story 5.2 生成发货需求逻辑调用库存查询接口
**When** GET `/api/v1/inventory/available?skuIds=1,2,3`
**Then** 返回每个 SKU 在各仓库的实际库存、锁定量、可用库存：`[{ skuId, warehouseId, actualQuantity, lockedQuantity, availableQuantity }]`
**And** 可选 `warehouseId` 参数用于限定单个仓库
**And** 若某 SKU+仓库 尚无 inventory_summary 记录，则返回 availableQuantity=0，不报错（FR43）
**And** 响应时间 < 1 秒（NFR-P6）

**Given** 后续库存写操作
**When** 涉及锁定/解锁/扣减/增加
**Then** 必须通过 InventoryService 的 QueryRunner 事务 + SELECT ... FOR UPDATE 执行
**And** 死锁时指数退避最多 3 次，超限抛 ConflictException({ code: 'CONCURRENT_UPDATE' })

**Given** Story 5.2 还未开始
**When** Story 5.0 未完成
**Then** 不允许开始 Story 5.2 的"生成发货需求"实现，避免临时库存查询方案

### Story 5.2: 销售订单列表与详情

As a 授权用户,
I want 查看销售订单列表（按状态和客户筛选）和订单详情（含行项信息和关联发货需求链接）,
So that 我可以快速找到需要的订单并跟踪其履行进度。

**Acceptance Criteria:**

**Given** 授权用户进入销售订单列表页
**When** 页面加载完成
**Then** 展示销售订单列表（ProTable），含列：订单编号（蓝色链接，UX-DR18）、客户名称、订单类型、币种、总金额（右对齐千分位+币种符号，UX-DR25）、状态（彩色 Tag，UX-DR07）、创建时间
**And** 支持按状态筛选、按客户筛选、按订单编号/客户名称关键字搜索、分页加载

**Given** 授权用户点击订单编号链接
**When** 进入销售订单详情页
**Then** 展示标准详情页布局（UX-DR05）：① 顶部面包屑+状态 Tag；② 基本信息卡片（客户信息、订单类型、币种、总金额、创建时间）；③ 订单行项表格（SKU 编码/名称/规格/数量/单价/金额）；④ 关联单据区（发货需求编号蓝色链接，点击跳转）
**And** 操作记录 ActivityTimeline 展示创建、状态变更等事件（UX-DR13）

**Given** 销售订单状态为"审核通过"（`SalesOrderStatus.APPROVED`）且不存在未作废的关联发货需求
**When** 查看详情页操作区
**Then** 展示"生成发货需求"按钮（Primary 蓝色实心，UX-DR15）

**Given** 授权用户点击"生成发货需求"按钮
**When** 系统弹出 Popconfirm（UX-DR16 状态推进）："确认为此订单生成发货需求？"
**Then** 确认后系统生成发货需求单，包含所有 SKU 及应发数量（FR24）
**And** 后端调用 Story 5.0 建立的 InventoryService / `GET /api/v1/inventory/available` 查询每个 SKU 在各仓库的当前可用库存
**And** 发货需求行项记录应发数量、可用库存快照、初始履行类型 null，发货需求状态为 `ShippingDemandStatus.PENDING_ALLOCATION`
**And** 销售订单状态从 `SalesOrderStatus.APPROVED` 推进为 `SalesOrderStatus.PREPARING`
**And** 前端展示 Notification.success（UX-DR17 重要成功），包含"查看发货需求"链接
**And** "生成发货需求"按钮隐藏，关联单据区显示发货需求编号蓝色链接
**And** 禁止为本 Story 实现临时库存表、mock 库存 API 或硬编码可用库存

**Given** 销售订单已存在未作废的关联发货需求
**When** 查看详情页
**Then** 不展示"生成发货需求"按钮，仅展示关联发货需求编号链接（防止重复生成）

**Given** 销售订单状态为"已发货"
**When** 查看详情
**Then** 状态 Tag 显示绿色"已发货"（UX-DR07 success）

### Story 5.3: 发货需求列表页

As a 商务跟单,
I want 查看发货需求单列表（按状态和关联销售订单筛选）,
So that 我可以快速找到需要处理的发货需求并跟进。

**Acceptance Criteria:**

**Given** 商务跟单进入发货需求列表页
**When** 页面加载完成
**Then** 展示发货需求列表（ProTable），含列：需求编号（蓝色链接）、关联销售订单编号（蓝色链接，UX-DR18）、客户名称、SKU 数量、状态（彩色 Tag，UX-DR07）、创建时间
**And** 支持按状态筛选、按关联销售订单筛选、关键字搜索、分页加载

**Given** 商务跟单点击发货需求编号
**When** 导航到详情页
**Then** 跳转到发货需求枢纽详情页（Story 5.4）

**Given** 后端发货需求实体
**When** 查看设计
**Then** 包含 id、demand_code（自动生成）、sales_order_id（外键）、status（待分配库存/采购中/已备货完成/部分发货/已发货/已作废）、created_at、updated_at、created_by、updated_by
**And** 发货需求行项实体：id、shipping_demand_id（外键）、sku_id（外键）、required_quantity、available_stock_snapshot、fulfillment_type（全部采购/部分采购/使用现有库存，默认 null）、created_at、updated_at

### Story 5.4: 发货需求枢纽详情页（含完整库存锁定）

As a 商务跟单,
I want 在发货需求详情页一屏完成所有库存决策——查看流程进度、关联单据计数、核心 KPI，为每个 SKU 设置履行类型，集中确认后系统按 FIFO 自动完成库存锁定,
So that 我无需跳转多个页面就能掌握全貌、做出决策并锁定库存，3 次点击内完成操作。

**Acceptance Criteria:**

**Given** 商务跟单进入发货需求详情页
**When** 页面加载完成
**Then** 页面顶部展示：① 面包屑 + 需求编号 + 状态 Tag；② FlowProgress 流程进度条（UX-DR08），7 步：需求创建→库存检查→采购备货→库存锁定→创建物流→出库发货→完成

**Given** 发货需求详情页加载完成
**When** 查看 SmartButton 区域
**Then** 展示 SmartButton 关联单据计数器（UX-DR09）：采购订单 N | 物流单 N | 出库单 N
**And** 点击任一 SmartButton 跳转对应列表页（预设筛选当前发货需求，UX-DR18）

**Given** 发货需求详情页加载完成
**When** 查看 KPI 摘要行
**Then** 展示 StatCard 卡片（UX-DR12）：总 SKU 种类、总应发数量、已锁定数量、已出库数量

**Given** 发货需求详情页加载完成
**When** 查看产品明细表
**Then** 表格包含列：SKU 编码/名称、规格、应发数量、可用库存（InventoryIndicator 色彩标签，UX-DR10）、履行类型选择器（下拉：全部采购/部分采购/使用现有库存）
**And** 库存色彩：可用 >= 应发 绿色 / 0 < 可用 < 应发 橙色 / 可用 = 0 红色（UX-DR10）
**And** 表格首列固定，水平滚动（UX-DR25）

**Given** 商务跟单在产品明细表中选择某 SKU 行的履行类型
**When** 选择"使用现有库存"或"部分采购"
**Then** 该行展开内联仓库分配区，展示该 SKU 在各仓库各批次的明细：入库日期、来源单据、批次实际数量、批次可用数量
**And** 用户填写"使用数量"字段（正整数，不超过该批次可用数量）

**Given** 商务跟单完成所有 SKU 行的履行类型选择并填写使用数量
**When** 点击页面底部"确认分配"按钮（Primary 蓝色，集中提交所有行的履行类型设置）
**Then** 系统校验所有行均已设置履行类型；未设置的行显示错误提示，阻止提交

**Given** 商务跟单点击"确认分配"后通过校验
**When** 系统执行保存
**Then** 所有 SKU 行的履行类型持久化至数据库（`PATCH /api/shipping-demands/:id/fulfillment`，一次性提交所有行）
**And** 履行类型为"使用现有库存"或"部分采购"（库存部分）的 SKU 行，系统按 FIFO（入库日期从早到晚）自动跨批次完成库存锁定（FR26）
**And** 批次层 batch_locked_quantity 增加；汇总层 locked_quantity 增加、available_quantity 减少
**And** 库存变动流水记录（change_type=锁定，source_document=发货需求）（FR42）
**And** 页面 InventoryIndicator 实时更新，KPI 摘要行"已锁定数量"StatCard 实时刷新
**And** 前端展示 Notification.success

**Given** 某"使用现有库存"SKU 行的可用库存不足以满足应发数量
**When** 用户填写使用数量超过可用量并尝试提交
**Then** 系统阻止提交，提示"[SKU名称] 可用库存不足，当前可用 N [单位]"（NFR-U3）

**Given** 库存锁定过程中遇到并发操作
**When** 确认分配执行时
**Then** 使用 SELECT ... FOR UPDATE 行锁保证一致性
**And** 死锁时指数退避最多 3 次重试，超限返回 ConflictException({ code: 'CONCURRENT_UPDATE' })

**Given** 发货需求详情页加载完成
**When** 查看底部操作记录区
**Then** 展示 ActivityTimeline（UX-DR13）：需求创建、库存检查、采购订单创建、物流单创建、出库确认等关键事件按时间倒序排列

### Story 5.5: 发货需求下游入口与完整作废逻辑

As a 商务跟单,
I want 在发货需求详情页直接创建物流单，以及对"待分配库存"状态的发货需求执行完整的作废操作（释放已锁定库存、销售订单状态回退为审核通过、支持重新生成）,
So that 我可以从枢纽页一键操作，作废后系统状态干净彻底，不留孤立数据。

**Acceptance Criteria:**

**Given** 商务跟单在发货需求详情页
**When** 点击"创建物流单"按钮（UX-DR27 一键直达）
**Then** 跳转到物流单创建表单，自动关联当前发货需求，SKU 和数量自动预填（FR28）
**And** 预填字段灰色底不可编辑（UX-DR29）

**Given** 发货需求状态为"待分配库存"
**When** 查看详情页操作按钮区
**Then** 展示"作废"按钮（Danger 红色，UX-DR15）

**Given** 商务跟单点击"作废"按钮
**When** 系统弹出 Modal 二次确认（UX-DR16 不可逆操作）
**Then** Modal 提示文案："确认作废此发货需求？作废后将释放已锁定库存，销售订单状态回退为'审核通过'，操作不可撤销"
**And** 若该发货需求已有关联采购订单（请购型），提示："该需求下有 N 个关联采购订单，作废后请手动处理"

**Given** 商务跟单在 Modal 中确认作废
**When** 系统执行作废逻辑（FR49）
**Then** ① 发货需求状态变更为"已作废"（红色标签，UX-DR07）
**And** ② 系统自动释放该发货需求下所有已锁定库存：批次层 batch_locked_quantity 减少、汇总层 locked_quantity 减少、available_quantity 增加
**And** 库存变动流水记录（change_type=解锁，source_document=发货需求作废）（FR42）
**And** ③ 关联销售订单状态回退为"审核通过"（`SalesOrderStatus.APPROVED`）
**And** 前端展示 Notification.success 通知（UX-DR17）

**Given** 发货需求作废成功
**When** 查看关联销售订单详情页
**Then** 销售订单状态显示"审核通过"（蓝色 Tag）
**And** 详情页操作区展示"重新生成发货需求"按钮（Primary 蓝色）

**Given** 授权用户在销售订单详情页点击"重新生成发货需求"
**When** Popconfirm 确认
**Then** 系统生成新的发货需求单（复用 Story 5.2 的生成逻辑，包含所有 SKU 及应发数量）
**And** 前端展示 Notification.success，包含新发货需求编号链接

**Given** 发货需求状态为"采购中"或之后状态
**When** 查看详情页
**Then** 不展示"作废"按钮（FR49 规则：采购中及之后不允许作废）

## Epic 6: 采购订单与收货入库

库存双层数据模型、期初录入和可用库存查询接口已在 Epic 5 Story 5.0 前置落地。Epic 6 不再重复创建库存基础表和查询接口，而是在采购订单、收货入库、请购型收货自动锁定、库存变动流水中消费同一 InventoryModule。采购分组预览面板（按供应商分组确认）同时落地。

**FRs covered:** FR27, FR35, FR36, FR37, FR38, FR42, FR43（历史变动流水查询）, FR44, FR45
**NFRs addressed:** NFR-P5, NFR-P6, NFR-U3
**UX-DRs addressed:** UX-DR11, UX-DR27, UX-DR29

### ~~Story 6.1: 库存双层结构、查询接口与期初录入~~（已前移至 Epic 5 Story 5.0）

原 Story 6.1 的库存双层结构、期初库存录入、可用库存查询接口和库存并发规则已前移为 **Story 5.0：库存双层结构、可用库存查询接口与期初录入（5.2 前置）**。Epic 6 不再重复创建库存基础表和查询接口；后续采购订单、收货入库、请购型收货自动锁定和库存变动流水必须消费 Story 5.0 提供的同一 InventoryModule。

### Story 6.2: 库存变动流水

As a 授权用户,
I want 系统自动记录每次库存变动流水，我可以按 SKU 或仓库查询历史变动明细,
So that 库存变动有完整审计记录，出现差异时可以追溯。

**Acceptance Criteria:**

**Given** 任意库存变动操作（期初录入/采购入库/发货出库/锁定/解锁）
**When** 操作执行成功
**Then** 系统自动写入库存变动流水记录（FR42）

**Given** 后端库存变动流水实体
**When** 查看设计
**Then** 包含 id、sku_id、warehouse_id、change_type（期初录入/采购入库/发货出库/锁定/解锁）、quantity_change（正数增加/负数减少）、before_quantity、after_quantity、source_document_type、source_document_id、operated_by、operated_at

**Given** 授权用户在库存查询页面选择某 SKU+仓库
**When** 点击"查看变动流水"
**Then** 展示该 SKU+仓库的历史变动列表（时间倒序），含列：变动类型（Tag）、数量变化（+/-）、变动前/后数量、来源单据（蓝色链接）、操作人、操作时间
**And** 支持按变动类型筛选、按时间范围筛选、分页

### Story 6.3: 采购订单创建与确认

As a 采购员,
I want 创建采购订单（支持从发货需求自动预填 SKU 和数量的请购型，以及手动创建的备货型），关联供应商并补充单价，提交后直接确认,
So that 采购流程可以快速启动，请购型自动继承发货需求信息减少重复录入。

**Acceptance Criteria:**

**Given** 商务跟单在发货需求详情页点击"创建采购订单"
**When** 系统打开 PurchaseGroupPreview 采购分组预览面板（Drawer 520px，UX-DR11）
**Then** 面板按供应商分组展示卡片，每组含：供应商名称、SKU 列表（SKU 编码/名称/数量-可编辑）
**And** 仅包含履行类型为"全部采购"或"部分采购"的 SKU（FR27）
**And** 底部操作栏展示"取消"和"确认创建 N 个采购订单"按钮

**Given** 商务跟单确认采购分组预览
**When** 点击"确认创建"
**Then** 系统按供应商分组批量生成采购订单，类型标注"请购型"（FR35）
**And** 每张采购订单自动关联供应商、预填 SKU 和数量、关联发货需求
**And** 合同条款默认关联该供应商已审批的第一条范本（FR35）
**And** 所有生成的采购订单状态为"已确认"（FR36）
**And** 前端展示 Notification.success，包含生成的采购订单数量和链接

**Given** 采购员手动进入采购订单创建表单（备货型）
**When** 页面加载完成
**Then** 表单展示分组卡片：① 基本信息（供应商-必填 EntitySearchSelect、合同条款-下拉仅展示已审批条款、备注）；② 订单行项子表格（SKU EntitySearchSelect + 数量 + 单价 + 金额自动计算）
**And** 选择供应商后自动带入联系方式、账期（灰色底不可编辑，UX-DR29）
**And** 合同条款默认选择该供应商已审批的第一条范本
**And** 订单类型自动标注为"备货型"

**Given** 采购员填写完整备货型订单
**When** 点击"提交"
**Then** Popconfirm 确认后订单创建为"已确认"状态（FR36）

**Given** 后端采购订单实体
**When** 查看设计
**Then** 包含 id、po_code（自动生成）、supplier_id（外键）、shipping_demand_id（外键，请购型关联，备货型为 null）、contract_term_id（外键）、order_type（请购型/备货型）、status（已确认/已收货）、total_amount、remark、created_at、updated_at、created_by、updated_by
**And** 采购订单行项：id、purchase_order_id（外键）、sku_id（外键）、quantity、unit_price、amount、created_at、updated_at

### Story 6.4: 采购订单列表与详情

As a 授权用户,
I want 查看采购订单列表（按状态和供应商筛选）和订单详情,
So that 我可以跟踪采购进度和查看订单明细。

**Acceptance Criteria:**

**Given** 授权用户进入采购订单列表页
**When** 页面加载完成
**Then** 展示采购订单列表（ProTable），含列：订单编号（蓝色链接）、供应商名称、订单类型（请购型/备货型 Tag）、总金额（右对齐千分位）、状态（彩色 Tag）、创建时间
**And** 支持按状态筛选、按供应商筛选、关键字搜索、分页

**Given** 授权用户点击订单编号
**When** 进入采购订单详情页
**Then** 展示标准详情页（UX-DR05）：① 基本信息卡片（供应商、订单类型、合同条款、总金额）；② 订单行项表格；③ 关联单据（发货需求编号链接-请购型、收货入库单链接）
**And** ActivityTimeline 展示创建、收货等事件

**Given** 采购订单状态为"已收货"
**When** 查看详情
**Then** 状态 Tag 显示绿色"已收货"

### Story 6.5: 收货入库单创建与确认

As a 仓管,
I want 创建收货入库单关联已确认的采购订单，逐行填写实际收货数量和目标仓库，确认后系统自动创建批次记录并更新库存,
So that 收货操作有完整记录，库存数据实时准确。

**Acceptance Criteria:**

**Given** 仓管进入收货入库单创建表单
**When** 选择关联采购订单（EntitySearchSelect，仅展示"已确认"状态的订单）
**Then** 自动预填采购订单行项信息：SKU 编码/名称/采购数量（只读）
**And** 每行新增可编辑字段：实际收货数量（必填，正整数）、目标仓库（必填，EntitySearchSelect）

**Given** 仓管填写完整收货信息
**When** 点击"确认收货"
**Then** Popconfirm 确认后执行收货逻辑
**And** 响应时间 < 3 秒（NFR-P5，含库存更新）

**Given** 收货确认执行成功
**When** 后端处理完成
**Then** ① 批次层为每行创建新批次记录（source_type=采购入库，关联采购订单+行项）
**And** ② 汇总层对应 SKU+仓库的 actual_quantity 增加收货数量
**And** ③ available_quantity 同步更新（= actual - locked）
**And** ④ 库存变动流水自动记录（change_type=采购入库）

**Given** 仓管填写收货信息时，某行实际收货数量小于该行采购数量（部分收货）
**When** 点击"确认收货"
**Then** 系统允许提交，不阻止部分收货
**And** 该行批次记录以实际收货数量创建
**And** 采购订单状态仍更新为"已收货"（MVP 阶段不区分全量/部分收货状态，以确认收货操作为准；FR38）
**And** 如业务需要补收剩余数量，需创建新的收货入库单关联同一采购订单（MVP 阶段支持同一采购订单多次收货）

**Given** 后端收货入库单实体
**When** 查看设计
**Then** 包含 id、receipt_code（自动生成）、purchase_order_id（外键）、status（已确认）、remark、created_at、updated_at、created_by、updated_by
**And** 入库行项：id、receipt_id（外键）、sku_id（外键）、po_line_id（外键）、received_quantity、warehouse_id（外键）、batch_id（外键，入库后关联）、created_at、updated_at

### Story 6.6: 收货后自动触发（请购型 FIFO 锁定 + 状态联动）

As a 系统,
I want 请购型采购订单收货后自动按 FIFO 锁定库存至对应发货需求，备货型仅增加实际库存不锁定，同时自动更新采购订单状态为"已收货",
So that 请购型物资到货即锁定，发货需求的库存分配自动完成。

**Acceptance Criteria:**

**Given** 请购型采购订单关联的收货入库单确认成功
**When** 后端触发自动锁定逻辑
**Then** 系统按 FIFO（入库日期最早的批次优先）自动跨批次锁定库存至对应发货需求（FR45）
**And** 批次层 batch_locked_quantity 增加
**And** 汇总层 locked_quantity 增加、available_quantity 减少
**And** 库存变动流水记录（change_type=锁定）

**Given** 备货型采购订单关联的收货入库单确认成功
**When** 后端执行
**Then** 仅增加实际库存，不执行自动锁定（FR45 规则）

**Given** 采购订单关联的收货入库单全部确认
**When** 后端检查收货状态
**Then** 采购订单状态自动更新为"已收货"（FR38）

**Given** FIFO 锁定过程中遇到并发操作
**When** 多个收货同时触发锁定
**Then** 使用 SELECT ... FOR UPDATE 行锁保证一致性
**And** 死锁时指数退避重试（最多 3 次）

**Given** 库存不足时校验
**When** 可用库存不足以完成锁定
**Then** 系统提示明确信息，包含当前可用库存数量（NFR-U3）

## Epic 7: 物流单与发货出库

商务跟单可以从发货需求创建物流单（含装柜信息、港口、物流供应商），仓管可以创建出库单确认发货出库（扣减库存+释放锁定），发货完成后发货需求和销售订单状态自动流转至完成。

**FRs covered:** FR25, FR30, FR31, FR32, FR33, FR34, FR41, FR46, FR47, FR48
**NFRs addressed:** NFR-P5, NFR-U3
**UX-DRs addressed:** UX-DR27

### Story 7.1: 物流单创建（从发货需求预填）

As a 商务跟单,
I want 从发货需求详情页一键创建物流单，系统自动预填 SKU 和数量，我补充物流供应商、港口、装柜信息和费用,
So that 物流单创建时自动继承发货需求信息，减少重复输入。

**Acceptance Criteria:**

**Given** 商务跟单在发货需求详情页点击"创建物流单"（UX-DR27）
**When** 跳转到物流单创建表单
**Then** 自动关联当前发货需求，发货需求编号灰色底不可编辑（UX-DR29）
**And** 货物明细表自动预填：SKU 编码/名称/数量（从发货需求行项继承，数量可编辑）

**Given** 商务跟单在物流单创建表单
**When** 填写物流信息
**Then** 表单分组卡片：① 基本信息（物流供应商-必填 EntitySearchSelect、运输方式-下拉（海运/陆运/空运/快递）-必填、公司主体-必填 EntitySearchSelect、起运港-必填 EntitySearchSelect、目的港/目的地-必填 EntitySearchSelect、运抵国-必填）；② 货物明细表（预填，可编辑：数量、箱数、每箱数量、长×宽×高 cm、毛重 kg）；③ 报关信息（是否出口报关-开关、唛头-文本，选填）；④ 备注（FR31）
**And** 物流跟踪字段（ETD/ETA/订舱号/船司·航司/船名航次/SO·提单号/实际离港日期）创建时不展示在表单中；物流单确认后，可在详情页物流跟踪卡片随时补填或更新（FR32）

**Given** 商务跟单填写完整物流单
**When** 点击"提交"
**Then** Popconfirm 确认后物流单创建成功，状态为"待出库"（FR30）
**And** 物流单编号自动生成

**Given** 后端物流单实体
**When** 查看设计
**Then** 包含 id、logistics_code（自动生成）、shipping_demand_id（外键）、logistics_provider_id（外键）、transport_mode（海运/陆运/空运/快递）、company_id（外键，公司主体）、departure_port_id（外键）、destination_port_id（外键）、destination_country（运抵国）、etd（预计离港日期，可空）、eta（预计到港日期，可空）、booking_number（订舱号，可空）、carrier（船司/航司，可空）、vessel_voyage（船名航次，可空）、bl_so_number（SO/提单号，可空）、actual_departure_date（实际离港日期，可空）、is_customs_declaration（布尔，是否出口报关）、shipping_mark（唛头，可空）、status（待出库/已出库）、remark、created_at、updated_at、created_by、updated_by（FR31）
**And** 物流单货物行项：id、logistics_order_id（外键）、sku_id（外键）、quantity、boxes、quantity_per_box、length_cm、width_cm、height_cm、gross_weight_kg、created_at、updated_at

### Story 7.2: 物流单列表与详情

As a 授权用户,
I want 查看物流单列表（按状态和物流供应商筛选）和物流单详情,
So that 我可以跟踪物流进度和查看货物、费用明细。

**Acceptance Criteria:**

**Given** 授权用户进入物流单列表页
**When** 页面加载完成
**Then** 展示物流单列表（ProTable），含列：物流单编号（蓝色链接）、关联发货需求编号（蓝色链接）、物流供应商、起运港/目的港、装柜方式、状态（彩色 Tag）、创建时间
**And** 支持按状态筛选、按物流供应商筛选、关键字搜索、分页

**Given** 授权用户点击物流单编号
**When** 进入物流单详情页
**Then** 展示标准详情页（UX-DR05）：① 基本信息卡片（物流供应商、运输方式、公司主体、起运港/目的港、运抵国）；② 物流跟踪卡片（ETD/ETA/订舱号/船司·航司/船名航次/SO·提单号/实际离港日期，字段可为空时展示"-"）；③ 货物明细表格（SKU/箱数/每箱数量/尺寸/毛重）；④ 报关信息（是否出口报关、唛头）；⑤ 费用明细（Story 7.5 落地）；⑥ 关联单据（发货需求链接、出库单链接）
**And** ActivityTimeline 展示创建、物流跟踪更新、出库等事件

**Given** 授权用户在物流单详情页（物流单状态为"待出库"或"已出库"）
**When** 点击物流跟踪卡片的"编辑"按钮
**Then** 物流跟踪字段切换为内联编辑模式（ETD/ETA/订舱号/船司·航司/船名航次/SO·提单号/实际离港日期，均为可空选填）
**And** 保存后物流跟踪信息更新，ActivityTimeline 自动新增"物流跟踪信息更新"事件记录（FR32）

### Story 7.3: 发货出库单创建与确认

As a 仓管,
I want 创建出库单关联已有的物流单，选择出库仓库，确认后系统自动按 FIFO 扣减库存并释放锁定,
So that 发货操作有完整记录，库存数据实时准确反映出库。

**Acceptance Criteria:**

**Given** 仓管进入出库单创建表单
**When** 选择关联物流单（EntitySearchSelect，仅展示"待出库"状态的物流单）
**Then** 自动预填物流单货物行项：SKU 编码/名称/应出数量（只读）
**And** 每行新增可编辑字段：实际出库数量（必填，正整数）、出库仓库（必填，EntitySearchSelect）

**Given** 仓管填写完整出库信息
**When** 点击"确认出库"
**Then** Popconfirm 确认后执行出库逻辑
**And** 响应时间 < 3 秒（NFR-P5，含库存更新）

**Given** 出库确认执行成功
**When** 后端处理完成
**Then** ① 按 FIFO（入库日期最早的批次优先）扣减批次层 batch_quantity（FR46）
**And** ② 释放对应批次的 batch_locked_quantity
**And** ③ 汇总层 actual_quantity 减少、locked_quantity 减少
**And** ④ available_quantity 保持正确（= actual - locked）
**And** ⑤ 库存变动流水自动记录（change_type=发货出库）

**Given** 出库数量超过本发货需求在该仓库的锁定量
**When** 提交时后端校验
**Then** 返回明确错误信息，包含当前本发货需求锁定数量（FR47、NFR-U3）

**Given** 后端出库单实体
**When** 查看设计
**Then** 包含 id、outbound_code（自动生成）、logistics_order_id（外键）、status（已确认）、remark、created_at、updated_at、created_by、updated_by
**And** 出库行项：id、outbound_id（外键）、sku_id（外键）、outbound_quantity、warehouse_id（外键）、created_at、updated_at

### Story 7.4: 发货出库后状态联动

As a 系统,
I want 出库确认后自动更新关联物流单状态为"已出库"，发货需求状态为"部分发货/已发货"，销售订单状态为"部分发货/已发货",
So that 状态流转自动化，无需人工逐一更新。

**Acceptance Criteria:**

**Given** 出库单确认成功
**When** 后端检查关联链路
**Then** 物流单状态更新为"已出库"（FR34）

**Given** 物流单状态更新为"已出库"
**When** 后端检查发货需求下所有物流单状态
**Then** 若发货需求部分 SKU 已出库则状态更新为"部分发货"，若全部 SKU 均已出库则状态更新为"已发货"（FR30）

**Given** 发货需求状态更新为"部分发货"或"已发货"
**When** 后端检查关联销售订单
**Then** 若销售订单部分发货需求/部分 SKU 已发货则状态更新为"部分发货"，若全部发货完成则状态更新为"已发货"（FR25）

**Given** 状态联动完成
**When** 查看各详情页
**Then** 物流单详情展示绿色"已出库" Tag
**And** 发货需求详情 FlowProgress 进度条更新至"出库发货"步骤
**And** 销售订单详情展示绿色"已发货" Tag
**And** 各页面 ActivityTimeline 自动新增状态变更事件记录

### ~~Story 7.5: 物流单费用管理~~（已移出 MVP）

> **Post-MVP**：物流费用管理在 PRD 中明确列为 Post-MVP 功能，本 Story 移出 Epic 7 MVP 范围。待 PRD 补充 FR50 后，在后续迭代中实现。

## Epic 8: 发货需求枢纽库存决策

发货需求状态根据库存分配进展（履行类型集中确认保存、所有 SKU 锁定完成、物流单出库确认）自动推进，FlowProgress 进度条实时反映当前阶段，商务跟单无需手动更新状态。

**FRs covered:** （状态机自动流转，依赖 FR26/FR49 在 Epic 5 完整实现后触发）
**UX-DRs addressed:** UX-DR08

### Story 8.1: 发货需求状态自动流转

As a 商务跟单,
I want 完成"确认分配"操作或关联采购收货后，发货需求状态自动推进，FlowProgress 进度条实时反映当前阶段,
So that 我无需手动维护状态，系统状态始终与业务进展保持一致。

**Acceptance Criteria:**

**Given** 商务跟单在发货需求详情页点击"确认分配"按钮（Story 5.4，集中提交所有 SKU 行的履行类型）
**When** 所有 SKU 行均已设置履行类型，且系统成功执行库存锁定
**Then** 发货需求状态从"待分配库存"按履行类型自动更新：若有需采购的 SKU 则进入"采购中"，若全部使用现有库存且锁定完成则进入"已备货完成"
**And** FlowProgress 进度条推进至"采购备货"步骤（若有需采购的 SKU）或"库存锁定"步骤（若所有 SKU 均走库存）

**Given** 发货需求处于"采购中"，所有 SKU 行均完成库存锁定（"使用现有库存"已在确认分配时锁定 + "请购型"采购订单收货后自动锁定）
**When** 后端检查所有行锁定状态（在任意锁定操作完成后触发检查）
**Then** 发货需求状态自动更新为"已备货完成"
**And** FlowProgress 进度条推进至"库存锁定"步骤
**And** 发货需求详情页"创建物流单"按钮变为可点击状态

**Given** 发货需求关联的所有物流单均已确认出库
**When** Story 7.4 状态联动触发
**Then** 发货需求状态更新为"部分发货"或"已发货"
**And** FlowProgress 进度条推进至"完成"步骤

**Given** 任意状态流转发生
**When** 查看发货需求详情页
**Then** FlowProgress 实时反映当前步骤（UX-DR08）
**And** SmartButton 计数器实时更新关联单据数量（UX-DR09）
**And** ActivityTimeline 自动新增状态变更事件
