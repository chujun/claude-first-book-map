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
- **详情弹窗** - 点击书籍查看详细信息（ISBN、页数、译者、定价、评价人数、作者信息等）

### 筛选功能
- **年代筛选** - 下拉框选择 + 输入框模糊匹配（如输入"90"匹配1990年代）
- **地区筛选** - 下拉框选择 + 输入框中英文模糊匹配（如输入"亚洲"或"亚"匹配亚洲）
- **国家筛选** - 下拉框选择 + 输入框模糊匹配（如输入"中国"匹配中国）
- **组合筛选** - 年代 + 地区 + 国家 + 搜索可同时生效

### 数据统计
- **书籍总数** - 414本全球经典书籍
- **国家统计** - 覆盖 20+ 个国家/地区
- **地区分布** - 欧洲、亚洲、美洲、非洲、大洋洲
- **坐标覆盖率** - 72% 书籍有精确坐标

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
├── docs/
│   └── douban-spider-architecture.md  # 豆瓣爬虫业务逻辑文档
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
| `region` | string | 按地区筛选（模糊匹配，支持中英文） |
| `category` | string | 按类别筛选 |
| `decade` | string | 按年代筛选（如"90"匹配1990年代，"2000"匹配2000年代） |
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
数据来源于**豆瓣读书**网站的真实用户数据，通过爬取获取：

1. **书籍详情页面** - 获取书名、出版社、出版时间、评分、排名、类别、译者、ISBN、页数、定价、评价人数
2. **作者页面** - 获取作者姓名、性别、出生日期、国家、出生地
3. **坐标信息** - 根据作者国家和出生地确定经纬度

> **详细业务逻辑文档**: [豆瓣爬虫架构文档](./docs/douban-spider-architecture.md)

### 数据格式

```json
{
  "id": 1,
  "rank": 1,
  "title": "红楼梦",
  "author": "曹雪芹",
  "author_gender": "男",
  "author_birth_date": "约1715年",
  "author_country": "中国",
  "author_birthplace": "北京",
  "country": "中国",
  "region": "Asia",
  "year": 2008,
  "rating": 9.7,
  "rating_count": 100000,
  "category": "小说",
  "publisher": "人民文学出版社",
  "pages": 320,
  "isbn": "9787020002207",
  "translator": "无名氏",
  "price": "¥45.00",
  "url": "https://book.douban.com/subject/1007305/",
  "lat": 39.9042,
  "lng": 116.4074
}
```

### 国家分布

| 国家 | 数量 | 地区 |
|------|------|------|
| 中国 | 128 | 亚洲 |
| 美国 | 31 | 美洲 |
| 英国 | 29 | 欧洲 |
| 日本 | 28 | 亚洲 |
| 法国 | 12 | 欧洲 |
| 意大利 | 9 | 欧洲 |
| 德国 | 9 | 欧洲 |
| 俄罗斯 | 9 | 欧洲 |
| 韩国 | 6 | 亚洲 |
| 奥地利 | 5 | 欧洲 |

## 测试覆盖

| 测试类型 | 覆盖率 |
|---------|--------|
| API 单元测试 | **98%** |
| 爬虫单元测试 | **83%** |
| E2E 测试 | 30 passed |

### API 测试覆盖

- 根端点响应
- 书籍列表（分页、筛选、排序）
- 书籍详情（200/404）
- 统计信息
- 国家/类别/地区列表
- 边界情况（无效参数、空结果）

### 爬虫测试覆盖

- 书籍详情解析
- 作者信息解析
- 坐标解析（城市/国家）
- 地区映射
- 错误处理

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**注意**: 需要 WebGL 支持才能渲染 3D 地球。

## License

ISC
