import { useEffect, useRef, useState } from 'react';
import { Breadcrumb, Button, Popconfirm, Result, Skeleton, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  ProForm,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
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
import '../master-page.css';

export default function ContractTemplateFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const templateId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);

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
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/contract-templates')}>
            返回列表
          </Button>
        }
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
        title="加载合同条款范本失败"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/contract-templates')}>
            返回列表
          </Button>,
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
      if (description) {
        payload.description = description;
      }
      await createMutation.mutateAsync(payload);
    }
    return true;
  };

  return (
    <div className="master-page master-form-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button
                type="link"
                className="master-breadcrumb-link"
                onClick={() => navigate('/master-data/contract-templates')}
              >
                基础数据
              </Button>
            ),
          },
          {
            title: (
              <Button
                type="link"
                className="master-breadcrumb-link"
                onClick={() => navigate('/master-data/contract-templates')}
              >
                合同条款范本
              </Button>
            ),
          },
          { title: isEdit ? `编辑 ${detailQuery.data?.name || ''}` : '新建条款范本' },
        ]}
      />

      <ProForm
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
        initialValues={initialValues}
        onFinish={async (values) => {
          if (
            isEdit &&
            detailQuery.data?.status === 'approved' &&
            (detailQuery.data.usageCount ?? 0) > 0
          ) {
            setPendingValues(values);
            setConfirmVisible(true);
            return false;
          }
          await performSubmit(values);
          return true;
        }}
      >
        <div className="master-info-card">
          <div className="master-form-body">
            <ProForm.Group>
              <ProFormText
                name="name"
                label="合同模板名称"
                width="md"
                placeholder="请输入合同模板名称"
                rules={[
                  { required: true, message: '请输入合同模板名称' },
                  { max: 200, message: '合同模板名称最多 200 个字符' },
                ]}
              />
            </ProForm.Group>

            <ProForm.Group>
              <ProForm.Item label="合同文件模板" name="templateFileUpload">
                <Upload
                  fileList={fileList}
                  maxCount={1}
                  beforeUpload={async (file) => {
                    const success = await handleUpload(file);
                    if (success) {
                      setFileList([
                        {
                          uid: file.uid,
                          name: file.name,
                          status: 'done',
                        },
                      ]);
                    }
                    return false;
                  }}
                  onRemove={() => {
                    setFileList([]);
                    setUploadedFileKey(null);
                    setUploadedFileName(null);
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    上传模板文件
                  </Button>
                </Upload>
              </ProForm.Item>
            </ProForm.Group>

            <ProForm.Group>
              <ProFormTextArea
                name="description"
                label="模板说明"
                width="xl"
                fieldProps={{ rows: 4 }}
                placeholder="请输入模板说明"
              />
            </ProForm.Group>

            <ProForm.Group>
              <ProFormTextArea
                name="content"
                label="合同条款"
                width="xl"
                fieldProps={{ rows: 10 }}
                placeholder="请输入合同条款"
                rules={[{ required: true, message: '请输入合同条款' }]}
              />
            </ProForm.Group>

            <ProForm.Group>
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
            </ProForm.Group>
          </div>
          <div className="master-form-footer">
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
