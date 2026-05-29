import { test, expect } from '@playwright/test';

test.describe('Story 9.3: 钉钉登录前端链路', () => {
  test('登录页钉钉扫码按钮会真实跳转到后端登录入口', async ({ page }) => {
    await page.route('**/api/auth/dingtalk/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<html><body><h1>钉钉登录入口已触发</h1></body></html>',
      });
    });

    await page.goto('/login?redirect=%2Fsettings%2Fusers');
    await page.getByRole('button', { name: '钉钉扫码登录' }).click();

    await expect(page).toHaveURL(/\/api\/auth\/dingtalk\/login$/);
    await expect(page.getByRole('heading', { name: '钉钉登录入口已触发' })).toBeVisible();

    const storedRedirect = await page.evaluate(() =>
      window.sessionStorage.getItem('auth:post-login-redirect'),
    );
    expect(storedRedirect).toBe('/settings/users');
  });

  test('ticket 交换成功后写入登录态并跳转到 redirect 目标页', async ({ page }) => {
    await page.route('**/api/auth/dingtalk/exchange', async (route) => {
      const postData = route.request().postDataJSON() as { ticket?: string };
      expect(postData.ticket).toBe('ticket-success');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 'OK',
          message: 'OK',
          data: {
            accessToken: 'mock.jwt.token.success',
            user: {
              id: 7,
              username: 'ding.user',
              name: '钉钉用户',
            },
          },
        }),
      });
    });

    await page.goto('/login?redirect=%2Fsettings%2Fusers');
    await page.evaluate(() => {
      window.sessionStorage.setItem('auth:post-login-redirect', '/settings/users');
    });

    await page.goto('/login/dingtalk/callback?ticket=ticket-success');

    await expect(page.getByText('登录成功，正在进入系统')).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/users$/);

    const token = await page.evaluate(() => window.localStorage.getItem('token'));
    const user = await page.evaluate(() => window.localStorage.getItem('user'));
    const storedRedirect = await page.evaluate(() => window.sessionStorage.getItem('auth:post-login-redirect'));

    expect(token).toBe('mock.jwt.token.success');
    expect(user).toContain('"username":"ding.user"');
    expect(user).toContain('"name":"钉钉用户"');
    expect(storedRedirect).toBeNull();
  });

  test('未绑定与过期场景显示正确文案并允许返回登录页', async ({ page }) => {
    await page.route('**/api/auth/dingtalk/exchange', async (route) => {
      const postData = route.request().postDataJSON() as { ticket?: string };

      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: postData.ticket === 'ticket-expired'
            ? 'DINGTALK_TICKET_EXPIRED'
            : 'DINGTALK_ACCOUNT_UNBOUND',
          message: postData.ticket === 'ticket-expired'
            ? '登录 ticket 已过期'
            : '当前钉钉账号未绑定系统用户',
          data: null,
        }),
      });
    });

    await page.goto('/login/dingtalk/callback?error=DINGTALK_ACCOUNT_UNBOUND');
    await expect(page.getByText('钉钉账号未绑定')).toBeVisible();
    await expect(page.getByText('请联系管理员完成钉钉绑定')).toBeVisible();
    await page.getByRole('link', { name: '返回账号密码登录' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/login/dingtalk/callback?ticket=ticket-expired');
    await expect(page.getByText('本次钉钉登录已过期，请重新扫码登录。')).toBeVisible();
    await expect(page.getByRole('button', { name: '重新扫码登录' })).toBeVisible();
    await expect(page.locator('.ant-message-notice')).toHaveCount(0);
    await expect(page).toHaveURL(/ticket=ticket-expired/);
  });

  test('ticket 交换失败时只展示映射后的友好文案，不泄露原始异常', async ({ page }) => {
    await page.route('**/api/auth/dingtalk/exchange', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'DINGTALK_OAUTH_FAILED',
          message: 'upstream trace: java.lang.RuntimeException: boom',
          data: {
            stack: 'java.lang.RuntimeException: boom\n at auth.exchange(AuthService.java:88)',
          },
        }),
      });
    });

    await page.goto('/login/dingtalk/callback?ticket=ticket-oauth-failed');

    await expect(page.getByText('钉钉登录失败，请重试或改用账号密码登录。')).toBeVisible();
    await expect(page.getByText('如问题持续存在，请返回登录页使用账号密码登录，或联系管理员协助处理。')).toBeVisible();
    await expect(page.getByText('java.lang.RuntimeException: boom')).toHaveCount(0);
    await expect(page.getByText('upstream trace: java.lang.RuntimeException: boom')).toHaveCount(0);
    await expect(page.locator('.ant-message-notice')).toHaveCount(0);
  });

  test('本地残留无效 token 时，登录页不会跳转循环，仍可正常显示登录表单', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'bad');
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          username: 'broken-user',
          name: 'Broken User',
        }),
      );
    });

    await page.goto('/login?redirect=%2Fsettings%2Fusers');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fsettings%2Fusers$/);
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible();
    await expect(page.getByRole('button', { name: '钉钉扫码登录' })).toBeVisible();
  });

  test('callback 缺少 ticket 时展示可操作错误，不暴露技术细节', async ({ page }) => {
    await page.goto('/login/dingtalk/callback');

    await expect(page.getByText('登录信息无效或已过期，请重新发起钉钉扫码登录。')).toBeVisible();
    await expect(page.getByRole('button', { name: '重新扫码登录' })).toBeVisible();
    await expect(page.getByText('missing-ticket')).toHaveCount(0);
    await expect(page.locator('.ant-message-notice')).toHaveCount(0);
  });

  test('密码登录成功后跳转到 redirect 目标页', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      const postData = route.request().postDataJSON() as {
        username?: string;
        password?: string;
      };
      expect(postData.username).toBe('admin');
      expect(postData.password).toBe('Admin@123');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 'OK',
          message: 'OK',
          data: {
            accessToken: 'mock.jwt.token.password',
            user: {
              username: 'admin',
              name: '管理员',
            },
          },
        }),
      });
    });

    await page.goto('/login?redirect=%2Fsettings%2Fusers');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/settings\/users$/);
    const token = await page.evaluate(() => window.localStorage.getItem('token'));
    expect(token).toBe('mock.jwt.token.password');
  });
});
