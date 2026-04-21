import { Breadcrumb, Button, Result, Space } from 'antd';
import { ProDescriptions } from '@ant-design/pro-components';
import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { getCompanyById, type Company } from '../../../api/companies.api';

export default function CompanyDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const companyId = Number(id);

  const query = useQuery({
    queryKey: ['company-detail', companyId],
    queryFn: () => getCompanyById(companyId),
    enabled: Number.isInteger(companyId) && companyId > 0,
  });

  if (!Number.isInteger(companyId) || companyId <= 0) {
    return (
      <Result
        status="404"
        title="公司主体不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/companies')}>
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
        title="公司主体详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/companies')}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  const basicColumns: ProDescriptionsItemProps<Company>[] = [
    { title: '公司中文名称', dataIndex: 'nameCn', span: 1 },
    { title: '公司英文名称', dataIndex: 'nameEn', span: 1, renderText: (v) => v || '-' },
    { title: '公司简称', dataIndex: 'abbreviation', span: 1, renderText: (v) => v || '-' },
    { title: '国家/地区', dataIndex: 'countryName', span: 1, renderText: (v) => v || '-' },
    { title: '签订地点', dataIndex: 'signingLocation', span: 1, renderText: (v) => v || '-' },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      span: 1,
      renderText: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      span: 1,
      renderText: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
  ];

  const addressColumns: ProDescriptionsItemProps<Company>[] = [
    { title: '中文地址', dataIndex: 'addressCn', span: 2, renderText: (v) => v || '-' },
    { title: '英文地址', dataIndex: 'addressEn', span: 2, renderText: (v) => v || '-' },
  ];

  const contactColumns: ProDescriptionsItemProps<Company>[] = [
    { title: '联系人', dataIndex: 'contactPerson', span: 1, renderText: (v) => v || '-' },
    { title: '联系电话', dataIndex: 'contactPhone', span: 1, renderText: (v) => v || '-' },
    { title: '总账会计', dataIndex: 'chiefAccountantName', span: 1, renderText: (v) => v || '-' },
  ];

  const bankColumns: ProDescriptionsItemProps<Company>[] = [
    { title: '开户行', dataIndex: 'bankName', span: 1, renderText: (v) => v || '-' },
    { title: '银行账号', dataIndex: 'bankAccount', span: 1, renderText: (v) => v || '-' },
    { title: 'SWIFT CODE', dataIndex: 'swiftCode', span: 1, renderText: (v) => v || '-' },
    { title: '默认币种代码', dataIndex: 'defaultCurrencyCode', span: 1, renderText: (v) => v || '-' },
    { title: '默认币种名称', dataIndex: 'defaultCurrencyName', span: 1, renderText: (v) => v || '-' },
  ];

  const complianceColumns: ProDescriptionsItemProps<Company>[] = [
    { title: '纳税人识别号', dataIndex: 'taxId', span: 1, renderText: (v) => v || '-' },
    { title: '海关备案号', dataIndex: 'customsCode', span: 1, renderText: (v) => v || '-' },
    { title: '检疫备案号', dataIndex: 'quarantineCode', span: 1, renderText: (v) => v || '-' },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/master-data/companies')}>
                公司主体管理
              </Button>
            ),
          },
          { title: '详情' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => navigate(`/master-data/companies/${id}/edit`)}>编辑</Button>
      </div>

      <ProDescriptions<Company>
        title="基本信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={basicColumns}
      />

      <ProDescriptions<Company>
        title="地址信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={addressColumns}
      />

      <ProDescriptions<Company>
        title="联系信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={contactColumns}
      />

      <ProDescriptions<Company>
        title="银行信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={bankColumns}
      />

      <ProDescriptions<Company>
        title="合规信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={complianceColumns}
      />
    </Space>
  );
}
