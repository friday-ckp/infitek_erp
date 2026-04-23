import { useRef, useState } from 'react';
import { Button, Result, Skeleton, Space, TreeSelect, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  ProCard,
  ProForm,
  ProFormDatePicker,
  ProFormDependency,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCertificate,
  getCertificateById,
  updateCertificate,
  uploadCertificateFile,
  type CreateCertificatePayload,
  type UpdateCertificatePayload,
} from '../../../api/certificates.api';
import { getSpus } from '../../../api/spus.api';
import { getProductCategoryTree, type ProductCategoryNode } from '../../../api/product-categories.api';

const CERTIFICATE_TYPE_OPTIONS = [
  'CE', 'FDA', 'IEC第三方检测报告', 'DOC',
  'IS09001', 'ISO14001', 'ISO45001', 'ISO13485', '其它',
].map((v) => ({ label: v, value: v }));

const ATTRIBUTION_TYPE_OPTIONS = [
  { label: '通用归属', value: '通用归属' },
  { label: '产品SPU归属', value: '产品SPU归属' },
  { label: '产品分类归属', value: '产品分类归属' },
];

function buildCategoryTreeData(nodes: ProductCategoryNode[]): any[] {
  return nodes.map((n) => ({
    title: n.name,
    value: n.id,
    selectable: n.level === 3,
    children: n.children?.length ? buildCategoryTreeData(n.children) : undefined,
  }));
}

export default function CertificateFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const certId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['certificate-detail', certId],
    queryFn: () => getCertificateById(certId as number),
    enabled: Boolean(isEdit && certId && Number.isInteger(certId) && certId > 0),
  });

  const spusQuery = useQuery({
    queryKey: ['spus-options'],
    queryFn: () => getSpus({ pageSize: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const categoryTreeQuery = useQuery({
    queryKey: ['product-category-tree'],
    queryFn: getProductCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCertificatePayload) => createCertificate(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      message.success('证书创建成功', 3);
      navigate(`/master-data/certificates/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCertificatePayload) => updateCertificate(certId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-detail', certId] });
      message.success('证书更新成功', 3);
      navigate(`/master-data/certificates/${certId}`);
    },
  });

  if (isEdit && (!certId || !Number.isInteger(certId) || certId <= 0)) {
    return (
      <Result
        status="404"
        title="证书不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/certificates')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) return <Skeleton active />;

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="加载证书信息失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/certificates')}>返回列表</Button>,
        ]}
      />
    );
  }

  const spuOptions = (spusQuery.data?.list ?? []).map((s) => ({
    label: `${s.spuCode} ${s.name}`,
    value: s.id,
  }));

  const categoryTreeData = buildCategoryTreeData(categoryTreeQuery.data ?? []);

  const initialValues = detailQuery.data
    ? {
        certificateNo: detailQuery.data.certificateNo ?? undefined,
        certificateName: detailQuery.data.certificateName,
        certificateType: detailQuery.data.certificateType,
        directive: detailQuery.data.directive ?? undefined,
        issueDate: detailQuery.data.issueDate ?? undefined,
        validFrom: detailQuery.data.validFrom,
        validUntil: detailQuery.data.validUntil,
        issuingAuthority: detailQuery.data.issuingAuthority,
        remarks: detailQuery.data.remarks ?? undefined,
        attributionType: detailQuery.data.attributionType ?? undefined,
        categoryId: detailQuery.data.categoryId ?? undefined,
        spuIds: detailQuery.data.spus.map((s) => s.id),
      }
    : {};

  const handleUpload = async (file: File): Promise<boolean> => {
    setUploading(true);
    try {
      const result = await uploadCertificateFile(file);
      setUploadedFileKey(result.key);
      setUploadedFileName(file.name);
      message.success('文件上传成功');
      return true;
    } catch {
      message.error('文件上传失败');
      return false;
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProForm
      formRef={formRef}
      title={isEdit ? '编辑证书' : '新建证书'}
      loading={detailQuery.isLoading}
      submitter={{
        searchConfig: { submitText: isEdit ? '保存' : '创建' },
        render: (_, dom) => (
          <Space>
            <Button onClick={() => navigate(-1)}>取消</Button>
            {dom[1]}
          </Space>
        ),
      }}
      initialValues={initialValues}
      onFinish={async (values) => {
        const fileKey = uploadedFileKey ?? detailQuery.data?.fileKey ?? undefined;
        const fileName = uploadedFileName ?? detailQuery.data?.fileName ?? undefined;

        const payload: CreateCertificatePayload = {
          certificateNo: values.certificateNo || undefined,
          certificateName: values.certificateName,
          certificateType: values.certificateType,
          directive: values.directive || undefined,
          issueDate: values.issueDate || undefined,
          validFrom: values.validFrom,
          validUntil: values.validUntil,
          issuingAuthority: values.issuingAuthority,
          remarks: values.remarks || undefined,
          attributionType: values.attributionType || undefined,
          categoryId: values.attributionType === '产品分类归属' && values.categoryId ? Number(values.categoryId) : undefined,
          fileKey,
          fileName,
          spuIds: values.attributionType === '产品SPU归属' && values.spuIds?.length ? values.spuIds.map(Number) : undefined,
        };

        if (isEdit) {
          await updateMutation.mutateAsync(payload as UpdateCertificatePayload);
        } else {
          await createMutation.mutateAsync(payload);
        }
        return true;
      }}
    >
      <ProCard title="基础信息" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormText
            name="certificateNo"
            label="证书编号"
            placeholder="请输入证书编号（可选，不填则自动生成）"
            width="sm"
            rules={[{ max: 30, message: '证书编号最多 30 个字符' }]}
          />
          <ProFormText
            name="certificateName"
            label="证书名称"
            placeholder="请输入证书名称"
            width="md"
            rules={[
              { required: true, message: '请输入证书名称' },
              { max: 200, message: '证书名称最多 200 个字符' },
            ]}
          />
          <ProFormSelect
            name="certificateType"
            label="证书类型"
            placeholder="请选择证书类型"
            width="sm"
            options={CERTIFICATE_TYPE_OPTIONS}
            rules={[{ required: true, message: '请选择证书类型' }]}
          />
          <ProFormText
            name="directive"
            label="指令法规"
            placeholder="请输入指令法规（可选）"
            width="md"
            rules={[{ max: 200, message: '指令法规最多 200 个字符' }]}
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="有效期信息" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormDatePicker name="issueDate" label="发证日期" placeholder="请选择发证日期（可选）" width="sm" />
          <ProFormDatePicker name="validFrom" label="有效期起" placeholder="请选择开始日期" width="sm" rules={[{ required: true, message: '请选择有效期起始日期' }]} />
          <ProFormDatePicker name="validUntil" label="有效期止" placeholder="请选择截止日期" width="sm" rules={[{ required: true, message: '请选择有效期截止日期' }]} />
        </ProForm.Group>
      </ProCard>

      <ProCard title="发证机构" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormText
            name="issuingAuthority"
            label="发证机构"
            placeholder="请输入发证机构名称"
            width="md"
            rules={[
              { required: true, message: '请输入发证机构' },
              { max: 200, message: '发证机构最多 200 个字符' },
            ]}
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="证书文件" bordered style={{ marginBottom: 16 }}>
        <ProForm.Item label="上传证书文件">
          <Upload
            fileList={fileList}
            maxCount={1}
            accept=".pdf,.jpg,.jpeg,.png"
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
              {isEdit && detailQuery.data?.fileName ? `替换文件（当前：${detailQuery.data.fileName}）` : '选择文件'}
            </Button>
          </Upload>
        </ProForm.Item>
      </ProCard>

      <ProCard title="资料归属信息" bordered style={{ marginBottom: 16 }}>
        <ProFormSelect
          name="attributionType"
          label="归属类型"
          placeholder="请选择归属类型"
          width="sm"
          options={ATTRIBUTION_TYPE_OPTIONS}
          fieldProps={{
            onChange: () => {
              formRef.current?.setFieldsValue({ spuIds: undefined, categoryId: undefined });
            },
          }}
        />
        <ProFormDependency name={['attributionType']}>
          {({ attributionType }) => {
            if (attributionType === '产品SPU归属') {
              return (
                <ProFormSelect
                  name="spuIds"
                  label="关联 SPU"
                  placeholder="请选择关联的 SPU（可多选）"
                  width="xl"
                  mode="multiple"
                  options={spuOptions}
                  fieldProps={{ optionFilterProp: 'label', loading: spusQuery.isLoading }}
                  rules={[{ required: true, message: '请选择关联的 SPU' }]}
                />
              );
            }
            if (attributionType === '产品分类归属') {
              return (
                <ProForm.Item
                  name="categoryId"
                  label="所属产品分类"
                  rules={[{ required: true, message: '请选择所属产品分类' }]}
                >
                  <TreeSelect
                    placeholder="请选择三级分类"
                    treeData={categoryTreeData}
                    loading={categoryTreeQuery.isLoading}
                    showSearch
                    treeNodeFilterProp="title"
                    style={{ width: 400 }}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    allowClear
                  />
                </ProForm.Item>
              );
            }
            return null;
          }}
        </ProFormDependency>
      </ProCard>

      <ProCard title="其他" bordered>
        <ProFormTextArea name="remarks" label="证书说明" placeholder="请输入证书说明（可选）" width="xl" />
      </ProCard>
    </ProForm>
  );
}
