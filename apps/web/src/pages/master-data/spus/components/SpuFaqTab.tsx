import { useState } from 'react';
import { Button, Empty, Form, Input, Modal, Popconfirm, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSpuFaq,
  deleteSpuFaq,
  getSpuFaqs,
  updateSpuFaq,
  type SpuFaq,
} from '../../../../api/spu-faqs.api';

interface Props {
  spuId: number;
}

interface FaqFormValues {
  question: string;
  answer: string;
}

export default function SpuFaqTab({ spuId }: Props) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FaqFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<SpuFaq | null>(null);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['spu-faqs', spuId],
    queryFn: () => getSpuFaqs(spuId),
    enabled: spuId > 0,
  });

  const invalidateFaqs = () => {
    queryClient.invalidateQueries({ queryKey: ['spu-faqs', spuId] });
  };

  const createMutation = useMutation({
    mutationFn: (values: FaqFormValues) =>
      createSpuFaq({ spuId, question: values.question, answer: values.answer }),
    onSuccess: () => {
      invalidateFaqs();
      message.success('保存成功', 3);
      handleCloseModal();
    },
    onError: (e: any) => {
      message.error(e?.message ?? '操作失败，请稍后重试', 5);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: FaqFormValues }) =>
      updateSpuFaq(id, { question: values.question, answer: values.answer }),
    onSuccess: () => {
      invalidateFaqs();
      message.success('保存成功', 3);
      handleCloseModal();
    },
    onError: (e: any) => {
      message.error(e?.message ?? '操作失败，请稍后重试', 5);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSpuFaq(id),
    onSuccess: () => {
      invalidateFaqs();
      message.success('已删除');
    },
    onError: (e: any) => {
      message.error(e?.message ?? '操作失败，请稍后重试', 5);
    },
  });

  const handleOpenCreate = () => {
    setEditingFaq(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (faq: SpuFaq) => {
    setEditingFaq(faq);
    form.setFieldsValue({ question: faq.question, answer: faq.answer });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingFaq(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<SpuFaq> = [
    {
      title: '序号',
      width: 60,
      render: (_: unknown, __: SpuFaq, index: number) => index + 1,
    },
    {
      title: '问题',
      dataIndex: 'question',
      ellipsis: true,
      render: (text: string) => (
        <Typography.Text ellipsis={{ tooltip: text }}>{text}</Typography.Text>
      ),
    },
    {
      title: '回答',
      dataIndex: 'answer',
      ellipsis: true,
      render: (text: string) => (
        <Typography.Paragraph
          ellipsis={{ rows: 2, tooltip: text }}
          style={{ margin: 0 }}
        >
          {text}
        </Typography.Paragraph>
      ),
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_: unknown, record: SpuFaq) => (
        <Space size={0}>
          <Button type="link" onClick={() => handleOpenEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除这条 FAQ 吗？"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" danger loading={deleteMutation.isPending && deleteMutation.variables === record.id}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="dashed" onClick={handleOpenCreate}>
          + 新增 FAQ
        </Button>
      </div>

      <Table<SpuFaq>
        rowKey="id"
        columns={columns}
        dataSource={faqs}
        loading={isLoading}
        pagination={false}
        locale={{
          emptyText: (
            <Empty description="暂无 FAQ 数据">
              <Button type="dashed" onClick={handleOpenCreate}>
                + 新增 FAQ
              </Button>
            </Empty>
          ),
        }}
      />

      <Modal
        title={editingFaq ? '编辑 FAQ' : '新增 FAQ'}
        open={modalOpen}
        onCancel={handleCloseModal}
        width={600}
        footer={[
          <Button key="cancel" onClick={handleCloseModal}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={isSubmitting} onClick={handleSubmit}>
            保存
          </Button>,
        ]}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="question"
            label="问题"
            rules={[
              { required: true, message: '请输入问题' },
              { max: 500, message: '问题不超过 500 个字符' },
            ]}
          >
            <Input placeholder="请输入问题" maxLength={500} showCount />
          </Form.Item>
          <Form.Item
            name="answer"
            label="回答"
            rules={[{ required: true, message: '请输入回答' }]}
          >
            <Input.TextArea
              placeholder="请输入回答"
              rows={6}
              autoSize={{ minRows: 4, maxRows: 10 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
