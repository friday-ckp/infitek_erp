import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Empty, Select, Space, Button } from "antd";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { LogisticsOrderStatus } from "@infitek/shared";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  getLogisticsOrders,
  LOGISTICS_ORDER_STATUS_LABELS,
  TRANSPORTATION_METHOD_LABELS,
  type LogisticsOrder,
} from "../../api/logistics-orders.api";
import { getLogisticsProviders } from "../../api/logistics-providers.api";
import { SearchForm, type ActiveTag } from "../../components/common/SearchForm";
import { useDebouncedValue } from "../../hooks/useDebounce";
import "../master-data/master-page.css";

const STATUS_OPTIONS = Object.values(LogisticsOrderStatus).map((value) => ({
  label: LOGISTICS_ORDER_STATUS_LABELS[value],
  value,
}));

const STATUS_STYLE_MAP: Record<string, { className: string; text: string }> = {
  [LogisticsOrderStatus.CONFIRMED]: {
    className: "master-pill-blue",
    text: "已确认",
  },
  [LogisticsOrderStatus.SHIPPED]: {
    className: "master-pill-orange",
    text: "已发运",
  },
  [LogisticsOrderStatus.DELIVERED]: {
    className: "master-pill-success",
    text: "已送达",
  },
  [LogisticsOrderStatus.CANCELLED]: {
    className: "master-pill-red",
    text: "已取消",
  },
};

function formatDate(value?: string | null) {
  return value ? dayjs(value).format("YYYY-MM-DD") : "—";
}

function displayOrDash(value?: string | number | null) {
  return value == null || value === "" ? "—" : String(value);
}

export default function LogisticsOrdersListPage() {
  const navigate = useNavigate();
  const [keywordInput, setKeywordInput] = useState("");
  const [status, setStatus] = useState<LogisticsOrderStatus | undefined>();
  const [logisticsProviderId, setLogisticsProviderId] = useState<
    number | undefined
  >();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const keyword = useDebouncedValue(keywordInput, 300).trim();
  const hasFilters =
    Boolean(keyword) || status != null || logisticsProviderId != null;

  useEffect(() => {
    setPage(1);
  }, [keyword, status, logisticsProviderId]);

  const query = useQuery({
    queryKey: [
      "logistics-orders",
      keyword,
      status,
      logisticsProviderId,
      page,
      pageSize,
    ],
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getLogisticsOrders({
        keyword: keyword || undefined,
        status,
        logisticsProviderId,
        page,
        pageSize,
      }),
  });

  const logisticsProvidersQuery = useQuery({
    queryKey: ["logistics-providers", "logistics-order-filter"],
    queryFn: () => getLogisticsProviders({ page: 1, pageSize: 200 }),
  });

  const clearAllFilters = () => {
    setKeywordInput("");
    setStatus(undefined);
    setLogisticsProviderId(undefined);
    setPage(1);
  };

  const selectedStatus = STATUS_OPTIONS.find((item) => item.value === status);
  const selectedProvider = (logisticsProvidersQuery.data?.list ?? []).find(
    (item) => item.id === logisticsProviderId,
  );

  const columns: ProColumns<LogisticsOrder>[] = useMemo(
    () => [
      {
        title: "物流单号",
        dataIndex: "orderCode",
        width: 170,
        fixed: "left",
        render: (_, record) => (
          <Link to={`/logistics-orders/${record.id}`}>{record.orderCode}</Link>
        ),
      },
      {
        title: "发货需求编号",
        dataIndex: "shippingDemandCode",
        width: 170,
        render: (_, record) => (
          <Link to={`/shipping-demands/${record.shippingDemandId}`}>
            {displayOrDash(record.shippingDemandCode)}
          </Link>
        ),
      },
      {
        title: "物流供应商",
        dataIndex: "logisticsProviderName",
        width: 220,
        render: (_, record) => displayOrDash(record.logisticsProviderName),
      },
      {
        title: "起运港/目的港",
        key: "ports",
        width: 260,
        render: (_, record) =>
          `${displayOrDash(record.originPortName)} / ${displayOrDash(record.destinationPortName)}`,
      },
      {
        title: "运输方式",
        dataIndex: "transportationMethod",
        width: 120,
        render: (_, record) =>
          TRANSPORTATION_METHOD_LABELS[record.transportationMethod] ??
          displayOrDash(record.transportationMethod),
      },
      {
        title: "状态",
        dataIndex: "status",
        width: 120,
        render: (_, record) => {
          const info = STATUS_STYLE_MAP[record.status] ?? {
            className: "master-pill-default",
            text: displayOrDash(record.status),
          };
          return (
            <span className={`master-pill ${info.className}`}>{info.text}</span>
          );
        },
      },
      {
        title: "运抵国",
        dataIndex: "destinationCountryName",
        width: 120,
        render: (_, record) => displayOrDash(record.destinationCountryName),
      },
      {
        title: "客户名称",
        dataIndex: "customerName",
        width: 180,
        render: (_, record) => displayOrDash(record.customerName),
      },
      {
        title: "创建时间",
        dataIndex: "createdAt",
        width: 140,
        render: (_, record) => formatDate(record.createdAt),
      },
      {
        title: "操作",
        key: "actions",
        width: 100,
        fixed: "right",
        render: (_, record) => (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => navigate(`/logistics-orders/${record.id}`)}
          >
            查看
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const activeTags: ActiveTag[] = [];
  if (keyword) {
    activeTags.push({
      key: "keyword",
      label: `关键词: ${keyword}`,
      onClose: () => {
        setKeywordInput("");
        setPage(1);
      },
    });
  }
  if (selectedStatus) {
    activeTags.push({
      key: "status",
      label: `状态: ${selectedStatus.label}`,
      onClose: () => {
        setStatus(undefined);
        setPage(1);
      },
    });
  }
  if (selectedProvider) {
    activeTags.push({
      key: "provider",
      label: `物流供应商: ${selectedProvider.name}`,
      onClose: () => {
        setLogisticsProviderId(undefined);
        setPage(1);
      },
    });
  }

  const emptyText = hasFilters ? (
    <Empty description="未找到匹配记录">
      <Button type="link" onClick={clearAllFilters}>
        清除筛选条件
      </Button>
    </Empty>
  ) : (
    <Empty description="暂无物流单" />
  );

  return (
    <div className="master-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">物流单</div>
          <div className="master-page-description">
            查看物流单进度、关联发货需求和物流跟踪信息。
          </div>
        </div>
      </div>

      <div className="master-list-shell">
        <SearchForm
          searchValue={keywordInput}
          onSearchChange={setKeywordInput}
          placeholder="快捷搜索 物流单号/发货需求编号/销售订单号/客户名称"
          activeTags={activeTags}
          onClearAll={hasFilters ? clearAllFilters : undefined}
          onQuery={() => setPage(1)}
          onReset={clearAllFilters}
          advancedContent={
            <Space wrap>
              <Select
                allowClear
                placeholder="物流单状态"
                style={{ width: 180 }}
                value={status}
                options={STATUS_OPTIONS}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              />
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="物流供应商"
                style={{ width: 240 }}
                value={logisticsProviderId}
                options={(logisticsProvidersQuery.data?.list ?? []).map((item) => ({
                  label: item.name,
                  value: item.id,
                }))}
                onChange={(value) => {
                  setLogisticsProviderId(value);
                  setPage(1);
                }}
              />
            </Space>
          }
        />

        <ProTable<LogisticsOrder>
          search={false}
          options={false}
          toolBarRender={false}
          rowKey="id"
          loading={query.isFetching}
          columns={columns}
          dataSource={query.data?.list ?? []}
          scroll={{ x: 1600, y: 540 }}
          locale={{ emptyText }}
          pagination={{
            current: page,
            pageSize,
            total: query.data?.total ?? 0,
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
      </div>
    </div>
  );
}
