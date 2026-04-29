import type { ReactNode } from 'react';
import { Tooltip, Tag } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const ACTION_TYPE_LABELS = {
  CREATE: '新增',
  UPDATE: '更新',
  DELETE: '删除',
} as const;

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
  records: Array<{
    key: string;
    operator: string;
    action: string;
    time: string;
    actionType?: 'CREATE' | 'UPDATE' | 'DELETE';
    changes?: Array<{
      key: string;
      fieldLabel: string;
      oldValue: string;
      newValue: string;
    }>;
  }>;
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
            <div className="master-tl-head">
              <div className="master-tl-operator">操作人：{record.operator}</div>
              {record.actionType ? (
                <Tag className={`master-tl-tag master-tl-tag-${record.actionType.toLowerCase()}`}>
                  {ACTION_TYPE_LABELS[record.actionType]}
                </Tag>
              ) : null}
            </div>
            <div className="master-tl-action">操作记录：{record.action}</div>
            {record.changes?.length ? (
              <div className="master-tl-changes">
                {record.changes.map((change) => {
                  const isLongChange =
                    change.oldValue.length > 80 ||
                    change.newValue.length > 80 ||
                    change.oldValue.includes('\n') ||
                    change.newValue.includes('\n');

                  return (
                    <div
                      className={`master-tl-change-chip${isLongChange ? ' master-tl-change-chip-block' : ''}`}
                      key={change.key}
                    >
                      <span className="master-tl-change-field">{change.fieldLabel}</span>
                      <span className="master-tl-change-old">{change.oldValue}</span>
                      <span className="master-tl-change-arrow">→</span>
                      <span className="master-tl-change-new">{change.newValue}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <Tooltip title={dayjs(record.time).fromNow()}>
              <div className="master-tl-time">操作时间：{dayjs(record.time).format('YYYY-MM-DD HH:mm:ss')}</div>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}
