import { useRef, useState } from 'react';
import { Button, Result, Skeleton } from 'antd';
import { ProForm, ProFormText, type ProFormInstance } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createCountry, getCountryById, updateCountry, type CreateCountryPayload, type UpdateCountryPayload } from '../../../api/countries.api';
import { AnchorNav, SectionCard } from '../components/page-scaffold';
import '../master-page.css';

export default function CountryFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const countryId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);
  const formRef = useRef<ProFormInstance>(undefined);
  const [activeAnchor, setActiveAnchor] = useState('basic');

  const detailQuery = useQuery({
    queryKey: ['country-detail', countryId],
    queryFn: () => getCountryById(countryId as number),
    enabled: Boolean(isEdit && countryId && Number.isInteger(countryId) && countryId > 0),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCountryPayload) => createCountry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      navigate('/master-data/countries');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCountryPayload) => updateCountry(countryId as number, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      queryClient.invalidateQueries({ queryKey: ['country-detail', countryId] });
      navigate('/master-data/countries');
    },
  });

  if (isEdit && (!countryId || !Number.isInteger(countryId) || countryId <= 0)) {
    return (
      <Result
        status="404"
        title="国家/地区不存在"
        extra={<Button type="primary" onClick={() => navigate('/master-data/countries')}>返回列表</Button>}
      />
    );
  }

  if (isEdit && detailQuery.isLoading) return <Skeleton active />;

  if (isEdit && detailQuery.isError && !detailQuery.data) {
    return (
      <Result
        status="error"
        title="国家/地区详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>重试</Button>,
          <Button key="back" onClick={() => navigate('/master-data/countries')}>返回列表</Button>,
        ]}
      />
    );
  }

  const anchors = [{ key: 'basic', label: '基础信息' }];

  return (
    <div className="master-page master-form-page">
      <div className="master-page-header">
        <div className="master-page-heading">
          <div className="master-page-title">{isEdit ? '编辑国家/地区' : '新建国家/地区'}</div>
          <div className="master-page-description">统一维护国家地区代码、中英文名称与简称。</div>
        </div>
      </div>

      <ProForm<{ code: string; name: string; nameEn?: string; abbreviation?: string }>
        formRef={formRef}
        submitter={false}
        loading={detailQuery.isLoading}
        initialValues={
          detailQuery.data
            ? {
                code: detailQuery.data.code,
                name: detailQuery.data.name,
                nameEn: detailQuery.data.nameEn ?? undefined,
                abbreviation: detailQuery.data.abbreviation ?? undefined,
              }
            : {}
        }
        onFinish={async (values) => {
          const payload = {
            code: values.code,
            name: values.name,
            nameEn: values.nameEn || undefined,
            abbreviation: values.abbreviation || undefined,
          };
          if (isEdit) {
            await updateMutation.mutateAsync(payload as UpdateCountryPayload);
          } else {
            await createMutation.mutateAsync(payload as CreateCountryPayload);
          }
          return true;
        }}
      >
        <div className="master-form-layout">
          <AnchorNav anchors={anchors} activeKey={activeAnchor} onChange={setActiveAnchor} />
          <div className="master-form-main">
            <SectionCard id="basic" title="基础信息" description="填写国家地区代码、中英文名称与简称。">
              <div className="master-form-grid">
                <ProFormText
                  name="code"
                  label="国家/地区代码"
                  placeholder="如：CN、US、DE"
                  rules={[
                    { required: true, message: '请输入国家/地区代码' },
                    { max: 10, message: '国家/地区代码最多 10 个字符' },
                  ]}
                />
                <ProFormText
                  name="name"
                  label="国家/地区名称"
                  placeholder="如：中国、美国、德国"
                  rules={[
                    { required: true, message: '请输入国家/地区名称' },
                    { max: 100, message: '国家/地区名称最多 100 个字符' },
                  ]}
                />
                <ProFormText
                  name="nameEn"
                  label="英文名称"
                  placeholder="如：China、United States"
                  rules={[{ max: 100, message: '英文名称最多 100 个字符' }]}
                />
                <ProFormText
                  name="abbreviation"
                  label="简称"
                  placeholder="如：中国、美"
                  rules={[{ max: 20, message: '简称最多 20 个字符' }]}
                />
              </div>
            </SectionCard>

            <div className="master-form-footer">
              <div className="master-form-footer-tip">本页仅统一 UI 层级和表单布局，不改动国家地区接口行为。</div>
              <div className="master-form-footer-actions">
                <Button onClick={() => navigate('/master-data/countries')}>取消</Button>
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
