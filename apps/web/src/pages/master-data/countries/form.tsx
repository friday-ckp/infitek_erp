import { Button, Card, Result, Skeleton, Space } from 'antd';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCountry,
  getCountryById,
  updateCountry,
  type CreateCountryPayload,
  type UpdateCountryPayload,
} from '../../../api/countries.api';

export default function CountryFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const countryId = id ? Number(id) : undefined;
  const isEdit = Boolean(id);

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
        extra={
          <Button type="primary" onClick={() => navigate('/master-data/countries')}>
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
        title="国家/地区详情加载失败"
        subTitle="请检查网络或稍后重试"
        extra={[
          <Button key="retry" type="primary" onClick={() => detailQuery.refetch()}>
            重试
          </Button>,
          <Button key="back" onClick={() => navigate('/master-data/countries')}>
            返回列表
          </Button>,
        ]}
      />
    );
  }

  return (
    <Card title={isEdit ? '编辑国家/地区' : '新建国家/地区'}>
      <ProForm<{
        code: string;
        name: string;
      }>
        grid
        rowProps={{ gutter: [16, 0] }}
        colProps={{ span: 12 }}
        loading={detailQuery.isLoading}
        submitter={{
          render: (_, dom) => (
            <Space>
              <Button onClick={() => navigate('/master-data/countries')}>取消</Button>
              {dom[1]}
            </Space>
          ),
          searchConfig: {
            submitText: isEdit ? '保存' : '创建',
          },
        }}
        initialValues={
          detailQuery.data
            ? {
                code: detailQuery.data.code,
                name: detailQuery.data.name,
              }
            : {}
        }
        onFinish={async (values) => {
          if (isEdit) {
            await updateMutation.mutateAsync({
              code: values.code,
              name: values.name,
            });
          } else {
            await createMutation.mutateAsync({
              code: values.code,
              name: values.name,
            });
          }
          return true;
        }}
      >
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
      </ProForm>
    </Card>
  );
}
