import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, message, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { ProForm, ProFormText } from '@ant-design/pro-components'
import { usersApi } from '../api/users'

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const [form] = ProForm.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (user) {
      form.setFieldsValue({ username: user.username, name: user.name })
    }
  }, [user, form])

  if (isEdit && isLoading) return <Spin style={{ display: 'block', margin: '100px auto' }} />

  const handleFinish = async (values: any) => {
    try {
      if (isEdit) {
        const dto: any = { name: values.name }
        if (values.password) dto.password = values.password
        await usersApi.update(Number(id), dto)
        messageApi.success('更新成功')
      } else {
        await usersApi.create({ username: values.username, name: values.name, password: values.password })
        messageApi.success('创建成功')
      }
      setTimeout(() => window.location.replace('/settings/users'), 1500)
    } catch (err: any) {
      messageApi.error(err.response?.data?.message || '操作失败')
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 600 }}>
      {contextHolder}
      <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }} onClick={() => navigate('/settings/users')}>
        返回
      </Button>

      <ProForm
        form={form}
        title={isEdit ? '编辑用户' : '创建用户'}
        onFinish={handleFinish}
        submitter={{ searchConfig: { submitText: isEdit ? '更新' : '创建' } }}
      >
        {isEdit ? (
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#666' }}>用户名</label>
            <div style={{ padding: '4px 11px', background: '#f5f5f5', borderRadius: 6, border: '1px solid #d9d9d9', color: '#333' }}>
              {user?.username}
            </div>
          </div>
        ) : (
          <ProFormText
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            rules={[{ required: true, message: '用户名必填' }]}
            fieldProps={{ name: 'username' }}
          />
        )}
        <ProFormText
          name="name"
          label="姓名"
          placeholder="请输入姓名"
          rules={[{ required: true, message: '姓名必填' }]}
          fieldProps={{ name: 'name' }}
        />
        <ProFormText.Password
          name="password"
          label={isEdit ? '密码（留空则不修改）' : '密码'}
          placeholder="请输入密码"
          rules={[
            ...(!isEdit ? [{ required: true, message: '密码必填' }] : []),
            { min: 8, message: '密码长度至少8位' },
          ]}
          fieldProps={{ name: 'password' }}
        />
        <ProFormText.Password
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          dependencies={['password']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                const pwd = getFieldValue('password')
                if (!value && !pwd) return Promise.resolve()
                if (!value && pwd) return Promise.reject(new Error('请确认密码'))
                if (value !== pwd) return Promise.reject(new Error('密码不一致'))
                return Promise.resolve()
              },
            }),
          ]}
          fieldProps={{ name: 'confirmPassword' }}
        />
      </ProForm>
    </div>
  )
}
