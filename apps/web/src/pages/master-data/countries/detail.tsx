import { Breadcrumb, Button, Card, Flex, Result, Space, Typography } from 'antd';
import { ProDescriptions } from '@ant-design/pro-components';
import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { getCountryById, type Country } from '../../../api/countries.api';

export default function CountryDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const countryId = Number(id);

  const query = useQuery({
    queryKey: ['country-detail', countryId],
    queryFn: () => getCountryById(countryId),
    enabled: Number.isInteger(countryId) && countryId > 0,
  });

  if (!Number.isInteger(countryId) || countryId <= 0) {
    return (
      <Result
        status="404"
        title="国家/地区不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/countries')}>
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
        title="国家/地区详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/countries')}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  const columns: ProDescriptionsItemProps<Country>[] = [
    { title: '国家/地区代码', dataIndex: 'code', span: 1 },
    { title: '国家/地区名称', dataIndex: 'name', span: 1 },
    { title: '英文名称', dataIndex: 'nameEn', span: 1, renderText: (v: string | null | undefined) => v || '-' },
    { title: '简称', dataIndex: 'abbreviation', span: 1, renderText: (v: string | null | undefined) => v || '-' },
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
        <Typography.Text>国家/地区不存在</Typography.Text>
        <Button onClick={() => navigate('/master-data/countries')}>返回列表</Button>
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
                <Button type="link" onClick={() => navigate('/master-data/countries')}>
                  基础数据
                </Button>
              ),
            },
            { title: '国家/地区管理' },
            { title: '详情' },
          ]}
        />
        <Button onClick={() => navigate(`/master-data/countries/${id}/edit`)}>编辑</Button>
      </Flex>

      <Card>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {query.data?.code || '-'} {query.data?.name ? `（${query.data.name}）` : ''}
        </Typography.Title>
      </Card>

      <ProDescriptions<Country>
        title="基础信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={columns}
      />
    </Space>
  );
}
