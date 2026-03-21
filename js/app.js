// 全球书籍地图应用
// 使用 Globe.gl 实现 3D 地球仪

// 抑制 Globe.gl 的 THREE.Clock 弃用警告
const originalWarn = console.warn;
console.warn = function(...args) {
    if (args[0] && args[0].toString().includes('THREE.Clock')) return;
    originalWarn.apply(console, args);
};

// 全局变量
let globe;
let bookData = [];
let filteredBookData = []; // 筛选后的数据
let currentDecade = 'all'; // 当前筛选的年代
let currentCountry = 'all'; // 当前筛选的国家/地区

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
    // 并行加载数据和非阻塞任务
    const dataPromise = loadBookData();

    // 先渲染列表（不依赖 Globe）
    dataPromise.then(() => {
        filteredBookData = [...bookData];
        renderBookList();
        updateStats();
        initSearch();
        initModal();
        initDecadeFilter();
        initCountryFilter();
    }).catch(err => {
        console.error('数据加载失败:', err);
    });

    // 地球在后台懒加载（不阻塞UI）
    loadGlobeLazy();
});

// 懒加载 Globe.gl - 后台异步加载
function loadGlobeLazy() {
    // 显示加载提示
    const container = document.getElementById('globe');
    if (container) {
        container.innerHTML = '<div class="globe-loading">🌍 地球加载中...</div>';
    }

    // 动态加载 Globe.gl (本地版本)
    const script = document.createElement('script');
    script.src = 'vendor/globe.gl.js';
    script.onload = () => {
        try {
            initGlobe();
        } catch (e) {
            console.warn('3D 地球初始化失败:', e.message);
            showGlobeError();
        }
    };
    script.onerror = () => {
        showGlobeError();
    };
    document.head.appendChild(script);
}

// 加载图书数据
async function loadBookData() {
    try {
        const response = await fetch('data/douban_books.json');
        bookData = await response.json();
        window.bookData = bookData;
    } catch (error) {
        bookData = [];
        throw error;
    }
}

// 显示地球错误提示
function showGlobeError() {
    const container = document.getElementById('globe');
    if (container) {
        container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #a0a0b0;
                text-align: center;
                padding: 20px;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🌍</div>
                <div style="font-size: 18px; margin-bottom: 10px;">3D 地图加载失败</div>
                <div style="font-size: 14px;">
                    您的浏览器不支持 WebGL<br>
                    请使用现代浏览器（Chrome/Edge/Firefox）<br>
                    或启用硬件加速
                </div>
            </div>
        `;
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
    if (!container || typeof Globe !== 'function') {
        throw new Error('Globe.gl 未加载');
    }

    const booksWithOffset = addRandomOffset(filteredBookData);

    // 创建 Globe 实例
    globe = Globe()(container);

    // 设置地球尺寸匹配容器
    const rect = container.getBoundingClientRect();
    globe.width(rect.width).height(rect.height);

    // 配置地球 (使用本地图片资源)
    globe
        .globeImageUrl('images/earth-blue-marble.jpg')
        .bumpImageUrl('images/earth-topology.png')
        .backgroundImageUrl('images/night-sky.png')
        .pointsData(booksWithOffset)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointColor(d => regionColors[d.region] || '#3498db')
        .pointAltitude(0.015)
        .pointRadius(1.2)
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
            if (d && d.rank) {
                showBookDetail(d);
                highlightBook(d.rank);
            }
        });

    // 设置初始视角
    setTimeout(() => {
        if (globe && globe.pointOfView) {
            globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
        }
    }, 500);
}

// 渲染书籍列表
function renderBookList() {
    const list = document.getElementById('bookList');
    if (!list) return;

    list.innerHTML = '';

    [...filteredBookData].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).forEach(book => {
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
    const totalEl = document.getElementById('totalBooks');
    const countryEl = document.getElementById('totalCountries');
    if (totalEl) totalEl.textContent = filteredBookData.length;
    if (countryEl) countryEl.textContent = new Set(filteredBookData.map(b => b.country)).size;
}

// 搜索
function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', () => {
        applyFilters();
    });
}

// 年代筛选
function initDecadeFilter() {
    const select = document.getElementById('decadeFilter');
    if (!select) return;
    select.addEventListener('change', e => {
        currentDecade = e.target.value;
        applyFilters();
    });
}

// 国家/地区筛选
function initCountryFilter() {
    const select = document.getElementById('countryFilter');
    if (!select) return;

    // 从数据中获取唯一的国家列表
    const countries = [...new Set(bookData.map(b => b.country))].sort();
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        select.appendChild(option);
    });

    select.addEventListener('change', e => {
        currentCountry = e.target.value;
        applyFilters();
    });
}

// 应用所有筛选
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const q = searchInput ? searchInput.value.toLowerCase() : '';

    filteredBookData = bookData.filter(book => {
        // 年代筛选
        if (currentDecade !== 'all') {
            const decadeStart = parseInt(currentDecade);
            const decadeEnd = decadeStart + 9;
            if (book.year < decadeStart || book.year > decadeEnd) {
                return false;
            }
        }
        // 国家/地区筛选
        if (currentCountry !== 'all' && book.country !== currentCountry) {
            return false;
        }
        // 搜索筛选
        if (q) {
            const titleMatch = book.title.toLowerCase().includes(q);
            const authorMatch = book.author.toLowerCase().includes(q);
            if (!titleMatch && !authorMatch) {
                return false;
            }
        }
        return true;
    });

    renderBookList();
    updateStats();
    updateGlobe();
}

// 更新地球标记
function updateGlobe() {
    if (!globe) return;
    const booksWithOffset = addRandomOffset(filteredBookData);
    globe.pointsData(booksWithOffset);
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
    if (!modal || !body) return;

    // 安全验证 URL 只允许 http/https
    const safeUrl = book.url && (book.url.startsWith('http://') || book.url.startsWith('https://'))
        ? book.url
        : '#';

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
            <p><strong>🔗 豆瓣链接：</strong><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">在豆瓣查看</a></p>
        </div>
    `;

    modal.style.display = 'block';
}

// 模态框
function initModal() {
    const modal = document.getElementById('bookModal');
    const closeBtn = document.querySelector('.close');
    if (!modal || !closeBtn) return;

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
}
