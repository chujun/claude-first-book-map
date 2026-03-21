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

  test('图书列表按评分从高到低排序', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 红楼梦 (rank 1, rating 9.7) 和 哈利·波特 (rank 3, rating 9.7) 评分相同
    // 如果按评分排序，rank 3 应该紧跟在 rank 1 后面
    // 如果按 rank 排序，顺序是 1, 2, 3...

    // 获取前3本书的排名
    const first3Ranks = [];
    for (let i = 0; i < 3; i++) {
      const item = page.locator('.book-item').nth(i);
      const rankText = await item.locator('.book-rank').textContent();
      first3Ranks.push(parseInt(rankText));
    }

    // 如果按评分排序，前3本应该是 1, 3, ? (因为红楼梦和哈利波特都是9.7)
    // 验证哈利·波特 (rank 3) 在红楼梦 (rank 1) 后面
    // 且 rank 3 < rank 5 (如果 rank 5 的书评分更低)

    // 检查 rank 3 是否紧跟在 rank 1 后面
    // 即前3本中包含 rank 1 和 rank 3
    expect(first3Ranks).toContain(1);
    expect(first3Ranks).toContain(3);
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

  test('书籍详情包含豆瓣链接', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 点击第一个图书
    await page.locator('.book-item').first().click();
    await page.waitForTimeout(500);

    // 验证 Modal 显示
    const modal = page.locator('#bookModal');
    await expect(modal).toBeVisible();

    // 验证豆瓣链接存在
    const doubanLink = page.locator('#modalBody a[href*="douban"]');
    await expect(doubanLink).toBeVisible();

    // 验证链接格式正确
    const href = await doubanLink.getAttribute('href');
    expect(href).toContain('douban.com');

    // 验证链接 target 属性为 _blank
    const target = await doubanLink.getAttribute('target');
    expect(target).toBe('_blank');
  });

  test('书籍详情包含必填字段', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 点击第一个图书
    await page.locator('.book-item').first().click();
    await page.waitForTimeout(500);

    const modalBody = page.locator('#modalBody');

    // 验证书名存在
    const title = await modalBody.locator('h2').textContent();
    expect(title.length).toBeGreaterThan(0);

    // 验证包含评分信息
    const content = await modalBody.textContent();
    expect(content).toContain('评分');

    // 验证包含作者信息
    expect(content).toContain('作者');
  });

  test('搜索功能 - 按作者搜索', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 搜索一个已知的作者名
    await page.locator('#searchInput').fill('刘慈欣');
    await page.waitForTimeout(500);

    // 验证有搜索结果
    const count = await page.locator('.book-item').count();
    expect(count).toBeGreaterThan(0);

    // 验证结果显示的是刘慈欣的书
    const firstResult = await page.locator('.book-item').first().textContent();
    expect(firstResult).toContain('刘慈欣');
  });

  test('搜索功能 - 无结果搜索', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 搜索一个不存在的书名
    await page.locator('#searchInput').fill('xyznonexistentbook12345');
    await page.waitForTimeout(500);

    // 验证没有搜索结果
    const count = await page.locator('.book-item').count();
    expect(count).toBe(0);

    // 验证统计数字为0
    const totalBooks = await page.locator('#totalBooks').textContent();
    expect(parseInt(totalBooks)).toBe(0);
  });

  test('年代筛选功能 - 筛选1950年代', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    const initialCount = await page.locator('.book-item').count();

    // 选择 1950 年代
    await page.locator('#decadeFilter').selectOption('1950');
    await page.waitForTimeout(500);

    const filteredCount = await page.locator('.book-item').count();

    // 验证数量变化
    expect(filteredCount).toBeLessThan(initialCount);

    // 验证统计更新
    const totalBooks = await page.locator('#totalBooks').textContent();
    expect(parseInt(totalBooks)).toBe(filteredCount);
  });

  test('年代筛选功能 - 筛选1800年代', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 选择 1800 年代（应该有古典名著如红楼梦）
    await page.locator('#decadeFilter').selectOption('1800');
    await page.waitForTimeout(500);

    const filteredCount = await page.locator('.book-item').count();

    // 1800年代应该有书籍（如红楼梦）
    // 如果数据中有这个年代的书，count应该大于0
    const totalBooks = await page.locator('#totalBooks').textContent();
    expect(parseInt(totalBooks)).toBe(filteredCount);
  });

  test('国家筛选功能 - 筛选美国书籍', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    const initialCount = await page.locator('.book-item').count();

    // 尝试选择美国
    const usaOption = page.locator('#countryFilter option').filter({ hasText: '美国' });
    const usaCount = await usaOption.count();

    if (usaCount > 0) {
      await usaOption.first().click();
      await page.waitForTimeout(500);

      const filteredCount = await page.locator('.book-item').count();

      // 验证筛选后数量减少
      expect(filteredCount).toBeLessThan(initialCount);

      // 验证显示的都是美国书籍
      const firstBookCountry = await page.locator('.book-item').first().locator('.book-country').textContent();
      expect(firstBookCountry).toBe('美国');
    }
  });

  test('国家筛选功能 - 筛选中国书籍', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    const initialCount = await page.locator('.book-item').count();

    // 选择中国
    const chinaOption = page.locator('#countryFilter option').filter({ hasText: '中国' });
    const chinaCount = await chinaOption.count();

    if (chinaCount > 0) {
      await chinaOption.first().click();
      await page.waitForTimeout(500);

      const filteredCount = await page.locator('.book-item').count();

      // 验证筛选后数量减少
      expect(filteredCount).toBeLessThan(initialCount);

      // 验证显示的都是中国书籍
      const firstBookCountry = await page.locator('.book-item').first().locator('.book-country').textContent();
      expect(firstBookCountry).toBe('中国');
    }
  });

  test('筛选组合 - 国家+年代+搜索', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 先选国家
    const chinaOption = page.locator('#countryFilter option').filter({ hasText: '中国' });
    if (await chinaOption.count() > 0) {
      await chinaOption.first().click();
      await page.waitForTimeout(300);
    }

    // 再选年代
    await page.locator('#decadeFilter').selectOption('1980');
    await page.waitForTimeout(300);

    // 最后搜索
    await page.locator('#searchInput').fill('余华');
    await page.waitForTimeout(300);

    // 获取最终结果
    const finalCount = await page.locator('.book-item').count();

    // 验证统计同步
    const totalBooks = await page.locator('#totalBooks').textContent();
    expect(parseInt(totalBooks)).toBe(finalCount);
  });

  test('页面标题正确显示', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('全球书籍地图');
  });

  test(' Globe 容器尺寸正确', async ({ page }) => {
    const globe = page.locator('#globe');
    const box = await globe.boundingBox();

    // Globe 容器应该有尺寸
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('统计信息 - 国家数量准确', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 获取显示的国家数量
    const totalCountries = await page.locator('#totalCountries').textContent();
    const countryCount = parseInt(totalCountries);

    // 获取实际数据中的国家数量
    const uniqueCountries = new Set();
    const bookItems = await page.locator('.book-item').all();
    for (const item of bookItems) {
      const country = await item.locator('.book-country').textContent();
      uniqueCountries.add(country);
    }

    // 验证显示的国家数量与实际匹配
    expect(countryCount).toBe(uniqueCountries.size);
  });

  test('模态框点击外部关闭', async ({ page }) => {
    await page.waitForSelector('.book-item', { timeout: 10000 });

    // 打开模态框
    await page.locator('.book-item').first().click();
    await page.waitForTimeout(500);

    const modal = page.locator('#bookModal');
    await expect(modal).toHaveCSS('display', 'block');

    // 点击模态框外部区域
    await page.mouse.click(10, 10);
    await page.waitForTimeout(500);

    // 验证模态框关闭
    await expect(modal).toHaveCSS('display', 'none');
  });

});
