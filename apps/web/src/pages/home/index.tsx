import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth.store';
import {
  heroMetrics,
  kpis,
  urgentTasks,
  quickLinks,
  moduleHealth,
  riskBoard,
  trendData,
  skuStatusData,
  templateStatusData,
  supplierStatusData,
  certificateStatusData,
} from './dashboard.mock';
import '../master-data/master-page.css';
import './dashboard.css';

type TimeSlot = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
type Tone = 'blue' | 'green' | 'amber' | 'sky' | 'red' | 'emerald';

function getTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return 'dawn';
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'noon';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
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

const KPI_ICONS = [
  <AppstoreOutlined />,
  <ShoppingOutlined />,
  <TeamOutlined />,
  <UserOutlined />,
  <SafetyCertificateOutlined />,
  <FileTextOutlined />,
] as const;

function formatTooltipValue(value: number | string | undefined, unit: string): [string, string] {
  const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
  return [`${numericValue} ${unit}`, ''];
}

function HeroMetric({
  label,
  value,
  unit,
  delta,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  delta: string;
  tone: Tone;
}) {
  return (
    <div className="dash-hero-metric">
      <div className="dash-hero-metric-label">{label}</div>
      <div className="dash-hero-metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <div className={`dash-hero-metric-delta tone-${tone}`}>{delta}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  delta,
  helper,
  tone,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  delta: string;
  helper: string;
  tone: Tone;
  icon: React.ReactNode;
}) {
  return (
    <div className="dash-kpi-card">
      <div className={`dash-kpi-icon tone-${tone}`}>{icon}</div>
      <div className="dash-kpi-body">
        <div className="dash-kpi-label">{label}</div>
        <div className="dash-kpi-value">
          {value.toLocaleString()}
          <span>{unit}</span>
        </div>
        <div className="dash-kpi-meta">
          <strong className={`tone-${tone}`}>{delta}</strong>
          <span>{helper}</span>
        </div>
      </div>
    </div>
  );
}

function SurfaceCard({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="dash-surface-card">
      <div className="dash-surface-head">
        <div className="dash-surface-title">{title}</div>
        {extra ? <div className="dash-surface-extra">{extra}</div> : null}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const name = user?.name || user?.username || '用户';
  const greeting = GREETINGS[getTimeSlot()];
  const dateStr = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="dash-page dash-workbench">
      <div className="dash-hero-grid">
        <section className="dash-hero-panel">
          <div className="dash-hero-kicker">今日工作面板</div>
          <div className="dash-hero-title">
            {greeting}，{name}
          </div>
          <div className="dash-hero-description">
            {dateStr} · 今天优先处理履约、合规和资料闭环。先把高风险节点清掉，再看趋势和结构数据。
          </div>
          <div className="dash-hero-pill-row">
            <span>待履约 27 单</span>
            <span>证书预警 9 张</span>
            <span>资料缺口 14 项</span>
          </div>
          <div className="dash-hero-metrics">
            {heroMetrics.map((metric) => (
              <HeroMetric
                key={metric.label}
                label={metric.label}
                value={metric.value}
                unit={metric.unit}
                delta={metric.delta}
                tone={metric.tone}
              />
            ))}
          </div>
        </section>

        <SurfaceCard title="今日最该处理">
          <div className="dash-task-list">
            {urgentTasks.map((task) => (
              <div key={task.label} className="dash-task-item">
                <div className="dash-task-copy">
                  <div className="dash-task-label">{task.label}</div>
                  <div className="dash-task-note">{task.note}</div>
                </div>
                <div className={`dash-task-value tone-${task.tone}`}>{task.value}</div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="dash-section-label">核心指标</div>
      <div className="dash-kpi-grid">
        {kpis.map((item, index) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={item.value}
            unit={item.unit}
            delta={item.delta}
            helper={item.helper}
            tone={item.tone}
            icon={KPI_ICONS[index]}
          />
        ))}
      </div>

      <div className="dash-section-label">工作台视图</div>
      <div className="dash-main-grid">
        <SurfaceCard title="业务走势" extra={<span className="dash-extra-note">销售 / 采购 / 库存</span>}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip formatter={(value) => formatTooltipValue(value as number, '项')} />
              <Line type="monotone" dataKey="sales" name="销售" stroke="#2563EB" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="purchase" name="采购" stroke="#14B8A6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="inventory" name="库存" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </SurfaceCard>

        <SurfaceCard title="快捷入口">
          <div className="dash-entry-grid">
            {quickLinks.map((item) => (
              <div key={item.label} className="dash-entry-card">
                <div>
                  <div className="dash-entry-title">{item.label}</div>
                  <div className="dash-entry-desc">{item.description}</div>
                </div>
                <ArrowRightOutlined className="dash-entry-arrow" />
              </div>
            ))}
          </div>

          <div className="dash-subsection-title">模块健康度</div>
          <div className="dash-health-list">
            {moduleHealth.map((item) => (
              <div key={item.label} className="dash-health-item">
                <div className="dash-health-row">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="dash-health-bar">
                  <span className={`dash-health-fill tone-${item.tone}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="风险与依赖">
          <div className="dash-risk-list">
            {riskBoard.map((item) => (
              <div key={item.item} className="dash-risk-row">
                <span>{item.item}</span>
                <strong className={`tone-${item.tone}`}>{item.status}</strong>
                <span>{item.owner}</span>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="dash-section-label">结构分析</div>
      <div className="dash-analysis-grid">
        <SurfaceCard title="SKU 状态分布">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={skuStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={82}
                label={({ name: itemName, percent }) => `${itemName} ${(((percent ?? 0) * 100)).toFixed(0)}%`}
                labelLine={false}
              >
                {skuStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatTooltipValue(value as number, '个')} />
            </PieChart>
          </ResponsiveContainer>
        </SurfaceCard>

        <SurfaceCard title="合同模板状态">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={templateStatusData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
              <Tooltip formatter={(value) => formatTooltipValue(value as number, '份')} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {templateStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SurfaceCard>

        <SurfaceCard title="供应商状态分布">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={supplierStatusData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={76}>
                {supplierStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatTooltipValue(value as number, '家')} />
            </PieChart>
          </ResponsiveContainer>
        </SurfaceCard>

        <SurfaceCard title="证书有效性">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={certificateStatusData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={76}>
                {certificateStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatTooltipValue(value as number, '张')} />
            </PieChart>
          </ResponsiveContainer>
        </SurfaceCard>
      </div>
    </div>
  );
}
