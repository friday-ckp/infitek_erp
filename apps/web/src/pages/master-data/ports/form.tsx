import { useRef, useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { ProForm, ProFormSelect, ProFormText, type ProFormInstance } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import request from '../../../api/request';
import { PORT_TYPE_OPTIONS, createPort, getPortById, updatePort, type CreatePortPayload, type UpdatePortPayload } from '../../../api/ports.api';
import type { PortType } from '@infitek/shared';
import { AnchorNav, SectionCard } from '../components/page-scaffold';
import '../master-page.css';

export default function PortFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const portId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const detailQuery = useQuery({
    queryKey: ['port-detail', portId],
    queryFn: () => getPortById(portId as number),
    enabled: Boolean(isEdit && portId && Number.isInteger(portId) && portId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePortPayload) => createPort(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      navigate(`/master-data/ports/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdatePortPayload) => updatePort(portId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      queryClient.invalidateQueries({ queryKey: ['port-detail', portId] });
      navigate(`/master-data/ports/${portId}`);
    },
  });

  if (isEdit && (!portId || !Number.isInteger(portId) || portId <= 0)) {
    return (
      <Result
        status="404"
        title="港口不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/ports')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) return <Skeleton active />;

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="港口详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/ports')}>返回列表</Button>,
        ]}
      />
    );
  }

  const anchors = [{ key: 'basic', label: '基础信息' }];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑港口' : '新建港口'}</div>
          <div className="master-page-description">统一维护港口中英文名称、代码、国家和类型。</div>
        </div>
      </div>

      <ProForm<{ portType?: PortType; portCode: string; nameCn: string; nameEn?: string; countryId: number; countryName?: string }>
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
        initialValues={
          detailQuery.data
            ? {
                portType: detailQuery.data.portType ?? undefined,
                portCode: detailQuery.data.portCode,
                nameCn: detailQuery.data.nameCn,
                nameEn: detailQuery.data.nameEn ?? undefined,
                countryId: detailQuery.data.countryId,
                countryName: detailQuery.data.countryName,
              }
            : {}
        }
        onFinish={async (values) => {
          const payload = {
            portType: values.portType,
            portCode: values.portCode,
            nameCn: values.nameCn,
            nameEn: values.nameEn || undefined,
            countryId: Number(values.countryId),
            countryName: values.countryName,
          };

          if (isEdit) {
            await updateMutation.mutateAsync(payload as UpdatePortPayload);
          } else {
            await createMutation.mutateAsync(payload as CreatePortPayload);
          }
          return true;
        }}
      >
        <div className="master-form-layout">
          <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
          <div className="master-form-main">
            <SectionCard id="basic" title="基础信息" description="填写港口中英文名称、代码、类型和所属国家。">
              <div className="master-form-grid">
                <ProFormText
                  name="nameCn"
                  label="港口中文名"
                  placeholder="请输入港口中文名"
                  rules={[
                    { required: true, message: '请输入港口名称' },
                    { max: 200, message: '港口名称最多 200 个字符' },
                  ]}
                />
                <ProFormText
                  name="nameEn"
                  label="港口英文名"
                  placeholder="请输入港口英文名"
                  rules={[
                    { required: true, message: '请输入港口英文名' },
                    { max: 200, message: '港口英文名最多 200 个字符' },
                  ]}
                />
                <ProFormText
                  name="portCode"
                  label="港口/机场代码"
                  placeholder="请输入港口/机场代码"
                  rules={[
                    { required: true, message: '请输入港口/机场代码' },
                    { max: 50, message: '港口/机场代码最多 50 个字符' },
                  ]}
                />
                <ProFormSelect
                  name="portType"
                  label="港口类型"
                  placeholder="请选择港口类型"
                  options={PORT_TYPE_OPTIONS}
                  rules={[{ required: true, message: '请选择港口类型' }]}
                />
                <ProFormSelect
                  name="countryId"
                  label="国家/地区"
                  placeholder="请搜索国家/地区"
                  showSearch
                  request={async (params) => {
                    try {
                      const res = await request.get<any, { list: Array<{ id: number; name: string; code: string }> }>('/countries', {
                        params: { keyword: params.keyWords, pageSize: 20 },
                      });
                      const options = (res.list || []).map((item) => ({
                        label: `${item.name} (${item.code})`,
                        value: Number(item.id),
                        name: item.name,
                      }));
                      if (!params.keyWords && detailQuery.data?.countryId) {
                        const exists = options.some((item) => item.value === detailQuery.data?.countryId);
                        if (!exists) {
                          options.unshift({
                            label: detailQuery.data.countryName,
                            value: detailQuery.data.countryId,
                            name: detailQuery.data.countryName,
                          });
                        }
                      }
                      return options;
                    } catch {
                      return [];
                    }
                  }}
                  rules={[{ required: true, message: '请选择国家/地区' }]}
                  fieldProps={{
                    onChange: (_value, option: any) => {
                      formRef.current?.setFieldsValue({ countryName: option?.name ?? null });
                    },
                  }}
                />
              </div>
            </SectionCard>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">本页仅调整视觉结构与排版，不改变港口数据提交逻辑。</div>
              <div className="master-form-footer-actions">
                <Button onClick={() => navigate('/master-data/ports')}>取消</Button>
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
