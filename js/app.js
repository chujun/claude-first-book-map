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
let currentDecade = ''; // 当前筛选的年代（下拉框）
let currentDecadeInput = ''; // 当前筛选的年代（输入框）
let currentRegion = ''; // 当前筛选的地区（下拉框）
let currentRegionInput = ''; // 当前筛选的地区（输入框）
let currentCountry = ''; // 当前筛选的国家/地区（下拉框）
let currentCountryInput = ''; // 当前筛选的国家/地区（输入框）

// API 配置 - 优先使用环境变量，否则自动检测当前主机
const API_BASE = window.API_BASE || (window.location.protocol + '//' + window.location.hostname + ':8000');

// 地区颜色映射
const regionColors = {
    "Europe": "#e74c3c",
    "Americas": "#3498db",
    "Asia": "#2ecc71",
    "Africa": "#f39c12",
    "Oceania": "#9b59b6"
};

// 地区中英文映射
const regionCNToEN = {
    "亚洲": "Asia",
    "欧洲": "Europe",
    "美洲": "Americas",
    "非洲": "Africa",
    "大洋洲": "Oceania",
    "亚": "Asia",
    "欧": "Europe",
    "美": "Americas",
    "非": "Africa",
    "大洋": "Oceania"
};

// 将中文地区名转换为英文
function normalizeRegion(value) {
    if (!value) return '';
    // 如果已经是英文，直接返回
    if (regionColors[value]) return value;
    // 查找对应的英文名
    const en = regionCNToEN[value];
    return en || value;
}

// 国家坐标映射（使用首都坐标）
const countryCoords = {
    "中国": { lat: 39.9042, lng: 116.4074 },      // 北京
    "日本": { lat: 35.6762, lng: 139.6503 },      // 东京
    "美国": { lat: 38.9072, lng: -77.0369 },      // 华盛顿
    "英国": { lat: 51.5074, lng: -0.1278 },        // 伦敦
    "法国": { lat: 48.8566, lng: 2.3522 },        // 巴黎
    "德国": { lat: 52.5200, lng: 13.4050 },       // 柏林
    "俄罗斯": { lat: 55.7558, lng: 37.6173 },      // 莫斯科
    "意大利": { lat: 41.9028, lng: 12.4964 },     // 罗马
    "西班牙": { lat: 40.4168, lng: -3.7038 },      // 马德里
    "韩国": { lat: 37.5665, lng: 126.9780 },      // 首尔
    "印度": { lat: 28.6139, lng: 77.2090 },       // 新德里
    "加拿大": { lat: 45.4215, lng: -75.6972 },    // 渥太华
    "巴西": { lat: -15.7975, lng: -47.8919 },     // 巴西利亚
    "墨西哥": { lat: 19.4326, lng: -99.1332 },    // 墨西哥城
    "阿根廷": { lat: -34.6037, lng: -58.3816 },   // 布宜诺斯艾利斯
    "哥伦比亚": { lat: 4.7110, lng: -74.0721 },    // 波哥大
    "智利": { lat: -33.4489, lng: -70.6693 },     // 圣地亚哥
    "澳大利亚": { lat: -35.2809, lng: 149.1300 },  // 堪培拉
    "丹麦": { lat: 55.6761, lng: 12.5683 },       // 哥本哈根
    "波兰": { lat: 52.2297, lng: 21.0122 },       // 华沙
    "奥地利": { lat: 48.2082, lng: 16.3738 },      // 维也纳
    "瑞典": { lat: 59.3293, lng: 18.0686 },       // 斯德哥尔摩
    "爱尔兰": { lat: 53.3498, lng: -6.2603 },     // 都柏林
    "葡萄牙": { lat: 38.7223, lng: -9.1393 },      // 里斯本
    "秘鲁": { lat: -12.0464, lng: -77.0428 },     // 利马
    "马来西亚": { lat: 3.1390, lng: 101.6869 },    // 吉隆坡
};

// 初始化应用
document.addEventListener('DOMContentLoaded', async function() {
    // 并行加载数据和非阻塞任务
    try {
        await loadBookData();
        filteredBookData = [...bookData];
        renderBookList();
        await updateStats();
        initSearch();
        initModal();
        initDecadeFilter();
        initRegionFilter();
        await initCountryFilter();
    } catch (err) {
        console.error('数据加载失败:', err);
    }

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
        // 从后端 API 获取书籍列表
        const response = await fetch(`${API_BASE}/api/books?limit=1000`);
        if (!response.ok) throw new Error('API 请求失败');
        bookData = await response.json();
        window.bookData = bookData;
    } catch (error) {
        console.warn('API 连接失败，使用本地数据:', error.message);
        // 备用：加载本地 JSON 数据
        try {
            const localResponse = await fetch('data/douban_books.json');
            bookData = await localResponse.json();
            window.bookData = bookData;
        } catch (localError) {
            bookData = [];
            throw localError;
        }
    }
}

// 加载统计信息
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        if (!response.ok) throw new Error('Stats API 请求失败');
        return await response.json();
    } catch (error) {
        console.warn('Stats API 连接失败');
        return null;
    }
}

// 加载国家列表
async function loadCountries() {
    try {
        const response = await fetch(`${API_BASE}/api/countries`);
        if (!response.ok) throw new Error('Countries API 请求失败');
        return await response.json();
    } catch (error) {
        console.warn('Countries API 连接失败');
        return null;
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

// 为每本书计算坐标，避免重叠
function addRandomOffset(books) {
    // 按坐标分组，检测重叠的书本
    const coordGroups = new Map();
    books.forEach((book, index) => {
        // 优先使用书籍的实际坐标
        let baseLat = book.lat;
        let baseLng = book.lng;

        // 如果坐标无效(0,0或null)，使用国家首都坐标
        if (!baseLat || !baseLng || (baseLat === 0 && baseLng === 0)) {
            const coords = countryCoords[book.country];
            if (coords) {
                baseLat = coords.lat;
                baseLng = coords.lng;
            } else {
                baseLat = 0;
                baseLng = 0;
            }
        }

        // 使用唯一标识符分组（同坐标的书本）
        const key = `${baseLat.toFixed(4)}_${baseLng.toFixed(4)}`;
        if (!coordGroups.has(key)) {
            coordGroups.set(key, []);
        }
        coordGroups.get(key).push({ book, index, baseLat, baseLng });
    });

    // 处理重叠：同一坐标的书本使用螺旋式分布
    const result = books.map((book, index) => {
        const coords = countryCoords[book.country] || { lat: 0, lng: 0 };
        let baseLat = book.lat;
        let baseLng = book.lng;

        if (!baseLat || !baseLng || (baseLat === 0 && baseLng === 0)) {
            baseLat = coords.lat || 0;
            baseLng = coords.lng || 0;
        }

        // 检测是否有重叠
        const key = `${baseLat.toFixed(4)}_${baseLng.toFixed(4)}`;
        const group = coordGroups.get(key);
        const groupIndex = group.findIndex(g => g.index === index);

        let finalLat = baseLat;
        let finalLng = baseLng;

        // 如果有重叠的书本，使用螺旋式偏移
        if (group.length > 1 && groupIndex > 0) {
            // 黄金角度螺旋分布，避免重叠
            const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 弧度
            const radius = 2 + groupIndex * 1.5; // 每本书向外偏移1.5度
            const angle = groupIndex * goldenAngle;

            finalLat = baseLat + Math.sin(angle) * radius;
            finalLng = baseLng + Math.cos(angle) * radius;
        }

        return {
            ...book,
            lat: finalLat,
            lng: finalLng
        };
    });

    return result;
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
        .pointAltitude(0.02)
        .pointRadius(2.0)
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
async function updateStats(useFiltered = false) {
    const totalEl = document.getElementById('totalBooks');
    const countryEl = document.getElementById('totalCountries');

    // 当使用筛选数据或 API 不可用时，使用本地计算
    if (useFiltered) {
        if (totalEl) totalEl.textContent = filteredBookData.length;
        if (countryEl) countryEl.textContent = new Set(filteredBookData.map(b => b.country)).size;
        return;
    }

    // 尝试从 API 获取统计信息
    const stats = await loadStats();
    if (stats) {
        if (totalEl) totalEl.textContent = stats.total_books;
        if (countryEl) countryEl.textContent = stats.total_countries;
    } else {
        // 备用：使用本地数据计算
        if (totalEl) totalEl.textContent = filteredBookData.length;
        if (countryEl) countryEl.textContent = new Set(filteredBookData.map(b => b.country)).size;
    }
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
    const select = document.getElementById('decadeSelect');
    const input = document.getElementById('decadeFilter');
    if (select) {
        select.addEventListener('change', e => {
            currentDecade = e.target.value;
            applyFilters();
        });
    }
    if (input) {
        input.addEventListener('input', e => {
            currentDecadeInput = e.target.value;
            applyFilters();
        });
    }
}

// 地区筛选
function initRegionFilter() {
    const select = document.getElementById('regionSelect');
    const input = document.getElementById('regionFilter');
    if (select) {
        select.addEventListener('change', e => {
            currentRegion = e.target.value;
            applyFilters();
        });
    }
    if (input) {
        input.addEventListener('input', e => {
            currentRegionInput = e.target.value;
            applyFilters();
        });
    }
}

// 国家/地区筛选
async function initCountryFilter() {
    const select = document.getElementById('countrySelect');
    const input = document.getElementById('countryFilter');
    if (!select) return;

    // 尝试从 API 获取国家列表
    const countries = await loadCountries();
    if (countries && countries.length > 0) {
        // 使用 API 返回的国家列表
        countries.forEach(c => {
            const option = document.createElement('option');
            option.value = c.country;
            option.textContent = c.country;
            select.appendChild(option);
        });
    } else {
        // 备用：从数据中获取唯一的国家列表
        const uniqueCountries = [...new Set(bookData.map(b => b.country))].sort();
        uniqueCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            select.appendChild(option);
        });
    }

    if (select) {
        select.addEventListener('change', e => {
            currentCountry = e.target.value;
            applyFilters();
        });
    }
    if (input) {
        input.addEventListener('input', e => {
            currentCountryInput = e.target.value;
            applyFilters();
        });
    }
}

// 应用所有筛选
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const q = searchInput ? searchInput.value.toLowerCase() : '';

    filteredBookData = bookData.filter(book => {
        // 年代筛选 - 下拉框优先，其次输入框模糊匹配
        const decadeValue = currentDecade || currentDecadeInput;
        if (decadeValue) {
            let decadeStart, decadeEnd;
            if (decadeValue.length === 2) {
                // "90" -> 1990-1999
                decadeStart = 1900 + parseInt(decadeValue);
            } else {
                // "1990" -> 1990-1999
                decadeStart = parseInt(decadeValue);
            }
            decadeEnd = decadeStart + 9;
            if (book.year < decadeStart || book.year > decadeEnd) {
                return false;
            }
        }
        // 地区筛选 - 下拉框优先，其次输入框模糊匹配，支持中英文
        const regionValue = normalizeRegion(currentRegion || currentRegionInput);
        if (regionValue && !book.region.includes(regionValue)) {
            return false;
        }
        // 国家筛选 - 下拉框优先，其次输入框模糊匹配
        const countryValue = currentCountry || currentCountryInput;
        if (countryValue && !book.country.includes(countryValue)) {
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
    updateStats(true);
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

    // 优先使用书籍的实际坐标
    let baseLat = book.lat;
    let baseLng = book.lng;

    // 如果坐标无效，使用国家首都坐标
    if (!baseLat || !baseLng || (baseLat === 0 && baseLng === 0)) {
        const coords = countryCoords[book.country] || { lat: 0, lng: 0 };
        baseLat = coords.lat || 0;
        baseLng = coords.lng || 0;
    }

    globe.pointOfView({
        lat: baseLat,
        lng: baseLng,
        altitude: 2
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
// HTML转义防止XSS
function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function showBookDetail(book) {
    const modal = document.getElementById('bookModal');
    const body = document.getElementById('modalBody');
    if (!modal || !body) return;

    // 安全验证 URL 只允许 http/https
    const safeUrl = book.url && (book.url.startsWith('http://') || book.url.startsWith('https://'))
        ? book.url
        : '#';

    body.innerHTML = `
        <h2>${escapeHtml(book.title)}</h2>
        <span class="book-detail-rank">#${book.rank}</span>
        <p class="book-detail-author">作者：${escapeHtml(book.author)}</p>
        <span class="book-detail-country" style="background: ${regionColors[book.region] || '#3498db'};">${escapeHtml(book.country)} | ${escapeHtml(book.region)}</span>
        <div class="book-detail-description">
            <p><strong>📅 出版年份：</strong>${escapeHtml(book.year) || '未知'}</p>
            <p><strong>⭐ 评分：</strong>${book.rating} ${book.rating_count ? '(' + escapeHtml(book.rating_count) + '人评价)' : ''}</p>
            <p><strong>💰 定价：</strong>${escapeHtml(book.price) || '未知'}</p>
            <p><strong>📚 类别：</strong>${escapeHtml(book.category) || '未知'}</p>
            <p><strong>🏢 出版社：</strong>${escapeHtml(book.publisher) || '未知'}</p>
            <p><strong>📖 页数：</strong>${escapeHtml(book.pages) || '未知'}</p>
            <p><strong>🔢 ISBN：</strong>${escapeHtml(book.isbn) || '未知'}</p>
            <p><strong>🌐 译者：</strong>${escapeHtml(book.translator) || '无'}</p>
            <hr class="detail-divider">
            <p><strong>👤 作者性别：</strong>${escapeHtml(book.author_gender) || '未知'}</p>
            <p><strong>📆 作者出生日期：</strong>${escapeHtml(book.author_birth_date) || '未知'}</p>
            <p><strong>📍 作者出生地：</strong>${escapeHtml(book.author_birthplace) || '未知'}</p>
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
