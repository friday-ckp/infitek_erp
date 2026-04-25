import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth.store';
import {
  kpis, skuStatusData, templateStatusData,
  trendData, supplierStatusData, certificateStatusData,
} from './dashboard.mock';
import '../master-data/master-page.css';
import './dashboard.css';

type TimeSlot = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

function getTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h >= 0 && h < 5)  return 'dawn';
  if (h >= 5 && h < 9)  return 'morning';
  if (h >= 9 && h < 12) return 'noon';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

const GREETINGS: Record<TimeSlot, string> = {
  dawn: '凌晨好',
  morning: '早上好',
  noon: '上午好',
  afternoon: '下午好',
  evening: '晚上好',
  night: '夜里好',
};

type StatColor = 'blue' | 'green' | 'orange' | 'gray' | 'red';

function formatTooltipValue(value: number | string | undefined, unit: string): [string, string] {
  const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
  return [`${numericValue} ${unit}`, ''];
}

function normalizeChartValue(value: number | string | ReadonlyArray<number | string> | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function StatCard({ label, value, unit = '', icon, color }: {
  label: string; value: number; unit?: string;
  icon: React.ReactNode; color: StatColor;
}) {
  return (
    <div className="dash-stat-card">
      <div className={`dash-stat-icon dash-stat-icon-${color}`}>{icon}</div>
      <div className="dash-stat-body">
        <div className="dash-stat-value">
          {value.toLocaleString()}
          {unit && <span className="dash-stat-unit">{unit}</span>}
        </div>
        <div className="dash-stat-label">{label}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dash-chart-card">
      <div className="dash-chart-title">{title}</div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.name || user?.username || '用户';
  const greeting = GREETINGS[getTimeSlot()];
  const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="dash-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">数据概览</div>
          <div className="master-page-description">{greeting}，{name} · {dateStr} · Infitek ERP 主数据核心概览</div>
        </div>
      </div>

      <div className="dash-section-label">核心指标</div>
      <div className="dash-stat-grid">
        <StatCard label="SKU 总数" value={kpis.skuTotal} unit="个" icon={<AppstoreOutlined />} color="blue" />
        <StatCard label="SPU 总计" value={kpis.spuTotal} unit="个" icon={<ShoppingOutlined />} color="green" />
        <StatCard label="供应商" value={kpis.supplierTotal} unit="家" icon={<TeamOutlined />} color="orange" />
        <StatCard label="客户" value={kpis.customerTotal} unit="家" icon={<UserOutlined />} color="blue" />
        <StatCard label="有效证书" value={kpis.certificateValid} unit="张" icon={<SafetyCertificateOutlined />} color="green" />
        <StatCard label="已通过合同模板" value={kpis.contractApproved} unit="份" icon={<FileTextOutlined />} color="gray" />
      </div>

      <div className="dash-section-label">产品与合同分析</div>
      <div className="dash-chart-grid-3">
        <ChartCard title="SKU 状态分布">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={skuStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name: n, percent }) => `${n} ${(((percent ?? 0) * 100)).toFixed(0)}%`} labelLine={false}>
                {skuStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => formatTooltipValue(normalizeChartValue(value), '个')} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="合同模板状态分布">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={templateStatusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="数量" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="近 6 个月 SPU / SKU 趋势">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="spu" name="SPU" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="sku" name="SKU" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="dash-section-label">供应链 & 合规</div>
      <div className="dash-chart-grid-3">
        <ChartCard title="供应商状态分布">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={supplierStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72}>
                {supplierStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => formatTooltipValue(normalizeChartValue(value), '家')} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="证书有效性">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={certificateStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72}>
                {certificateStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => formatTooltipValue(normalizeChartValue(value), '张')} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="dash-chart-card dash-placeholder">
          <div className="dash-placeholder-label">销售 / 采购 / 库存</div>
          <div className="dash-placeholder-desc">业务模块数据<br />接口接入后展示</div>
        </div>
      </div>
    </div>
  );
}
