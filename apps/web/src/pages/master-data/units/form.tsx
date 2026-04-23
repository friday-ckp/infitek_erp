import { useRef } from 'react';
import { Breadcrumb, Button, Result, Skeleton } from 'antd';
import {
  ProForm,
  ProFormSelect,
  ProFormText,
  type ProFormInstance,
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
import '../master-page.css';

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
  const formRef = useRef<ProFormInstance>(undefined);

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
        extra={<Button type="primary" onClick={() => navigate('/master-data/units')}>返回列表</Button>}
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
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/units')}>返回列表</Button>,
        ]}
      />
    );
  }

  return (
    <div className="master-page master-form-page">
      <Breadcrumb
        items={[
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/units')}>
                主数据
              </Button>
            ),
          },
          {
            title: (
              <Button type="link" className="master-breadcrumb-link" onClick={() => navigate('/master-data/units')}>
                单位管理
              </Button>
            ),
          },
          { title: isEdit ? `编辑 ${detailQuery.data?.code || ''}` : '新建单位' },
        ]}
      />

      <ProForm<{
        code: string;
        name: string;
        status?: UnitStatus;
      }>
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
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
        <div className="master-info-card">
          <div className="master-form-body">
            <ProForm.Group>
              <ProFormText
                name="name"
                label="单位名称"
                placeholder="请输入单位名称"
                width="md"
                rules={[
                  { required: true, message: '请输入单位名称' },
                  { max: 100, message: '单位名称最多 100 个字符' },
                ]}
              />
              <ProFormText
                name="code"
                label="单位编码"
                placeholder="请输入单位编码"
                width="sm"
                rules={[
                  { required: true, message: '请输入单位编码' },
                  { max: 50, message: '单位编码最多 50 个字符' },
                ]}
              />
              {isEdit ? (
                <ProFormSelect
                  name="status"
                  label="状态"
                  width="sm"
                  options={statusOptions}
                  rules={[{ required: true, message: '请选择状态' }]}
                />
              ) : null}
            </ProForm.Group>
          </div>
          <div className="master-form-footer">
            <Button onClick={() => navigate('/master-data/units')}>取消</Button>
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
