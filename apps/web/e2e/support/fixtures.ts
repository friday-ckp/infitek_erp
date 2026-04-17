import { test as base, expect } from '@playwright/test';

/**
 * 扩展 Playwright 测试 fixtures
 * 提供常用的测试工具和数据
 */

type TestFixtures = {
  authenticatedPage: void;
  adminUser: { username: string; password: string };
  testUser: { username: string; password: string };
};

export const test = base.extend<TestFixtures>({
  /**
   * 已认证的页面 fixture
   * 自动登录并导航到应用
   */
  authenticatedPage: async ({ page }, use) => {
    // 导航到登录页
    await page.goto('/login');

    // 使用管理员凭证登录
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // 等待登录完成并稳定
    await page.waitForURL('**/settings/users');
    await page.waitForLoadState('networkidle');

    // 使用 page
    await use();

    // 清理：清除 token
    await page.evaluate(() => localStorage.removeItem('token'));
  },

  /**
   * 管理员用户凭证
   */
  adminUser: async ({}, use) => {
    const adminUser = {
      username: 'admin',
      password: 'Admin@123',
    };
    await use(adminUser);
  },

  /**
   * 普通测试用户凭证
   */
  testUser: async ({}, use) => {
    const testUser = {
      username: 'testuser',
      password: 'TestUser@123',
    };
    await use(testUser);
  },
});

export { expect };
