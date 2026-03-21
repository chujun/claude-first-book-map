#!/usr/bin/env python3
"""
快速更新书籍数据 - 使用 requests
只获取书籍基本信息，不获取作者详细信息
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from fetch_douban import DoubanSpider, CoordinateResolver, RegionResolver
import sqlite3
import time
import random

DB_PATH = os.path.join(os.path.dirname(__file__), 'bookmap.db')


def update_books_fast():
    """快速更新书籍基本信息"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 获取需要更新的书籍（跳过已有页数的）
    cur.execute('SELECT id, url FROM books WHERE pages IS NULL OR pages = "" ORDER BY rank')
    books = cur.fetchall()

    spider = DoubanSpider()
    coord_resolver = CoordinateResolver()
    region_resolver = RegionResolver()

    total = len(books)
    updated = 0
    failed = 0

    print(f"开始快速更新，还需更新 {total} 本书籍...")
    print("-" * 50)

    for i, (book_id, url) in enumerate(books):
        try:
            if i % 10 == 0:
                print(f"[{i+1}/{total}] 进度: {i}/{total}...")

            # 获取书籍详情
            detail = spider.fetch_book_detail(url)
            if not detail:
                failed += 1
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

    conn.close()

    print("-" * 50)
    print(f"快速更新完成! 成功: {updated}, 失败: {failed}")
    return updated, failed


if __name__ == '__main__':
    update_books_fast()
