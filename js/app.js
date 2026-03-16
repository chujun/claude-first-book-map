// 全球书籍地图应用
// 使用 Globe.gl 实现 3D 地球仪

// 全局变量
let globe;
let bookData = [];

// 地区颜色映射
const regionColors = {
    "Europe": "#e74c3c",
    "Americas": "#3498db",
    "Asia": "#2ecc71",
    "Africa": "#f39c12",
    "Oceania": "#9b59b6"
};

// 国家坐标映射
const countryCoords = {
    "中国": { lat: 35.8617, lng: 104.1954 },
    "日本": { lat: 36.2048, lng: 138.2529 },
    "美国": { lat: 37.0902, lng: -95.7129 },
    "英国": { lat: 55.3781, lng: -3.4360 },
    "法国": { lat: 46.2276, lng: 2.2137 },
    "德国": { lat: 51.1657, lng: 10.4515 },
    "俄罗斯": { lat: 61.5240, lng: 105.3188 },
    "意大利": { lat: 41.8719, lng: 12.5674 },
    "西班牙": { lat: 40.4637, lng: -3.7492 },
    "韩国": { lat: 35.9078, lng: 127.7669 },
    "印度": { lat: 20.5937, lng: 78.9629 },
    "加拿大": { lat: 56.1304, lng: -106.3468 },
    "巴西": { lat: -14.2350, lng: -51.9253 },
    "墨西哥": { lat: 23.6345, lng: -102.5528 },
    "阿根廷": { lat: -38.4161, lng: -63.6167 },
    "哥伦比亚": { lat: 4.5709, lng: -74.2973 },
    "智利": { lat: -35.6751, lng: -71.5430 },
    "澳大利亚": { lat: -25.2744, lng: 133.7751 },
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadBookData().then(() => {
        initGlobe();
        renderBookList();
        updateStats();
        initSearch();
        initModal();
    });
});

// 加载图书数据
async function loadBookData() {
    try {
        const response = await fetch('data/douban_books.json');
        bookData = await response.json();
        window.bookData = bookData;
    } catch (error) {
        bookData = [];
    }
}

// 为每本书添加随机偏移避免重叠
function addRandomOffset(books) {
    return books.map((book) => {
        const coords = countryCoords[book.country] || { lat: 0, lng: 0 };
        const seed = book.rank * 12345;
        const pseudoRandom = (seed % 1000) / 1000;
        const angle = pseudoRandom * Math.PI * 2;
        const radius = 4 + (pseudoRandom * 4);

        return {
            ...book,
            lat: coords.lat + Math.sin(angle) * radius,
            lng: coords.lng + Math.cos(angle) * radius
        };
    });
}

// 初始化 3D 地球
function initGlobe() {
    const container = document.getElementById('globe');
    if (!container || typeof Globe !== 'function') return;

    const booksWithOffset = addRandomOffset(bookData);

    // 创建 Globe 实例
    globe = Globe()(container);

    // 配置地球
    globe
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .pointsData(booksWithOffset)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointColor(d => regionColors[d.region] || '#3498db')
        .pointAltitude(0.015)
        .pointRadius(1.2)
        .pointsMerge(true)
        .pointLabel(d => `
            <div style="
                background: rgba(26, 26, 46, 0.95);
                color: white;
                padding: 12px;
                border-radius: 10px;
                font-family: 'Noto Sans SC', sans-serif;
                min-width: 180px;
                border: 1px solid ${regionColors[d.region] || '#3498db'};
            ">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">
                    ${d.title}
                </div>
                <div style="font-size: 12px; opacity: 0.9;">
                    ${d.author}
                </div>
                <div style="font-size: 11px; margin-top: 5px; color: #888;">
                    ${d.country} | ${d.year} | ⭐ ${d.rating}
                </div>
            </div>
        `)
        .onPointClick(d => {
            console.log('Point clicked:', d);
            if (d && d.rank) {
                showBookDetail(d);
                highlightBook(d.rank);
            }
        });

    // 设置初始视角
    setTimeout(() => {
        if (globe.pointOfView) {
            globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
        }
    }, 500);

    // 响应式
    window.addEventListener('resize', () => {
        if (globe.width && globe.height) {
            const section = document.querySelector('.map-section');
            globe.width(section.clientWidth);
            globe.height(section.clientHeight || 700);
        }
    });
}

// 渲染书籍列表
function renderBookList() {
    const list = document.getElementById('bookList');
    list.innerHTML = '';

    [...bookData].sort((a, b) => a.rank - b.rank).forEach(book => {
        const item = document.createElement('div');
        item.className = 'book-item';
        item.dataset.rank = book.rank;
        item.innerHTML = `
            <span class="book-rank">${book.rank}</span>
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
            <span class="book-country" style="background: ${regionColors[book.region] || '#3498db'};">${book.country}</span>
        `;

        item.addEventListener('click', () => {
            document.querySelectorAll('.book-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            focusOnBook(book);
            showBookDetail(book);
        });

        list.appendChild(item);
    });
}

// 更新统计
function updateStats() {
    document.getElementById('totalBooks').textContent = bookData.length;
    document.getElementById('totalCountries').textContent = new Set(bookData.map(b => b.country)).size;
}

// 搜索
function initSearch() {
    document.getElementById('searchInput').addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.book-item').forEach(item => {
            const t = item.querySelector('.book-title').textContent.toLowerCase();
            const a = item.querySelector('.book-author').textContent.toLowerCase();
            item.style.display = (t.includes(q) || a.includes(q)) ? 'block' : 'none';
        });
    });
}

// 聚焦书籍
function focusOnBook(book) {
    if (!globe || !globe.pointOfView) return;
    const coords = countryCoords[book.country] || { lat: 0, lng: 0 };
    const seed = book.rank * 12345;
    const r = (seed % 1000) / 1000;
    const angle = r * Math.PI * 2;
    const radius = 4 + r * 4;

    globe.pointOfView({
        lat: coords.lat + Math.sin(angle) * radius,
        lng: coords.lng + Math.cos(angle) * radius,
        altitude: 1.5
    }, 1000);
}

// 高亮
function highlightBook(rank) {
    document.querySelectorAll('.book-item').forEach(i => i.classList.remove('active'));
    const item = document.querySelector(`.book-item[data-rank="${rank}"]`);
    if (item) {
        item.classList.add('active');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 显示详情
function showBookDetail(book) {
    const modal = document.getElementById('bookModal');
    const body = document.getElementById('modalBody');

    body.innerHTML = `
        <h2>${book.title}</h2>
        <span class="book-detail-rank">#${book.rank}</span>
        <p class="book-detail-author">作者：${book.author}</p>
        <span class="book-detail-country" style="background: ${regionColors[book.region] || '#3498db'};">${book.country} | ${book.region}</span>
        <div class="book-detail-description">
            <p><strong>📅 出版年份：</strong>${book.year}</p>
            <p><strong>⭐ 评分：</strong>${book.rating}</p>
            <p><strong>📚 类别：</strong>${book.category}</p>
            <p><strong>🏢 出版社：</strong>${book.publisher}</p>
        </div>
    `;

    modal.style.display = 'block';
}

// 模态框
function initModal() {
    const modal = document.getElementById('bookModal');
    document.querySelector('.close').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
}
