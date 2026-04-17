import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Tag, Popconfirm, message, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { usersApi, type User } from '../api/users'

export default function UsersPage() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>()
  const queryClient = useQueryClient()
  const [messageApi, contextHolder] = message.useMessage()

  const handleDeactivate = async (id: number) => {
    try {
      await usersApi.deactivate(id)
      messageApi.success('停用成功')
      // 强制刷新 ProTable
      if (actionRef.current) {
        actionRef.current.reload()
      } else {
        window.location.reload()
      }
    } catch {
      messageApi.error('停用失败')
    }
  }

  const columns: ProColumns<User>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      render: (_, record) => (
        <a onClick={() => navigate(`/settings/users/${record.id}`)}>{record.username}</a>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: '活跃', status: 'Success' },
        inactive: { text: '停用', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'green' : 'default'}>
          {record.status === 'active' ? '活跃' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/settings/users/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => navigate(`/settings/users/${record.id}/edit`)}>
            编辑
          </Button>
          {record.status === 'active' && (
            <Popconfirm
              title="确定要停用该用户吗？"
              onConfirm={() => handleDeactivate(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                停用
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <ProTable<User>
        headerTitle="用户管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const { current, pageSize, username, name, status } = params as any
          const search = username || name || undefined
          const result = await usersApi.list({
            page: current,
            pageSize,
            search,
            status,
          })
          return { data: result.data, total: result.total, success: true }
        }}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/settings/users/create')}
          >
            创建用户
          </Button>,
        ]}
      />
    </>
  )
}
