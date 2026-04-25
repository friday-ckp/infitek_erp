import React, { useState } from 'react';
import { Button, Flex, Input, Space, Tag, theme } from 'antd';
import { DownOutlined, FilterOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import './search-form.css';

export interface ActiveTag {
  /** 唯一标识，用作 React key */
  key: string;
  /** 展示文本 */
  label: string;
  /** 点击关闭按钮时的回调 */
  onClose: () => void;
}

export interface SearchFormProps {
  /** 搜索框当前值（受控） */
  searchValue: string;
  /** 搜索框内容变化回调（防抖由调用方通过 useDebouncedValue 处理） */
  onSearchChange: (value: string) => void;
  /** 搜索框占位文字 */
  placeholder?: string;
  /** 高级筛选区内容（直接全部展示，不折叠） */
  advancedContent?: React.ReactNode;
  /** 已选筛选条件，有内容时显示 Tag 列表和"清除全部"按钮 */
  activeTags?: ActiveTag[];
  /** 点击"清除全部"按钮的回调 */
  onClearAll?: () => void;
  /** 点击"查询"按钮的回调 */
  onQuery?: () => void;
  /** 点击"重置"按钮的回调 */
  onReset?: () => void;
}

/**
 * 通用搜索表单组件，封装列表页搜索/筛选/Tag 三段式交互。
 *
 * 职责边界：
 * - 只负责 UI 展示和用户交互事件上报
 * - 不持有业务状态，不发起 API 请求
 * - 防抖逻辑由调用方使用 useDebouncedValue hook 处理
 * - 所有筛选项直接展示，不折叠
 */
export function SearchForm({
  searchValue,
  onSearchChange,
  placeholder = '快捷搜索',
  advancedContent,
  activeTags = [],
  onClearAll,
  onQuery,
  onReset,
}: SearchFormProps) {
  const { token } = theme.useToken();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const hasActions = onQuery != null || onReset != null;
  const hasAdvanced = advancedContent != null;
  const showAdvanced = hasAdvanced && (advancedOpen || activeTags.length > 0);

  return (
    <div className="search-form-card">
      <Flex gap={token.marginSM} wrap align="center" className="search-form-row">
        <Input
          placeholder={placeholder}
          className="search-form-input"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          prefix={<SearchOutlined style={{ color: token.colorTextQuaternary }} />}
        />
        {hasAdvanced ? (
          <Button
            icon={<FilterOutlined />}
            className="search-form-toggle"
            onClick={() => setAdvancedOpen((prev) => !prev)}
          >
            高级筛选
            <DownOutlined
              style={{
                marginLeft: 4,
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </Button>
        ) : null}
        {hasActions && (
          <div className="search-form-actions">
            <Space wrap>
              {onQuery && (
                <Button type="primary" icon={<SearchOutlined />} onClick={onQuery}>
                  查询
                </Button>
              )}
              {onReset && (
                <Button icon={<ReloadOutlined />} onClick={onReset}>
                  重置
                </Button>
              )}
            </Space>
          </div>
        )}
      </Flex>

      {showAdvanced ? <div className="search-form-advanced">{advancedContent}</div> : null}

      {activeTags.length > 0 && (
        <Space wrap className="search-form-tags">
          {activeTags.map((item) => (
            <Tag closable key={item.key} onClose={item.onClose}>
              {item.label}
            </Tag>
          ))}
          {onClearAll && (
            <Button type="link" onClick={onClearAll}>
              清除全部
            </Button>
          )}
        </Space>
      )}
    </div>
  );
}
