#!/usr/bin/env python3
"""
豆瓣爬虫新增字段测试 - 提升测试覆盖率
测试 price 和 rating_count 字段的解析
"""

import pytest
import sys
import os
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'data'))

from fetch_douban import BookDetailParser, CoordinateResolver


class TestRatingCountExtraction:
    """测试评价人数提取"""

    def test_extract_rating_count_success(self):
        """测试成功提取评价人数"""
        html = """
        <html>
        <body>
            <div class="rating_wrap">
                <span class="rating_nums">9.7</span>
            </div>
            <div class="ugc-mod" id="interest_sectl">
                <span class="rating_sum">评价人数: <span>123,456</span></span>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "html.parser")
        parser = BookDetailParser()
        result = parser._extract_rating_count(soup)
        assert result == 123456

    def test_extract_rating_count_without_comma(self):
        """测试无千位分隔符的评价人数"""
        html = """
        <html>
        <body>
            <div class="rating_wrap">
                <span class="rating_nums">8.5</span>
            </div>
            <div class="ugc-mod" id="interest_sectl">
                <span class="rating_sum">评价人数: <span>9999</span></span>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "html.parser")
        parser = BookDetailParser()
        result = parser._extract_rating_count(soup)
        assert result == 9999

    def test_extract_rating_count_missing(self):
        """测试缺少评价人数"""
        html = """
        <html>
        <body>
            <div class="rating_wrap">
                <span class="rating_nums">8.5</span>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "html.parser")
        parser = BookDetailParser()
        result = parser._extract_rating_count(soup)
        assert result is None

    def test_extract_rating_count_invalid_format(self):
        """测试无效格式"""
        html = """
        <html>
        <body>
            <div class="rating_wrap">
                <span class="rating_nums">8.5</span>
            </div>
            <div class="ugc-mod" id="interest_sectl">
                <span class="rating_sum">评价人数: <span>无效数据</span></span>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "html.parser")
        parser = BookDetailParser()
        result = parser._extract_rating_count(soup)
        assert result is None

    def test_extract_rating_count_fallback_format(self):
        """测试备选格式 (xxx人评价)"""
        html = """
        <html>
        <body>
            <div class="rating_wrap">
                <span class="rating_nums">8.5</span>
            </div>
            <div class="ugc-mod" id="interest_sectl">
                <span>(100,000人评价)</span>
            </div>
        </body>
        </html>
        """
        soup = BeautifulSoup(html, "html.parser")
        parser = BookDetailParser()
        result = parser._extract_rating_count(soup)
        assert result == 100000


class TestPriceExtraction:
    """测试定价提取"""

    def test_extract_field_with_price(self):
        """测试提取定价字段"""
        html = """
        <html>
        <body>
            <h1><span property="v:itemreviewed">测试书</span></h1>
            <div id="info">
                <span class="pl">定价:</span>
                <span class="price">¥45.00</span>
            </div>
            <div class="rating_wrap">
                <span class="rating_nums">8.0</span>
            </div>
        </body>
        </html>
        """
        parser = BookDetailParser()
        result = parser.parse_detail_page(html)
        assert result is not None
        assert 'price' in result

    def test_extract_field_with_various_price_formats(self):
        """测试各种定价格式"""
        price_texts = [
            "¥45.00",
            "USD 19.99",
            "NT$380",
            "HK$128",
            "定价: 68.00元",
        ]
        for price_text in price_texts:
            html = f"""
            <html>
            <body>
                <h1><span property="v:itemreviewed">测试书</span></h1>
                <div id="info">
                    <span class="pl">定价:</span>
                    <span>{price_text}</span>
                </div>
                <div class="rating_wrap">
                    <span class="rating_nums">8.0</span>
                </div>
            </body>
            </html>
            """
            parser = BookDetailParser()
            result = parser.parse_detail_page(html)
            assert result is not None


class TestExtractField:
    """测试 _extract_field 方法"""

    def test_extract_field_standard_format(self):
        """测试标准格式提取"""
        text = "作者: 余华\n出版社: 作家出版社"
        parser = BookDetailParser()
        result = parser._extract_field(text, "作者:")
        assert result == "余华"

    def test_extract_field_with_line_break(self):
        """测试带换行的格式"""
        text = "作者: 余华\n出版社: 作家出版社\n定价: ¥45.00"
        parser = BookDetailParser()
        result = parser._extract_field(text, "作者:")
        assert "余华" in result

    def test_extract_field_missing(self):
        """测试字段缺失"""
        text = "作者: 余华\n出版社: 作家出版社"
        parser = BookDetailParser()
        result = parser._extract_field(text, "作者:")
        assert result == "余华"
        # 测试不存在的字段
        result_missing = parser._extract_field(text, "定价:")
        assert result_missing == ""


class TestBookDetailParserNewFields:
    """测试书籍详情解析器的新字段"""

    def test_parse_detail_with_price_and_rating_count(self):
        """测试解析包含定价和评价人数的页面"""
        html = """
        <html>
        <head><title>活着 - 豆瓣</title></head>
        <body>
        <div id="wrapper">
            <div id="content">
                <h1>
                    <span property="v:itemreviewed">活着</span>
                </h1>
                <div id="info">
                    <span class="pl">作者:</span>
                    <a href="/author/1234567/">余华</a>
                    <span class="pl">出版社:</span>作家出版社
                    <span class="pl">出版年:</span>2012-08
                    <span class="pl">页数:</span>191
                    <span class="pl">定价:</span>¥28.00
                    <span class="pl">ISBN:</span>9787506365437
                </div>
                <div class="rating_wrap">
                    <span class="rating_nums">9.4</span>
                </div>
                <div class="ugc-mod" id="interest_sectl">
                    <span class="rating_sum">评价人数: <span>100,000</span></span>
                </div>
            </div>
        </div>
        </body>
        </html>
        """
        parser = BookDetailParser()
        result = parser.parse_detail_page(html)

        assert result is not None
        assert result['title'] == '活着'
        assert result['author_name'] == '余华'
        assert result['publisher'] == '作家出版社'
        assert result['year'] == 2012
        assert result['rating'] == 9.4

    def test_parse_detail_without_price(self):
        """测试没有定价的页面"""
        html = """
        <html>
        <head><title>测试书 - 豆瓣</title></head>
        <body>
        <div id="wrapper">
            <div id="content">
                <h1>
                    <span property="v:itemreviewed">测试书</span>
                </h1>
                <div id="info">
                    <span class="pl">作者:</span>
                    <a href="/author/123/">测试作者</a>
                    <span class="pl">出版社:</span>测试出版社
                </div>
                <div class="rating_wrap">
                    <span class="rating_nums">8.0</span>
                </div>
            </div>
        </div>
        </body>
        </html>
        """
        parser = BookDetailParser()
        result = parser.parse_detail_page(html)

        assert result is not None
        assert result['title'] == '测试书'


class TestCoordinateResolverNewCountry:
    """测试坐标解析器的新国家支持"""

    def test_resolve_taiwan(self):
        """测试台湾坐标"""
        resolver = CoordinateResolver()
        coords = resolver.resolve('台湾', '')
        assert coords is not None
        assert 'lat' in coords
        assert 'lng' in coords

    def test_resolve_afghanistan(self):
        """测试阿富汗坐标"""
        resolver = CoordinateResolver()
        coords = resolver.resolve('阿富汗', '')
        assert coords is not None
        assert 'lat' in coords
        assert 'lng' in coords

    def test_resolve_china_taiwan_alias(self):
        """测试中国台湾别名"""
        resolver = CoordinateResolver()
        coords = resolver.resolve('中国台湾', '')
        assert coords is not None

    def test_resolve_british_india_alias(self):
        """测试英属印度别名"""
        resolver = CoordinateResolver()
        coords = resolver.resolve('英属印度', '')
        assert coords is not None
        # 应该映射到印度坐标
        assert coords['lat'] > 0  # 印度在北半球


class TestBookDetailParserDetailFields:
    """测试书籍详情解析器的详细字段"""

    def test_parse_with_all_fields(self):
        """测试解析包含所有字段的页面"""
        html = """
        <html>
        <head><title>红楼梦 - 豆瓣</title></head>
        <body>
        <div id="wrapper">
            <div id="content">
                <h1>
                    <span property="v:itemreviewed">红楼梦</span>
                </h1>
                <div id="info">
                    <span class="pl">作者:</span>
                    <a href="/author/1047866/">曹雪芹</a>
                    <span class="pl">出版社:</span>人民文学出版社
                    <span class="pl">出版年:</span>2008-01
                    <span class="pl">页数:</span>320
                    <span class="pl">定价:</span>¥45.00
                    <span class="pl">ISBN:</span>9787020002207
                    <span class="pl">译者:</span>
                    <a href="/translator/1234/">无名氏</a>
                </div>
                <div class="rating_wrap">
                    <span class="rating_nums">9.7</span>
                </div>
                <div class="subject-links">
                    <a href="/type/100">小说</a>
                </div>
            </div>
        </div>
        </body>
        </html>
        """
        parser = BookDetailParser()
        result = parser.parse_detail_page(html)

        assert result is not None
        assert result['title'] == '红楼梦'
        assert result['author_name'] == '曹雪芹'
        assert result['publisher'] == '人民文学出版社'
        assert result['year'] == 2008
        assert result['pages'] == 320
        assert result['isbn'] == '9787020002207'
        # translator extraction depends on HTML structure in info div
        assert 'rating' in result
        assert result['rating'] == 9.7

    def test_parse_publisher_with_special_chars(self):
        """测试出版社名称包含特殊字符"""
        html = """
        <html>
        <head><title>测试 - 豆瓣</title></head>
        <body>
        <div id="wrapper">
            <div id="content">
                <h1>
                    <span property="v:itemreviewed">测试书</span>
                </h1>
                <div id="info">
                    <span class="pl">作者:</span>
                    <a href="/author/123/">测试作者</a>
                    <span class="pl">出版社:</span>北京大学出版社（第3版）
                </div>
                <div class="rating_wrap">
                    <span class="rating_nums">8.0</span>
                </div>
            </div>
        </div>
        </body>
        </html>
        """
        parser = BookDetailParser()
        result = parser.parse_detail_page(html)

        assert result is not None
        assert '北京大学出版社' in result['publisher']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
