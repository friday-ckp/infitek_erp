import { useState } from 'react';
import { Button, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUsers, deactivateUser } from '../../../api/users.api';

interface User {
  id: string;
  username: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

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

  const fetchUsers = async (page: number = 1, search: string = '', status: string = '') => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await getUsers(
        page,
        state.pageSize,
        search || undefined,
        (status as 'ACTIVE' | 'INACTIVE') || undefined
      );
      if (response.success) {
        setState((prev) => ({
          ...prev,
          data: response.data.items,
          total: response.data.total,
          page: response.data.page,
        }));
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSearch = (value: string) => {
    setState((prev) => ({ ...prev, search: value, page: 1 }));
    fetchUsers(1, value, state.statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setState((prev) => ({ ...prev, statusFilter: status, page: 1 }));
    fetchUsers(1, state.search, status);
  };

  const handleDeactivate = async (id: string) => {
    try {
      const response = await deactivateUser(id);
      if (response.success) {
        message.success('用户已停用');
        fetchUsers(state.page, state.search, state.statusFilter);
      }
    } catch (error) {
      message.error('停用用户失败');
    }
  };

  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, page }));
    fetchUsers(page, state.search, state.statusFilter);
  };

  const statusColor = (status: string) => {
    return status === 'ACTIVE' ? 'green' : 'default';
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>用户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/settings/users/form')}>
          新建用户
        </Button>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="搜索用户名或姓名"
          value={state.search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', flex: 1 }}
        />
        <select
          value={state.statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
        >
          <option value="">全部状态</option>
          <option value="ACTIVE">活跃</option>
          <option value="INACTIVE">停用</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>用户名</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>姓名</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>账号状态</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>创建时间</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {state.data.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 16px' }}>{user.username}</td>
                <td style={{ padding: '12px 16px' }}>{user.name}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Tag color={statusColor(user.status)}>{user.status === 'ACTIVE' ? '活跃' : '停用'}</Tag>
                </td>
                <td style={{ padding: '12px 16px' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <Space>
                    <a onClick={() => navigate(`/settings/users/${user.id}`)}>查看</a>
                    <a onClick={() => navigate(`/settings/users/${user.id}/edit`)}>编辑</a>
                    {user.status === 'ACTIVE' && (
                      <Popconfirm
                        title="停用用户"
                        description="确定要停用此用户吗？停用后该账号将无法登录。"
                        onConfirm={() => handleDeactivate(user.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <a style={{ color: '#ff4d4f' }}>停用</a>
                      </Popconfirm>
                    )}
                  </Space>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>共 {state.total} 条记录</span>
        <div>
          <button
            onClick={() => handlePageChange(state.page - 1)}
            disabled={state.page === 1}
            style={{ marginRight: '8px', padding: '4px 8px' }}
          >
            上一页
          </button>
          <span style={{ margin: '0 8px' }}>
            第 {state.page} 页，共 {Math.ceil(state.total / state.pageSize)} 页
          </span>
          <button
            onClick={() => handlePageChange(state.page + 1)}
            disabled={state.page >= Math.ceil(state.total / state.pageSize)}
            style={{ marginLeft: '8px', padding: '4px 8px' }}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
