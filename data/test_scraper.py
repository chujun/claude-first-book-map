#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试豆瓣图书数据爬虫
"""

import unittest
import json
import os
import sys

# 添加 data 目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scraper import DoubanScraper, validate_book_data, export_to_json, detect_country


class TestDoubanScraper(unittest.TestCase):
    """测试豆瓣爬虫功能"""

    def test_scraper_initialization(self):
        """测试爬虫初始化"""
        scraper = DoubanScraper()
        self.assertIsNotNone(scraper.session)
        self.assertEqual(scraper.book_list, [])

    def test_validate_book_data_valid(self):
        """测试有效图书数据验证"""
        valid_book = {
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
            "url": "https://book.douban.com/subject/1000001/"
        }
        self.assertTrue(validate_book_data(valid_book))

    def test_validate_book_data_missing_field(self):
        """测试缺少字段的数据"""
        invalid_book = {
            "rank": 1,
            "title": "红楼梦",
            # 缺少 author
        }
        self.assertFalse(validate_book_data(invalid_book))

    def test_validate_book_data_invalid_rating(self):
        """测试无效评分"""
        invalid_book = {
            "rank": 1,
            "title": "红楼梦",
            "author": "曹雪芹",
            "country": "中国",
            "countryCode": "CN",
            "region": "Asia",
            "year": 1791,
            "rating": 11.0,  # 无效评分
            "category": "小说",
            "publisher": "人民文学出版社",
            "url": "https://book.douban.com/subject/1000001/"
        }
        self.assertFalse(validate_book_data(invalid_book))

    def test_validate_book_data_invalid_year(self):
        """测试无效年份"""
        invalid_book = {
            "rank": 1,
            "title": "红楼梦",
            "author": "曹雪芹",
            "country": "中国",
            "countryCode": "CN",
            "region": "Asia",
            "year": 3000,  # 未来年份
            "rating": 9.6,
            "category": "小说",
            "publisher": "人民文学出版社",
            "url": "https://book.douban.com/subject/1000001/"
        }
        self.assertFalse(validate_book_data(invalid_book))

    def test_export_to_json(self):
        """测试JSON导出"""
        test_books = [
            {
                "rank": 1,
                "title": "测试书",
                "author": "测试作者",
                "country": "中国",
                "countryCode": "CN",
                "region": "Asia",
                "year": 2020,
                "rating": 8.5,
                "category": "小说",
                "publisher": "测试出版社",
                "url": "https://book.douban.com/subject/1/"
            }
        ]

        output_file = "/tmp/test_books.json"
        export_to_json(test_books, output_file)

        self.assertTrue(os.path.exists(output_file))

        with open(output_file, 'r', encoding='utf-8') as f:
            loaded = json.load(f)
            self.assertEqual(len(loaded), 1)
            self.assertEqual(loaded[0]['title'], '测试书')

        os.remove(output_file)

    def test_country_detection(self):
        """测试国家/地区检测"""
        # 测试中国作者
        self.assertEqual(detect_country("曹雪芹", "中国古典"), ("中国", "CN", "Asia"))

        # 测试日本作者
        self.assertEqual(detect_country("村上春树", "日本现代文学"), ("日本", "JP", "Asia"))

        # 测试美国作者
        self.assertEqual(detect_country("海明威", "美国文学"), ("美国", "US", "Americas"))

        # 测试英国作者
        self.assertEqual(detect_country("莎士比亚", "英国文学"), ("英国", "GB", "Europe"))


if __name__ == "__main__":
    unittest.main()
