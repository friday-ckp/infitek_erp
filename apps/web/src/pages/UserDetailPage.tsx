import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Tag, Spin, Result, Space } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { ProDescriptions } from '@ant-design/pro-components'
import { usersApi } from '../api/users'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(Number(id)),
    enabled: !!id,
  })

  if (isLoading) return <Spin style={{ display: 'block', margin: '100px auto' }} />
  if (isError || !user) return <Result status="404" title="用户不存在" extra={<Button onClick={() => navigate('/settings/users')}>返回列表</Button>} />

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/settings/users')}>
          返回
        </Button>
        <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/settings/users/${id}/edit`)}>
          编辑
        </Button>
      </Space>

      <ProDescriptions
        title="用户详情"
        column={2}
        dataSource={user}
        columns={[
          {
            title: '用户名',
            dataIndex: 'username',
            render: (val) => <span data-testid="username">{val}</span>,
          },
          {
            title: '姓名',
            dataIndex: 'name',
            render: (val) => <span data-testid="name">{val}</span>,
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (val) => (
              <span data-testid="status">
                <Tag color={val === 'active' ? 'green' : 'default'}>
                  {val === 'active' ? '活跃' : '停用'}
                </Tag>
              </span>
            ),
          },
          {
            title: '创建者',
            dataIndex: 'createdBy',
            render: (val) => <span data-testid="created-by">{val}</span>,
          },
          {
            title: '更新者',
            dataIndex: 'updatedBy',
            render: (val) => <span data-testid="updated-by">{val ?? '-'}</span>,
          },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            render: (val) => <span data-testid="created-at">{new Date(val as string).toLocaleString()}</span>,
          },
          {
            title: '更新时间',
            dataIndex: 'updatedAt',
            render: (val) => <span data-testid="updated-at">{new Date(val as string).toLocaleString()}</span>,
          },
        ]}
      />
    </div>
  )
}
