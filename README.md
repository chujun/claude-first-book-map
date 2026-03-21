# 全球书籍地图 - Global Books Globe

一个展示全球经典书籍及其对应国家/地区的 3D 交互式地图应用。

![全球书籍地图](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)

## 功能特性

### 核心功能
- **3D 地球仪展示** - 使用 Globe.gl 渲染交互式 3D 地球
- **全球 Top 414 书籍** - 展示来自全球 23 个国家/地区的经典著作
- **智能筛选** - 支持年代模糊匹配、国家/地区模糊匹配
- **实时搜索** - 按书名或作者搜索
- **详情弹窗** - 点击书籍查看详细信息

### 筛选功能
- **年代筛选** - 支持 1900-2020 年代筛选（支持模糊匹配，如"90"匹配1990年代）
- **国家/地区筛选** - 支持模糊匹配（如"中国"匹配所有包含"中国"的国家）
- **组合筛选** - 年代 + 国家 + 搜索可同时生效

### 数据统计
- **书籍总数** - 实时显示当前筛选条件下的书籍数量
- **国家统计** - 显示覆盖的国家/地区数量
- **地区分布** - 欧洲、亚洲、美洲、非洲、大洋洲

## 技术栈

| 技术 | 说明 |
|------|------|
| HTML5 + CSS3 | 前端结构与样式 |
| JavaScript (ES6+) | 应用逻辑 |
| Globe.gl | 3D 地球渲染 |
| Python | 后端 API、数据爬虫 |
| FastAPI | REST API |
| SQLite | 数据存储 |
| Playwright | E2E 测试 |
| pytest | Python 单元测试 |

## 项目结构

```
book-map/
├── index.html              # 主页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   └── app.js             # 应用逻辑
├── api/
│   └── main.py            # FastAPI 后端
├── data/
│   ├── schema.sql        # 数据库 schema
│   ├── bookmap.db        # SQLite 数据库
│   ├── douban_books.json # 书籍数据
│   ├── fetch_douban.py   # 豆瓣爬虫
│   ├── fetch_geonames.py # GeoNames 坐标获取
│   └── import_to_db.py   # 数据导入脚本
├── tests/
│   ├── test_api.py       # API 单元测试 (pytest)
│   └── book-map.spec.js  # E2E 测试 (Playwright)
├── run_api.py            # API 启动脚本
├── requirements.txt      # Python 依赖
├── playwright.config.js  # Playwright 配置
└── CLAUDE.md            # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
pip install -r requirements.txt
```

### 2. 导入数据

```bash
cd data
python import_to_db.py
```

### 3. 启动服务

```bash
# 启动后端 API (端口 8000)
python run_api.py

# 启动前端 (端口 3000)
python -m http.server 3000
```

访问 http://localhost:3000

### 4. 运行测试

```bash
# Python API 测试
python -m pytest tests/test_api.py -v

# E2E 测试
npx playwright test --project=chromium

# 测试覆盖率
python -m pytest tests/test_api.py --cov=api --cov-report=term
```

## API 文档

后端 API 提供以下端点：

### 书籍接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/books` | 获取书籍列表 |
| GET | `/api/books/{id}` | 获取书籍详情 |

#### GET /api/books 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `country` | string | 按国家筛选（模糊匹配） |
| `region` | string | 按地区筛选（模糊匹配） |
| `category` | string | 按类别筛选 |
| `decade` | string | 按年代筛选（如"90"匹配1990年代） |
| `min_rating` | float | 最低评分（0-10） |
| `limit` | int | 返回数量（默认100，最大1000） |
| `offset` | int | 偏移量（默认0） |
| `sort_by` | string | 排序字段：`rank`, `rating`, `year`, `title` |
| `order` | string | 排序方向：`asc`, `desc` |

#### 示例

```bash
# 获取所有书籍
curl http://localhost:8000/api/books

# 筛选中国书籍
curl http://localhost:8000/api/books?country=中国

# 筛选1990年代书籍
curl http://localhost:8000/api/books?decade=90

# 筛选亚洲书籍（模糊匹配）
curl http://localhost:8000/api/books?region=Asia

# 按评分排序
curl "http://localhost:8000/api/books?sort_by=rating&order=desc&limit=10"
```

### 统计接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取统计信息 |
| GET | `/api/countries` | 获取国家列表 |
| GET | `/api/categories` | 获取类别列表 |
| GET | `/api/regions` | 获取地区列表 |

## 数据说明

### 数据来源
数据来源于**豆瓣读书**网站的真实用户数据，通过爬取以下页面获取：

1. **豆瓣 Top 250** - https://book.douban.com/top250
2. **豆瓣标签页** - https://book.douban.com/tag/小说、文学

### 数据格式

```json
{
  "id": 1,
  "rank": 1,
  "title": "红楼梦",
  "author": "曹雪芹 著",
  "country": "中国",
  "countryCode": "CN",
  "region": "Asia",
  "year": 2010,
  "rating": 9.7,
  "category": "小说",
  "publisher": "豆瓣",
  "url": "https://book.douban.com/subject/1007305/",
  "lat": 35.8617,
  "lng": 104.1954
}
```

### 国家分布

| 国家 | 数量 | 地区 |
|------|------|------|
| 中国 | 260 | 亚洲 |
| 英国 | 40 | 欧洲 |
| 日本 | 36 | 亚洲 |
| 法国 | 13 | 欧洲 |
| 德国 | 9 | 欧洲 |
| 意大利 | 8 | 欧洲 |
| 俄罗斯 | 7 | 欧洲 |
| 韩国 | 7 | 亚洲 |
| 哥伦比亚 | 5 | 美洲 |
| 奥地利 | 5 | 欧洲 |

## 测试覆盖

| 测试类型 | 覆盖率 |
|---------|--------|
| API 单元测试 | **98%** |
| E2E 测试 | 35 passed |

### API 测试覆盖

- 根端点响应
- 书籍列表（分页、筛选、排序）
- 书籍详情（200/404）
- 统计信息
- 国家/类别/地区列表
- 边界情况（无效参数、空结果）

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**注意**: 需要 WebGL 支持才能渲染 3D 地球。

## License

ISC
