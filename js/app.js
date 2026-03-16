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
        try {
            initGlobe();
        } catch (e) {
            console.error('Globe 初始化失败:', e);
        }
        renderBookList();
        updateStats();
        initSearch();
        initModal();
    }).catch(err => {
        console.error('数据加载失败:', err);
    });
});

// 加载图书数据
async function loadBookData() {
    try {
        const response = await fetch('data/douban_books.json');
        bookData = await response.json();
        window.bookData = bookData;
        console.log(`已加载 ${bookData.length} 本图书数据`);
    } catch (error) {
        console.error('加载图书数据失败:', error);
        bookData = [];
    }
}

// 为每本书添加微小的随机偏移，避免重叠
function addRandomOffset(books) {
    return books.map((book, index) => {
        const coords = countryCoords[book.country] || { lat: 0, lng: 0 };
        // 基于索引生成伪随机偏移，确保同一本书位置固定
        const seed = book.rank * 12345;
        const pseudoRandom = (seed % 1000) / 1000;

        // 计算偏移：使用泊松盘采样类似的算法
        const angle = pseudoRandom * Math.PI * 2;
        const radius = 2 + (pseudoRandom * 3); // 2-5度范围

        return {
            ...book,
            lat: coords.lat + Math.sin(angle) * radius,
            lng: coords.lng + Math.cos(angle) * radius
        };
    });
}

// 初始化 3D 地球
function initGlobe() {
    const globeContainer = document.getElementById('globe');
    if (!globeContainer) {
        console.error('找不到地球容器 #globe');
        return;
    }

    // 为书籍添加偏移避免重叠
    const booksWithOffset = addRandomOffset(bookData);

    // 创建国家聚合点数据
    const booksByCountry = {};
    bookData.forEach(book => {
        const country = book.country;
        if (!booksByCountry[country]) {
            booksByCountry[country] = [];
        }
        booksByCountry[country].push(book);
    });

    const countryPoints = Object.keys(booksByCountry).map(country => {
        const coords = countryCoords[country] || { lat: 0, lng: 0 };
        const books = booksByCountry[country];
        return {
            lat: coords.lat,
            lng: coords.lng,
            country: country,
            bookCount: books.length,
            allBooks: books
        };
    }).filter(p => p.lat !== 0);

    // 使用 Globe.gl 创建 3D 地球
    globe = Globe()
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .pointsData(booksWithOffset)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointColor(d => regionColors[d.region] || '#3498db')
        .pointAltitude(0.02)
        .pointRadius(d => Math.max(0.3, Math.min(0.8, 8 / Math.sqrt(bookData.length))))
        .pointsMerge(true)
        .pointLabel(d => {
            return `
                <div style="
                    background: rgba(26, 26, 46, 0.95);
                    color: white;
                    padding: 12px;
                    border-radius: 10px;
                    font-family: 'Noto Sans SC', sans-serif;
                    min-width: 180px;
                    border: 1px solid ${regionColors[d.region] || '#3498db'};
                ">
                    <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: ${regionColors[d.region]};">
                        📖 ${d.title}
                    </div>
                    <div style="font-size: 12px; opacity: 0.9;">
                        ✍️ ${d.author}
                    </div>
                    <div style="font-size: 11px; margin-top: 5px; color: #888;">
                        🌍 ${d.country} | ${d.year} | ⭐ ${d.rating}
                    </div>
                </div>
            `;
        })
        .onPointClick(d => {
            showBookDetail(d);
            highlightBook(d.rank);
        })
        .enablePointerInteraction(true);

    // 将地球添加到容器
    globe(globeContainer);

    // 设置初始视角
    setTimeout(() => {
        if (globe && globe.pointOfView) {
            globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
        }
    }, 100);

    // 调整画布大小
    resizeGlobe();
    window.addEventListener('resize', resizeGlobe);
}

// 调整地球大小
function resizeGlobe() {
    const container = document.querySelector('.map-section');
    const width = container.clientWidth;
    const height = container.clientHeight || 700;
    if (globe && globe.width && globe.height) {
        globe.width(width);
        globe.height(height);
    }
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
            <span class="book-country" style="background: ${regionColors[book.region] || '#3498db'};">${book.country}</span>
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
    // 计算偏移后的位置
    const coords = countryCoords[book.country] || { lat: 0, lng: 0 };
    const seed = book.rank * 12345;
    const pseudoRandom = (seed % 1000) / 1000;
    const angle = pseudoRandom * Math.PI * 2;
    const radius = 2 + (pseudoRandom * 3);

    if (globe && globe.pointOfView) {
        globe.pointOfView({
            lat: coords.lat + Math.sin(angle) * radius,
            lng: coords.lng + Math.cos(angle) * radius,
            altitude: 1.5
        }, 1000);
    }
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
        <span class="book-detail-country" style="background: ${regionColors[book.region] || '#3498db'};">${book.country} | ${book.region}</span>
        <div class="book-detail-description">
            <p><strong>📅 出版年份：</strong>${book.year}</p>
            <p><strong>⭐ 评分：</strong>${book.rating}</p>
            <p><strong>📚 类别：</strong>${book.category}</p>
            <p><strong>🏢 出版社：</strong>${book.publisher}</p>
            <hr style="margin: 1rem 0; border: none; border-top: 1px solid #333;">
            <p style="font-size: 12px; color: #888;">点击地图上的书籍标记可查看其他书籍信息</p>
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
