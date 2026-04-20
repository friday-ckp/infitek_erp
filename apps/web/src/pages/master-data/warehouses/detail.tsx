import { Breadcrumb, Button, Card, Flex, Result, Space, Tag, Typography } from 'antd';
import { ProDescriptions } from '@ant-design/pro-components';
import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import type { WarehouseStatus } from '@infitek/shared';
import { getWarehouseById, type Warehouse } from '../../../api/warehouses.api';

const statusText: Record<WarehouseStatus, string> = {
  active: '启用',
  inactive: '禁用',
};

const statusColor: Record<WarehouseStatus, string> = {
  active: 'success',
  inactive: 'default',
};

export default function WarehouseDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const warehouseId = Number(id);

  const query = useQuery({
    queryKey: ['warehouse-detail', warehouseId],
    queryFn: () => getWarehouseById(warehouseId),
    enabled: Number.isInteger(warehouseId) && warehouseId > 0,
  });

  if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
    return (
      <Result
        status="404"
        title="仓库不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/warehouses')}>
            返回列表
          </Button>
        }
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="仓库详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/warehouses')}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  const columns: ProDescriptionsItemProps<Warehouse>[] = [
    { title: '仓库名称', dataIndex: 'name', span: 1 },
    {
      title: '仓库地址',
      dataIndex: 'address',
      span: 1,
      renderText: (value) => value || '-',
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
        <Typography.Text>仓库不存在</Typography.Text>
        <Button onClick={() => navigate('/master-data/warehouses')}>返回列表</Button>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex justify="space-between" align="center">
        <Breadcrumb
          items={[
            {
              title: (
                <Button type="link" onClick={() => navigate('/master-data/warehouses')}>
                  基础数据
                </Button>
              ),
            },
            { title: '仓库管理' },
            { title: '详情' },
          ]}
        />
        <Button onClick={() => navigate(`/master-data/warehouses/${id}/edit`)}>编辑</Button>
      </Flex>

      <Card>
        <Flex justify="space-between" align="center">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {query.data?.name || '-'}
          </Typography.Title>
          {query.data ? (
            <Tag color={statusColor[query.data.status]}>{statusText[query.data.status]}</Tag>
          ) : null}
        </Flex>
      </Card>

      <ProDescriptions<Warehouse>
        title="基础信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={columns}
      />
    </Space>
  );
}
