#!/usr/bin/env python3
"""
使用 Playwright 快速更新书籍数据
只获取书籍基本信息（页数、ISBN），不获取作者详细信息
绕过豆瓣的反爬虫机制
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fetch_douban import DoubanSpider, CoordinateResolver, RegionResolver, BookDetailParser
import sqlite3
import time
import random
from typing import Optional, Dict
from playwright.sync_api import sync_playwright

DB_PATH = os.path.join(os.path.dirname(__file__), 'bookmap.db')


class BookDetailFetcherWithPlaywright:
    """使用 Playwright 获取书籍详情（处理反爬虫验证）"""

    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None
        self.parser = BookDetailParser()

    def _ensure_browser(self):
        """确保浏览器已启动"""
        if not self.playwright:
            self.playwright = sync_playwright().start()
            self.browser = self.playwright.chromium.launch(headless=True)
            self.context = self.browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )

    def fetch_book_detail(self, url: str) -> Optional[Dict]:
        """使用 Playwright 获取书籍详情"""
        try:
            self._ensure_browser()
            page = self.context.new_page()

            page.goto(url, timeout=30000)
            page.wait_for_timeout(2000)

            # 获取页面HTML
            html = page.content()

            # 使用现有的解析器解析
            detail = self.parser.parse_detail_page(html)

            page.close()
            return detail

        except Exception as e:
            print(f"Playwright 获取书籍详情失败: {e}")
            return None

    def close(self):
        """关闭浏览器"""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()


def update_books_with_playwright():
    """使用 Playwright 快速更新书籍基本信息"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 获取需要更新的书籍（跳过已有页数的）
    cur.execute('SELECT id, url FROM books WHERE pages IS NULL OR pages = "" ORDER BY rank')
    books = cur.fetchall()

    fetcher = BookDetailFetcherWithPlaywright()
    coord_resolver = CoordinateResolver()
    region_resolver = RegionResolver()

    total = len(books)
    updated = 0
    failed = 0

    print(f"开始使用 Playwright 快速更新，还需更新 {total} 本书籍...")
    print("-" * 50)

    for i, (book_id, url) in enumerate(books):
        try:
            if i > 0 and i % 10 == 0:
                print(f"[{i+1}/{total}] 进度: {i}/{total}...")

            # 使用 Playwright 获取书籍详情
            detail = fetcher.fetch_book_detail(url)
            if not detail:
                failed += 1
                # 随机延迟后重试
                time.sleep(random.uniform(3, 5))
                continue

            # 构建更新数据
            title = detail.get('title', '')
            author = detail.get('author_name', '')
            publisher = detail.get('publisher', '')
            year = detail.get('year')
            pages = detail.get('pages')
            isbn = detail.get('isbn', '')
            translator = detail.get('translator', '')
            # 获取新评分，但保留原评分（如果新评分为0或None）
            new_rating = detail.get('rating', 0)
            if new_rating and new_rating > 0:
                rating = new_rating
            else:
                # 保留原评分
                cur.execute('SELECT rating FROM books WHERE id = ?', (book_id,))
                row = cur.fetchone()
                rating = row[0] if row and row[0] else 0

            # 尝试根据作者名判断国家（简单处理）
            author_country = ''
            for country in coord_resolver.COUNTRY_COORDS.keys():
                if country in author:
                    author_country = country
                    break

            # 解析坐标
            lat, lng = None, None
            if author_country:
                coords = coord_resolver.resolve(author_country)
                if coords:
                    lat = coords.get('lat')
                    lng = coords.get('lng')

            # 确定地区
            region = 'Unknown'
            if author_country:
                region = region_resolver.resolve(author_country)

            # 更新数据库
            cur.execute('''
                UPDATE books SET
                    title = ?, author = ?, year = ?, publisher = ?,
                    pages = ?, isbn = ?, translator = ?, rating = ?,
                    country = ?, region = ?, lat = ?, lng = ?
                WHERE id = ?
            ''', (title, author, year, publisher, pages, isbn, translator, rating,
                  author_country or '未知', region, lat, lng, book_id))

            conn.commit()
            updated += 1

            # 随机延迟避免被封
            time.sleep(random.uniform(1, 2))

        except Exception as e:
            print(f"  ID {book_id} 更新失败: {e}")
            failed += 1
            continue

    fetcher.close()
    conn.close()

    print("-" * 50)
    print(f"Playwright 快速更新完成! 成功: {updated}, 失败: {failed}")
    return updated, failed


if __name__ == '__main__':
    update_books_with_playwright()
