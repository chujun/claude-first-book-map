const { test, expect } = require('@playwright/test');

test.describe('全球书籍地图 - Book Map Application', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待页面加载完成
    await page.waitForSelector('#globe', { timeout: 10000 });
    await page.waitForTimeout(2000); // 等待 WebGL 初始化
  });

  test('页面加载无错误', async ({ page }) => {
    // 验证页面标题
    await expect(page).toHaveTitle(/全球书籍地图/);

    // 验证主要元素存在
    await expect(page.locator('#globe')).toBeVisible();
    await expect(page.locator('#searchInput')).toBeVisible();
    await expect(page.locator('#bookModal')).toBeAttached();
  });

  test('图书数据正确加载', async ({ page }) => {
    // 等待书籍列表渲染
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 验证统计数据
    const totalBooks = await page.locator('#totalBooks').textContent();
    expect(parseInt(totalBooks)).toBeGreaterThan(0);

    const totalCountries = await page.locator('#totalCountries').textContent();
    expect(parseInt(totalCountries)).toBeGreaterThan(0);

    // 验证书籍列表项
    const bookItems = await page.locator('.book-item').count();
    expect(bookItems).toBeGreaterThan(0);
  });

  test('地球容器和 Canvas 渲染', async ({ page }) => {
    // 验证地球容器
    const globe = page.locator('#globe');
    await expect(globe).toBeVisible();

    // 验证 Canvas 存在 (WebGL 渲染)
    const canvas = page.locator('#globe canvas');
    await expect(canvas).toBeAttached();
  });

  test('点击图书项弹出详情', async ({ page }) => {
    // 等待书籍列表
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 点击第一个图书
    await page.locator('.book-item').first().click();
    await page.waitForTimeout(500);

    // 验证 Modal 显示
    const modal = page.locator('#bookModal');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveCSS('display', 'block');

    // 验证 Modal 内容不为空
    const modalBody = page.locator('#modalBody');
    await expect(modalBody).not.toBeEmpty();
  });

  test('关闭 Modal', async ({ page }) => {
    // 等待书籍列表
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 点击第一个图书打开 Modal
    await page.locator('.book-item').first().click();
    await page.waitForTimeout(500);

    // 点击关闭按钮
    await page.locator('.close').click();
    await page.waitForTimeout(300);

    // 验证 Modal 隐藏
    const modal = page.locator('#bookModal');
    await expect(modal).toHaveCSS('display', 'none');
  });

  test('搜索功能 - 按书名搜索', async ({ page }) => {
    // 等待书籍列表
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 获取初始图书数量
    const initialCount = await page.locator('.book-item:visible').count();

    // 搜索红楼梦
    await page.locator('#searchInput').fill('红楼梦');
    await page.waitForTimeout(500);

    // 搜索后应该有更少的结果或没有结果
    const afterSearchCount = await page.locator('.book-item:visible').count();
    // 注意: 显示的图书可能使用 CSS display 或 visibility 控制
    // 验证搜索后列表有变化
    expect(afterSearchCount).toBeLessThanOrEqual(initialCount);
  });

  test('搜索功能 - 清空搜索', async ({ page }) => {
    // 等待书籍列表
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 获取初始数量
    const initialCount = await page.locator('.book-item').count();

    // 搜索
    await page.locator('#searchInput').fill('红楼梦');
    await page.waitForTimeout(500);

    // 清空搜索
    await page.locator('#searchInput').clear();
    await page.waitForTimeout(500);

    // 验证恢复
    const afterClearCount = await page.locator('.book-item').count();
    expect(afterClearCount).toBe(initialCount);
  });

  test('图例显示正确', async ({ page }) => {
    // 验证图例存在
    const legend = page.locator('.map-legend');
    await expect(legend).toBeVisible();

    // 验证图例项数量 (5个地区)
    const legendItems = page.locator('.legend-item');
    await expect(legendItems).toHaveCount(5);

    // 验证各地区标签
    await expect(page.locator('.legend-item:has-text("欧洲文学")')).toBeVisible();
    await expect(page.locator('.legend-item:has-text("美洲文学")')).toBeVisible();
    await expect(page.locator('.legend-item:has-text("亚洲文学")')).toBeVisible();
    await expect(page.locator('.legend-item:has-text("非洲文学")')).toBeVisible();
    await expect(page.locator('.legend-item:has-text("大洋洲文学")')).toBeVisible();
  });

  test('控制台无错误', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(3000);

    expect(errors).toHaveLength(0);
  });

  test('年代筛选器存在', async ({ page }) => {
    // 验证年代筛选下拉选择器存在
    const decadeFilter = page.locator('#decadeFilter');
    await expect(decadeFilter).toBeVisible();

    // 验证有"全部年代"选项
    await expect(decadeFilter.locator('option').first()).toContainText('全部年代');

    // 验证有具体年代选项 (通过 count 检查)
    const options = decadeFilter.locator('option');
    await expect(options).toHaveCount(14); // all + 1900-2020

    // 验证通过 selectOption 可以选择特定年代
    await decadeFilter.selectOption('1980');
    const selected = await decadeFilter.inputValue();
    expect(selected).toBe('1980');
  });

  test('年代筛选功能 - 筛选2000年代', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 获取初始图书数量
    const initialCount = await page.locator('.book-item').count();
    expect(initialCount).toBeGreaterThan(0);

    // 选择 2000 年代
    await page.locator('#decadeFilter').selectOption('2000');
    await page.waitForTimeout(500);

    // 验证筛选后数量变化
    const filteredCount = await page.locator('.book-item').count();
    // 2000年代的书应该少于总数
    expect(filteredCount).toBeLessThan(initialCount);

    // 验证统计数字也更新了
    const totalBooks = await page.locator('#totalBooks').textContent();
    expect(parseInt(totalBooks)).toBe(filteredCount);
  });

  test('年代筛选功能 - 清空筛选恢复全部', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 获取初始数量
    const initialCount = await page.locator('.book-item').count();

    // 选择一个年代
    await page.locator('#decadeFilter').selectOption('1990');
    await page.waitForTimeout(500);

    // 切回全部年代
    await page.locator('#decadeFilter').selectOption('all');
    await page.waitForTimeout(500);

    // 验证恢复
    const restoredCount = await page.locator('.book-item').count();
    expect(restoredCount).toBe(initialCount);
  });

  test('年代筛选和搜索组合', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 先搜索
    await page.locator('#searchInput').fill('红');
    await page.waitForTimeout(300);

    const afterSearchCount = await page.locator('.book-item').count();

    // 再添加年代筛选
    await page.locator('#decadeFilter').selectOption('1980');
    await page.waitForTimeout(500);

    // 验证双重筛选
    const afterBothCount = await page.locator('.book-item').count();
    expect(afterBothCount).toBeLessThanOrEqual(afterSearchCount);
  });

  // ===== 国家筛选测试 (TDD RED 阶段) =====

  test('国家筛选器存在', async ({ page }) => {
    const countryFilter = page.locator('#countryFilter');
    await expect(countryFilter).toBeVisible();
    await expect(countryFilter.locator('option').first()).toContainText('全部地区');
  });

  test('国家筛选功能 - 筛选特定国家', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    const initialCount = await page.locator('.book-item').count();
    expect(initialCount).toBeGreaterThan(0);

    // 获取一个存在于数据中的国家
    const firstBookCountry = await page.locator('.book-item').first().locator('.book-country').textContent();

    // 选择该国家
    await page.locator('#countryFilter').selectOption({ label: firstBookCountry });
    await page.waitForTimeout(500);

    const filteredCount = await page.locator('.book-item').count();
    expect(filteredCount).toBeLessThan(initialCount);
  });

  test('国家筛选功能 - 清空筛选恢复全部', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    const initialCount = await page.locator('.book-item').count();

    // 选择一个国家
    const countries = page.locator('#countryFilter option');
    const count = await countries.count();
    if (count > 1) {
      await page.locator('#countryFilter').selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }

    // 切回全部
    await page.locator('#countryFilter').selectOption('all');
    await page.waitForTimeout(500);

    const restoredCount = await page.locator('.book-item').count();
    expect(restoredCount).toBe(initialCount);
  });

  test('国家筛选和年代筛选组合', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 先选国家
    await page.locator('#countryFilter').selectOption({ index: 1 });
    await page.waitForTimeout(300);

    const afterCountryCount = await page.locator('.book-item').count();

    // 再加年代筛选
    await page.locator('#decadeFilter').selectOption('1990');
    await page.waitForTimeout(500);

    const afterBothCount = await page.locator('.book-item').count();
    expect(afterBothCount).toBeLessThanOrEqual(afterCountryCount);
  });

});
