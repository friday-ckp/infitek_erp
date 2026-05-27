import { useMemo, useRef } from 'react';
import { Button, Result, Skeleton, message } from 'antd';
import { ProForm, ProFormDatePicker, ProFormDigit, ProFormSelect, type ProFormInstance } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import {
  createOpeningInventory,
  type CreateOpeningInventoryPayload,
} from '../../api/inventory.api';
import { getSkus } from '../../api/skus.api';
import { getWarehouses } from '../../api/warehouses.api';
import { SectionCard } from '../master-data/components/page-scaffold';
import {
  buildInventoryContextSearch,
  buildSkuOptions,
  buildWarehouseOptions,
} from './components/inventory-page-utils';
import '../master-data/master-page.css';
import './inventory.css';

interface OpeningInventoryFormValues {
  skuId: number;
  warehouseId: number;
  quantity: number;
  receiptDate?: string | Dayjs;
}

export default function InventoryOpeningBalancesPage() {
  const queryClient = useQueryClient();
  const formRef = useRef<ProFormInstance<OpeningInventoryFormValues>>(undefined);

  const skusQuery = useQuery({
    queryKey: ['inventory-skus'],
    queryFn: () => getSkus({ page: 1, pageSize: 200 }),
  });
  const warehousesQuery = useQuery({
    queryKey: ['inventory-warehouses'],
    queryFn: () => getWarehouses({ page: 1, pageSize: 200 }),
  });

  const skuOptions = useMemo(() => buildSkuOptions(skusQuery.data?.list), [skusQuery.data]);
  const warehouseOptions = useMemo(() => buildWarehouseOptions(warehousesQuery.data?.list), [warehousesQuery.data]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateOpeningInventoryPayload) => createOpeningInventory(payload),
    onSuccess: async (_, payload) => {
      message.success('期初库存已保存');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventory-available'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-batches'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-transactions-page'] }),
      ]);
      formRef.current?.resetFields();
      const search = buildInventoryContextSearch({
        skuIds: [payload.skuId],
        warehouseId: payload.warehouseId,
      });
      message.info({
        content: <Link to={`/inventory/available?${search}`}>查看可用库存查询结果</Link>,
        duration: 5,
      });
    },
  });

  if ((skusQuery.isError && !skusQuery.data) || (warehousesQuery.isError && !warehousesQuery.data)) {
    return (
      <Result
        status="error"
        title="库存基础数据加载失败"
        extra={<Button type="primary" onClick={() => { skusQuery.refetch(); warehousesQuery.refetch(); }}>重试</Button>}
      />
    );
  }

  const loadingBase = skusQuery.isLoading || warehousesQuery.isLoading;

  return (
    <div className="master-page master-form-page inventory-page">
      <div className="master-page-header inventory-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">期初库存录入</div>
          <div className="master-page-description">录入 SKU、仓库、期初数量和入库日期，保存后由库存服务生成期初批次并聚合库存。</div>
        </div>
        <div className="inventory-header-summary" aria-label="库存基础数据">
          <div className="inventory-header-count">
            <span>SKU</span>
            <strong>{skuOptions.length}</strong>
          </div>
          <div className="inventory-header-count">
            <span>仓库</span>
            <strong>{warehouseOptions.length}</strong>
          </div>
        </div>
      </div>

      {loadingBase ? (
        <Skeleton active />
      ) : (
        <div className="master-form-main">
          <SectionCard
            id="opening"
            title="期初库存录入"
            description="每次提交都会新增一条期初批次；保存成功后可跳转到可用库存查询核对结果。"
            extra={<span className="inventory-section-badge">期初批次</span>}
          >
            <ProForm<OpeningInventoryFormValues>
              formRef={formRef}
              layout="vertical"
              submitter={false}
              onFinish={async (values) => {
                await createMutation.mutateAsync({
                  skuId: values.skuId,
                  warehouseId: values.warehouseId,
                  quantity: values.quantity,
                  receiptDate: values.receiptDate
                    ? dayjs(values.receiptDate).format('YYYY-MM-DD')
                    : undefined,
                });
                return true;
              }}
            >
              <div className="master-form-grid inventory-opening-grid">
                <ProFormSelect
                  name="skuId"
                  label="SKU"
                  options={skuOptions}
                  showSearch
                  rules={[{ required: true, message: '请选择 SKU' }]}
                  fieldProps={{ optionFilterProp: 'label' }}
                />
                <ProFormSelect
                  name="warehouseId"
                  label="仓库"
                  options={warehouseOptions}
                  showSearch
                  rules={[{ required: true, message: '请选择仓库' }]}
                  fieldProps={{ optionFilterProp: 'label' }}
                />
                <ProFormDigit
                  name="quantity"
                  label="期初数量"
                  min={0}
                  fieldProps={{ precision: 0 }}
                  rules={[{ required: true, message: '请输入期初数量' }]}
                />
                <ProFormDatePicker name="receiptDate" label="入库日期" />
              </div>
              <div className="master-form-footer inventory-form-footer">
                <div className="master-form-footer-tip">保存后库存汇总会立即按批次聚合结果刷新。</div>
                <div className="master-form-footer-actions">
                  <Button onClick={() => formRef.current?.resetFields()}>重置</Button>
                  <Button
                    type="primary"
                    loading={createMutation.isPending}
                    onClick={() => formRef.current?.submit?.()}
                  >
                    保存期初库存
                  </Button>
                </div>
              </div>
            </ProForm>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
