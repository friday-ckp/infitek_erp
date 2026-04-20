import { Button, Card, Result, Skeleton, Space } from 'antd';
import {
  ProForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { UnitStatus } from '@infitek/shared';
import {
  createUnit,
  getUnitById,
  updateUnit,
  type CreateUnitPayload,
  type UpdateUnitPayload,
} from '../../../api/units.api';

const statusOptions: Array<{ label: string; value: UnitStatus }> = [
  { label: '启用', value: 'active' as UnitStatus },
  { label: '禁用', value: 'inactive' as UnitStatus },
];

export default function UnitFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const unitId = id ? Number(id) : undefined;

  const isEdit = Boolean(id);

  const detailQuery = useQuery({
    queryKey: ['unit-detail', unitId],
    queryFn: () => getUnitById(unitId as number),
    enabled: Boolean(isEdit && unitId && Number.isInteger(unitId) && unitId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUnitPayload) => createUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      navigate('/master-data/units');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUnitPayload) => updateUnit(unitId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit-detail', unitId] });
      navigate('/master-data/units');
    },
  });

  if (isEdit && (!unitId || !Number.isInteger(unitId) || unitId <= 0)) {
    return (
      <Result
        status="404"
        title="单位不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/units')}>
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
        title="单位详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/units')}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  return (
    <Card title={isEdit ? '编辑单位' : '新建单位'}>
      <ProForm<{
        code: string;
        name: string;
        status?: UnitStatus;
      }>
        grid
        rowProps={{ gutter: [16, 0] }}
        colProps={{ span: 12 }}
        loading={detailQuery.isLoading}
        submitter={{
          searchConfig: {
            submitText: isEdit ? '保存' : '创建',
            resetText: '取消',
          },
          resetButtonProps: {
            onClick: () => navigate('/master-data/units'),
          },
          render: (_, dom) => (
            <Space>
              <Button onClick={() => navigate('/master-data/units')}>取消</Button>
              {dom[1]}
            </Space>
          ),
        }}
        initialValues={
          detailQuery.data
            ? {
                code: detailQuery.data.code,
                name: detailQuery.data.name,
                status: detailQuery.data.status,
              }
            : { status: 'active' as UnitStatus }
        }
        onFinish={async (values) => {
          if (isEdit) {
            await updateMutation.mutateAsync({
              code: values.code,
              name: values.name,
              status: values.status,
            });
            return true;
          }

          await createMutation.mutateAsync({
            code: values.code,
            name: values.name,
          });
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="单位名称"
          placeholder="请输入单位名称"
          rules={[
            { required: true, message: '请输入单位名称' },
            { max: 100, message: '单位名称最多 100 个字符' },
          ]}
        />
        <ProFormText
          name="code"
          label="单位编码"
          placeholder="请输入单位编码"
          rules={[
            { required: true, message: '请输入单位编码' },
            { max: 50, message: '单位编码最多 50 个字符' },
          ]}
        />
        {isEdit ? (
          <ProFormSelect
            name="status"
            label="状态"
            options={statusOptions}
            rules={[{ required: true, message: '请选择状态' }]}
          />
        ) : null}
      </ProForm>
    </Card>
  );
}
