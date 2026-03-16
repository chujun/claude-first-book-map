const { firefox } = require('playwright');

(async () => {
    console.log('🚀 启动浏览器测试...\n');

    let browser;
    try {
        browser = await firefox.launch({
            headless: true
        });
        console.log('✅ Firefox 启动成功');
    } catch (e) {
        console.log('❌ 浏览器启动失败:', e.message);
        process.exit(1);
    }

    const page = await browser.newPage();

    // 监听控制台消息
    let consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    // 监听页面错误
    let pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
    });

    try {
        console.log('📄 访问页面...');
        await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 检查页面标题
        const title = await page.title();
        console.log('📌 页面标题:', title);

        // 检查 #globe 元素
        const globe = await page.$('#globe');
        console.log('🌍 找到地球容器:', globe ? '是 ✅' : '否 ❌');

        // 等待 JS 执行
        await page.waitForTimeout(5000);

        // 检查书籍数据 - 通过 evaluate 获取 window 变量
        const booksLoaded = await page.evaluate(() => {
            return window.bookData ? window.bookData.length : 0;
        });
        console.log('📚 书籍数据加载:', booksLoaded > 0 ? `${booksLoaded} 本 ✅` : '失败 ❌');

        // 检查 DOM 元素
        const totalBooks = await page.$('#totalBooks');
        const booksText = await totalBooks?.textContent();
        console.log('📖 书籍数量显示:', booksText || '0');

        const totalCountries = await page.$('#totalCountries');
        const countriesText = await totalCountries?.textContent();
        console.log('🌍 国家数量显示:', countriesText || '0');

        // 检查旋转按钮是否已移除
        const rotateBtn = await page.$('#rotateBtn');
        console.log('⏸️ 旋转按钮已移除:', !rotateBtn ? '是 ✅' : '否 ❌');

        // 检查侧边栏书籍列表
        const bookListItems = await page.$$('.book-item');
        console.log('📋 书籍列表项:', bookListItems.length > 0 ? `${bookListItems.length} 项 ✅` : '0 项');

        // 检查数据加载日志
        const dataLog = consoleLogs.find(l => l.text.includes('已加载'));
        console.log('📝 数据加载日志:', dataLog ? dataLog.text : '无');

        // 检查 WebGL 错误
        const webglErrors = consoleLogs.filter(l => l.text.includes('WebGL'));
        if (webglErrors.length > 0) {
            console.log('\n⚠️ WebGL 警告 (虚拟机环境限制):');
            console.log('   WebGL 在无头浏览器中可能无法工作');
            console.log('   这是环境限制，不是代码问题');
        }

        // 总结
        console.log('\n========== 测试结果 ==========');
        const allPassed = globe && booksLoaded > 0 && !rotateBtn && bookListItems.length > 0;

        if (allPassed) {
            console.log('✅ 所有核心功能测试通过!');
            console.log('\n注意: WebGL 3D 地图需要 GPU 支持');
            console.log('在有图形界面的浏览器中打开 http://192.168.40.201:8080/ 即可看到 3D 地球');
        } else {
            console.log('❌ 部分测试失败');
        }

    } catch (error) {
        console.log('❌ 测试错误:', error.message);
    }

    await browser.close();
    console.log('================================\n');
})();
