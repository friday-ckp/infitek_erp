import { useRef, useState } from 'react';
import { Button, Result, Skeleton, Space, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  ProCard,
  ProForm,
  ProFormDatePicker,
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
    queryFn: () => getSpus({ pageSize: 200 }),
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

  const initialValues = detailQuery.data
    ? {
        certificateName: detailQuery.data.certificateName,
        certificateType: detailQuery.data.certificateType,
        directive: detailQuery.data.directive ?? undefined,
        issueDate: detailQuery.data.issueDate ?? undefined,
        validFrom: detailQuery.data.validFrom,
        validUntil: detailQuery.data.validUntil,
        issuingAuthority: detailQuery.data.issuingAuthority,
        remarks: detailQuery.data.remarks ?? undefined,
        attributionType: detailQuery.data.attributionType ?? undefined,
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
          certificateName: values.certificateName,
          certificateType: values.certificateType,
          directive: values.directive || undefined,
          issueDate: values.issueDate || undefined,
          validFrom: values.validFrom,
          validUntil: values.validUntil,
          issuingAuthority: values.issuingAuthority,
          remarks: values.remarks || undefined,
          attributionType: values.attributionType || undefined,
          fileKey,
          fileName,
          spuIds: values.spuIds?.length ? values.spuIds : undefined,
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
            name="certificateName"
            label="证书名称"
            placeholder="请输入证书名称"
            width="md"
            rules={[
              { required: true, message: '请输入证书名称' },
              { max: 200, message: '证书名称最多 200 个字符' },
            ]}
          />
          <ProFormText
            name="certificateType"
            label="证书类型"
            placeholder="如 CE、FCC、ROHS 等"
            width="sm"
            rules={[
              { required: true, message: '请输入证书类型' },
              { max: 50, message: '证书类型最多 50 个字符' },
            ]}
          />
          <ProFormText
            name="directive"
            label="指令法规"
            placeholder="请输入指令法规（可选）"
            width="md"
            rules={[{ max: 200, message: '指令法规最多 200 个字符' }]}
          />
          <ProFormText
            name="attributionType"
            label="归属类型"
            placeholder="请输入归属类型（可选）"
            width="sm"
            rules={[{ max: 50, message: '归属类型最多 50 个字符' }]}
          />
        </ProForm.Group>
      </ProCard>

      <ProCard title="有效期信息" bordered style={{ marginBottom: 16 }}>
        <ProForm.Group>
          <ProFormDatePicker
            name="issueDate"
            label="发证日期"
            placeholder="请选择发证日期（可选）"
            width="sm"
          />
          <ProFormDatePicker
            name="validFrom"
            label="有效期起"
            placeholder="请选择开始日期"
            width="sm"
            rules={[{ required: true, message: '请选择有效期起始日期' }]}
          />
          <ProFormDatePicker
            name="validUntil"
            label="有效期止"
            placeholder="请选择截止日期"
            width="sm"
            rules={[{ required: true, message: '请选择有效期截止日期' }]}
          />
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

      <ProCard title="关联 SPU" bordered style={{ marginBottom: 16 }}>
        <ProFormSelect
          name="spuIds"
          label="适用 SPU"
          placeholder="请选择关联的 SPU（可多选）"
          width="xl"
          mode="multiple"
          options={spuOptions}
          fieldProps={{ optionFilterProp: 'label', loading: spusQuery.isLoading }}
        />
      </ProCard>

      <ProCard title="其他" bordered>
        <ProFormTextArea
          name="remarks"
          label="证书说明"
          placeholder="请输入证书说明（可选）"
          width="xl"
        />
      </ProCard>
    </ProForm>
  );
}
