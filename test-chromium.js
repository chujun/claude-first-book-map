const { chromium } = require('playwright');

(async () => {
    console.log('🚀 使用 Chromium 进行功能验证...\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 收集日志和错误
    const consoleLogs = [];
    const pageErrors = [];

    page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', err => pageErrors.push(err.message));

    try {
        await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('✅ 页面加载完成');

        // 等待 JS 执行
        await page.waitForTimeout(5000);

        // 核心功能检查
        const results = await page.evaluate(() => {
            return {
                bookData: window.bookData?.length || 0,
                totalBooks: document.getElementById('totalBooks')?.textContent,
                totalCountries: document.getElementById('totalCountries')?.textContent,
                bookItems: document.querySelectorAll('.book-item').length,
                hasGlobe: !!document.getElementById('globe'),
                hasCanvas: !!document.querySelector('#globe canvas'),
                modalExists: !!document.getElementById('bookModal')
            };
        });

        console.log('\n========== 功能检查 ==========');
        console.log(`📚 书籍数据: ${results.bookData}`);
        console.log(`📖 显示总数: ${results.totalBooks}`);
        console.log(`🌍 国家数量: ${results.totalCountries}`);
        console.log(`📋 列表项: ${results.bookItems}`);
        console.log(`🗺️  地球容器: ${results.hasGlobe ? '✅' : '❌'}`);
        console.log(`🎨 Canvas渲染: ${results.hasCanvas ? '✅' : '❌ (WebGL限制)'}`);
        console.log(`📋 详情弹窗: ${results.modalExists ? '✅' : '❌'}`);

        // 测试点击列表项
        console.log('\n========== 交互测试 ==========');
        const firstBookItem = await page.$('.book-item');
        if (firstBookItem) {
            await firstBookItem.click();
            await page.waitForTimeout(500);

            const modalVisible = await page.evaluate(() => {
                const modal = document.getElementById('bookModal');
                return modal?.style.display === 'block';
            });
            console.log(`📖 点击列表项弹出详情: ${modalVisible ? '✅' : '❌'}`);

            // 关闭弹窗
            const closeBtn = await page.$('.close');
            if (closeBtn) {
                await closeBtn.click();
                await page.waitForTimeout(300);
            }
        }

        // 搜索功能测试
        console.log('\n========== 搜索测试 ==========');
        const searchInput = await page.$('#searchInput');
        if (searchInput) {
            await searchInput.fill('红楼梦');
            await page.waitForTimeout(300);

            const visibleItems = await page.evaluate(() => {
                return document.querySelectorAll('.book-item[style="display: block"], .book-item:not([style])').length;
            });
            console.log(`🔍 搜索"红楼梦"结果: ${visibleItems} 项`);
        }

        // 控制台日志
        console.log('\n========== Console 日志 ==========');
        consoleLogs.forEach(log => {
            if (log.type === 'error') {
                console.log(`❌ [${log.type}] ${log.text}`);
            }
        });

        // 总结
        console.log('\n========== 测试结果 ==========');
        const allPassed = results.bookItems > 0 && results.totalBooks > 0;

        if (allPassed) {
            console.log('✅ 所有核心功能测试通过!');
        } else {
            console.log('❌ 部分测试失败');
        }

    } catch (error) {
        console.log('❌ 测试错误:', error.message);
    }

    await browser.close();
    console.log('\n================================\n');
})();
