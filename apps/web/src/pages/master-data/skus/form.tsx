import { useRef } from 'react';
import { Button, Result, Skeleton, message } from 'antd';
import {
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createSku, getSkuById, updateSku, type CreateSkuPayload, type UpdateSkuPayload } from '../../../api/skus.api';
import { getSpus } from '../../../api/spus.api';
import { getUnits } from '../../../api/units.api';

export default function SkuFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const skuId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);

  // spuId pre-fill from query param (when navigating from SPU detail)
  const rawSpuId = searchParams.get('spuId');
  const prefilledSpuId =
    rawSpuId && Number.isInteger(Number(rawSpuId)) && Number(rawSpuId) > 0
      ? Number(rawSpuId)
      : undefined;

  const detailQuery = useQuery({
    queryKey: ['sku-detail', skuId],
    queryFn: () => getSkuById(skuId as number),
    enabled: Boolean(isEdit && skuId && Number.isInteger(skuId) && skuId > 0),
  });

  const spusQuery = useQuery({
    queryKey: ['spus-options'],
    queryFn: () => getSpus({ pageSize: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const unitsQuery = useQuery({
    queryKey: ['units-options'],
    queryFn: () => getUnits({ pageSize: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSkuPayload) => createSku(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      message.success('SKU 创建成功', 3);
      navigate(`/master-data/skus/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSkuPayload) => updateSku(skuId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skus'] });
      queryClient.invalidateQueries({ queryKey: ['sku-detail', skuId] });
      message.success('SKU 更新成功', 3);
      navigate(`/master-data/skus/${skuId}`);
    },
  });

  if (isEdit && (!skuId || !Number.isInteger(skuId) || skuId <= 0)) {
    return (
      <Result
        status="404"
        title="SKU 不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/skus')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) return <Skeleton active />;

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="加载 SKU 信息失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/skus')}>返回列表</Button>,
        ]}
      />
    );
  }

  const spuOptions = (spusQuery.data?.list ?? []).map((s) => ({
    label: `${s.spuCode} - ${s.name}`,
    value: s.id,
  }));

  const unitOptions = (unitsQuery.data?.list ?? []).map((u) => ({
    label: u.name,
    value: u.id,
  }));

  const initialValues = detailQuery.data
    ? {
        spuId: detailQuery.data.spuId,
        nameCn: detailQuery.data.nameCn ?? undefined,
        nameEn: detailQuery.data.nameEn ?? undefined,
        specification: detailQuery.data.specification,
        status: detailQuery.data.status,
        productType: detailQuery.data.productType ?? undefined,
        principle: detailQuery.data.principle ?? undefined,
        productUsage: detailQuery.data.productUsage ?? undefined,
        coreParams: detailQuery.data.coreParams ?? undefined,
        electricalParams: detailQuery.data.electricalParams ?? undefined,
        material: detailQuery.data.material ?? undefined,
        hasPlug: detailQuery.data.hasPlug ?? undefined,
        specialAttributes: detailQuery.data.specialAttributes ?? undefined,
        specialAttributesNote: detailQuery.data.specialAttributesNote ?? undefined,
        customerWarrantyMonths: detailQuery.data.customerWarrantyMonths ?? undefined,
        forbiddenCountries: detailQuery.data.forbiddenCountries ?? undefined,
        weightKg: detailQuery.data.weightKg,
        grossWeightKg: detailQuery.data.grossWeightKg ?? undefined,
        lengthCm: detailQuery.data.lengthCm ?? undefined,
        widthCm: detailQuery.data.widthCm ?? undefined,
        heightCm: detailQuery.data.heightCm ?? undefined,
        volumeCbm: detailQuery.data.volumeCbm,
        packagingType: detailQuery.data.packagingType ?? undefined,
        packagingQty: detailQuery.data.packagingQty ?? undefined,
        packagingInfo: detailQuery.data.packagingInfo ?? undefined,
        hsCode: detailQuery.data.hsCode,
        customsNameCn: detailQuery.data.customsNameCn,
        customsNameEn: detailQuery.data.customsNameEn,
        declaredValueRef: detailQuery.data.declaredValueRef ?? undefined,
        declarationElements: detailQuery.data.declarationElements ?? undefined,
        isInspectionRequired: detailQuery.data.isInspectionRequired ?? undefined,
        regulatoryConditions: detailQuery.data.regulatoryConditions ?? undefined,
        taxRefundRate: detailQuery.data.taxRefundRate ?? undefined,
        customsInfoMaintained: detailQuery.data.customsInfoMaintained ?? undefined,
      }
    : { spuId: prefilledSpuId, status: 'active', unitId: undefined };

  return (
    <ProForm
      formRef={formRef}
      title={isEdit ? '编辑 SKU' : '新建 SKU'}
      loading={detailQuery.isLoading}
      submitter={{
        searchConfig: { submitText: isEdit ? '保存' : '创建' },
        render: (_, dom) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => navigate(-1)}>取消</Button>
            {dom[1]}
          </div>
        ),
      }}
      initialValues={initialValues}
      onFinish={async (values) => {
        const payload: CreateSkuPayload = {
          spuId: values.spuId,
          nameCn: values.nameCn || undefined,
          nameEn: values.nameEn || undefined,
          specification: values.specification,
          status: values.status || undefined,
          productType: values.productType || undefined,
          principle: values.principle || undefined,
          productUsage: values.productUsage || undefined,
          coreParams: values.coreParams || undefined,
          electricalParams: values.electricalParams || undefined,
          material: values.material || undefined,
          hasPlug: values.hasPlug ?? undefined,
          specialAttributes: values.specialAttributes || undefined,
          specialAttributesNote: values.specialAttributesNote || undefined,
          customerWarrantyMonths: values.customerWarrantyMonths ?? undefined,
          forbiddenCountries: values.forbiddenCountries || undefined,
          weightKg: values.weightKg,
          grossWeightKg: values.grossWeightKg ?? undefined,
          lengthCm: values.lengthCm ?? undefined,
          widthCm: values.widthCm ?? undefined,
          heightCm: values.heightCm ?? undefined,
          volumeCbm: values.volumeCbm,
          packagingType: values.packagingType || undefined,
          packagingQty: values.packagingQty ?? undefined,
          packagingInfo: values.packagingInfo || undefined,
          hsCode: values.hsCode,
          customsNameCn: values.customsNameCn,
          customsNameEn: values.customsNameEn,
          declaredValueRef: values.declaredValueRef ?? undefined,
          declarationElements: values.declarationElements || undefined,
          isInspectionRequired: values.isInspectionRequired ?? undefined,
          regulatoryConditions: values.regulatoryConditions || undefined,
          taxRefundRate: values.taxRefundRate ?? undefined,
          customsInfoMaintained: values.customsInfoMaintained ?? undefined,
        };
        if (isEdit) {
          await updateMutation.mutateAsync(payload);
        } else {
          await createMutation.mutateAsync(payload);
        }
        return true;
      }}
    >
      <ProCard title="基本信息" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormSelect
            name="spuId"
            label="所属 SPU"
            placeholder="请选择 SPU"
            width="md"
            options={spuOptions}
            loading={spusQuery.isLoading}
            showSearch
            fieldProps={{ optionFilterProp: 'label', disabled: Boolean(prefilledSpuId) }}
            rules={[{ required: true, message: '请选择所属 SPU' }]}
          />
          <ProFormSelect
            name="status"
            label="状态"
            width="sm"
            options={[
              { label: '启用', value: 'active' },
              { label: '停用', value: 'inactive' },
            ]}
            rules={[{ required: true, message: '请选择状态' }]}
          />
          <ProFormSelect
            name="unitId"
            label="单位"
            placeholder="请选择单位"
            width="sm"
            options={unitOptions}
            loading={unitsQuery.isLoading}
            showSearch
            fieldProps={{ optionFilterProp: 'label', allowClear: true }}
          />
          <ProFormText
            name="nameCn"
            label="中文名称"
            placeholder="请输入中文名称"
            width="md"
            rules={[{ max: 200, message: '最多 200 个字符' }]}
          />
          <ProFormText
            name="nameEn"
            label="英文名称"
            placeholder="请输入英文名称"
            width="md"
            rules={[{ max: 200, message: '最多 200 个字符' }]}
          />
          <ProFormTextArea
            name="specification"
            label="规格描述"
            placeholder="请输入规格描述"
            width="xl"
            rules={[
              { required: true, message: '请输入规格描述' },
              { max: 500, message: '最多 500 个字符' },
            ]}
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="规格参数" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormText
            name="productType"
            label="产品类型"
            placeholder="请输入产品类型"
            width="md"
            rules={[{ max: 100, message: '最多 100 个字符' }]}
          />
          <ProFormText
            name="principle"
            label="工作原理"
            placeholder="请输入工作原理"
            width="md"
            rules={[{ max: 200, message: '最多 200 个字符' }]}
          />
          <ProFormText
            name="material"
            label="材质"
            placeholder="请输入材质"
            width="md"
            rules={[{ max: 200, message: '最多 200 个字符' }]}
          />
          <ProFormSwitch
            name="hasPlug"
            label="是否含插头"
          />
          <ProFormDigit
            name="customerWarrantyMonths"
            label="客户质保期（月）"
            placeholder="请输入月数"
            width="sm"
            min={0}
            fieldProps={{ precision: 0 }}
          />
          <ProFormText
            name="specialAttributes"
            label="特殊属性"
            placeholder="请输入特殊属性"
            width="md"
            rules={[{ max: 500, message: '最多 500 个字符' }]}
          />
          <ProFormTextArea
            name="specialAttributesNote"
            label="特殊属性说明"
            placeholder="请输入特殊属性说明"
            width="xl"
          />
          <ProFormTextArea
            name="coreParams"
            label="核心参数"
            placeholder="请输入核心参数"
            width="xl"
          />
          <ProFormTextArea
            name="electricalParams"
            label="电气参数"
            placeholder="请输入电气参数"
            width="xl"
          />
          <ProFormTextArea
            name="productUsage"
            label="产品用途"
            placeholder="请输入产品用途"
            width="xl"
          />
          <ProFormText
            name="forbiddenCountries"
            label="禁止经营国家"
            placeholder="多个国家用逗号分隔"
            width="xl"
            rules={[{ max: 500, message: '最多 500 个字符' }]}
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="重量体积" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormDigit
            name="weightKg"
            label="净重（KG）"
            placeholder="请输入净重"
            width="sm"
            min={0}
            fieldProps={{ precision: 3 }}
            rules={[{ required: true, message: '请输入净重' }]}
          />
          <ProFormDigit
            name="grossWeightKg"
            label="毛重（KG）"
            placeholder="请输入毛重"
            width="sm"
            min={0}
            fieldProps={{ precision: 3 }}
          />
          <ProFormDigit
            name="lengthCm"
            label="长（CM）"
            placeholder="请输入长度"
            width="sm"
            min={0}
            fieldProps={{ precision: 2 }}
          />
          <ProFormDigit
            name="widthCm"
            label="宽（CM）"
            placeholder="请输入宽度"
            width="sm"
            min={0}
            fieldProps={{ precision: 2 }}
          />
          <ProFormDigit
            name="heightCm"
            label="高（CM）"
            placeholder="请输入高度"
            width="sm"
            min={0}
            fieldProps={{ precision: 2 }}
          />
          <ProFormDigit
            name="volumeCbm"
            label="体积（CBM）"
            placeholder="请输入体积"
            width="sm"
            min={0}
            fieldProps={{ precision: 4 }}
            rules={[{ required: true, message: '请输入体积' }]}
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="包装信息" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormText
            name="packagingType"
            label="包装类型"
            placeholder="请输入包装类型"
            width="md"
            rules={[{ max: 100, message: '最多 100 个字符' }]}
          />
          <ProFormDigit
            name="packagingQty"
            label="包装数量"
            placeholder="请输入数量"
            width="sm"
            min={0}
            fieldProps={{ precision: 0 }}
          />
          <ProFormTextArea
            name="packagingInfo"
            label="包装说明"
            placeholder="请输入包装说明"
            width="xl"
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="报关信息" bordered>
        <ProForm.Group>
          <ProFormText
            name="hsCode"
            label="HS 码"
            placeholder="请输入 8-10 位 HS 码"
            width="md"
            rules={[
              { required: true, message: '请输入 HS 码' },
              { pattern: /^\d{8,10}$/, message: 'HS 码必须为 8-10 位数字' },
            ]}
          />
          <ProFormText
            name="customsNameCn"
            label="报关中文品名"
            placeholder="请输入报关中文品名"
            width="md"
            rules={[
              { required: true, message: '请输入报关中文品名' },
              { max: 200, message: '最多 200 个字符' },
            ]}
          />
          <ProFormText
            name="customsNameEn"
            label="报关英文品名"
            placeholder="请输入报关英文品名"
            width="md"
            rules={[
              { required: true, message: '请输入报关英文品名' },
              { max: 200, message: '最多 200 个字符' },
            ]}
          />
          <ProFormDigit
            name="declaredValueRef"
            label="申报价值参考（USD）"
            placeholder="请输入参考价值"
            width="sm"
            min={0}
            fieldProps={{ precision: 2 }}
          />
          <ProFormDigit
            name="taxRefundRate"
            label="退税率（%）"
            placeholder="请输入退税率"
            width="sm"
            min={0}
            max={100}
            fieldProps={{ precision: 2 }}
          />
          <ProFormSwitch
            name="isInspectionRequired"
            label="是否需要检验"
          />
          <ProFormSwitch
            name="customsInfoMaintained"
            label="报关信息是否维护"
          />
          <ProFormText
            name="regulatoryConditions"
            label="监管条件"
            placeholder="请输入监管条件"
            width="xl"
            rules={[{ max: 500, message: '最多 500 个字符' }]}
          />
          <ProFormTextArea
            name="declarationElements"
            label="申报要素"
            placeholder="请输入申报要素"
            width="xl"
          />
        </ProForm.Group>
      </ProCard>
    </ProForm>
  );
}
