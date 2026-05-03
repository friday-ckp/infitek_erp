export const heroMetrics = [
  { label: '待履约订单', value: 27, unit: '单', delta: '较昨日 -3', tone: 'blue' },
  { label: '证书预警', value: 9, unit: '张', delta: '7 天内到期', tone: 'red' },
  { label: '资料缺口', value: 14, unit: '项', delta: '重点 SKU 4 个', tone: 'amber' },
] as const;

export const kpis = [
  {
    label: 'SKU 总数',
    value: 248,
    unit: '个',
    delta: '+12',
    tone: 'blue',
    helper: '近 30 天净增',
  },
  {
    label: 'SPU 总计',
    value: 86,
    unit: '个',
    delta: '+5',
    tone: 'green',
    helper: '近 30 天新增',
  },
  {
    label: '供应商',
    value: 34,
    unit: '家',
    delta: '+2',
    tone: 'amber',
    helper: '合作主体',
  },
  {
    label: '客户',
    value: 52,
    unit: '家',
    delta: '+6',
    tone: 'sky',
    helper: '活跃客户',
  },
  {
    label: '有效证书',
    value: 41,
    unit: '张',
    delta: '+4',
    tone: 'green',
    helper: '当前有效',
  },
  {
    label: '已通过合同模板',
    value: 7,
    unit: '份',
    delta: '+1',
    tone: 'blue',
    helper: '可复用模板',
  },
] as const;

export const urgentTasks = [
  {
    label: '证书即将到期',
    value: 9,
    note: '本周内需复核，涉及德国与美国客户包',
    tone: 'red',
  },
  {
    label: '待提交合同模板',
    value: 3,
    note: '采购与法务待确认，影响新采购单创建',
    tone: 'amber',
  },
  {
    label: '待完善产品资料',
    value: 14,
    note: '涉及 4 个重点 SKU，影响销售与发货资料齐套',
    tone: 'blue',
  },
] as const;

export const quickLinks = [
  { label: '销售订单', description: '录入新订单并确认客户需求' },
  { label: '发货需求', description: '查看待履约与备货状态' },
  { label: '采购订单', description: '跟进采购在途与交期' },
  { label: '库存查询', description: '核对可用库存和锁定量' },
] as const;

export const moduleHealth = [
  { label: '销售履约完整度', value: 82, tone: 'blue' },
  { label: '采购跟单完成度', value: 68, tone: 'amber' },
  { label: '产品资料齐备率', value: 74, tone: 'green' },
  { label: '合规证书有效率', value: 81, tone: 'emerald' },
] as const;

export const riskBoard = [
  {
    item: '美国插头资料包',
    status: '缺少 UL 证书',
    owner: '产品资料组',
    tone: 'red',
  },
  {
    item: '采购合同条款模板',
    status: '待法务复核',
    owner: '采购中心',
    tone: 'amber',
  },
  {
    item: '发货需求 SD-2031',
    status: '待库存确认',
    owner: '商务履约组',
    tone: 'blue',
  },
  {
    item: '德国客户证书包',
    status: '7 天内到期',
    owner: '合规专员',
    tone: 'red',
  },
] as const;

export const trendData = [
  { month: '11月', sales: 126, purchase: 98, inventory: 72 },
  { month: '12月', sales: 132, purchase: 103, inventory: 75 },
  { month: '1月', sales: 138, purchase: 108, inventory: 78 },
  { month: '2月', sales: 146, purchase: 112, inventory: 83 },
  { month: '3月', sales: 154, purchase: 118, inventory: 87 },
  { month: '4月', sales: 162, purchase: 125, inventory: 92 },
] as const;

export const skuStatusData = [
  { name: '上架', value: 128, color: '#2563EB' },
  { name: '下架可售', value: 64, color: '#F59E0B' },
  { name: '下架不可售', value: 38, color: '#EF4444' },
  { name: '临拓', value: 18, color: '#94A3B8' },
] as const;

export const templateStatusData = [
  { name: '待提交', value: 3, color: '#2563EB' },
  { name: '审核中', value: 2, color: '#0EA5E9' },
  { name: '审核通过', value: 7, color: '#22C55E' },
  { name: '已拒绝', value: 1, color: '#EF4444' },
  { name: '已作废', value: 4, color: '#94A3B8' },
] as const;

export const supplierStatusData = [
  { name: '合作', value: 24, color: '#2563EB' },
  { name: '临拓', value: 7, color: '#F59E0B' },
  { name: '淘汰', value: 3, color: '#94A3B8' },
] as const;

export const certificateStatusData = [
  { name: '有效', value: 41, color: '#22C55E' },
  { name: '预警', value: 6, color: '#F59E0B' },
  { name: '过期', value: 3, color: '#EF4444' },
] as const;
