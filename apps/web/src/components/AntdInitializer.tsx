import { App } from 'antd';
import { useEffect } from 'react';
import { initAntdStatic } from '../utils/antdStatic';

/**
 * Must be rendered inside <App> (from antd).
 * Captures the message/modal instances provided by App.useApp() and
 * stores them in antdStatic so non-component code can use them.
 */
export function AntdInitializer() {
  const { message, modal } = App.useApp();

  useEffect(() => {
    initAntdStatic(message, modal);
  }, [message, modal]);

  return null;
}
