#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
豆瓣图书数据爬虫
从豆瓣获取全球书籍前100名数据
"""

import requests
import json
import time
import random
import re
from typing import List, Dict, Optional, Tuple


class DoubanScraper:
    """豆瓣图书爬虫"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })
        self.book_list: List[Dict] = []

    def fetch_top_books(self, total: int = 100) -> List[Dict]:
        """获取豆瓣Top图书"""
        all_books = []
        page_size = 20

        for start in range(0, total, page_size):
            url = f"https://book.douban.com/top250"
            params = {'start': start}

            try:
                response = self.session.get(url, params=params, timeout=10)
                response.raise_for_status()
                response.encoding = 'utf-8'

                books = self.parse_book_list(response.text, start // page_size + 1)
                all_books.extend(books)

                time.sleep(random.uniform(1, 2))

            except requests.RequestException as e:
                print(f"请求失败 (start={start}): {e}")
                continue

        return all_books

    def parse_book_list(self, html: str, page: int) -> List[Dict]:
        """解析图书列表页面"""
        books = []

        # 匹配图书项
        pattern = r'<tr class="item">.*?<a href="([^"]+)"[^>]*title="([^"]+)"[^>]*>.*?<p class="pl">([^<]+)</p>.*?<span class="rating_nums">([^<]+)</span>'

        matches = re.findall(pattern, html, re.DOTALL)

        for i, match in enumerate(matches):
            url, title, info, rating = match

            # 解析作者/出版社/年份
            info_parts = info.split('/')
            author = info_parts[0].strip() if info_parts else "未知"

            # 提取年份
            year_match = re.search(r'\b(19|20)\d{2}\b', info)
            year = int(year_match.group()) if year_match else 2000

            # 出版社
            publisher = info_parts[-1].strip() if len(info_parts) > 1 else "未知出版社"

            # 检测国家
            country, country_code, region = detect_country(author, title)

            book = {
                "title": title.strip(),
                "author": author,
                "country": country,
                "countryCode": country_code,
                "region": region,
                "year": year,
                "rating": float(rating),
                "publisher": publisher,
                "url": url,
                "source": "douban"
            }

            books.append(book)

        return books

    def fetch_book_details(self, book_id: str) -> Optional[Dict]:
        """获取图书详情"""
        url = f"https://book.douban.com/subject/{book_id}/"

        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            response.encoding = 'utf-8'

            # 解析详情页获取更多信息
            html = response.text

            # 提取 ISBN
            isbn_match = re.search(r'ISBN[:\s]*(\d{13}|\d{10})', html)
            isbn = isbn_match.group(1) if isbn_match else ""

            # 提取类别
            category_match = re.search(r'展开全部.*?<a[^>]*>([^<]+)</a>', html, re.DOTALL)
            category = category_match.group(1).strip() if category_match else "小说"

            return {"isbn": isbn, "category": category}

        except requests.RequestException:
            return None


def validate_book_data(book: Dict) -> bool:
    """验证图书数据完整性"""
    required_fields = ['title', 'author', 'country', 'rating', 'year']

    for field in required_fields:
        if field not in book or not book[field]:
            return False

    # 验证评分范围
    if not (0 <= book['rating'] <= 10):
        return False

    # 验证年份范围
    if not (1700 <= book['year'] <= 2026):
        return False

    return True


def detect_country(author: str, context: str = "") -> Tuple[str, str, str]:
    """根据作者和上下文检测国家/地区"""

    text = author + " " + context

    # 中国作者
    chinese_names = [
        "曹雪芹", "施耐庵", "吴承恩", "罗贯中", "孔子", "孟子", "庄子", "老子",
        "司马迁", "司马光", "鲁迅", "沈从文", "张爱玲", "巴金", "老舍", "茅盾",
        "余华", "路遥", "钱钟书", "王小波", "刘慈欣", "金庸", "万历十五年", "明朝那些事儿",
        "红楼梦", "水浒传", "西游记", "三国演义", "围城", "活着", "平凡的世界",
        "城南旧事", "呼兰河传", "askar"
    ]
    for name in chinese_names:
        if name in text:
            return ("中国", "CN", "Asia")

    # 日本作者
    japanese_names = [
        "村上春树", "东野圭吾", "川端康成", "三岛由纪夫", "芥川龙之介", "夏目漱石",
        "太宰治", "宫泽贤治", "紫式部", "横光利雄", "安部公房", "大江健三郎",
        "夏目漱石", "松本清张", "森鸥外"
    ]
    for name in japanese_names:
        if name in text:
            return ("日本", "JP", "Asia")

    # 美国作者
    american_names = [
        "海明威", "菲茨杰拉德", "福克纳", "塞林格", "纳博科夫", "玛格丽特·米切尔",
        "哈珀·李", "斯坦贝克", "约瑟夫·海勒", "冯内古特", "艾里森", "莫里森",
        "福克纳", "德莱塞", "欧文", "凯鲁亚克", "塞林格", "品钦", "德里罗"
    ]
    for name in american_names:
        if name in text:
            return ("美国", "US", "Americas")

    # 英国作者
    british_names = [
        "莎士比亚", "奥斯汀", "狄更斯", "勃朗特", "王尔德", "乔伊斯", "毛姆",
        "奥威尔", "托尔金", "沃尔夫", "康拉德", "格林", "品特", "贝克特"
    ]
    for name in british_names:
        if name in text:
            return ("英国", "GB", "Europe")

    # 法国作者
    french_names = [
        "雨果", "大仲马", "小仲马", "福楼拜", "普鲁斯特", "加缪", "萨特",
        "圣埃克苏佩里", "波德莱尔", "莫泊桑", "左拉", "巴尔扎克", "司汤达"
    ]
    for name in french_names:
        if name in text:
            return ("法国", "FR", "Europe")

    # 德国作者
    german_names = [
        "歌德", "卡夫卡", "黑塞", "托马斯·曼", "雷马克", "格林兄弟", "席勒", "荷尔德林"
    ]
    for name in german_names:
        if name in text:
            return ("德国", "DE", "Europe")

    # 俄罗斯作者
    russian_names = [
        "托尔斯泰", "陀思妥耶夫斯基", "普希金", "果戈理", "布尔加科夫",
        "帕斯捷尔纳克", "肖洛霍夫", "高尔基", "契诃夫", "屠格涅夫"
    ]
    for name in russian_names:
        if name in text:
            return ("俄罗斯", "RU", "Europe")

    # 拉美作者
    latin_names = [
        "马尔克斯", "博尔赫斯", "波拉尼奥", "富恩特斯", "阿连德", "科塔萨尔", "鲁尔福"
    ]
    for name in latin_names:
        if name in text:
            return ("哥伦比亚", "CO", "Americas")

    # 印度作者
    indian_names = ["泰戈尔", "阿米尔·汗"]
    for name in indian_names:
        if name in text:
            return ("印度", "IN", "Asia")

    # 西班牙作者
    spanish_names = ["塞万提斯", "马尔克斯"]  # 注意：马尔克斯实际是哥伦比亚
    for name in spanish_names:
        if name in text:
            return ("西班牙", "ES", "Europe")

    return ("美国", "US", "Americas")  # 默认


def export_to_json(books: List[Dict], filename: str) -> None:
    """导出数据到JSON文件"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(books, f, ensure_ascii=False, indent=2)


def add_coordinates(books: List[Dict]) -> List[Dict]:
    """为图书添加坐标"""
    import math

    country_coords = {
        "中国": (35.8617, 104.1954),
        "日本": (36.2048, 138.2529),
        "美国": (37.0902, -95.7129),
        "英国": (55.3781, -3.4360),
        "法国": (46.2276, 2.2137),
        "德国": (51.1657, 10.4515),
        "俄罗斯": (61.5240, 105.3188),
        "意大利": (41.8719, 12.5674),
        "西班牙": (40.4637, -3.7492),
        "哥伦比亚": (4.5709, -74.2973),
        "印度": (20.5937, 78.9629),
    }

    for i, book in enumerate(books):
        base_coords = country_coords.get(book.get("country", ""), (0, 0))
        # 添加基于排名的伪随机偏移避免重叠
        seed = book.get("rank", i) * 12345
        pseudo_random = (seed % 1000) / 1000
        angle = pseudo_random * 2 * math.pi
        radius = 3 + pseudo_random * 3

        book["lat"] = base_coords[0] + math.sin(angle) * radius
        book["lng"] = base_coords[1] + math.cos(angle) * radius

    return books


def scrape_and_save(output_file: str = "douban_books.json", total: int = 100) -> List[Dict]:
    """爬取并保存数据"""
    scraper = DoubanScraper()

    print(f"开始爬取豆瓣图书 Top {total}...")
    books = scraper.fetch_top_books(total)

    if not books:
        print("警告: 未能获取数据，使用备用方案")
        books = get_fallback_data()

    # 添加排名
    for i, book in enumerate(books, 1):
        book["rank"] = i

    # 添加坐标
    books = add_coordinates(books)

    # 验证数据
    valid_books = [b for b in books if validate_book_data(b)]
    print(f"获取到 {len(books)} 本书，验证通过 {len(valid_books)} 本")

    # 导出
    export_to_json(valid_books, output_file)
    print(f"数据已保存到 {output_file}")

    return valid_books


def get_fallback_data() -> List[Dict]:
    """获取备用数据（当网络不可用时）"""
    return [
        {"rank": 1, "title": "红楼梦", "author": "曹雪芹", "country": "中国", "countryCode": "CN", "region": "Asia", "year": 1791, "rating": 9.6, "category": "小说", "publisher": "人民文学出版社", "url": "https://book.douban.com/subject/1000001/"},
        {"rank": 2, "title": "活着", "author": "余华", "country": "中国", "countryCode": "CN", "region": "Asia", "year": 1993, "rating": 9.4, "category": "小说", "publisher": "作家出版社", "url": "https://book.douban.com/subject/1000002/"},
        {"rank": 3, "title": "百年孤独", "author": "加西亚·马尔克斯", "country": "哥伦比亚", "countryCode": "CO", "region": "Americas", "year": 1967, "rating": 9.3, "category": "小说", "publisher": "南海出版公司", "url": "https://book.douban.com/subject/1000003/"},
        {"rank": 4, "title": "挪威的森林", "author": "村上春树", "country": "日本", "countryCode": "JP", "region": "Asia", "year": 1987, "rating": 9.0, "category": "小说", "publisher": "上海译文出版社", "url": "https://book.douban.com/subject/1000004/"},
        {"rank": 5, "title": "追风筝的人", "author": "卡勒德·胡赛尼", "country": "美国", "countryCode": "US", "region": "Americas", "year": 2003, "rating": 9.2, "category": "小说", "publisher": "上海人民出版社", "url": "https://book.douban.com/subject/1000005/"},
    ]


if __name__ == "__main__":
    import sys
    import os

    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    output = sys.argv[1] if len(sys.argv) > 1 else "douban_books.json"
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 100

    scrape_and_save(output, count)
