#!/usr/bin/env python3
"""
豆瓣图书 Top 1000 爬虫
爬取书名、年份、作者、评分、排名、类别、出版社、豆瓣链接
"""

import requests
from bs4 import BeautifulSoup
import time
import random
import json
import re
from typing import List, Dict, Optional


BASE_URL = "https://book.douban.com/top250"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}


def fetch_page(page: int) -> Optional[str]:
    """获取单页内容"""
    url = f"{BASE_URL}?start={page * 25}"
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"请求页面 {page} 失败: {e}")
        return None


def parse_book_info(html: str) -> List[Dict]:
    """解析页面中的书籍信息"""
    soup = BeautifulSoup(html, "html.parser")
    books = []

    # 豆瓣图书列表项
    table = soup.find("table", {"width": "100%"})
    if not table:
        return books

    for tr in table.find_all("tr"):
        td = tr.find("td", width="90%")
        if not td:
            continue

        # 获取书名和链接
        title_elem = td.find("a")
        if not title_elem:
            continue

        title = title_elem.get("title", "").strip()
        url = title_elem.get("href", "").strip()

        # 获取其他信息
        info = td.find("p", class_="pl")
        if info:
            info_text = info.get_text()
            # 解析: 作者, 出版社, 年份
            parts = info_text.split("/")
            author = parts[0].strip() if len(parts) > 0 else "未知"
            publisher = parts[-2].strip() if len(parts) > 2 else "未知"
            try:
                year = int(parts[-1].strip()[:4]) if len(parts) > 1 else None
            except (ValueError, IndexError):
                year = None
        else:
            author = "未知"
            publisher = "未知"
            year = None

        # 获取评分
        rating_elem = td.find("span", class_="rating_nums")
        rating = float(rating_elem.get_text()) if rating_elem else 0.0

        # 获取排名 (从 1 开始)
        rank_elem = td.find("span", class_="rec")
        if rank_elem:
            rank_text = rank_elem.get_text()
            match = re.search(r"\d+", rank_text)
            rank = int(match.group()) if match else None
        else:
            rank = None

        # 获取类别
        category_elem = td.find("span", class_="tag")
        category = category_elem.get_text().strip() if category_elem else "文学"

        if title and rank:
            books.append({
                "rank": rank,
                "title": title,
                "author": author,
                "publisher": publisher,
                "year": year,
                "rating": rating,
                "category": category,
                "url": url,
            })

    return books


def fetch_all_books() -> List[Dict]:
    """爬取豆瓣 Top 1000 图书"""
    all_books = []

    for page in range(10):  # Top250 分 10 页
        print(f"正在获取第 {page + 1}/10 页...")
        html = fetch_page(page)

        if html:
            books = parse_book_info(html)
            all_books.extend(books)
            print(f"  获取到 {len(books)} 本书")

        # 随机延迟 2-4 秒，避免被封
        time.sleep(random.uniform(2, 4))

    return all_books


def save_books(books: List[Dict], filepath: str = "douban_top1000.json"):
    """保存书籍数据到 JSON 文件"""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(books, f, ensure_ascii=False, indent=2)
    print(f"已保存 {len(books)} 本书到 {filepath}")


def main():
    print("开始爬取豆瓣图书 Top 250...")
    books = fetch_all_books()

    if books:
        save_books(books)
        print(f"完成! 共获取 {len(books)} 本书")
    else:
        print("未能获取到任何书籍数据")


if __name__ == "__main__":
    main()
