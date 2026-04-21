import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Col,
  Empty,
  Flex,
  Result,
  Row,
  Skeleton,
  Space,
  Tree,
  Typography,
  theme,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useQuery } from '@tanstack/react-query';
import { getProductCategoryTree, type ProductCategoryNode } from '../../../api/product-categories.api';

function buildTreeData(nodes: ProductCategoryNode[]): DataNode[] {
  return nodes.map((node) => ({
    title: node.name,
    key: String(node.id),
    children: node.children.length > 0 ? buildTreeData(node.children) : undefined,
  }));
}

function findNodeById(nodes: ProductCategoryNode[], id: string): ProductCategoryNode | null {
  for (const node of nodes) {
    if (String(node.id) === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

function buildBreadcrumb(nodes: ProductCategoryNode[], id: string): string {
  const path: string[] = [];

  function traverse(items: ProductCategoryNode[], targetId: string): boolean {
    for (const item of items) {
      if (String(item.id) === targetId) {
        path.push(item.name);
        return true;
      }
      if (traverse(item.children, targetId)) {
        path.unshift(item.name);
        return true;
      }
    }
    return false;
  }

  traverse(nodes, id);
  return path.join(' / ');
}

export default function ProductCategoriesPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['product-categories', 'tree'],
    queryFn: getProductCategoryTree,
  });

  if (query.isError && !query.data) {
    return (
      <Result
        status="error"
        title="加载产品分类失败"
        subTitle="请检查网络或稍后重试"
        extra={
          <Button type="primary" onClick={() => query.refetch()}>
            重试
          </Button>
        }
      />
    );
  }

  const treeNodes = query.data ?? [];
  const treeData = buildTreeData(treeNodes);
  const selectedNode = selectedId ? findNodeById(treeNodes, selectedId) : null;
  const breadcrumb = selectedId ? buildBreadcrumb(treeNodes, selectedId) : '';

  return (
    <div>
      <Flex align="center" justify="space-between" style={{ marginBottom: token.marginMD }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          产品分类管理
        </Typography.Title>
        <Button type="primary" onClick={() => navigate('/master-data/product-categories/create')}>
          新建一级分类
        </Button>
      </Flex>

      <Skeleton active loading={query.isLoading && !query.data}>
        <Row gutter={token.marginMD} style={{ minHeight: 500 }}>
          {/* 左侧 Tree 面板 */}
          <Col
            span={8}
            style={{
              borderRight: `1px solid ${token.colorBorder}`,
              paddingRight: token.paddingMD,
            }}
          >
            {treeNodes.length === 0 ? (
              <Empty description="暂无分类">
                <Button
                  type="primary"
                  onClick={() => navigate('/master-data/product-categories/create')}
                >
                  新建一级分类
                </Button>
              </Empty>
            ) : (
              <Tree
                treeData={treeData}
                defaultExpandAll
                selectedKeys={selectedId ? [selectedId] : []}
                onSelect={(keys) => {
                  if (keys.length > 0) {
                    setSelectedId(String(keys[0]));
                  } else {
                    setSelectedId(null);
                  }
                }}
              />
            )}
          </Col>

          {/* 右侧详情面板 */}
          <Col span={16} style={{ paddingLeft: token.paddingMD }}>
            {!selectedNode ? (
              <Empty description="请选择左侧分类节点" />
            ) : (
              <div>
                <Typography.Title level={4} style={{ marginTop: 0 }}>
                  {selectedNode.name}
                </Typography.Title>

                <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
                  <div>
                    <Typography.Text type="secondary">层级路径：</Typography.Text>
                    <Typography.Text>{breadcrumb}</Typography.Text>
                  </div>

                  {selectedNode.code && (
                    <div>
                      <Typography.Text type="secondary">分类编号：</Typography.Text>
                      <Typography.Text>{selectedNode.code}</Typography.Text>
                    </div>
                  )}

                  {selectedNode.nameEn && (
                    <div>
                      <Typography.Text type="secondary">英文名：</Typography.Text>
                      <Typography.Text>{selectedNode.nameEn}</Typography.Text>
                    </div>
                  )}

                  {selectedNode.purchaseOwner && (
                    <div>
                      <Typography.Text type="secondary">采购负责人：</Typography.Text>
                      <Typography.Text>{selectedNode.purchaseOwner}</Typography.Text>
                    </div>
                  )}

                  {selectedNode.productOwner && (
                    <div>
                      <Typography.Text type="secondary">产品负责人：</Typography.Text>
                      <Typography.Text>{selectedNode.productOwner}</Typography.Text>
                    </div>
                  )}

                  <div>
                    <Typography.Text type="secondary">下属 SPU 数量：</Typography.Text>
                    <Typography.Text>0</Typography.Text>
                  </div>

                  <Space style={{ marginTop: token.marginSM }}>
                    <Button
                      onClick={() =>
                        navigate(`/master-data/product-categories/${selectedNode.id}/edit`)
                      }
                    >
                      编辑
                    </Button>
                    <Button
                      type="dashed"
                      disabled={selectedNode.level >= 3}
                      onClick={() =>
                        navigate(
                          `/master-data/product-categories/create?parentId=${selectedNode.id}`,
                        )
                      }
                    >
                      新建子分类
                    </Button>
                  </Space>
                </Space>
              </div>
            )}
          </Col>
        </Row>
      </Skeleton>
    </div>
  );
}
