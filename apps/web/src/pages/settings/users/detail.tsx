import { useState, useEffect } from 'react';
import { Button, Tag, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById } from '../../../api/users.api';

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

export default function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUser(id);
    }
  }, [id]);

  const fetchUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await getUserById(userId);
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      message.error('获取用户详情失败');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    return status === 'ACTIVE' ? 'green' : 'default';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '24px' }}>
        <p>用户不存在</p>
        <Button onClick={() => navigate('/settings/users')}>返回列表</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/settings/users')}
          />
          <h1 style={{ margin: 0 }}>用户详情</h1>
        </div>
        <Button onClick={() => navigate(`/settings/users/${user.id}/edit`)}>编辑</Button>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>基础信息</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '12px' }}>用户名</label>
            <div style={{ fontSize: '14px' }}>{user.username}</div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '12px' }}>姓名</label>
            <div style={{ fontSize: '14px' }}>{user.name}</div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '12px' }}>账号状态</label>
            <Tag color={statusColor(user.status)}>{user.status === 'ACTIVE' ? '活跃' : '停用'}</Tag>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '12px' }}>创建时间</label>
            <div style={{ fontSize: '14px' }}>{new Date(user.created_at).toLocaleString()}</div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '12px' }}>更新时间</label>
            <div style={{ fontSize: '14px' }}>{new Date(user.updated_at).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>操作审计</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '12px' }}>创建人</label>
            <div style={{ fontSize: '14px' }}>{user.created_by}</div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '12px' }}>更新人</label>
            <div style={{ fontSize: '14px' }}>{user.updated_by}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
