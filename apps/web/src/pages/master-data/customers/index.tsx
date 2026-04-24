import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Empty, Result, Select, Skeleton, Space, Typography, theme } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getCountries, type Country } from '../../../api/countries.api';
import { getCustomers, type Customer } from '../../../api/customers.api';
import { SearchForm } from '../../../components/common/SearchForm';
import type { ActiveTag } from '../../../components/common/SearchForm';
import { useDebouncedValue } from '../../../hooks/useDebounce';

export default function CustomersListPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [keywordInput, setKeywordInput] = useState('');
  const [countryId, setCountryId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters = Boolean(keyword) || countryId != null;

  useEffect(() => {
    setPage(1);
  }, [keyword, countryId]);

  const customersQuery = useQuery({
    queryKey: ['customers', keyword, countryId, page, pageSize],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getCustomers({
        keyword: keyword || undefined,
        countryId,
        page,
        pageSize,
      }),
  });

  const countriesQuery = useQuery({
    queryKey: ['countries', 'customer-filter'],
    queryFn: () => getCountries({ page: 1, pageSize: 200 }),
  });

  if (customersQuery.isError && !customersQuery.data) {
    return (
      <Result
        status="error"
        title="加载客户列表失败"
        subTitle="请检查网络或稍后重试"
        extra={
          <Button type="primary" onClick={() => customersQuery.refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const countries = countriesQuery.data?.list ?? [];
  const selectedCountry = countries.find((item) => item.id === countryId);

  const columns: ProColumns<Customer>[] = useMemo(
    () => [
      {
        title: '客户代码',
        dataIndex: 'customerCode',
        width: 140,
      },
      {
        title: '客户名称',
        dataIndex: 'customerName',
        width: 240,
        ellipsis: true,
        render: (_, record) => (
          <Link to={`/master-data/customers/${record.id}`} style={{ color: token.colorLink }}>
            {record.customerName}
          </Link>
        ),
      },
      {
        title: '联系人',
        dataIndex: 'contactPerson',
        width: 140,
        render: (_, record) =>
          record.contactPerson || <Typography.Text type="secondary">-</Typography.Text>,
      },
      {
        title: '国家/地区',
        dataIndex: 'countryName',
        width: 160,
      },
      {
        title: '销售员',
        dataIndex: 'salespersonName',
        width: 140,
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 140,
        render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD'),
      },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        fixed: 'right',
        render: (_, record) => (
          <Space size={12}>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/customers/${record.id}`)}
            >
              查看
            </Button>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/master-data/customers/${record.id}/edit`)}
            >
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [navigate, token.colorLink],
  );

  const emptyText = hasFilters ? (
    <Empty description="未找到匹配记录">
      <Button
        type="link"
        onClick={() => {
          setKeywordInput('');
          setCountryId(undefined);
          setPage(1);
        }}
      >
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无数据">
      <Button type="primary" onClick={() => navigate('/master-data/customers/create')}>
        新建客户
      </Button>
    </Empty>
  );

  const activeTags: ActiveTag[] = [
    keyword
      ? {
          key: 'keyword',
          label: `关键词: ${keyword}`,
          onClose: () => {
            setKeywordInput('');
            setPage(1);
          },
        }
      : null,
    selectedCountry
      ? {
          key: 'country',
          label: `国家: ${selectedCountry.name}`,
          onClose: () => {
            setCountryId(undefined);
            setPage(1);
          },
        }
      : null,
  ].filter(Boolean) as ActiveTag[];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: token.marginMD,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          客户主数据管理
        </Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/customers/create')}>
          新建客户
        </Button>
      </div>

      <SearchForm
        searchValue={keywordInput}
        onSearchChange={(value) => {
          setKeywordInput(value);
          setPage(1);
        }}
        placeholder="快捷搜索客户名称/客户代码"
        advancedContent={
          <Select<number>
            placeholder="国家/地区"
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 220 }}
            loading={countriesQuery.isLoading}
            value={countryId}
            options={countries.map((item: Country) => ({
              label: `${item.name} (${item.code})`,
              value: item.id,
            }))}
            onChange={(value) => {
              setCountryId(value);
              setPage(1);
            }}
          />
        }
        activeTags={activeTags}
        onClearAll={() => {
          setKeywordInput('');
          setCountryId(undefined);
          setPage(1);
        }}
        onQuery={() => {
          setPage(1);
          customersQuery.refetch();
        }}
        onReset={() => {
          setKeywordInput('');
          setCountryId(undefined);
          setPage(1);
        }}
      />

      <Skeleton
        active
        loading={customersQuery.isLoading && !customersQuery.data}
        style={{ marginTop: token.marginMD }}
      >
        <ProTable<Customer>
          search={false}
          options={false}
          toolBarRender={false}
          rowKey="id"
          loading={customersQuery.isFetching}
          columns={columns}
          dataSource={customersQuery.data?.list ?? []}
          scroll={{ x: 1120, y: 540 }}
          rowClassName={() => 'customer-row-height'}
          locale={{ emptyText }}
          pagination={{
            current: page,
            pageSize,
            total: customersQuery.data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== pageSize) {
                setPage(1);
              } else {
                setPage(nextPage);
              }
              setPageSize(nextPageSize);
            },
          }}
        />
      </Skeleton>

      <style>{`
        .customer-row-height .ant-table-cell {
          height: 48px;
        }
      `}</style>
    </div>
  );
}
