import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getUsers, deactivateUser } from '../../../api/users.api';
import type { User } from '../../../api/users.api';
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
import { useAuthStore } from '../../../store/auth.store';
import '../../master-data/master-page.css';

const { Option } = Select;

interface ListState {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  search: string;
  statusFilter: string;
}

interface DingtalkOrgUserListState {
  data: DingtalkOrgUser[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  keyword: string;
  statusFilter: DingtalkOrgUserStatus | '';
}

export default function UsersList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.username === 'admin';
  const [state, setState] = useState<ListState>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    search: '',
    statusFilter: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [orgUserState, setOrgUserState] = useState<DingtalkOrgUserListState>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    keyword: '',
    statusFilter: '',
  });
  const [orgKeywordInput, setOrgKeywordInput] = useState('');
  const [orgStatusInput, setOrgStatusInput] = useState<DingtalkOrgUserStatus | ''>('');
  const [manualBindModalOpen, setManualBindModalOpen] = useState(false);
  const [selectedOrgUser, setSelectedOrgUser] = useState<DingtalkOrgUser | null>(null);
  const [manualBindUserId, setManualBindUserId] = useState('');
  const [orgActionLoading, setOrgActionLoading] = useState<string | null>(null);

  const fetchUsers = async (page: number = 1, search: string = '', status: string = '', pageSize?: number) => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await getUsers(
        page,
        pageSize ?? state.pageSize,
        search || undefined,
        (status as 'ACTIVE' | 'INACTIVE') || undefined,
      );
      setState((prev) => ({
        ...prev,
        data: data.list,
        total: data.total,
        page: data.page,
        loading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchDingtalkOrgUsers = async (
    page: number = 1,
    keyword: string = '',
    status: DingtalkOrgUserStatus | '' = '',
    pageSize?: number,
  ) => {
    setOrgUserState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await getDingtalkOrgUsers(
        page,
        pageSize ?? orgUserState.pageSize,
        keyword || undefined,
        status || undefined,
      );
      setOrgUserState((prev) => ({
        ...prev,
        data: data.list,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        loading: false,
      }));
    } catch {
      setOrgUserState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDingtalkOrgUsers();
    }
  }, [isAdmin]);

  const hasFilters = Boolean(searchInput || statusInput);

  const handleQuery = () => {
    setState((prev) => ({ ...prev, search: searchInput, statusFilter: statusInput, page: 1 }));
    fetchUsers(1, searchInput, statusInput);
  };

  const handleReset = () => {
    setSearchInput('');
    setStatusInput('');
    setState((prev) => ({ ...prev, search: '', statusFilter: '', page: 1 }));
    fetchUsers(1, '', '');
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateUser(id);
      message.success('用户已停用');
      fetchUsers(state.page, state.search, state.statusFilter);
    } catch {
      // 错误由拦截器统一处理
    }
  };

  const handleSyncDingtalkOrgUsers = async () => {
    setSyncLoading(true);
    try {
      const result = await syncDingtalkOrgUsers();
      message.success(
        `同步完成：共 ${result.total} 条，新增 ${result.created} 条，更新 ${result.updated} 条，已绑定 ${result.bound} 条`,
      );
      fetchDingtalkOrgUsers(orgUserState.page, orgUserState.keyword, orgUserState.statusFilter);
    } catch {
      // 错误由拦截器统一处理
    } finally {
      setSyncLoading(false);
    }
  };

  const reloadOrgUsers = () => {
    fetchDingtalkOrgUsers(orgUserState.page, orgUserState.keyword, orgUserState.statusFilter);
  };

  const handleConfirmBinding = async (record: DingtalkOrgUser) => {
    setOrgActionLoading(`confirm-${record.id}`);
    try {
      await confirmDingtalkOrgUserBinding(record.id);
      message.success('候选绑定已确认');
      reloadOrgUsers();
      fetchUsers(state.page, state.search, state.statusFilter);
    } catch {
      // 错误由拦截器统一处理
    } finally {
      setOrgActionLoading(null);
    }
  };

  const handleRecompute = async (record: DingtalkOrgUser) => {
    setOrgActionLoading(`recompute-${record.id}`);
    try {
      await recomputeDingtalkOrgUserMatch(record.id);
      message.success('匹配建议已重新计算');
      reloadOrgUsers();
    } catch {
      // 错误由拦截器统一处理
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
      reloadOrgUsers();
      fetchUsers(state.page, state.search, state.statusFilter);
    } catch {
      // 错误由拦截器统一处理
    } finally {
      setOrgActionLoading(null);
    }
  };

  const handleUnbindOrgUser = async (record: DingtalkOrgUser) => {
    setOrgActionLoading(`unbind-${record.id}`);
    try {
      await unbindDingtalkOrgUser(record.id);
      message.success('绑定关系已解绑');
      reloadOrgUsers();
      fetchUsers(state.page, state.search, state.statusFilter);
    } catch {
      // 错误由拦截器统一处理
    } finally {
      setOrgActionLoading(null);
    }
  };

  const columns = useMemo(() => [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '账号状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'processing' : undefined}>
          {status === 'active' ? '活跃' : '停用'}
        </Tag>
      ),
    },
    {
      title: '钉钉绑定',
      dataIndex: 'dingtalkBindingStatus',
      key: 'dingtalkBindingStatus',
      render: (status: string | undefined, record: User) => (
        status === 'BOUND'
          ? <span><Tag color="success">已绑定</Tag>{record.dingtalkBoundAt ? <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>{new Date(record.dingtalkBoundAt).toLocaleDateString()}</span> : null}</span>
          : <Tag>未绑定</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: User) => (
        <Space>
          <a onClick={() => navigate(`/settings/users/${record.id}`)}>查看</a>
          <a onClick={() => navigate(`/settings/users/${record.id}/edit`)}>编辑</a>
          {record.status === 'active' && (
            <Popconfirm
              title="停用用户"
              description="确定要停用此用户吗？停用后该账号将无法登录。"
              onConfirm={() => handleDeactivate(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <a style={{ color: '#ff4d4f' }}>停用</a>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [navigate, state.page, state.search, state.statusFilter]);

  const orgUserColumns = useMemo(() => [
    { title: 'UnionID', dataIndex: 'unionId', key: 'unionId', ellipsis: true },
    { title: '昵称', dataIndex: 'nick', key: 'nick', render: (value: string | null | undefined) => value || '—' },
    { title: '手机号', dataIndex: 'mobile', key: 'mobile', render: (value: string | null | undefined) => value || '—' },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (value: string | null | undefined) => value || '—' },
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
      title: '最近同步',
      dataIndex: 'lastSyncedAt',
      key: 'lastSyncedAt',
      render: (value: string | null | undefined) => value ? new Date(value).toLocaleString() : '—',
    },
    {
      title: '匹配建议',
      key: 'suggested',
      render: (_: unknown, record: DingtalkOrgUser) => {
        if (!record.suggestedUserId) {
          return '—';
        }
        const parts = [
          record.suggestedUsername,
          record.suggestedUserName,
          `#${record.suggestedUserId}`,
        ].filter(Boolean);
        return parts.join(' / ');
      },
    },
    {
      title: '匹配依据',
      dataIndex: 'matchReason',
      key: 'matchReason',
      render: (value: string | null | undefined) => value || '—',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: DingtalkOrgUser) => (
        <Space wrap>
          {record.status === 'CANDIDATE' && (
            <Button
              type="link"
              loading={orgActionLoading === `confirm-${record.id}`}
              onClick={() => handleConfirmBinding(record)}
            >
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
              onConfirm={() => handleUnbindOrgUser(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                loading={orgActionLoading === `unbind-${record.id}`}
              >
                解绑
              </Button>
            </Popconfirm>
          )}
          <Button
            type="link"
            loading={orgActionLoading === `recompute-${record.id}`}
            onClick={() => handleRecompute(record)}
          >
            重算建议
          </Button>
        </Space>
      ),
    },
  ], []);

  const activeTags: ActiveTag[] = [
    searchInput
      ? {
          key: 'search',
          label: `关键词: ${searchInput}`,
          onClose: () => {
            setSearchInput('');
            setState((prev) => ({ ...prev, search: '', page: 1 }));
            fetchUsers(1, '', statusInput);
          },
        }
      : null,
    statusInput
      ? {
          key: 'status',
          label: `状态: ${statusInput === 'ACTIVE' ? '活跃' : '停用'}`,
          onClose: () => {
            setStatusInput('');
            setState((prev) => ({ ...prev, statusFilter: '', page: 1 }));
            fetchUsers(1, searchInput, '');
          },
        }
      : null,
  ].filter(Boolean) as ActiveTag[];

  if (!state.loading && state.data.length === 0 && !hasFilters) {
    return (
      <div className="master-page">
        <div className="master-page-shell">
          <div className="master-page-header">
            <div className="master-page-heading">
              <div className="master-page-kicker">Basic Data</div>
              <div className="master-page-title">用户管理</div>
              <div className="master-page-description">统一维护系统账号与登录权限状态。</div>
            </div>
            <div className="master-page-actions">
              <Button type="primary" onClick={() => navigate('/settings/users/create')}>
                新建用户
              </Button>
              {isAdmin && (
                <Button onClick={handleSyncDingtalkOrgUsers} loading={syncLoading}>
                  同步钉钉组织用户
                </Button>
              )}
            </div>
          </div>
          <div className="master-list-shell">
            <Empty description="暂无用户数据">
              <Button type="primary" onClick={() => navigate('/settings/users/create')}>
                新建用户
              </Button>
            </Empty>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="master-page">
      <div className="master-page-shell">
        <div className="master-page-header">
          <div className="master-page-heading">
            <div className="master-page-title">用户管理</div>
            <div className="master-page-description">统一维护系统账号信息、状态以及后续的权限协作入口。</div>
          </div>
          <div className="master-page-actions">
            <Button type="primary" onClick={() => navigate('/settings/users/create')}>
              新建用户
            </Button>
            {isAdmin && (
              <Button onClick={handleSyncDingtalkOrgUsers} loading={syncLoading}>
                同步钉钉组织用户
              </Button>
            )}
          </div>
        </div>

        <div className="master-list-shell">
          <SearchForm
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            placeholder="搜索用户名或姓名"
            activeTags={activeTags}
            onClearAll={handleReset}
            onQuery={handleQuery}
            onReset={handleReset}
            advancedContent={(
              <Select
                value={statusInput || undefined}
                placeholder="全部状态"
                onChange={(v) => setStatusInput(v ?? '')}
                style={{ width: 160 }}
                allowClear
                onClear={() => setStatusInput('')}
              >
                <Option value="ACTIVE">活跃</Option>
                <Option value="INACTIVE">停用</Option>
              </Select>
            )}
          />

          {hasFilters && !state.loading && state.data.length === 0 ? (
            <Empty description="未找到匹配记录">
              <Button type="link" onClick={handleReset}>
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
                    fetchUsers(newPage, state.search, state.statusFilter, pageSize);
                  },
                }}
              />
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="master-section-card" style={{ marginTop: 24 }}>
            <div className="master-section-header">
              <div className="master-section-heading">
                <div className="master-section-title">钉钉组织用户池</div>
                <div className="master-section-description">
                  这里展示 Story 9.6 同步下来的钉钉组织用户，用于后续候选匹配和绑定处理。
                </div>
              </div>
            </div>
            <div className="master-section-body">
              <Space wrap style={{ width: '100%', marginBottom: 16, justifyContent: 'space-between' }}>
                <Space wrap>
                  <Input
                    value={orgKeywordInput}
                    onChange={(e) => setOrgKeywordInput(e.target.value)}
                    placeholder="搜索 UnionID、昵称、手机号、邮箱"
                    style={{ width: 280 }}
                    allowClear
                  />
                  <Select
                    value={orgStatusInput || undefined}
                    placeholder="全部状态"
                    onChange={(value) => setOrgStatusInput(value ?? '')}
                    style={{ width: 160 }}
                    allowClear
                    onClear={() => setOrgStatusInput('')}
                  >
                    <Option value="UNBOUND">未绑定</Option>
                    <Option value="CANDIDATE">候选</Option>
                    <Option value="CONFLICT">冲突</Option>
                    <Option value="BOUND">已绑定</Option>
                  </Select>
                </Space>
                <Space>
                  <Button
                    onClick={() => {
                      setOrgKeywordInput('');
                      setOrgStatusInput('');
                      setOrgUserState((prev) => ({
                        ...prev,
                        keyword: '',
                        statusFilter: '',
                        page: 1,
                      }));
                      fetchDingtalkOrgUsers(1, '', '');
                    }}
                  >
                    重置
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      setOrgUserState((prev) => ({
                        ...prev,
                        keyword: orgKeywordInput,
                        statusFilter: orgStatusInput,
                        page: 1,
                      }));
                      fetchDingtalkOrgUsers(1, orgKeywordInput, orgStatusInput);
                    }}
                  >
                    查询
                  </Button>
                </Space>
              </Space>

              <Table
                dataSource={orgUserState.data}
                columns={orgUserColumns}
                rowKey="id"
                loading={orgUserState.loading}
                pagination={{
                  current: orgUserState.page,
                  pageSize: orgUserState.pageSize,
                  total: orgUserState.total,
                  showSizeChanger: true,
                  pageSizeOptions: [10, 20, 50],
                  showTotal: (total) => `共 ${total} 条记录`,
                  onChange: (page, pageSize) => {
                    const newPage = pageSize !== orgUserState.pageSize ? 1 : page;
                    setOrgUserState((prev) => ({ ...prev, page: newPage, pageSize }));
                    fetchDingtalkOrgUsers(
                      newPage,
                      orgUserState.keyword,
                      orgUserState.statusFilter,
                      pageSize,
                    );
                  },
                }}
              />
            </div>
          </div>
        )}
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
