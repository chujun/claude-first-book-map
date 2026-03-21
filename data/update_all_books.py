#!/usr/bin/env python3
"""
批量更新书籍数据
使用 Playwright 从豆瓣获取完整的书籍和作者信息
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fetch_douban import (
    DoubanSpider, BookDetailParser, BookListParser,
    CoordinateResolver, RegionResolver, AuthorParserWithPlaywright
)
import sqlite3
import time
import random

DB_PATH = os.path.join(os.path.dirname(__file__), 'bookmap.db')


def update_all_books():
    """更新数据库中所有书籍的详细信息"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 获取所有需要更新的书籍
    cur.execute('SELECT id, url FROM books ORDER BY rank')
    books = cur.fetchall()

    spider = DoubanSpider()
    playwright_parser = AuthorParserWithPlaywright()
    coord_resolver = CoordinateResolver()
    region_resolver = RegionResolver()

    total = len(books)
    updated = 0
    failed = 0
    skip_count = 0

    print(f"开始更新 {total} 本书籍...")
    print("-" * 50)

    for i, (book_id, url) in enumerate(books):
        try:
            print(f"[{i+1}/{total}] 正在更新书籍 ID {book_id}...")

            # 获取书籍详情
            detail = spider.fetch_book_detail(url)
            if not detail:
                print(f"  无法获取详情，跳过")
                skip_count += 1
                continue

            # 获取作者信息（使用 Playwright）
            author_url = detail.get('author_url', '')
            author_info = None
            if author_url:
                author_url_full = author_url if author_url.startswith('http') else 'https://book.douban.com' + author_url
                author_info = playwright_parser.fetch_author_info(author_url_full)
                print(f"  作者信息: {author_info}")

            # 构建更新数据
            title = detail.get('title', '')
            author = detail.get('author_name', '')
            publisher = detail.get('publisher', '')
            year = detail.get('year')
            pages = detail.get('pages')
            isbn = detail.get('isbn', '')
            translator = detail.get('translator', '')
            rating = detail.get('rating', 0)

            author_gender = author_info.get('gender', '') if author_info else ''
            author_birth_date = author_info.get('birth_date', '') if author_info else ''
            author_country = author_info.get('country', '') if author_info else ''
            author_birthplace = author_info.get('birthplace', '') if author_info else ''

            # 如果 Playwright 获取的作者名为空，使用详情页的作者名
            if not author and author_info:
                author = author_info.get('name', '')

            # 解析坐标
            lat, lng = None, None
            if author_country:
                coords = coord_resolver.resolve(author_country, author_birthplace)
                if coords:
                    lat = coords.get('lat')
                    lng = coords.get('lng')

            # 确定地区
            region = 'Unknown'
            if author_country:
                region = region_resolver.resolve(author_country)
            elif author:
                # 尝试根据作者名判断国家
                region = region_resolver.resolve(author_country)

            # 更新数据库
            cur.execute('''
                UPDATE books SET
                    title = ?, author = ?, year = ?, publisher = ?,
                    pages = ?, isbn = ?, translator = ?, rating = ?,
                    author_gender = ?, author_birth_date = ?,
                    author_country = ?, author_birthplace = ?,
                    country = ?, region = ?, lat = ?, lng = ?
                WHERE id = ?
            ''', (title, author, year, publisher, pages, isbn, translator, rating,
                  author_gender, author_birth_date, author_country, author_birthplace,
                  author_country or '未知', region, lat, lng, book_id))

            conn.commit()
            updated += 1
            print(f"  更新成功: {title}")

            # 随机延迟避免被封
            time.sleep(random.uniform(2, 4))

        except Exception as e:
            print(f"  更新失败: {e}")
            failed += 1
            continue

    # 关闭 Playwright
    playwright_parser.close()
    conn.close()

    print("-" * 50)
    print(f"更新完成! 成功: {updated}, 跳过: {skip_count}, 失败: {failed}")
    return updated, skip_count, failed


if __name__ == '__main__':
    update_all_books()
