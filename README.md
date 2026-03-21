# 全球书籍地图 - Global Books Globe

一个展示全球经典书籍及其对应国家/地区的 3D 交互式地图应用。

![全球书籍地图](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)

## 功能特性

### 核心功能
- **3D 地球仪展示** - 使用 Globe.gl 渲染交互式 3D 地球
- **全球 Top 1000 书籍** - 展示来自全球 11 个国家/地区的经典著作
- **智能筛选** - 支持按年代、国家/地区筛选
- **实时搜索** - 按书名或作者搜索
- **详情弹窗** - 点击书籍查看详细信息

### 筛选功能
- **年代筛选** - 支持 1900-2020 年代筛选
- **国家/地区筛选** - 从数据动态生成的国家列表
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
| Python | 数据爬虫与生成 |
| Playwright | E2E 测试 |

## 项目结构

```
book-map/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   └── app.js         # 应用逻辑
├── data/
│   ├── douban_books.json  # 书籍数据 (1000本)
│   ├── scraper.py        # 数据爬虫
│   ├── test_scraper.py   # 单元测试
│   └── generate_books.py # 数据生成脚本
├── tests/
│   └── book-map.spec.js  # E2E 测试
├── playwright.config.js  # Playwright 配置
└── CLAUDE.md            # 项目说明
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

访问 http://localhost:8080

### 运行测试

```bash
# E2E 测试
npx playwright test

# 单元测试
cd data && python3 -m pytest test_scraper.py -v
```

## 数据说明

### 数据来源
数据来源于**豆瓣读书**网站的真实用户数据，通过爬取以下页面获取：

1. **豆瓣 Top 250** - https://book.douban.com/top250
   - 豆瓣用户评分最高的 250 本书籍
   - 包含中外经典文学

2. **豆瓣标签页** - https://book.douban.com/tag/小说、文学
   - 按标签分类的书籍列表
   - 反映中国读者的阅读趋势

### 数据获取逻辑

```python
# 伪代码展示数据获取流程
def fetch_douban_books():
    books = []
    # 1. 爬取豆瓣 Top250 (10页，每页25本)
    for page in range(10):
        url = f"https://book.douban.com/top250?start={page*25}"
        html = requests.get(url)
        books.extend(parse_books(html))

    # 2. 爬取标签页
    for tag in ['小说', '文学']:
        for page in range(10):
            url = f"https://book.douban.com/tag/{tag}?start={page*18}"
            html = requests.get(url)
            books.extend(parse_books(html))

    # 3. 解析作者国家前缀 [美][英][法][日]等
    for book in books:
        book['country'] = parse_country_from_author(book['author'])

    # 4. 清理数据，去重
    books = deduplicate(books)
    return books
```

### 国家检测规则

作者名中的国家前缀格式：
| 前缀格式 | 国家 |
|---------|------|
| `[清]` `[明]` `[宋]` | 中国 |
| `[美]` `【美】` | 美国 |
| `[英]` | 英国 |
| `[法]` | 法国 |
| `[德]` | 德国 |
| `[日]` | 日本 |
| `[俄]` | 俄罗斯 |
| `[意]` | 意大利 |
| `[丹]` `（丹麦）` | 丹麦 |
| `[哥伦]` | 哥伦比亚 |

**注意**：豆瓣上的书籍主要是中国读者阅读和评分的外文翻译作品，因此美国、英国、法国等西方国家书籍占比较高，这真实反映了豆瓣读书的用户阅读偏好。

### 数据格式

```json
{
  "rank": 1,
  "title": "红楼梦",
  "author": "曹雪芹",
  "country": "中国",
  "countryCode": "CN",
  "region": "Asia",
  "year": 1791,
  "rating": 9.6,
  "category": "小说",
  "publisher": "人民文学出版社",
  "lat": 37.42,
  "lng": 113.92
}
```

### 国家分布

> 以下数据反映豆瓣用户的阅读偏好，包含大量被翻译引进的外国文学作品。

| 国家/地区 | 数量 | 说明 |
|----------|------|------|
| 美国 | 319 | 科幻、推理、经典文学翻译作品 |
| 中国 | 40 | 本土华语文学 |
| 英国 | 21 | 经典英美文学 |
| 日本 | 10 | 日本文学翻译作品 |
| 法国 | 6 | 法国文学翻译作品 |
| 意大利 | 5 | 意大利文学翻译作品 |
| 俄罗斯 | 4 | 俄国文学翻译作品 |
| 德国 | 4 | 德国文学翻译作品 |
| 哥伦比亚 | 3 | 拉美文学代表 |
| 丹麦 | 1 | 安徒生童话 |
| 韩国 | 1 | 韩国文学 |

## 开发指南

### 添加新功能

1. 在 `features.json` 中添加功能描述
2. 使用 TDD 流程开发
3. 运行测试确保通过
4. 更新 `features.json` 中的 `passes` 字段

### 添加新书籍

编辑 `data/scraper.py` 中的作者/国家映射，运行爬虫生成新数据。

## 测试覆盖

| 测试类型 | 覆盖内容 |
|---------|---------|
| 页面加载 | 标题、元素存在 |
| 数据加载 | 图书数据、统计 |
| 3D 地球 | Globe 容器、Canvas |
| 详情弹窗 | 打开/关闭 |
| 搜索功能 | 书名搜索、清空 |
| 年代筛选 | 筛选/清空/组合 |
| 国家筛选 | 筛选/清空/组合 |
| 控制台 | 无 JS 错误 |

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**注意**: 需要 WebGL 支持才能渲染 3D 地球。

## License

ISC
