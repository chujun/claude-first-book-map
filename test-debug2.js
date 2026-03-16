const { firefox } = require('playwright');

(async () => {
    const browser = await firefox.launch({ headless: true });
    const page = await browser.newPage();

    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    page.on('pageerror', err => logs.push('ERROR: ' + err.message));

    await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 检查 DOM 元素
    const results = await page.evaluate(() => {
        const data = {
            globeContainer: !!document.getElementById('globe'),
            bookList: !!document.getElementById('bookList'),
            bookItems: document.querySelectorAll('.book-item').length,
            totalBooksText: document.getElementById('totalBooks')?.textContent,
            modal: !!document.getElementById('bookModal'),
            windowBookData: window.bookData ? window.bookData.length : 0
        };

        // 检查是否有错误
        const listEl = document.getElementById('bookList');
        if (listEl) {
            data.listInnerHTML = listEl.innerHTML.substring(0, 200);
        }

        return data;
    });

    console.log('=== DOM 检查 ===');
    console.log('#globe 容器:', results.globeContainer);
    console.log('#bookList 容器:', results.bookList);
    console.log('.book-item 数量:', results.bookItems);
    console.log('#totalBooks 文本:', results.totalBooksText);
    console.log('window.bookData:', results.windowBookData);
    console.log('列表内容:', results.listInnerHTML);

    console.log('\n=== Console 日志 ===');
    logs.forEach(l => console.log(l));

    await browser.close();
})();
