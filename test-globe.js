const { chromium } = require('playwright');

(async () => {
    console.log('启动浏览器...');

    let browser;
    try {
        // 尝试使用系统Chrome
        browser = await chromium.launch({
            headless: true,
            channel: 'chrome'
        });
    } catch (e) {
        console.log('Chrome 不可用，尝试使用chromium...');
        try {
            browser = await chromium.launch({
                headless: true
            });
        } catch (e2) {
            console.log('无法启动浏览器:', e2.message);
            process.exit(1);
        }
    }

    const page = await browser.newPage();

    // 监听控制台消息
    page.on('console', msg => {
        console.log('Console:', msg.type(), msg.text());
    });

    // 监听页面错误
    page.on('pageerror', error => {
        console.log('Page Error:', error.message);
    });

    try {
        console.log('访问页面...');
        await page.goto('http://192.168.40.201:8080/', { waitUntil: 'networkidle', timeout: 30000 });

        console.log('页面加载完成');

        // 检查页面标题
        const title = await page.title();
        console.log('页面标题:', title);

        // 检查 #globe 元素
        const globe = await page.$('#globe');
        console.log('找到 #globe 元素:', !!globe);

        // 检查 canvas 元素（3D 渲染）
        const canvas = await page.$('#globe canvas');
        console.log('找到 canvas 元素:', !!canvas);

        // 检查地球是否渲染
        if (canvas) {
            const box = await canvas.boundingBox();
            console.log('Canvas 尺寸:', box);
        }

        // 检查书籍数据是否加载
        const totalBooks = await page.$('#totalBooks');
        if (totalBooks) {
            const booksText = await totalBooks.textContent();
            console.log('书籍数量:', booksText);
        }

        // 检查是否有控制按钮
        const rotateBtn = await page.$('#rotateBtn');
        console.log('找到旋转按钮:', !!rotateBtn);

        // 等待几秒让3D渲染完成
        await page.waitForTimeout(3000);

        // 再次检查canvas
        const canvas2 = await page.$('#globe canvas');
        console.log('3秒后 canvas 元素:', !!canvas2);

    } catch (error) {
        console.log('错误:', error.message);
    }

    await browser.close();
    console.log('测试完成');
})();
