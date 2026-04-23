import { useRef, useState } from 'react';
import { Breadcrumb, Button, Descriptions, Result, Skeleton, Tabs, Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import type { TabsProps } from 'antd';
import {
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createSku,
  getSkuById,
  getSkus,
  updateSku,
  uploadSkuImage,
  type CreateSkuPayload,
  type PackagingRow,
  type UpdateSkuPayload,
} from '../../../api/skus.api';
import { getSpus } from '../../../api/spus.api';
import { getUnits } from '../../../api/units.api';
import { getCountries } from '../../../api/countries.api';
import { getProductCategoryTree, type ProductCategoryNode } from '../../../api/product-categories.api';
import '../master-page.css';

const PRODUCT_TYPE_OPTIONS = [
  { label: '主品', value: '主品' },
  { label: '配件', value: '配件' },
  { label: '耗材', value: '耗材' },
];

const STATUS_OPTIONS = [
  { label: '上架', value: '上架' },
  { label: '下架可售', value: '下架可售' },
  { label: '下架不可售', value: '下架不可售' },
  { label: '临拓', value: '临拓' },
];

const ELECTRICAL_PARAMS_OPTIONS = [
  '110V 50HZ',
  '110V 60HZ',
  '220V 50HZ',
  '220V 60HZ',
  '380V 50HZ',
  '380V 60HZ',
  '/',
].map((value) => ({ label: value, value }));

function parsePackagingList(sku: any): PackagingRow[] {
  if (sku.packagingList) {
    try {
      return JSON.parse(sku.packagingList);
    } catch {
      // noop
    }
  }
  return [
    {
      packagingType: sku.packagingType ?? undefined,
      packagingQty: sku.packagingQty ?? undefined,
      weightKg: sku.weightKg ?? undefined,
      grossWeightKg: sku.grossWeightKg ?? undefined,
      lengthCm: sku.lengthCm ?? undefined,
      widthCm: sku.widthCm ?? undefined,
      heightCm: sku.heightCm ?? undefined,
      volumeCbm: sku.volumeCbm ?? undefined,
    },
  ];
}

export default function SkuFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const skuId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);

  const rawSpuId = searchParams.get('spuId');
  const prefilledSpuId =
    rawSpuId && Number.isInteger(Number(rawSpuId)) && Number(rawSpuId) > 0 ? Number(rawSpuId) : undefined;

  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [uploadedImageKeys, setUploadedImageKeys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['sku-detail', skuId],
    queryFn: () => getSkuById(skuId as number),
    enabled: Boolean(isEdit && skuId && Number.isInteger(skuId) && skuId > 0),
  });

  const spusQuery = useQuery({
    queryKey: ['spus-options'],
    queryFn: () => getSpus({ pageSize: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const unitsQuery = useQuery({
    queryKey: ['units-options'],
    queryFn: () => getUnits({ pageSize: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const countriesQuery = useQuery({
    queryKey: ['countries-options'],
    queryFn: () => getCountries({ pageSize: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['product-category-tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  const allSkusQuery = useQuery({
    queryKey: ['skus-all-for-accessory'],
    queryFn: () => getSkus({ pageSize: 500 }),
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

  if (isEdit && detailQuery.isLoading) {
    return <Skeleton active />;
  }

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

  const referencedSpuId = prefilledSpuId ?? (isEdit ? detailQuery.data?.spuId : undefined);
  const referencedSpu = referencedSpuId ? (spusQuery.data?.list ?? []).find((spu) => spu.id === referencedSpuId) : undefined;

  const spuOptions = (spusQuery.data?.list ?? []).map((spu) => ({
    label: `${spu.spuCode} - ${spu.name}`,
    value: spu.id,
  }));

  const unitOptions = (unitsQuery.data?.list ?? []).map((unit) => ({
    label: unit.name,
    value: unit.id,
  }));

  const countryOptions = (countriesQuery.data?.list ?? []).map((country) => ({
    label: country.name,
    value: country.name,
  }));

  const mainSkuOptions = (allSkusQuery.data?.list ?? [])
    .filter((sku) => sku.productType === '主品' && sku.id !== skuId)
    .map((sku) => ({ label: `${sku.skuCode} - ${sku.nameCn || sku.specification}`, value: sku.id }));

  const categoryTree: ProductCategoryNode[] = categoryTreeQuery.data ?? [];
  const level1Options = categoryTree.map((node) => ({ label: node.name, value: node.id }));

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadSkuImage(file);
      setUploadedImageKeys((prev) => [...prev, result.key]);
      message.success('图片上传成功');
    } catch (error: any) {
      message.error(error?.message ?? '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const existingImageUrls: string[] = (() => {
    if (detailQuery.data?.productImageUrls) {
      try {
        return JSON.parse(detailQuery.data.productImageUrls);
      } catch {
        // noop
      }
    }
    if (detailQuery.data?.productImageUrl) return [detailQuery.data.productImageUrl];
    return [];
  })();

  const initialValues = detailQuery.data
    ? {
        skuCode: detailQuery.data.skuCode,
        spuId: detailQuery.data.spuId,
        unitId: detailQuery.data.unitId ?? undefined,
        nameCn: detailQuery.data.nameCn ?? undefined,
        nameEn: detailQuery.data.nameEn ?? undefined,
        specification: detailQuery.data.specification,
        status: detailQuery.data.status,
        productType: detailQuery.data.productType ?? undefined,
        productModel: detailQuery.data.productModel ?? undefined,
        accessoryParentSkuId: detailQuery.data.accessoryParentSkuId ?? undefined,
        categoryLevel1Id: detailQuery.data.categoryLevel1Id ?? undefined,
        categoryLevel2Id: detailQuery.data.categoryLevel2Id ?? undefined,
        categoryLevel3Id: detailQuery.data.categoryLevel3Id ?? undefined,
        principle: detailQuery.data.principle ?? undefined,
        productUsage: detailQuery.data.productUsage ?? undefined,
        coreParams: detailQuery.data.coreParams ?? undefined,
        electricalParams: detailQuery.data.electricalParams ?? undefined,
        material: detailQuery.data.material ?? undefined,
        hasPlug: detailQuery.data.hasPlug ?? undefined,
        specialAttributes: detailQuery.data.specialAttributes ?? undefined,
        specialAttributesNote: detailQuery.data.specialAttributesNote ?? undefined,
        customerWarrantyMonths: detailQuery.data.customerWarrantyMonths ?? undefined,
        forbiddenCountries: detailQuery.data.forbiddenCountries?.split(',').filter(Boolean) ?? [],
        packagingList: parsePackagingList(detailQuery.data),
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
    : { spuId: prefilledSpuId, status: '上架', unitId: undefined, packagingList: [{}] };

  const basicTab = (
    <div className="master-form-body">
      {referencedSpu ? (
        <div className="master-info-tip" style={{ marginTop: 0, marginBottom: 12 }}>
          <Descriptions size="small" column={2} title="参考 SPU 信息">
            <Descriptions.Item label="SPU 编码">{referencedSpu.spuCode}</Descriptions.Item>
            <Descriptions.Item label="品名">{referencedSpu.name}</Descriptions.Item>
          </Descriptions>
        </div>
      ) : null}
      <ProForm.Group>
        <ProFormSelect
          name="spuId"
          label="所属 SPU"
          placeholder="请选择 SPU"
          width="md"
          options={spuOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label', disabled: Boolean(prefilledSpuId) }}
          rules={[{ required: true, message: '请选择所属 SPU' }]}
        />
        <ProFormText
          name="skuCode"
          label="SKU 编码"
          placeholder="请输入 SKU 编码"
          width="md"
          rules={[
            { required: true, message: '请输入 SKU 编码' },
            { max: 30, message: '最多 30 个字符' },
          ]}
          disabled={isEdit}
        />
        <ProFormSelect
          name="status"
          label="状态"
          width="sm"
          options={STATUS_OPTIONS}
          rules={[{ required: true, message: '请选择状态' }]}
        />
        <ProFormSelect
          name="unitId"
          label="单位"
          placeholder="请选择单位"
          width="sm"
          options={unitOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label', allowClear: true }}
        />
        <ProFormText name="nameCn" label="中文名称" placeholder="请输入中文名称" width="md" rules={[{ max: 200, message: '最多 200 个字符' }]} />
        <ProFormText name="nameEn" label="英文名称" placeholder="请输入英文名称" width="md" rules={[{ max: 200, message: '最多 200 个字符' }]} />
        <ProFormText name="productModel" label="产品型号" placeholder="请输入产品型号" width="md" rules={[{ max: 200, message: '最多 200 个字符' }]} />
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
    </div>
  );

  const categoryTab = (
    <div className="master-form-body">
      <ProForm.Group>
        <ProFormSelect
          name="categoryLevel1Id"
          label="一级分类"
          placeholder="请选择一级分类"
          width="md"
          options={level1Options}
          showSearch
          fieldProps={{
            optionFilterProp: 'label',
            onChange: () => {
              formRef.current?.setFieldsValue({ categoryLevel2Id: undefined, categoryLevel3Id: undefined });
            },
          }}
        />
        <ProFormDependency name={['categoryLevel1Id']}>
          {({ categoryLevel1Id }) => {
            const parent = categoryTree.find((node) => node.id === categoryLevel1Id);
            const options = (parent?.children ?? []).map((node) => ({ label: node.name, value: node.id }));
            return (
              <ProFormSelect
                name="categoryLevel2Id"
                label="二级分类"
                placeholder="请选择二级分类"
                width="md"
                options={options}
                showSearch
                fieldProps={{
                  optionFilterProp: 'label',
                  onChange: () => {
                    formRef.current?.setFieldsValue({ categoryLevel3Id: undefined });
                  },
                }}
              />
            );
          }}
        </ProFormDependency>
        <ProFormDependency name={['categoryLevel1Id', 'categoryLevel2Id']}>
          {({ categoryLevel1Id, categoryLevel2Id }) => {
            const level1 = categoryTree.find((node) => node.id === categoryLevel1Id);
            const level2 = (level1?.children ?? []).find((node) => node.id === categoryLevel2Id);
            const options = (level2?.children ?? []).map((node) => ({ label: node.name, value: node.id }));
            return (
              <ProFormSelect
                name="categoryLevel3Id"
                label="三级分类"
                placeholder="请选择三级分类"
                width="md"
                options={options}
                showSearch
                fieldProps={{ optionFilterProp: 'label' }}
              />
            );
          }}
        </ProFormDependency>
      </ProForm.Group>
    </div>
  );

  const specTab = (
    <div className="master-form-body">
      <ProForm.Group>
        <ProFormSelect
          name="productType"
          label="产品类型"
          placeholder="请选择产品类型"
          width="sm"
          options={PRODUCT_TYPE_OPTIONS}
          fieldProps={{
            onChange: () => {
              formRef.current?.setFieldsValue({ accessoryParentSkuId: undefined });
            },
          }}
        />
        <ProFormDependency name={['productType']}>
          {({ productType }) =>
            productType === '配件' ? (
              <ProFormSelect
                name="accessoryParentSkuId"
                label="配件归属SKU"
                placeholder="请选择主品SKU"
                width="md"
                options={mainSkuOptions}
                showSearch
                fieldProps={{ optionFilterProp: 'label' }}
              />
            ) : null
          }
        </ProFormDependency>
        <ProFormText name="principle" label="工作原理" placeholder="请输入工作原理" width="md" rules={[{ max: 200, message: '最多 200 个字符' }]} />
        <ProFormText name="material" label="材质" placeholder="请输入材质" width="md" rules={[{ max: 200, message: '最多 200 个字符' }]} />
        <ProFormSwitch name="hasPlug" label="是否含插头" />
        <ProFormDigit name="customerWarrantyMonths" label="客户质保期（月）" placeholder="请输入月数" width="sm" min={0} fieldProps={{ precision: 0 }} />
        <ProFormSelect name="specialAttributes" label="特殊属性" placeholder="请选择" width="xs" options={[{ label: '是', value: '是' }, { label: '否', value: '否' }]} />
        <ProFormTextArea name="specialAttributesNote" label="特殊属性说明" placeholder="请输入特殊属性说明" width="xl" />
        <ProFormTextArea name="coreParams" label="核心参数" placeholder="请输入核心参数" width="xl" />
        <ProFormSelect name="electricalParams" label="电参数" placeholder="请选择电参数" width="md" options={ELECTRICAL_PARAMS_OPTIONS} />
        <ProFormTextArea name="productUsage" label="产品用途" placeholder="请输入产品用途" width="xl" />
        <ProFormSelect
          name="forbiddenCountries"
          label="禁止经营国家"
          placeholder="请选择国家"
          width="xl"
          mode="multiple"
          options={countryOptions}
          fieldProps={{ optionFilterProp: 'label', loading: countriesQuery.isLoading }}
        />
      </ProForm.Group>
    </div>
  );

  const imageTab = (
    <div className="master-form-body">
      <ProForm.Item name="_productImages" label="产品图片（可多张）">
        <Upload
          listType="picture-card"
          fileList={imageFileList}
          accept=".jpg,.jpeg,.png"
          multiple
          beforeUpload={(file) => {
            setImageFileList((prev) => [...prev, file as unknown as UploadFile]);
            handleImageUpload(file);
            return false;
          }}
          onRemove={(file) => {
            const index = imageFileList.indexOf(file);
            setImageFileList((prev) => prev.filter((_, idx) => idx !== index));
            setUploadedImageKeys((prev) => prev.filter((_, idx) => idx !== index));
          }}
        >
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>上传</div>
          </div>
        </Upload>
        {existingImageUrls.length > 0 && uploadedImageKeys.length === 0 ? (
          <div className="master-info-tip">已有 {existingImageUrls.length} 张图片，上传新图将替换。</div>
        ) : null}
      </ProForm.Item>
      {uploading ? <div className="master-info-tip">图片上传中，请稍候…</div> : null}
    </div>
  );

  const packagingTab = (
    <div className="master-form-body">
      <ProFormList
        name="packagingList"
        creatorButtonProps={{ creatorButtonText: '添加包装行' }}
        min={1}
        copyIconProps={false}
      >
        <ProForm.Group>
          <ProFormText name="packagingType" label="包装类型" placeholder="如：内包装/外包装" width="sm" />
          <ProFormDigit name="packagingQty" label="包装数量" placeholder="数量" width="xs" min={0} fieldProps={{ precision: 0 }} />
          <ProFormDigit name="weightKg" label="净重(KG)" placeholder="净重" width="xs" min={0} fieldProps={{ precision: 3 }} />
          <ProFormDigit name="grossWeightKg" label="毛重(KG)" placeholder="毛重" width="xs" min={0} fieldProps={{ precision: 3 }} />
          <ProFormDigit name="lengthCm" label="长(CM)" placeholder="长" width="xs" min={0} fieldProps={{ precision: 2 }} />
          <ProFormDigit name="widthCm" label="宽(CM)" placeholder="宽" width="xs" min={0} fieldProps={{ precision: 2 }} />
          <ProFormDigit name="heightCm" label="高(CM)" placeholder="高" width="xs" min={0} fieldProps={{ precision: 2 }} />
          <ProFormDigit name="volumeCbm" label="体积(CBM)" placeholder="体积" width="xs" min={0} fieldProps={{ precision: 4 }} />
        </ProForm.Group>
      </ProFormList>
      <div className="master-info-tip">如需自动计算体积，请在保存前确认长宽高单位为 CM。</div>
    </div>
  );

  const customsTab = (
    <div className="master-form-body">
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
        <ProFormDigit name="declaredValueRef" label="申报价值参考（USD）" placeholder="请输入参考价值" width="sm" min={0} fieldProps={{ precision: 2 }} />
        <ProFormDigit name="taxRefundRate" label="退税率（%）" placeholder="请输入退税率" width="sm" min={0} max={100} fieldProps={{ precision: 2 }} />
        <ProFormSwitch name="isInspectionRequired" label="是否需要检验" />
        <ProFormSwitch name="customsInfoMaintained" label="报关信息是否维护" />
        <ProFormText name="regulatoryConditions" label="监管条件" placeholder="请输入监管条件" width="xl" rules={[{ max: 500, message: '最多 500 个字符' }]} />
        <ProFormTextArea name="declarationElements" label="申报要素" placeholder="请输入申报要素" width="xl" />
      </ProForm.Group>
    </div>
  );

  const tabItems: TabsProps['items'] = [
    { key: 'basic', label: '基本信息', children: basicTab },
    { key: 'category', label: '分类信息', children: categoryTab },
    { key: 'spec', label: '规格参数', children: specTab },
    { key: 'images', label: '产品图片', children: imageTab },
    { key: 'packaging', label: '包装信息', children: packagingTab },
    { key: 'customs', label: '报关信息', children: customsTab },
  ];

  return (
    <div className="master-page master-form-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/skus')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/skus')}>
                SKU 管理
              </Button>
            ),
          },
          { title: isEdit ? `编辑 ${detailQuery.data?.skuCode || ''}` : '新建 SKU' },
        ]}
      />

      <ProForm
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
        initialValues={initialValues}
        onFinish={async (values) => {
          const rows: PackagingRow[] = values.packagingList ?? [];
          const firstRow = rows[0] ?? {};
          const imageKeys = uploadedImageKeys.length > 0 ? uploadedImageKeys : existingImageUrls;

          const payload: CreateSkuPayload = {
            skuCode: values.skuCode,
            spuId: values.spuId,
            unitId: values.unitId ?? undefined,
            nameCn: values.nameCn || undefined,
            nameEn: values.nameEn || undefined,
            specification: values.specification,
            status: values.status || undefined,
            productType: values.productType || undefined,
            productModel: values.productModel || undefined,
            accessoryParentSkuId: values.productType === '配件' ? values.accessoryParentSkuId ?? undefined : undefined,
            categoryLevel1Id: values.categoryLevel1Id ?? undefined,
            categoryLevel2Id: values.categoryLevel2Id ?? undefined,
            categoryLevel3Id: values.categoryLevel3Id ?? undefined,
            principle: values.principle || undefined,
            productUsage: values.productUsage || undefined,
            coreParams: values.coreParams || undefined,
            electricalParams: values.electricalParams || undefined,
            material: values.material || undefined,
            hasPlug: values.hasPlug ?? undefined,
            specialAttributes: values.specialAttributes || undefined,
            specialAttributesNote: values.specialAttributesNote || undefined,
            customerWarrantyMonths: values.customerWarrantyMonths ?? undefined,
            forbiddenCountries: values.forbiddenCountries?.length ? values.forbiddenCountries.join(',') : undefined,
            weightKg: firstRow.weightKg ?? 0,
            grossWeightKg: firstRow.grossWeightKg ?? undefined,
            lengthCm: firstRow.lengthCm ?? undefined,
            widthCm: firstRow.widthCm ?? undefined,
            heightCm: firstRow.heightCm ?? undefined,
            volumeCbm: firstRow.volumeCbm ?? 0,
            packagingList: rows.length ? JSON.stringify(rows) : undefined,
            hsCode: values.hsCode,
            customsNameCn: values.customsNameCn,
            customsNameEn: values.customsNameEn,
            declaredValueRef: values.declaredValueRef ?? undefined,
            declarationElements: values.declarationElements || undefined,
            isInspectionRequired: values.isInspectionRequired ?? undefined,
            regulatoryConditions: values.regulatoryConditions || undefined,
            taxRefundRate: values.taxRefundRate ?? undefined,
            customsInfoMaintained: values.customsInfoMaintained ?? undefined,
            productImageUrls: imageKeys.length ? JSON.stringify(imageKeys) : undefined,
          };

          if (isEdit) {
            await updateMutation.mutateAsync(payload);
          } else {
            await createMutation.mutateAsync(payload);
          }
          return true;
        }}
      >
        <div className="master-info-card">
          <Tabs className="master-info-tabs" defaultActiveKey="basic" items={tabItems} />
          <div className="master-form-footer">
            <Button onClick={() => navigate(-1)}>取消</Button>
            <Button
              type="primary"
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={() => formRef.current?.submit?.()}
            >
              {isEdit ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
