import { useRef, useState } from 'react';
import { Breadcrumb, Button, Result, Skeleton, Upload, message } from 'antd';
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
  QUESTION_TYPE_OPTIONS,
  createSpuFaq,
  getSpuFaqById,
  updateSpuFaq,
  uploadFaqAttachment,
  type CreateSpuFaqPayload,
  type SpuFaqQuestionType,
  type UpdateSpuFaqPayload,
} from '../../../api/spu-faqs.api';
import '../master-page.css';

export default function SpuFaqFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const faqId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const detailQuery = useQuery({
    queryKey: ['spu-faq-detail', faqId],
    queryFn: () => getSpuFaqById(faqId as number),
    enabled: Boolean(isEdit && faqId && Number.isInteger(faqId) && faqId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSpuFaqPayload) => createSpuFaq(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spu-faqs'] });
      message.success('FAQ 创建成功', 3);
      navigate('/master-data/spu-faqs');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSpuFaqPayload) => updateSpuFaq(faqId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spu-faqs'] });
      queryClient.invalidateQueries({ queryKey: ['spu-faq-detail', faqId] });
      message.success('FAQ 更新成功', 3);
      navigate('/master-data/spu-faqs');
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadFaqAttachment(file);
      setUploadedKey(result.key);
      message.success('附件上传成功', 3);
    } catch (error: any) {
      message.error(error?.message ?? '附件上传失败', 5);
      setFileList([]);
    } finally {
      setUploading(false);
    }
  };

  if (isEdit && (!faqId || !Number.isInteger(faqId) || faqId <= 0)) {
    return (
      <Result
        status="404"
        title="FAQ 不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/spu-faqs')}>返回列表</Button>}
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
        title="FAQ 详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/spu-faqs')}>返回列表</Button>,
        ]}
      />
    );
  }

  const detail = detailQuery.data;

  return (
    <div className="master-page master-form-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/spu-faqs')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/spu-faqs')}>
                FAQ 管理
              </Button>
            ),
          },
          { title: isEdit ? '编辑 FAQ' : '新建 FAQ' },
        ]}
      />

      <ProForm
        formRef={formRef}
        submitter={false}
        initialValues={
          isEdit && detail
            ? {
                question: detail.question,
                answer: detail.answer,
                questionType: detail.questionType,
                spuCode: detail.spuCode ?? undefined,
              }
            : undefined
        }
        onFinish={async (values) => {
          const attachmentUrl = uploadedKey ?? (isEdit ? detail?.attachmentUrl ?? undefined : undefined);

          if (isEdit) {
            const payload: UpdateSpuFaqPayload = {
              question: values.question,
              answer: values.answer,
              questionType: values.questionType as SpuFaqQuestionType,
              attachmentUrl: attachmentUrl ?? undefined,
            };
            await updateMutation.mutateAsync(payload);
          } else {
            const payload: CreateSpuFaqPayload = {
              question: values.question,
              answer: values.answer,
              questionType: values.questionType as SpuFaqQuestionType,
              spuCode: values.spuCode || undefined,
              attachmentUrl: attachmentUrl ?? undefined,
            };
            await createMutation.mutateAsync(payload);
          }
          return true;
        }}
      >
        <div className="master-info-card">
          <div className="master-form-body">
            <ProForm.Group>
              <ProFormSelect
                name="questionType"
                label="问题类型"
                placeholder="请选择问题类型"
                width="md"
                options={QUESTION_TYPE_OPTIONS}
                rules={[{ required: true, message: '请选择问题类型' }]}
              />
              <ProFormText
                name="spuCode"
                label="SPU 编码"
                placeholder="请输入 SPU 编码（可选）"
                width="sm"
                rules={[{ max: 30, message: 'SPU 编码最多 30 个字符' }]}
              />
            </ProForm.Group>

            <ProFormText
              name="question"
              label="问题"
              placeholder="请输入问题内容"
              width="xl"
              rules={[
                { required: true, message: '请输入问题' },
                { max: 500, message: '问题最多 500 个字符' },
              ]}
              fieldProps={{ showCount: true, maxLength: 500 }}
            />

            <ProFormTextArea
              name="answer"
              label="回答"
              placeholder="请输入回答内容"
              width="xl"
              rules={[{ required: true, message: '请输入回答' }]}
              fieldProps={{ rows: 6, autoSize: { minRows: 4, maxRows: 12 } }}
            />

            <ProForm.Item label="上传附件">
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
                  setUploadedKey(null);
                }}
              >
                <Button loading={uploading}>
                  {isEdit && detail?.attachmentUrl ? '替换附件' : '选择文件（PDF / 图片）'}
                </Button>
              </Upload>
              {isEdit && detail?.attachmentUrl && !uploadedKey ? (
                <div className="master-info-tip">当前已有附件，上传新文件将替换。</div>
              ) : null}
            </ProForm.Item>
          </div>
          <div className="master-form-footer">
            <Button onClick={() => navigate('/master-data/spu-faqs')}>取消</Button>
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
