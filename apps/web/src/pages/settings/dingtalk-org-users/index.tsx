import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  confirmDingtalkOrgUserBinding,
  getDingtalkOrgUsers,
  manualBindDingtalkOrgUser,
  recomputeDingtalkOrgUserMatch,
  syncDingtalkOrgUsers,
  unbindDingtalkOrgUser,
} from '../../../api/dingtalk-org-users.api';
import type { DingtalkOrgUser, DingtalkOrgUserStatus } from '../../../api/dingtalk-org-users.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import '../../master-data/master-page.css';

const { Option } = Select;

interface OrgUserState {
  data: DingtalkOrgUser[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  keyword: string;
  statusFilter: DingtalkOrgUserStatus | '';
}

export default function DingtalkOrgUsersPage() {
  const navigate = useNavigate();
  const [syncLoading, setSyncLoading] = useState(false);
  const [orgActionLoading, setOrgActionLoading] = useState<string | null>(null);
  const [manualBindModalOpen, setManualBindModalOpen] = useState(false);
  const [selectedOrgUser, setSelectedOrgUser] = useState<DingtalkOrgUser | null>(null);
  const [manualBindUserId, setManualBindUserId] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [statusInput, setStatusInput] = useState<DingtalkOrgUserStatus | ''>('');
  const [state, setState] = useState<OrgUserState>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    keyword: '',
    statusFilter: '',
  });

  const fetchOrgUsers = async (
    page: number = 1,
    keyword: string = '',
    status: DingtalkOrgUserStatus | '' = '',
    pageSize?: number,
  ) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await getDingtalkOrgUsers(page, pageSize ?? state.pageSize, keyword || undefined, status || undefined);
      setState((prev) => ({
        ...prev,
        data: data.list,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        loading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchOrgUsers();
  }, []);

  const hasFilters = Boolean(keywordInput || statusInput);

  const reload = () => fetchOrgUsers(state.page, state.keyword, state.statusFilter, state.pageSize);

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const result = await syncDingtalkOrgUsers();
      message.success(`同步完成：共 ${result.total} 条，新增 ${result.created} 条，更新 ${result.updated} 条，已绑定 ${result.bound} 条`);
      reload();
    } catch {
      // handled by interceptor
    } finally {
      setSyncLoading(false);
    }
  };

  const handleConfirmBinding = async (record: DingtalkOrgUser) => {
    setOrgActionLoading(`confirm-${record.id}`);
    try {
      await confirmDingtalkOrgUserBinding(record.id);
      message.success('候选绑定已确认');
      reload();
    } catch {
      // handled by interceptor
    } finally {
      setOrgActionLoading(null);
    }
  };

  const handleManualBind = async () => {
    if (!selectedOrgUser || !manualBindUserId) {
      message.error('请输入目标 ERP 用户 ID');
      return;
    }

    setOrgActionLoading(`manual-${selectedOrgUser.id}`);
    try {
      await manualBindDingtalkOrgUser(selectedOrgUser.id, manualBindUserId);
      message.success('手工绑定已完成');
      setManualBindModalOpen(false);
      setSelectedOrgUser(null);
      setManualBindUserId('');
      reload();
    } catch {
      // handled by interceptor
    } finally {
      setOrgActionLoading(null);
    }
  };

  const handleUnbind = async (record: DingtalkOrgUser) => {
    setOrgActionLoading(`unbind-${record.id}`);
    try {
      await unbindDingtalkOrgUser(record.id);
      message.success('绑定关系已解绑');
      reload();
    } catch {
      // handled by interceptor
    } finally {
      setOrgActionLoading(null);
    }
  };

  const handleRecompute = async (record: DingtalkOrgUser) => {
    setOrgActionLoading(`recompute-${record.id}`);
    try {
      await recomputeDingtalkOrgUserMatch(record.id);
      message.success('匹配建议已重新计算');
      reload();
    } catch {
      // handled by interceptor
    } finally {
      setOrgActionLoading(null);
    }
  };

  const columns = useMemo(() => [
    { title: 'UnionID', dataIndex: 'unionId', key: 'unionId', ellipsis: true },
    { title: '昵称', dataIndex: 'nick', key: 'nick', render: (value: string | null | undefined) => value || '—' },
    { title: '手机号', dataIndex: 'mobile', key: 'mobile', render: (value: string | null | undefined) => value || '—' },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (value: string | null | undefined) => value || '—' },
    { title: '工号', dataIndex: 'jobNumber', key: 'jobNumber', render: (value: string | null | undefined) => value || '—' },
    {
      title: '部门',
      dataIndex: 'departmentNames',
      key: 'departmentNames',
      render: (value: string[] | null | undefined) => value?.length ? value.join(' / ') : '—',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DingtalkOrgUserStatus) => {
        const statusMap = {
          UNBOUND: { color: 'default', text: '未绑定' },
          CANDIDATE: { color: 'processing', text: '候选' },
          CONFLICT: { color: 'warning', text: '冲突' },
          BOUND: { color: 'success', text: '已绑定' },
        } as const;
        const current = statusMap[status];
        return <Tag color={current.color}>{current.text}</Tag>;
      },
    },
    {
      title: '建议匹配',
      key: 'suggested',
      render: (_: unknown, record: DingtalkOrgUser) => {
        if (!record.suggestedUserId) {
          return '—';
        }
        return [record.suggestedUsername, record.suggestedUserName, `#${record.suggestedUserId}`]
          .filter(Boolean)
          .join(' / ');
      },
    },
    {
      title: '匹配依据',
      dataIndex: 'matchReason',
      key: 'matchReason',
      render: (value: string | null | undefined) => value || '—',
    },
    {
      title: '最近同步',
      dataIndex: 'lastSyncedAt',
      key: 'lastSyncedAt',
      render: (value: string | null | undefined) => value ? new Date(value).toLocaleString() : '—',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: DingtalkOrgUser) => (
        <Space wrap>
          {record.status === 'CANDIDATE' && (
            <Button type="link" loading={orgActionLoading === `confirm-${record.id}`} onClick={() => handleConfirmBinding(record)}>
              确认绑定
            </Button>
          )}
          {(record.status === 'UNBOUND' || record.status === 'CONFLICT') && (
            <Button
              type="link"
              onClick={() => {
                setSelectedOrgUser(record);
                setManualBindUserId(record.suggestedUserId ? String(record.suggestedUserId) : '');
                setManualBindModalOpen(true);
              }}
            >
              手工绑定
            </Button>
          )}
          {record.status === 'BOUND' && (
            <Popconfirm
              title="解绑当前绑定关系"
              description="解绑后该记录会回到待处理状态，确定继续？"
              onConfirm={() => handleUnbind(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger loading={orgActionLoading === `unbind-${record.id}`}>
                解绑
              </Button>
            </Popconfirm>
          )}
          <Button type="link" loading={orgActionLoading === `recompute-${record.id}`} onClick={() => handleRecompute(record)}>
            重算建议
          </Button>
        </Space>
      ),
    },
  ], [orgActionLoading]);

  const activeTags: ActiveTag[] = [
    keywordInput
      ? {
          key: 'keyword',
          label: `关键词: ${keywordInput}`,
          onClose: () => {
            setKeywordInput('');
            setState((prev) => ({ ...prev, keyword: '', page: 1 }));
            fetchOrgUsers(1, '', statusInput);
          },
        }
      : null,
    statusInput
      ? {
          key: 'status',
          label: `状态: ${statusInput === 'UNBOUND' ? '未绑定' : statusInput === 'CANDIDATE' ? '候选' : statusInput === 'CONFLICT' ? '冲突' : '已绑定'}`,
          onClose: () => {
            setStatusInput('');
            setState((prev) => ({ ...prev, statusFilter: '', page: 1 }));
            fetchOrgUsers(1, keywordInput, '');
          },
        }
      : null,
  ].filter(Boolean) as ActiveTag[];

  return (
    <div className="master-page">
      <div className="master-page-shell">
        <div className="master-page-header">
          <div className="master-page-heading">
            <div className="master-page-title">钉钉用户同步与绑定管理</div>
            <div className="master-page-description">集中处理同步结果、匹配候选、冲突记录和正式绑定关系。</div>
          </div>
          <div className="master-page-actions">
            <Button onClick={() => navigate('/settings/users')}>返回用户管理</Button>
            <Button type="primary" onClick={handleSync} loading={syncLoading}>同步钉钉组织用户</Button>
          </div>
        </div>

        <div className="master-list-shell">
          <SearchForm
            searchValue={keywordInput}
            onSearchChange={setKeywordInput}
            placeholder="搜索 UnionID、昵称、手机号、邮箱、工号"
            activeTags={activeTags}
            onClearAll={() => {
              setKeywordInput('');
              setStatusInput('');
              setState((prev) => ({ ...prev, keyword: '', statusFilter: '', page: 1 }));
              fetchOrgUsers(1, '', '');
            }}
            onQuery={() => {
              setState((prev) => ({ ...prev, keyword: keywordInput, statusFilter: statusInput, page: 1 }));
              fetchOrgUsers(1, keywordInput, statusInput);
            }}
            onReset={() => {
              setKeywordInput('');
              setStatusInput('');
              setState((prev) => ({ ...prev, keyword: '', statusFilter: '', page: 1 }));
              fetchOrgUsers(1, '', '');
            }}
            advancedContent={(
              <Select
                value={statusInput || undefined}
                placeholder="全部状态"
                onChange={(value) => setStatusInput(value ?? '')}
                style={{ width: 160 }}
                allowClear
                onClear={() => setStatusInput('')}
              >
                <Option value="UNBOUND">未绑定</Option>
                <Option value="CANDIDATE">候选</Option>
                <Option value="CONFLICT">冲突</Option>
                <Option value="BOUND">已绑定</Option>
              </Select>
            )}
          />

          {hasFilters && !state.loading && state.data.length === 0 ? (
            <Empty description="未找到匹配记录">
              <Button type="link" onClick={() => {
                setKeywordInput('');
                setStatusInput('');
                setState((prev) => ({ ...prev, keyword: '', statusFilter: '', page: 1 }));
                fetchOrgUsers(1, '', '');
              }}>
                清除筛选条件
              </Button>
            </Empty>
          ) : (
            <div className="master-table-shell">
              <Table
                dataSource={state.data}
                columns={columns}
                rowKey="id"
                loading={state.loading}
                pagination={{
                  current: state.page,
                  pageSize: state.pageSize,
                  total: state.total,
                  showSizeChanger: true,
                  pageSizeOptions: [10, 20, 50],
                  showTotal: (total) => `共 ${total} 条记录`,
                  onChange: (page, pageSize) => {
                    const newPage = pageSize !== state.pageSize ? 1 : page;
                    setState((prev) => ({ ...prev, page: newPage, pageSize }));
                    fetchOrgUsers(newPage, state.keyword, state.statusFilter, pageSize);
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        title="手工绑定钉钉用户"
        open={manualBindModalOpen}
        onCancel={() => {
          setManualBindModalOpen(false);
          setSelectedOrgUser(null);
          setManualBindUserId('');
        }}
        onOk={handleManualBind}
        okText="确认绑定"
        cancelText="取消"
        confirmLoading={Boolean(selectedOrgUser && orgActionLoading === `manual-${selectedOrgUser.id}`)}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>当前记录：{selectedOrgUser?.nick || selectedOrgUser?.unionId || '—'}</div>
          <Input
            value={manualBindUserId}
            onChange={(e) => setManualBindUserId(e.target.value)}
            placeholder="请输入 ERP 用户 ID"
          />
        </Space>
      </Modal>
    </div>
  );
}
