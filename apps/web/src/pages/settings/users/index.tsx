import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getUsers, deactivateUser } from '../../../api/users.api';
import type { User } from '../../../api/users.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
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

export default function UsersList() {
  const navigate = useNavigate();
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

  useEffect(() => {
    fetchUsers();
  }, []);

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
      </div>
    </div>
  );
}
