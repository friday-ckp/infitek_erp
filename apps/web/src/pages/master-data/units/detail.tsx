import { Breadcrumb, Button, Card, Flex, Space, Tag, Typography } from 'antd';
import { ProDescriptions } from '@ant-design/pro-components';
import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import type { UnitStatus } from '@infitek/shared';
import { getUnitById, type Unit } from '../../../api/units.api';

const statusText: Record<UnitStatus, string> = {
  active: '启用',
  inactive: '禁用',
};

const statusColor: Record<UnitStatus, string> = {
  active: 'success',
  inactive: 'default',
};

export default function UnitDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();

  const query = useQuery({
    queryKey: ['unit-detail', id],
    queryFn: () => getUnitById(id),
    enabled: Boolean(id),
  });

  const columns: ProDescriptionsItemProps<Unit>[] = [
    {
      title: '单位名称',
      dataIndex: 'name',
      span: 1,
    },
    {
      title: '单位编码',
      dataIndex: 'code',
      span: 1,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      span: 1,
      renderText: (value) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      span: 1,
      renderText: (value) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      span: 1,
      renderText: (value) => value || '-',
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      span: 1,
      renderText: (value) => value || '-',
    },
  ];

  if (!query.data && !query.isLoading) {
    return (
      <Space direction="vertical">
        <Typography.Text>单位不存在</Typography.Text>
        <Button onClick={() => navigate('/master-data/units')}>返回列表</Button>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex justify="space-between" align="center">
        <Breadcrumb
          items={[
            { title: <Button type="link" onClick={() => navigate('/master-data/units')}>基础数据</Button> },
            { title: '单位管理' },
            { title: '详情' },
          ]}
        />
        <Button onClick={() => navigate(`/master-data/units/${id}/edit`)}>编辑</Button>
      </Flex>

      <Card>
        <Flex justify="space-between" align="center">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {query.data?.name || '-'}
          </Typography.Title>
          {query.data ? <Tag color={statusColor[query.data.status]}>{statusText[query.data.status]}</Tag> : null}
        </Flex>
      </Card>

      <ProDescriptions<Unit>
        title="基础信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={columns}
      />
    </Space>
  );
}
