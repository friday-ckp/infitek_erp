import { useState, useEffect } from 'react';
import { Button, Space, Tag, Popconfirm, Input, Select, Table, message } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUsers, deactivateUser } from '../../../api/users.api';
import type { User } from '../../../api/users.api';

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

  const fetchUsers = async (page: number = 1, search: string = '', status: string = '') => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await getUsers(
        page,
        state.pageSize,
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

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '账号状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
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
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/settings/users/create')}>
          新建用户
        </Button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Input
          placeholder="搜索用户名或姓名"
          prefix={<SearchOutlined />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleQuery}
          style={{ width: 240 }}
          allowClear
          onClear={() => setSearchInput('')}
        />
        <Select
          value={statusInput || undefined}
          placeholder="全部状态"
          onChange={(v) => setStatusInput(v ?? '')}
          style={{ width: 120 }}
          allowClear
          onClear={() => setStatusInput('')}
        >
          <Option value="ACTIVE">活跃</Option>
          <Option value="INACTIVE">停用</Option>
        </Select>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery}>
          查询
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <Table
          dataSource={state.data}
          columns={columns}
          rowKey="id"
          loading={state.loading}
          pagination={{
            current: state.page,
            pageSize: state.pageSize,
            total: state.total,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page) => {
              setState((prev) => ({ ...prev, page }));
              fetchUsers(page, state.search, state.statusFilter);
            },
          }}
        />
      </div>
    </div>
  );
}
