const { firefox } = require('playwright');

(async () => {
    console.log('🚀 启动测试...\n');

    const browser = await firefox.launch({ headless: true });
    const page = await browser.newPage();

    // 收集所有控制台消息
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    // 收集页面错误
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
    });

    try {
        await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('✅ 页面加载完成\n');

        // 等待一段时间让 JS 执行
        await page.waitForTimeout(5000);

        // 检查 Globe 对象是否加载
        const globeLoaded = await page.evaluate(() => {
            return typeof Globe === 'function';
        });
        console.log('Globe.gl 库加载:', globeLoaded ? '✅' : '❌');

        // 检查数据加载
        const dataLoaded = await page.evaluate(() => {
            return window.bookData ? window.bookData.length : 0;
        });
        console.log('书籍数据加载:', dataLoaded);

        // 输出所有控制台消息
        console.log('\n========== Console 日志 ==========');
        consoleLogs.forEach(log => {
            console.log(`[${log.type}] ${log.text}`);
        });

        // 输出页面错误
        if (pageErrors.length > 0) {
            console.log('\n========== Page Errors ==========');
            pageErrors.forEach(err => console.log(err));
        }

        // 检查页面元素
        const hasGlobeContainer = await page.$('#globe');
        const hasCanvas = await page.$('#globe canvas');
        const hasBookList = await page.$('.book-item');

        console.log('\n========== 元素检查 ==========');
        console.log('#globe 容器:', hasGlobeContainer ? '✅' : '❌');
        console.log('canvas (3D渲染):', hasCanvas ? '✅' : '❌ (WebGL限制)');
        console.log('.book-item 列表:', hasBookList ? '✅' : '❌');

    } catch (error) {
        console.log('❌ 测试错误:', error.message);
    }

    await browser.close();
})();
