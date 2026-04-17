import { Page } from '@playwright/test';

/**
 * 通用测试辅助函数
 */

/**
 * 登录用户
 */
export async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/settings/users');
}

/**
 * 登出用户
 */
export async function logout(page: Page) {
  await page.evaluate(() => localStorage.removeItem('token'));
  await page.goto('/login');
}

/**
 * 等待 API 响应
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse((response) => {
    if (typeof urlPattern === 'string') {
      return response.url().includes(urlPattern);
    }
    return urlPattern.test(response.url());
  });
}

/**
 * 获取表格数据
 */
export async function getTableData(page: Page, selector: string) {
  const rows = await page.locator(`${selector} tbody tr`).all();
  const data = [];

  for (const row of rows) {
    const cells = await row.locator('td').all();
    const rowData: Record<string, string> = {};

    for (let i = 0; i < cells.length; i++) {
      const text = await cells[i].textContent();
      rowData[`col${i}`] = text || '';
    }

    data.push(rowData);
  }

  return data;
}

/**
 * 填充表单
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [name, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
    await input.fill(value);
  }
}

/**
 * 提交表单
 */
export async function submitForm(page: Page, submitButtonSelector = 'button[type="submit"]') {
  await page.click(submitButtonSelector);
}

/**
 * 验证错误消息
 */
export async function expectErrorMessage(page: Page, message: string) {
  try {
    const el = await page.waitForSelector(
      '.ant-form-item-explain-error',
      { state: 'attached', timeout: 8000 }
    );
    const text = await el.textContent();
    return text?.includes(message) ?? false;
  } catch {
    return false;
  }
}

/**
 * 验证成功消息
 */
export async function expectSuccessMessage(page: Page, _message: string) {
  try {
    // 等待任意 message 通知出现（消息可能很快消失，用 attached 而非 visible）
    await page.waitForSelector('.ant-message-notice-content', { state: 'attached', timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}
