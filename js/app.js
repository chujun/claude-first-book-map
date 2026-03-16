// 全球书籍地图应用
// 使用 Globe.gl 实现 3D 地球仪

// 全局变量
let globe;
let isRotating = true;
let bookData = [];

// 地区颜色映射
const regionColors = {
    "Europe": "#e74c3c",
    "Americas": "#3498db",
    "Asia": "#2ecc71",
    "Africa": "#f39c12",
    "Oceania": "#9b59b6"
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadBookData().then(() => {
        initGlobe();
        renderBookList();
        updateStats();
        initSearch();
        initModal();
        initControls();
    });
});

// 加载图书数据
async function loadBookData() {
    try {
        const response = await fetch('data/douban_books.json');
        bookData = await response.json();
        console.log(`已加载 ${bookData.length} 本图书数据`);
    } catch (error) {
        console.error('加载图书数据失败:', error);
        bookData = [];
    }
}

// 初始化 3D 地球
function initGlobe() {
    // 使用 Globe.gl 创建 3D 地球
    globe = Globe()
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .pointsData(bookData)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointColor(d => regionColors[d.region] || '#3498db')
        .pointAltitude(0.01)
        .pointRadius(0.5)
        .pointsMerge(true)
        .pointLabel(d => {
            return `
                <div style="
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    color: white;
                    padding: 10px;
                    border-radius: 8px;
                    font-family: 'Noto Sans SC', sans-serif;
                    min-width: 150px;
                ">
                    <div style="font-weight: bold; margin-bottom: 5px;">${d.title}</div>
                    <div style="font-size: 12px; opacity: 0.8;">${d.author}</div>
                    <div style="font-size: 11px; margin-top: 5px; color: ${regionColors[d.region]};">
                        ${d.country} | ${d.year}
                    </div>
                </div>
            `;
        })
        .onPointClick(d => {
            showBookDetail(d);
            highlightBook(d.rank);
        })
        .enablePointerInteraction(true)
        .autoRotate(isRotating)
        .autoRotateSpeed(0.5)
        ('#globe');

    // 设置初始视角
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

    // 调整画布大小
    resizeGlobe();
    window.addEventListener('resize', resizeGlobe);
}

// 调整地球大小
function resizeGlobe() {
    const container = document.querySelector('.map-section');
    const width = container.clientWidth;
    const height = container.clientHeight || 700;
    globe.width(width);
    globe.height(height);
}

// 初始化控制按钮
function initControls() {
    const rotateBtn = document.getElementById('rotateBtn');
    rotateBtn.addEventListener('click', () => {
        isRotating = !isRotating;
        globe.autoRotate(isRotating);
        rotateBtn.textContent = isRotating ? '⏸️ 暂停旋转' : '▶️ 开始旋转';
        rotateBtn.classList.toggle('active', !isRotating);
    });

    // 鼠标拖拽停止自动旋转
    globe.controls().addEventListener('start', () => {
        if (isRotating) {
            globe.autoRotate(false);
        }
    });

    globe.controls().addEventListener('end', () => {
        if (isRotating) {
            globe.autoRotate(true);
        }
    });
}

// 渲染书籍列表
function renderBookList() {
    const bookListEl = document.getElementById('bookList');
    bookListEl.innerHTML = '';

    const sortedBooks = [...bookData].sort((a, b) => a.rank - b.rank);

    sortedBooks.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        bookItem.dataset.rank = book.rank;

        bookItem.innerHTML = `
            <span class="book-rank">${book.rank}</span>
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
            <span class="book-country" style="background: ${regionColors[book.region]};">${book.country}</span>
        `;

        bookItem.addEventListener('click', () => {
            document.querySelectorAll('.book-item').forEach(item => {
                item.classList.remove('active');
            });
            bookItem.classList.add('active');

            focusOnBook(book);
            showBookDetail(book);
        });

        bookListEl.appendChild(bookItem);
    });
}

// 更新统计信息
function updateStats() {
    document.getElementById('totalBooks').textContent = bookData.length;
    const countries = new Set(bookData.map(book => book.country));
    document.getElementById('totalCountries').textContent = countries.size;
}

// 初始化搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        filterBooks(query);
    });
}

// 过滤书籍
function filterBooks(query) {
    const bookItems = document.querySelectorAll('.book-item');

    bookItems.forEach(item => {
        const title = item.querySelector('.book-title').textContent.toLowerCase();
        const author = item.querySelector('.book-author').textContent.toLowerCase();
        const country = item.querySelector('.book-country').textContent.toLowerCase();

        if (title.includes(query) || author.includes(query) || country.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 聚焦到书籍
function focusOnBook(book) {
    globe.pointOfView({
        lat: book.lat,
        lng: book.lng,
        altitude: 1.5
    }, 1000);
}

// 高亮书籍列表项
function highlightBook(rank) {
    document.querySelectorAll('.book-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeItem = document.querySelector(`.book-item[data-rank="${rank}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 显示书籍详情
function showBookDetail(book) {
    const modal = document.getElementById('bookModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h2>${book.title}</h2>
        <span class="book-detail-rank">#${book.rank}</span>
        <p class="book-detail-author">作者：${book.author}</p>
        <span class="book-detail-country" style="background: ${regionColors[book.region]};">${book.country} | ${book.region}</span>
        <div class="book-detail-description">
            <p><strong>出版年份：</strong>${book.year}</p>
            <p><strong>评分：</strong>${book.rating}</p>
            <p><strong>类别：</strong>${book.category}</p>
            <p><strong>出版社：</strong>${book.publisher}</p>
            <hr style="margin: 1rem 0; border: none; border-top: 1px solid #eee;">
            <p>点击地图标记可查看更多书籍信息</p>
        </div>
    `;

    modal.style.display = 'block';
}

// 初始化模态框
function initModal() {
    const modal = document.getElementById('bookModal');
    const closeBtn = document.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}
