import { useRef, useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { ProForm, ProFormSelect, ProFormText, type ProFormInstance } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import type { UnitStatus } from '@infitek/shared';
import { createUnit, getUnitById, updateUnit, type CreateUnitPayload, type UpdateUnitPayload } from '../../../api/units.api';
import { AnchorNav, SectionCard } from '../components/page-scaffold';
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
  const [activeAnchor, setActiveAnchor] = useState('basic');

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

  if (isEdit && detailQuery.isLoading) return <Skeleton active />;

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

  const anchors = [
    { key: 'basic', label: '基础信息' },
    { key: 'status', label: '状态设置' },
  ];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑单位' : '新建单位'}</div>
          <div className="master-page-description">统一维护单位名称、编码与启停状态。</div>
        </div>
      </div>

      <ProForm<{ code: string; name: string; status?: UnitStatus }>
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
        initialValues={
          detailQuery.data
            ? { code: detailQuery.data.code, name: detailQuery.data.name, status: detailQuery.data.status }
            : { status: 'active' as UnitStatus }
        }
        onFinish={async (values) => {
          if (isEdit) {
            await updateMutation.mutateAsync({ code: values.code, name: values.name, status: values.status });
            return true;
          }
          await createMutation.mutateAsync({ code: values.code, name: values.name });
          return true;
        }}
      >
        <div className="master-form-layout">
          <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />

          <div className="master-form-main">
            <SectionCard id="basic" title="基础信息" description="填写单位主标识与业务显示名称。">
              <div className="master-form-grid">
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
              </div>
            </SectionCard>

            <SectionCard id="status" title="状态设置" description="编辑时支持维护单位启停状态。">
              <div className="master-form-grid">
                {isEdit ? (
                  <ProFormSelect
                    name="status"
                    label="状态"
                    options={statusOptions}
                    rules={[{ required: true, message: '请选择状态' }]}
                  />
                ) : (
                  <div className="master-info-tip" style={{ marginTop: 0 }}>新建后默认为启用状态，如需调整可在详情页进入编辑后修改。</div>
                )}
              </div>
            </SectionCard>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">本页仅统一表单排版与层级，不调整单位接口逻辑。</div>
              <div className="master-form-footer-actions">
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
          </div>
        </div>
      </ProForm>
    </div>
  );
}
