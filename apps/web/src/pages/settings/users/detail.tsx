import { useState, useEffect } from 'react';
import { Button, Tag, Spin, Descriptions } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById } from '../../../api/users.api';
import type { User } from '../../../api/users.api';

export default function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getUserById(id)
        .then((data) => setUser(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <p>用户不存在</p>
        <Button onClick={() => navigate('/settings/users')}>返回列表</Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/settings/users')} />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>用户详情</h2>
        </div>
        <Button onClick={() => navigate(`/settings/users/${user.id}/edit`)}>编辑</Button>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, padding: 24, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>基础信息</h3>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
          <Descriptions.Item label="账号状态">
            <Tag color={user.status === 'ACTIVE' ? 'green' : 'default'}>
              {user.status === 'ACTIVE' ? '活跃' : '停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(user.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(user.updated_at).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, padding: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>操作审计</h3>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="创建人">{user.created_by}</Descriptions.Item>
          <Descriptions.Item label="更新人">{user.updated_by}</Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  );
}
