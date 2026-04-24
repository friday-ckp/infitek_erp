import { useEffect, useRef, useState } from 'react';
import { Breadcrumb, Button, Result, Select, Skeleton, TreeSelect, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createProductDocument,
  getProductDocumentById,
  updateProductDocument,
  uploadProductDocumentFile,
  DOCUMENT_TYPE_OPTIONS,
  ATTRIBUTION_TYPE_OPTIONS,
  type CreateProductDocumentPayload,
  type UpdateProductDocumentPayload,
} from '../../../api/product-documents.api';
import { getProductCategoryTree, type ProductCategoryNode } from '../../../api/product-categories.api';
import { getCountries } from '../../../api/countries.api';
import { getSpus } from '../../../api/spus.api';
import antdStatic from '../../../utils/antdStatic';
import './product-document-page.css';

function buildTreeData(nodes: ProductCategoryNode[], filterLevel?: number): any[] {
  return nodes.map((n) => ({
    title: n.name,
    value: n.id,
    selectable: filterLevel ? n.level === filterLevel : true,
    disabled: filterLevel ? n.level !== filterLevel : false,
    children: n.children?.length ? buildTreeData(n.children, filterLevel) : undefined,
  }));
}

export default function ProductDocumentFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const docId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);

  const [attributionType, setAttributionType] = useState<string>('general');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['product-document-detail', docId],
    queryFn: () => getProductDocumentById(docId as number),
    enabled: Boolean(isEdit && docId && Number.isInteger(docId) && docId > 0),
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['product-category-tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  const countriesQuery = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => getCountries({ pageSize: 300 }),
    staleTime: 10 * 60 * 1000,
  });

  const spusQuery = useQuery({
    queryKey: ['spus-options'],
    queryFn: () => getSpus({ pageSize: 300 }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateProductDocumentPayload) => createProductDocument(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-documents'] });
      antdStatic.message?.success('资料创建成功', 3);
      navigate(`/master-data/product-documents/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProductDocumentPayload) => updateProductDocument(docId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-documents'] });
      queryClient.invalidateQueries({ queryKey: ['product-document-detail', docId] });
      antdStatic.message?.success('资料更新成功', 3);
      navigate(`/master-data/product-documents/${docId}`);
    },
  });

  if (isEdit && (!docId || !Number.isInteger(docId) || docId <= 0)) {
    return (
      <Result
        status="404"
        title="资料不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/product-documents')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) return <Skeleton active />;

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="加载资料信息失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/product-documents')}>返回列表</Button>,
        ]}
      />
    );
  }

  const countryOptions = (countriesQuery.data?.list ?? []).map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const spuOptions = (spusQuery.data?.list ?? []).map((s) => ({
    label: `${s.spuCode} - ${s.name}`,
    value: s.id,
  }));

  const level3TreeData = buildTreeData(categoryTreeQuery.data ?? [], 3);
  const level1TreeData = buildTreeData(categoryTreeQuery.data ?? [], 1);
  const level2TreeData = buildTreeData(categoryTreeQuery.data ?? [], 2);

  const initialValues = detailQuery.data
    ? {
        documentName: detailQuery.data.documentName,
        documentType: detailQuery.data.documentType,
        content: detailQuery.data.content ?? undefined,
        attributionType: detailQuery.data.attributionType,
        countryId: detailQuery.data.countryId ?? undefined,
        categoryLevel1Id: detailQuery.data.categoryLevel1Id ?? undefined,
        categoryLevel2Id: detailQuery.data.categoryLevel2Id ?? undefined,
        categoryLevel3Id: detailQuery.data.categoryLevel3Id ?? undefined,
        spuId: detailQuery.data.spuId ?? undefined,
      }
    : { attributionType: 'general' };

  useEffect(() => {
    if (!detailQuery.data) return;

    setAttributionType(detailQuery.data.attributionType);

    if (detailQuery.data.fileName) {
      setFileList([
        {
          uid: String(detailQuery.data.id),
          name: detailQuery.data.fileName,
          status: 'done',
        },
      ]);
    }

    if (detailQuery.data.fileKey) {
      setUploadedFileKey(detailQuery.data.fileKey);
      setUploadedFileName(detailQuery.data.fileName);
    }
  }, [detailQuery.data]);

  const handleUpload = async (file: File): Promise<boolean> => {
    setUploading(true);
    try {
      const result = await uploadProductDocumentFile(file);
      setUploadedFileKey(result.key);
      setUploadedFileName(file.name);
      antdStatic.message?.success('文件上传成功');
      return true;
    } catch {
      antdStatic.message?.error('文件上传失败');
      setFileList([]);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleAttributionChange = (val: string) => {
    setAttributionType(val);
    formRef.current?.setFieldsValue({
      categoryLevel1Id: undefined,
      categoryLevel2Id: undefined,
      categoryLevel3Id: undefined,
      spuId: undefined,
    });
  };

  const renderAttributionFields = () => {
    if (attributionType === 'category_l1') {
      return (
        <div className="pd-cond-block">
          <div className="pd-cond-label">▼ 当前归属为「产品一级分类归属」，请选择分类</div>
          <ProForm.Item name="categoryLevel1Id" label="所属产品一级分类" rules={[{ required: true, message: '请选择一级分类' }]}>
            <TreeSelect
              treeData={level1TreeData}
              allowClear
              showSearch
              treeNodeFilterProp="title"
              placeholder="请选择一级分类"
              style={{ width: 360 }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              loading={categoryTreeQuery.isLoading}
            />
          </ProForm.Item>
        </div>
      );
    }
    if (attributionType === 'category_l2') {
      return (
        <div className="pd-cond-block">
          <div className="pd-cond-label">▼ 当前归属为「产品二级分类归属」，请选择分类</div>
          <ProForm.Item name="categoryLevel2Id" label="所属产品二级分类" rules={[{ required: true, message: '请选择二级分类' }]}>
            <TreeSelect
              treeData={level2TreeData}
              allowClear
              showSearch
              treeNodeFilterProp="title"
              placeholder="请选择二级分类"
              style={{ width: 360 }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              loading={categoryTreeQuery.isLoading}
            />
          </ProForm.Item>
        </div>
      );
    }
    if (attributionType === 'category_l3') {
      return (
        <div className="pd-cond-block">
          <div className="pd-cond-label">▼ 当前归属为「产品三级分类归属」，请选择分类</div>
          <ProForm.Item name="categoryLevel3Id" label="所属产品三级分类" rules={[{ required: true, message: '请选择三级分类' }]}>
            <TreeSelect
              treeData={level3TreeData}
              allowClear
              showSearch
              treeNodeFilterProp="title"
              placeholder="请选择三级分类"
              style={{ width: 360 }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              loading={categoryTreeQuery.isLoading}
            />
          </ProForm.Item>
        </div>
      );
    }
    if (attributionType === 'product') {
      return (
        <div className="pd-cond-block">
          <div className="pd-cond-label">▼ 当前归属为「产品归属」，请选择所属产品</div>
          <ProFormSelect
            name="spuId"
            label="所属产品"
            placeholder="请选择所属产品"
            width="xl"
            options={spuOptions}
            fieldProps={{ optionFilterProp: 'label', loading: spusQuery.isLoading, showSearch: true }}
            rules={[{ required: true, message: '请选择所属产品' }]}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="pd-page pd-form-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="pd-breadcrumb-link" onClick={() => navigate('/master-data/product-documents')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="pd-breadcrumb-link" onClick={() => navigate('/master-data/product-documents')}>
                产品资料库
              </Button>
            ),
          },
          { title: isEdit ? `编辑资料` : '新建资料' },
        ]}
      />

      <ProForm
        formRef={formRef}
        loading={detailQuery.isLoading}
        submitter={false}
        initialValues={initialValues}
        onFinish={async (values) => {
          const fileKey = uploadedFileKey ?? detailQuery.data?.fileKey ?? undefined;
          const fileName = uploadedFileName ?? detailQuery.data?.fileName ?? undefined;

          if (uploading) {
            antdStatic.message?.warning('文件上传中，请稍后再保存');
            return false;
          }

          const payload: CreateProductDocumentPayload = {
            documentName: values.documentName,
            documentType: values.documentType,
            content: values.content || undefined,
            attributionType: values.attributionType,
            countryId: values.countryId ? Number(values.countryId) : null,
            categoryLevel1Id: values.attributionType === 'category_l1' && values.categoryLevel1Id ? Number(values.categoryLevel1Id) : null,
            categoryLevel2Id: values.attributionType === 'category_l2' && values.categoryLevel2Id ? Number(values.categoryLevel2Id) : null,
            categoryLevel3Id: values.attributionType === 'category_l3' && values.categoryLevel3Id ? Number(values.categoryLevel3Id) : null,
            spuId: values.attributionType === 'product' && values.spuId ? Number(values.spuId) : null,
            fileKey: fileKey && fileName ? fileKey : undefined,
            fileName: fileKey && fileName ? fileName : undefined,
          };

          if (isEdit) {
            await updateMutation.mutateAsync(payload as UpdateProductDocumentPayload);
          } else {
            await createMutation.mutateAsync(payload);
          }
          return true;
        }}
        onFinishFailed={({ errorFields }) => {
          if (errorFields.length > 0) {
            antdStatic.message?.error(errorFields[0]?.errors?.[0] || '请先完善必填信息');
          }
        }}
      >
        <div className="pd-info-card">
          <div className="pd-form-tab">
            <ProForm.Group>
              <ProFormText
                name="documentName"
                label="资料名称"
                placeholder="请输入资料名称"
                width="md"
                rules={[
                  { required: true, message: '请输入资料名称' },
                  { max: 200, message: '最多 200 个字符' },
                ]}
              />
              <ProFormSelect
                name="documentType"
                label="资料类型"
                placeholder="请选择资料类型"
                width="sm"
                options={DOCUMENT_TYPE_OPTIONS}
                rules={[{ required: true, message: '请选择资料类型' }]}
              />
            </ProForm.Group>

            <ProForm.Group>
              <ProFormSelect
                name="attributionType"
                label="归属类型"
                placeholder="请选择归属类型"
                width="sm"
                options={ATTRIBUTION_TYPE_OPTIONS}
                rules={[{ required: true, message: '请选择归属类型' }]}
                fieldProps={{ onChange: handleAttributionChange }}
              />
              <ProForm.Item name="countryId" label="国家/地区">
                <Select
                  style={{ width: 240 }}
                  placeholder="请选择国家/地区（可选）"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  loading={countriesQuery.isLoading}
                  options={countryOptions}
                />
              </ProForm.Item>
            </ProForm.Group>

            {renderAttributionFields()}

            <ProForm.Item label="资料文件" style={{ marginTop: 16 }}>
              <Upload
                fileList={fileList}
                maxCount={1}
                beforeUpload={(file) => {
                  setFileList([file as unknown as UploadFile]);
                  handleUpload(file);
                  return false;
                }}
                onRemove={() => {
                  setFileList([]);
                  setUploadedFileKey(null);
                  setUploadedFileName(null);
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {isEdit && detailQuery.data?.fileName
                    ? `替换文件（当前：${detailQuery.data.fileName}）`
                    : '选择文件'}
                </Button>
              </Upload>
              <div className="pd-file-hint">
                上传后将存储到 OSS，不在本地持久化。
              </div>
            </ProForm.Item>

            <ProFormTextArea
              name="content"
              label="资料内容"
              placeholder="请输入资料内容说明（可选）"
              width="xl"
              fieldProps={{ rows: 5 }}
            />
          </div>

          <div className="pd-form-footer">
            <Button onClick={() => navigate(-1)}>取消</Button>
            <Button
              htmlType="submit"
              type="primary"
              loading={uploading || createMutation.isPending || updateMutation.isPending}
            >
              {isEdit ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
