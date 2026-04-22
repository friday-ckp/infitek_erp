import { Breadcrumb, Button, Modal, Result, Space, Tag, message } from 'antd';
import { ProDescriptions } from '@ant-design/pro-components';
import type { ProDescriptionsItemProps } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteCertificate, getCertificateById, type Certificate } from '../../../api/certificates.api';

export default function CertificateDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const certId = Number(id);

  const query = useQuery({
    queryKey: ['certificate-detail', certId],
    queryFn: () => getCertificateById(certId),
    enabled: Number.isInteger(certId) && certId > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCertificate(certId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      message.success('证书已删除');
      navigate('/master-data/certificates');
    },
  });

  if (!Number.isInteger(certId) || certId <= 0) {
    return (
      <Result
        status="404"
        title="证书不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/certificates')}>返回列表</Button>}
      />
    );
  }

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="证书详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => query.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/certificates')}>返回列表</Button>,
        ]}
      />
    );
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除证书「${query.data?.certificateName}」吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => deleteMutation.mutateAsync(),
    });
  };

  const basicColumns: ProDescriptionsItemProps<Certificate>[] = [
    { title: '证书编号', dataIndex: 'certificateNo', span: 1 },
    { title: '证书名称', dataIndex: 'certificateName', span: 1 },
    { title: '证书类型', dataIndex: 'certificateType', span: 1 },
    {
      title: '状态',
      key: 'status',
      span: 1,
      render: () =>
        query.data?.status === 'valid' ? (
          <Tag color="success">有效</Tag>
        ) : (
          <Tag color="error">已过期</Tag>
        ),
    },
    { title: '指令法规', dataIndex: 'directive', span: 1, renderText: (v) => v || '-' },
    { title: '归属类型', dataIndex: 'attributionType', span: 1, renderText: (v) => v || '-' },
    { title: '发证机构', dataIndex: 'issuingAuthority', span: 1 },
    { title: '发证日期', dataIndex: 'issueDate', span: 1, renderText: (v) => v || '-' },
    { title: '有效期起', dataIndex: 'validFrom', span: 1 },
    { title: '有效期止', dataIndex: 'validUntil', span: 1 },
    {
      title: '证书文件',
      key: 'file',
      span: 1,
      render: () =>
        query.data?.fileUrl ? (
          <Button type="link" style={{ padding: 0 }} onClick={() => window.open(query.data!.fileUrl!, '_blank')}>
            {query.data.fileName || '下载'}
          </Button>
        ) : (
          '-'
        ),
    },
    { title: '证书说明', dataIndex: 'remarks', span: 2, renderText: (v) => v || '-' },
    {
      title: '关联 SPU',
      key: 'spus',
      span: 2,
      render: () => {
        const spus = query.data?.spus ?? [];
        if (spus.length === 0) return '-';
        return spus.map((s) => `${s.spuCode} ${s.name}`).join('、');
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      span: 1,
      renderText: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      span: 1,
      renderText: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/master-data/certificates')}>
                产品证书库
              </Button>
            ),
          },
          { title: '详情' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={() => navigate(`/master-data/certificates/${id}/edit`)}>编辑</Button>
        <Button danger onClick={handleDelete} loading={deleteMutation.isPending}>删除</Button>
      </div>

      <ProDescriptions<Certificate>
        title="证书信息"
        loading={query.isLoading}
        column={2}
        dataSource={query.data}
        columns={basicColumns}
      />
    </Space>
  );
}
