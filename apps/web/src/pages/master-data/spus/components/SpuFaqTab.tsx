import { Button, Empty, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  QUESTION_TYPE_LABELS,
  getSpuFaqs,
  type SpuFaq,
} from '../../../../api/spu-faqs.api';

interface Props {
  spuId: number;
}

export default function SpuFaqTab({ spuId }: Props) {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['spu-faqs', { spuId }],
    queryFn: () => getSpuFaqs({ spuId, pageSize: 100 }),
    enabled: spuId > 0,
  });

  const faqs = data?.list ?? [];

  const columns: ColumnsType<SpuFaq> = [
    {
      title: '序号',
      width: 60,
      render: (_: unknown, __: SpuFaq, index: number) => index + 1,
    },
    {
      title: '问题类型',
      dataIndex: 'questionType',
      width: 120,
      render: (_, record) => (
        <Tag>{QUESTION_TYPE_LABELS[record.questionType] ?? record.questionType}</Tag>
      ),
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
        <Typography.Paragraph ellipsis={{ rows: 2, tooltip: text }} style={{ margin: 0 }}>
          {text}
        </Typography.Paragraph>
      ),
    },
    {
      title: '附件',
      dataIndex: 'attachmentUrl',
      width: 70,
      render: (_, record) => (record.attachmentUrl ? <Tag color="blue">有</Tag> : '-'),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          type="dashed"
          onClick={() => navigate(`/master-data/spu-faqs/create?spuId=${spuId}`)}
        >
          + 新建 FAQ
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
            <Empty description="暂无关联 FAQ">
              <Button
                type="dashed"
                onClick={() => navigate(`/master-data/spu-faqs/create?spuId=${spuId}`)}
              >
                + 新建 FAQ
              </Button>
            </Empty>
          ),
        }}
      />
    </div>
  );
}
