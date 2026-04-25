import { useRef, useState } from 'react';
import { Button, Result, Skeleton, TreeSelect, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
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
import { AnchorNav, SectionCard } from '../components/page-scaffold';
import '../master-page.css';

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
  const [activeAnchor, setActiveAnchor] = useState('basic');

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

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'relation', label: '归属与附件' },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑证书' : '新建证书'}</div>
          <div className="master-page-description">统一整理证书主体、归属关系与附件上传界面。</div>
        </div>
      </div>

      <ProForm
        formRef={formRef}
        loading={detailQuery.isLoading}
        submitter={false}
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
        <div className="master-form-layout">
          <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

          <div className="master-form-main">
            <SectionCard
              id="basic"
              title="基础信息"
              description="维护证书编号、名称、类型、有效期和发证机构信息。"
            >
              <div className="master-form-grid">
                <ProFormText
                  name="certificateNo"
                  label="证书编号"
                  placeholder="请输入证书编号（可选，不填则自动生成）"
                  rules={[{ max: 30, message: '证书编号最多 30 个字符' }]}
                />
                <ProFormText
                  name="certificateName"
                  label="证书名称"
                  placeholder="请输入证书名称"
                  rules={[
                    { required: true, message: '请输入证书名称' },
                    { max: 200, message: '证书名称最多 200 个字符' },
                  ]}
                />
                <ProFormSelect
                  name="certificateType"
                  label="证书类型"
                  placeholder="请选择证书类型"
                  options={CERTIFICATE_TYPE_OPTIONS}
                  rules={[{ required: true, message: '请选择证书类型' }]}
                />
                <ProFormText
                  name="directive"
                  label="指令法规"
                  placeholder="请输入指令法规（可选）"
                  rules={[{ max: 200, message: '指令法规最多 200 个字符' }]}
                />
                <ProFormDatePicker name="issueDate" label="发证日期" placeholder="请选择发证日期（可选）" />
                <ProFormDatePicker
                  name="validFrom"
                  label="有效期起"
                  placeholder="请选择开始日期"
                  rules={[{ required: true, message: '请选择有效期起始日期' }]}
                />
                <ProFormDatePicker
                  name="validUntil"
                  label="有效期止"
                  placeholder="请选择截止日期"
                  rules={[{ required: true, message: '请选择有效期截止日期' }]}
                />
                <ProFormText
                  name="issuingAuthority"
                  label="发证机构"
                  placeholder="请输入发证机构名称"
                  rules={[
                    { required: true, message: '请输入发证机构' },
                    { max: 200, message: '发证机构最多 200 个字符' },
                  ]}
                />
              </div>
            </SectionCard>

            <SectionCard
              id="relation"
              title="归属与附件"
              description="归属选择和文件上传逻辑保持不变，仅统一界面组织方式。"
            >
              <div className="master-form-grid">
                <ProFormSelect
                  name="attributionType"
                  label="归属类型"
                  placeholder="请选择归属类型"
                  options={ATTRIBUTION_TYPE_OPTIONS}
                  fieldProps={{
                    onChange: () => {
                      formRef.current?.setFieldsValue({ spuIds: undefined, categoryId: undefined });
                    },
                  }}
                />
                <div />
                <ProFormDependency name={['attributionType']}>
                  {({ attributionType }) => {
                    if (attributionType === '产品SPU归属') {
                      return (
                        <div className="full">
                          <div className="master-info-tip" style={{ marginTop: 0, marginBottom: 16 }}>
                            当前归属为「产品SPU归属」，请选择关联 SPU。
                          </div>
                          <ProFormSelect
                            name="spuIds"
                            label="关联 SPU"
                            placeholder="请选择关联的 SPU（可多选）"
                            mode="multiple"
                            options={spuOptions}
                            fieldProps={{ optionFilterProp: 'label', loading: spusQuery.isLoading }}
                            rules={[{ required: true, message: '请选择关联的 SPU' }]}
                          />
                        </div>
                      );
                    }
                    if (attributionType === '产品分类归属') {
                      return (
                        <div className="full">
                          <div className="master-info-tip" style={{ marginTop: 0, marginBottom: 16 }}>
                            当前归属为「产品分类归属」，请选择三级分类。
                          </div>
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
                              style={{ width: '100%' }}
                              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                              allowClear
                            />
                          </ProForm.Item>
                        </div>
                      );
                    }
                    return null;
                  }}
                </ProFormDependency>

                <div className="full">
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
                    <div className="master-info-tip">支持 `pdf/jpg/png`，上传后将存储到 OSS，不在本地持久化。</div>
                  </ProForm.Item>
                </div>

                <div className="full">
                  <ProFormTextArea name="remarks" label="证书说明" placeholder="请输入证书说明（可选）" fieldProps={{ rows: 4 }} />
                </div>
              </div>
            </SectionCard>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">当前仅统一证书页面排版与视觉样式，不改动归属判断和文件上传接口逻辑。</div>
              <div className="master-form-footer-actions">
                <Button onClick={() => navigate(isEdit ? `/master-data/certificates/${certId}` : '/master-data/certificates')}>
                  取消
                </Button>
                <Button
                  type="primary"
                  loading={uploading || createMutation.isPending || updateMutation.isPending}
                  onClick={() => formRef.current?.submit?.()}
                >
                  {isEdit ? '保存' : '创建'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProForm>
    </div>
  );
}
