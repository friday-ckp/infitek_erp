import { useEffect, useRef, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Result, Skeleton, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { ProForm, ProFormSwitch, ProFormText, ProFormTextArea, type ProFormInstance } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createContractTemplate,
  getContractTemplateById,
  updateContractTemplate,
  uploadContractTemplateFile,
  type CreateContractTemplatePayload,
  type UpdateContractTemplatePayload,
} from '../../../api/contract-templates.api';
import antdStatic from '../../../utils/antdStatic';
import { AnchorNav, SectionCard } from '../components/page-scaffold';
import '../master-page.css';

export default function ContractTemplateFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const templateId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingValues, setPendingValues] = useState<Record<string, unknown> | null>(null);

  const detailQuery = useQuery({
    queryKey: ['contract-template-detail', templateId],
    queryFn: () => getContractTemplateById(templateId as number),
    enabled: Boolean(isEdit && templateId && Number.isInteger(templateId) && templateId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateContractTemplatePayload) => createContractTemplate(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      antdStatic.message?.success('合同条款范本创建成功', 3);
      navigate(`/master-data/contract-templates/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateContractTemplatePayload) => updateContractTemplate(templateId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
      queryClient.invalidateQueries({ queryKey: ['contract-template-detail', templateId] });
      antdStatic.message?.success('合同条款范本更新成功', 3);
      navigate(`/master-data/contract-templates/${templateId}`);
    },
  });

  useEffect(() => {
    if (!detailQuery.data) return;

    if (detailQuery.data.templateFileName) {
      setFileList([
        {
          uid: String(detailQuery.data.id),
          name: detailQuery.data.templateFileName,
          status: 'done',
        },
      ]);
      setUploadedFileKey(detailQuery.data.templateFileKey);
      setUploadedFileName(detailQuery.data.templateFileName);
    }
  }, [detailQuery.data]);

  if (isEdit && (!templateId || !Number.isInteger(templateId) || templateId <= 0)) {
    return (
      <Result
        status="404"
        title="合同条款范本不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/contract-templates')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) return <Skeleton active />;

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="加载合同条款范本失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/contract-templates')}>返回列表</Button>,
        ]}
      />
    );
  }

  const initialValues = detailQuery.data
    ? {
        name: detailQuery.data.name,
        description: detailQuery.data.description ?? undefined,
        content: detailQuery.data.content,
        isDefault: Boolean(detailQuery.data.isDefault),
        requiresLegalReview: Boolean(detailQuery.data.requiresLegalReview),
      }
    : {
        isDefault: false,
        requiresLegalReview: false,
      };

  const handleUpload = async (file: File): Promise<boolean> => {
    setUploading(true);
    try {
      const result = await uploadContractTemplateFile(file);
      setUploadedFileKey(result.key);
      setUploadedFileName(file.name);
      antdStatic.message?.success('模板文件上传成功');
      return true;
    } catch {
      antdStatic.message?.error('模板文件上传失败');
      setFileList([]);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const performSubmit = async (values: Record<string, unknown>) => {
    const description = (values.description as string | undefined)?.trim();
    if (isEdit) {
      const payload: UpdateContractTemplatePayload = {
        name: values.name as string,
        description: description || null,
        content: values.content as string,
        isDefault: values.isDefault ? 1 : 0,
        requiresLegalReview: values.requiresLegalReview ? 1 : 0,
        templateFileKey: uploadedFileKey,
        templateFileName: uploadedFileName,
      };
      await updateMutation.mutateAsync(payload);
    } else {
      const payload: CreateContractTemplatePayload = {
        name: values.name as string,
        content: values.content as string,
        isDefault: values.isDefault ? 1 : 0,
        requiresLegalReview: values.requiresLegalReview ? 1 : 0,
        templateFileKey: uploadedFileKey ?? undefined,
        templateFileName: uploadedFileName ?? undefined,
      };
      if (description) payload.description = description;
      await createMutation.mutateAsync(payload);
    }
    return true;
  };

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'file', label: '模板文件' },
    { key: 'content', label: '条款内容' },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑条款范本' : '新建条款范本'}</div>
          <div className="master-page-description">统一维护合同模板名称、文件、说明与条款内容。</div>
        </div>
      </div>

      <ProForm
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
        initialValues={initialValues}
        onFinish={async (values) => {
          if (isEdit && detailQuery.data?.status === 'approved' && (detailQuery.data.usageCount ?? 0) > 0) {
            setPendingValues(values);
            setConfirmVisible(true);
            return false;
          }
          await performSubmit(values);
          return true;
        }}
      >
        <div className="master-form-layout">
          <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
          <div className="master-form-main">
            <SectionCard id="basic" title="基础信息" description="填写模板名称和启用方式。">
              <div className="master-form-grid">
                <ProFormText
                  name="name"
                  label="合同模板名称"
                  placeholder="请输入合同模板名称"
                  rules={[
                    { required: true, message: '请输入合同模板名称' },
                    { max: 200, message: '合同模板名称最多 200 个字符' },
                  ]}
                />
                <ProFormSwitch
                  name="isDefault"
                  label="是否默认模板"
                  fieldProps={{ checkedChildren: '是', unCheckedChildren: '否' }}
                />
                <ProFormSwitch
                  name="requiresLegalReview"
                  label="是否为法务审核模板"
                  fieldProps={{ checkedChildren: '是', unCheckedChildren: '否' }}
                />
              </div>
            </SectionCard>

            <SectionCard id="file" title="模板文件" description="上传或替换合同文件模板。">
              <div className="master-form-grid">
                <div className="full">
                  <Upload
                    fileList={fileList}
                    maxCount={1}
                    beforeUpload={async (file) => {
                      const success = await handleUpload(file);
                      if (success) {
                        setFileList([{ uid: file.uid, name: file.name, status: 'done' }]);
                      }
                      return false;
                    }}
                    onRemove={() => {
                      setFileList([]);
                      setUploadedFileKey(null);
                      setUploadedFileName(null);
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading}>上传模板文件</Button>
                  </Upload>
                </div>
                <div className="full">
                  <ProFormTextArea
                    name="description"
                    label="模板说明"
                    fieldProps={{ rows: 4 }}
                    placeholder="请输入模板说明"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard id="content" title="条款内容" description="维护模板正文内容和业务说明。">
              <div className="master-form-grid">
                <div className="full">
                  <ProFormTextArea
                    name="content"
                    label="合同条款"
                    fieldProps={{ rows: 10 }}
                    placeholder="请输入合同条款"
                    rules={[{ required: true, message: '请输入合同条款' }]}
                  />
                </div>
              </div>
            </SectionCard>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">本页仅统一视觉和结构，不改变条款模板审批与上传逻辑。</div>
              <div className="master-form-footer-actions">
                <Button onClick={() => navigate('/master-data/contract-templates')}>取消</Button>
                <Button
                  type="primary"
                  loading={createMutation.isPending || updateMutation.isPending}
                  onClick={() => formRef.current?.submit?.()}
                >
                  {isEdit ? '保存' : '创建'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProForm>

      <Popconfirm
        title="确认更新已被引用的审核通过模板？"
        description={`该条款已被 ${detailQuery.data?.usageCount ?? 0} 张采购订单引用，修改后引用方将展示最新条款内容，请确认修改内容已获相关人员知悉。`}
        open={confirmVisible}
        okText="确认保存"
        cancelText="取消"
        onConfirm={async () => {
          if (pendingValues) {
            await performSubmit(pendingValues);
          }
          setConfirmVisible(false);
          setPendingValues(null);
        }}
        onCancel={() => {
          setConfirmVisible(false);
          setPendingValues(null);
        }}
      >
        <span />
      </Popconfirm>
    </div>
  );
}
