import { Page, Locator } from '@playwright/test';

export class UsersPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly createButton: Locator;
  readonly usersTable: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrev: Locator;

  constructor(page: Page) {
    this.page = page;
    // ProTable 搜索框 — 列名 "用户名" 对应的 input
    this.searchInput = page.locator('input[placeholder*="搜索"], .ant-pro-table-search input').first();
    // ProTable 状态筛选 — Ant Design Select
    this.statusFilter = page.locator('.ant-select').filter({ hasText: /全部|活跃|停用/ }).first();
    // 创建用户按钮
    this.createButton = page.locator('button:has-text("创建用户")');
    // 表格
    this.usersTable = page.locator('.ant-table, table').first();
    // 分页
    this.paginationNext = page.locator('.ant-pagination-next button, button[aria-label="Next Page"], li[title="Next Page"] button').first();
    this.paginationPrev = page.locator('.ant-pagination-prev button, button[aria-label="Previous Page"], li[title="Previous Page"] button').first();
  }

  async goto() {
    try {
      await this.page.goto('/settings/users', { waitUntil: 'domcontentloaded' });
    } catch {
      // 忽略导航冲突，等待页面稳定
    }
    await this.page.waitForURL('**/settings/users', { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async searchUser(query: string) {
    // ProTable query filter — 用户名或姓名搜索框
    const usernameInput = this.page.locator('input[id="username"]');
    const nameInput = this.page.locator('input[id="name"]');
    // 先尝试用户名搜索框，再尝试姓名搜索框
    if (await usernameInput.isVisible()) {
      await usernameInput.fill(query);
    } else if (await nameInput.isVisible()) {
      await nameInput.fill(query);
    }
    // 点击查询按钮
    await this.page.locator('button:has-text("查 询"), button:has-text("查询")').first().click();
    await this.page.waitForResponse(r => r.url().includes('/api/users'));
    await this.page.waitForLoadState('networkidle');
  }

  async filterByStatus(status: 'ACTIVE' | 'INACTIVE') {
    const label = status === 'ACTIVE' ? '活跃' : '停用';
    // 先展开搜索区域
    const expandBtn = this.page.locator('a:has-text("展开"), span:has-text("展开")').first();
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
    }
    // 点击状态 Select
    const statusSelect = this.page.locator('.ant-select').filter({ has: this.page.locator('input[id="status"]') }).first();
    await statusSelect.click();
    await this.page.locator(`.ant-select-dropdown .ant-select-item-option:has-text("${label}")`).click();
    // 点击查询按钮
    await this.page.locator('button:has-text("查 询"), button:has-text("查询")').first().click();
    await this.page.waitForResponse(r => r.url().includes('/api/users'));
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreateButton() {
    await this.createButton.click();
    await this.page.waitForURL('**/users/create');
  }

  async getUserList() {
    await this.page.waitForSelector('.ant-table-tbody tr, tbody tr', { timeout: 10000 });
    const rows = await this.usersTable.locator('tbody tr').all();
    const users = [];
    for (const row of rows) {
      const cells = await row.locator('td').all();
      if (cells.length >= 2) {
        users.push({
          username: (await cells[0].textContent())?.trim() ?? null,
          name: (await cells[1].textContent())?.trim() ?? null,
          status: (await cells[2].textContent())?.trim() ?? null,
        });
      }
    }
    return users;
  }

  async viewUserDetail(username: string) {
    const row = this.usersTable.locator(`tr:has-text("${username}")`).first();
    await row.locator('button:has-text("详情")').click();
    await this.page.waitForURL('**/users/**');
    await this.page.waitForLoadState('networkidle');
  }

  async editUser(username: string) {
    const row = this.usersTable.locator(`tr:has-text("${username}")`).first();
    await row.locator('button:has-text("编辑")').click();
    await this.page.waitForURL('**/users/**/edit');
    await this.page.waitForLoadState('networkidle');
  }

  async deactivateUser(username: string) {
    const row = this.usersTable.locator(`tr:has-text("${username}")`).first();
    await row.locator('button:has-text("停用")').click();
    const confirmButton = this.page.locator('.ant-popover button.ant-btn-primary').first();
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    // 同时等待停用 API 和随后的列表刷新
    await Promise.all([
      confirmButton.click(),
      this.page.waitForResponse(r => r.url().includes('/deactivate')),
    ]);
    // 等待 ProTable reload 完成（GET /api/users）
    await this.page.waitForTimeout(800);
    await this.page.waitForResponse(
      r => r.url().includes('/api/users') && r.request().method() === 'GET',
      { timeout: 5000 }
    ).catch(() => {});
    await this.page.waitForLoadState('networkidle');
  }

  async goToNextPage() {
    await this.paginationNext.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToPrevPage() {
    await this.paginationPrev.click();
    await this.page.waitForLoadState('networkidle');
  }
}

export class UserFormPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly nameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input[id="username"], input[name="username"]').first();
    this.nameInput = page.locator('input[id="name"], input[name="name"]').first();
    this.passwordInput = page.locator('input[id="password"], input[name="password"]').first();
    this.confirmPasswordInput = page.locator('input[id="confirmPassword"], input[name="confirmPassword"]').first();
    // ProForm 提交按钮（文字有空格如"创 建"/"更 新"）
    this.submitButton = page.locator('button.ant-btn-primary').last();
    this.cancelButton = page.locator('button:has-text("返回"), button:has-text("取")').first();
  }

  async fillForm(data: { username?: string; name?: string; password?: string; confirmPassword?: string }) {
    if (data.username) await this.usernameInput.fill(data.username);
    if (data.name) await this.nameInput.fill(data.name);
    if (data.password) await this.passwordInput.fill(data.password);
    if (data.confirmPassword) await this.confirmPasswordInput.fill(data.confirmPassword);
  }

  async submit() {
    await this.submitButton.click();
    // 不等 networkidle，让调用方自己等消息或跳转
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async getErrorMessage() {
    const errorElement = this.page.locator('.ant-form-item-explain-error, [class*="error"]').first();
    return await errorElement.textContent();
  }
}

export class UserDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly editButton: Locator;
  readonly deactivateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.locator('button:has-text("返回")');
    this.editButton = page.locator('button:has-text("编辑")');
    this.deactivateButton = page.locator('button:has-text("停用")');
  }

  async getUserInfo() {
    const username = await this.page.locator('[data-testid="username"]').textContent().catch(() => undefined);
    const name = await this.page.locator('[data-testid="name"]').textContent().catch(() => undefined);
    const status = await this.page.locator('[data-testid="status"]').textContent().catch(() => undefined);
    const createdAt = await this.page.locator('[data-testid="created-at"]').textContent().catch(() => undefined);
    const updatedAt = await this.page.locator('[data-testid="updated-at"]').textContent().catch(() => undefined);
    const createdBy = await this.page.locator('[data-testid="created-by"]').textContent().catch(() => undefined);
    const updatedBy = await this.page.locator('[data-testid="updated-by"]').textContent().catch(() => undefined);
    return { username, name, status, createdAt, updatedAt, created_by: createdBy, updated_by: updatedBy };
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL('**/users');
  }

  async edit() {
    await this.editButton.click();
    await this.page.waitForURL('**/users/**/edit');
  }

  async deactivate() {
    await this.deactivateButton.click();
    const confirmButton = this.page.locator('.ant-popconfirm button:has-text("确认"), .ant-popover button:has-text("确认")').first();
    await confirmButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
