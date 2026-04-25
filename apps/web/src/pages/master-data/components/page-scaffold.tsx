import type { ReactNode } from 'react';

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function displayOrDash(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function MetaItem({
  label,
  value,
  full = false,
  className,
}: {
  label: string;
  value: ReactNode;
  full?: boolean;
  className?: string;
}) {
  return (
    <div className={joinClassNames('master-meta-item', full && 'full', className)}>
      <div className="master-meta-label">{label}</div>
      <div className={`master-meta-value${value === '—' ? ' empty' : ''}`}>{value}</div>
    </div>
  );
}

export function SummaryMetaItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="master-summary-meta-item">
      <div className="master-summary-meta-label">{label}</div>
      <div className={`master-summary-meta-value${value === '—' ? ' empty' : ''}`}>{value}</div>
    </div>
  );
}

export function AnchorNav({
  anchors,
  activeKey,
  onChange,
}: {
  anchors: Array<{ key: string; label: string }>;
  activeKey: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="master-anchor-nav">
      {anchors.map((anchor) => (
        <a
          key={anchor.key}
          href={`#${anchor.key}`}
          className={`master-anchor-link${activeKey === anchor.key ? ' active' : ''}`}
          onClick={() => onChange(anchor.key)}
        >
          {anchor.label}
        </a>
      ))}
    </div>
  );
}

export function SectionCard({
  id,
  title,
  description,
  extra,
  bodyClassName,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  extra?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="master-section-card">
      <div className="master-section-header">
        <div className="master-section-heading">
          <div className="master-section-title">{title}</div>
          {description ? <div className="master-section-description">{description}</div> : null}
        </div>
        {extra}
      </div>
      <div className={joinClassNames('master-section-body', bodyClassName)}>{children}</div>
    </section>
  );
}

export function OperationTimeline({
  records,
  emptyClassName,
}: {
  records: Array<{ key: string; operator: string; action: string; time: string }>;
  emptyClassName?: string;
}) {
  if (!records.length) {
    return <div className={`master-meta-value empty${emptyClassName ? ` ${emptyClassName}` : ''}`}>—</div>;
  }

  return (
    <div className="master-status-timeline">
      {records.map((record, index) => (
        <div className="master-tl-item" key={record.key}>
          <div className={`master-tl-dot${index === records.length - 1 ? ' gray' : ''}`} />
          <div className="master-tl-content">
            <div className="master-tl-operator">操作人：{record.operator}</div>
            <div className="master-tl-action">操作记录：{record.action}</div>
            <div className="master-tl-time">操作时间：{record.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
