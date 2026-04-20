import { useEffect, useState } from 'react';

/**
 * 对输入值进行防抖处理，延迟 `delay` 毫秒后返回稳定值。
 * 适用于搜索框输入防抖，避免每次击键都触发 API 请求。
 *
 * @param value  原始输入值
 * @param delay  防抖延迟，毫秒，默认 300ms
 * @returns      防抖后的稳定值
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
