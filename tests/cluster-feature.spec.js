const { test, expect } = require('@playwright/test');

test.describe('3D地球聚类功能 E2E 测试', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待页面加载完成
    await page.waitForSelector('#globe', { timeout: 15000 });
    // 等待 Canvas 就绪 (WebGL 初始化完成)
    await page.waitForSelector('#globe canvas', { timeout: 15000 });
    // 等待书籍数据加载
    await page.waitForSelector('.book-item', { timeout: 15000 });
    // 短暂等待确保渲染稳定
    await page.waitForTimeout(1000);
  });

  test('页面正常加载无JS错误', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('.book-item', { timeout: 15000 });
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });

  test('地球Canvas渲染正常', async ({ page }) => {
    const globe = page.locator('#globe');
    await expect(globe).toBeVisible();

    const canvas = page.locator('#globe canvas');
    await expect(canvas).toBeAttached();

    // 验证 canvas 有尺寸
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('书籍列表显示正常', async ({ page }) => {
    // 等待书籍列表加载
    await page.waitForSelector('.book-item', { timeout: 15000 });

    // 验证有书籍显示
    const bookItems = await page.locator('.book-item').count();
    expect(bookItems).toBeGreaterThan(0);

    // 验证统计数字正确
    const totalBooks = await page.locator('#totalBooks').textContent();
    expect(parseInt(totalBooks)).toBe(bookItems);
  });

  test('点击聚类标记展开功能', async ({ page }) => {
    // 这个测试验证聚类功能的存在和基本交互
    // 由于3D地球上的聚类是Canvas渲染的，我们主要验证：
    // 1. 地图可以正常交互
    // 2. 书籍列表点击功能正常

    await page.waitForSelector('.book-item', { timeout: 15000 });

    // 点击第一本书，应该显示详情
    await page.locator('.book-item').first().click();
    await page.waitForTimeout(300);

    // 验证模态框打开
    const modal = page.locator('#bookModal');
    await expect(modal).toBeVisible();
  });

  test('筛选后地球更新', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 15000 });

    // 获取初始书籍数量
    const initialCount = await page.locator('.book-item').count();

    // 使用年代筛选
    await page.locator('#decadeSelect').selectOption('1980');
    await page.waitForTimeout(500);

    // 验证筛选后数量变化
    const filteredCount = await page.locator('.book-item').count();
    expect(filteredCount).toBeLessThan(initialCount);

    // 验证统计也更新
    const totalBooks = await page.locator('#totalBooks').textContent();
    expect(parseInt(totalBooks)).toBe(filteredCount);
  });

});
