// 全球书籍地图应用
// 使用 Leaflet.js 实现交互式地图

// 全局变量
let map;
let markers = [];
let activeMarker = null;

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    renderBookList();
    updateStats();
    initSearch();
    initModal();
});

// 初始化地图
function initMap() {
    // 创建地图，初始中心为中国
    map = L.map('map', {
        center: [30, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        worldCopyJump: true
    });

    // 添加瓦片图层 - 使用多种地图样式
    const baseLayers = {
        'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }),
        'CartoDB Positron': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB',
            maxZoom: 19
        }),
        'CartoDB Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB',
            maxZoom: 19
        })
    };

    // 默认使用 CartoDB Positron
    baseLayers['CartoDB Positron'].addTo(map);

    // 添加图层控制
    L.control.layers(baseLayers, null, {
        position: 'topright'
    }).addTo(map);

    // 添加标记点
    addBookMarkers();

    // 地图点击事件
    map.on('click', function(e) {
        closeModal();
    });
}

// 添加书籍标记点
function addBookMarkers() {
    bookData.forEach(book => {
        // 为没有坐标的书籍使用国家中心坐标
        if (!book.lat || !book.lng) {
            const center = getCountryCenter(book.countryCode);
            book.lat = center.lat;
            book.lng = center.lng;
        }

        // 创建自定义标记图标
        const markerIcon = createMarkerIcon(book.region, book.rank);

        // 创建标记
        const marker = L.marker([book.lat, book.lng], {
            icon: markerIcon,
            title: book.title
        });

        // 绑定弹出框
        const popupContent = createPopupContent(book);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });

        // 标记点击事件
        marker.on('click', function() {
            activeMarker = marker;
            highlightBook(book.rank);
            showBookDetail(book);
        });

        marker.addTo(map);
        markers.push({ marker, book });
    });
}

// 创建自定义标记图标
function createMarkerIcon(region, rank) {
    const color = regionColors[region] || '#3498db';

    return L.divIcon({
        className: 'custom-marker-wrapper',
        html: `
            <div class="marker-container" style="
                width: 32px;
                height: 32px;
                position: relative;
            ">
                <div style="
                    width: 32px;
                    height: 32px;
                    background: ${color};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 700;
                    color: white;
                    transform: ${rank % 2 === 0 ? 'rotate(180deg)' : 'rotate(0deg)'};
                ">
                    ${rank}
                </div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20]
    });
}

// 创建弹出框内容
function createPopupContent(book) {
    return `
        <div class="popup-content" style="font-family: 'Noto Sans SC', sans-serif; min-width: 200px;">
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                color: white;
                padding: 12px;
                margin: -12px -12px 12px -12px;
                border-radius: 8px 8px 0 0;
            ">
                <span style="
                    display: inline-block;
                    background: white;
                    color: ${regionColors[book.region]};
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 24px;
                    font-weight: 700;
                    font-size: 12px;
                    margin-right: 8px;
                ">${book.rank}</span>
                <strong style="font-size: 14px;">${book.title}</strong>
            </div>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                <strong>作者：</strong>${book.author}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                <strong>国家：</strong><span style="
                    display: inline-block;
                    background: ${regionColors[book.region]};
                    color: white;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                ">${book.country}</span>
            </p>
            <p style="margin: 0; font-size: 12px; color: #888;">
                <strong>出版：</strong>${book.year > 0 ? book.year : Math.abs(book.year) + ' BC'}
            </p>
        </div>
    `;
}

// 渲染书籍列表
function renderBookList() {
    const bookListEl = document.getElementById('bookList');
    bookListEl.innerHTML = '';

    // 按排名排序
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
            // 移除其他高亮
            document.querySelectorAll('.book-item').forEach(item => {
                item.classList.remove('active');
            });
            bookItem.classList.add('active');

            // 定位到地图标记
            focusOnBook(book);

            // 显示详情
            showBookDetail(book);
        });

        bookListEl.appendChild(bookItem);
    });
}

// 更新统计信息
function updateStats() {
    // 书籍总数
    document.getElementById('totalBooks').textContent = bookData.length;

    // 国家/地区数
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
    // 找到对应的标记
    const markerData = markers.find(m => m.book.rank === book.rank);
    if (markerData) {
        // 移动地图到标记位置
        map.setView([book.lat, book.lng], 5, {
            animate: true,
            duration: 1
        });

        // 打开弹出框
        markerData.marker.openPopup();
    }
}

// 高亮书籍列表项
function highlightBook(rank) {
    // 移除其他高亮
    document.querySelectorAll('.book-item').forEach(item => {
        item.classList.remove('active');
    });

    // 添加高亮
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
            <p><strong>出版年份：</strong>${book.year > 0 ? book.year : Math.abs(book.year) + ' 年前'}</p>
            <p><strong>文学类别：</strong>${getCategoryName(book.category)}</p>
            <hr style="margin: 1rem 0; border: none; border-top: 1px solid #eee;">
            <p>${book.description}</p>
        </div>
    `;

    modal.style.display = 'block';
}

// 获取类别中文名称
function getCategoryName(category) {
    const categoryNames = {
        'novel': '小说',
        'dystopia': '反乌托邦',
        'fantasy': '奇幻',
        'philosophical': '哲学',
        'adventure': '冒险',
        'children': '儿童文学',
        'satire': '讽刺',
        'short-stories': '短篇小说',
        'magical-realism': '魔幻现实主义',
        'historical': '历史',
        'epic': '史诗',
        'science-fiction': '科幻',
        'psychological': '心理',
        'drama': '戏剧',
        'poetry': '诗歌',
        'gothic': '哥特',
        'horror': '恐怖',
        'young-adult': '青少年文学',
        'mystery': '悬疑',
        'memoir': '回忆录'
    };
    return categoryNames[category] || category;
}

// 初始化模态框
function initModal() {
    const modal = document.getElementById('bookModal');
    const closeBtn = document.querySelector('.close');

    closeBtn.addEventListener('click', closeModal);

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('bookModal');
    modal.style.display = 'none';
}

// 添加一些CSS样式到页面
const style = document.createElement('style');
style.textContent = `
    .custom-popup .leaflet-popup-content-wrapper {
        border-radius: 12px;
        padding: 0;
        overflow: hidden;
    }

    .custom-popup .leaflet-popup-content {
        margin: 0;
    }

    .custom-popup .leaflet-popup-tip {
        background: white;
    }

    .marker-container {
        transition: transform 0.2s;
    }

    .marker-container:hover {
        transform: scale(1.2);
    }

    .book-item {
        border-left: 4px solid transparent;
    }

    .book-item.active {
        border-left-color: #3498db;
        background: #f5f7fa;
    }
`;
document.head.appendChild(style);
