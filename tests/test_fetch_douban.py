#!/usr/bin/env python3
"""
豆瓣爬虫测试 - TDD RED 阶段
测试新的数据获取业务逻辑
"""

import pytest
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'data'))

from unittest.mock import Mock, patch
import requests

# Mock HTML responses for testing
MOCK_BOOK_DETAIL_HTML = """
<html>
<head><title>红楼梦 - 豆瓣</title></head>
<body>
<div id="wrapper">
    <div id="content">
        <h1>
            <span property="v:itemreviewed">红楼梦</span>
        </h1>
        <div id="info">
            <span><span class="pl">作者:</span> <a href="/author/1047866/">曹雪芹</a></span>
            <span class="pl">出版社:</span> 人民文学出版社
            <span class="pl">出版年:</span> 2008-01
            <span class="pl">页数:</span> 320
            <span class="pl">ISBN:</span> 9787020002207
            <span class="pl">译者:</span> <a href="/translator/1234/">无名氏</a>
        </div>
        <div class="rating_wrap">
            <span class="rating_nums">9.7</span>
        </div>
        <div class="ugc-mod" id="interest_sectl">
            <div class="mod-star">
                <span class="rating-star"></span>
            </div>
        </div>
    </div>
</div>
</body>
</html>
"""

MOCK_AUTHOR_HTML = """
<html>
<head><title>曹雪芹 - 豆瓣</title></head>
<body>
<div id="content">
    <div class="article">
        <div class="profile-header">
            <h1>曹雪芹</h1>
            <div class="info">
                <span>性别: 男</span>
                <span>出生日期: 约1715年</span>
                <span>国家/地区: 中国</span>
                <span>出生地: 北京</span>
            </div>
        </div>
    </div>
</div>
</body>
</html>
"""

MOCK_BOOK_LIST_HTML = """
<html>
<body>
<table width="100%">
    <tr>
        <td width="90%">
            <a title="红楼梦" href="https://book.douban.com/subject/1007305/">红楼梦</a>
            <p class="pl">曹雪芹/人民文学出版社/2008</p>
            <span class="rating_nums">9.7</span>
            <span class="rec">1</span>
            <span class="tag">小说</span>
        </td>
    </tr>
    <tr>
        <td width="90%">
            <a title="活着" href="https://book.douban.com/subject/1007306/">活着</a>
            <p class="pl">余华/作家出版社/2010</p>
            <span class="rating_nums">9.4</span>
            <span class="rec">2</span>
            <span class="tag">小说</span>
        </td>
    </tr>
</table>
</body>
</html>
"""


class TestBookDetailParser:
    """测试书籍详情解析"""

    def test_parse_book_detail_success(self):
        """测试成功解析书籍详情页面"""
        from fetch_douban import BookDetailParser

        parser = BookDetailParser()
        result = parser.parse_detail_page(MOCK_BOOK_DETAIL_HTML)

        assert result is not None
        assert result['title'] == '红楼梦'
        assert result['publisher'] == '人民文学出版社'
        assert result['year'] == 2008
        assert result['pages'] == 320
        assert result['isbn'] == '9787020002207'
        assert result['rating'] == 9.7
        assert result['author_name'] == '曹雪芹'
        assert result['translator'] == '无名氏'

    def test_parse_book_detail_missing_fields(self):
        """测试解析缺少字段的书籍页面"""
        from fetch_douban import BookDetailParser

        minimal_html = """
        <html>
        <body>
            <h1><span property="v:itemreviewed">测试书</span></h1>
            <div id="info">
                <span class="pl">出版社:</span> 测试出版社
                <span class="pl">出版年:</span> 2020-05
            </div>
            <div class="rating_wrap">
                <span class="rating_nums">8.5</span>
            </div>
        </body>
        </html>
        """
        parser = BookDetailParser()
        result = parser.parse_detail_page(minimal_html)

        assert result is not None
        assert result['title'] == '测试书'
        assert result['publisher'] == '测试出版社'
        assert result['year'] == 2020
        assert result['rating'] == 8.5

    def test_parse_book_detail_invalid_html(self):
        """测试解析无效HTML"""
        from fetch_douban import BookDetailParser

        parser = BookDetailParser()
        result = parser.parse_detail_page("<html><body>Invalid</body></html>")

        assert result is None


class TestAuthorParser:
    """测试作者信息解析"""

    def test_parse_author_info_success(self):
        """测试成功解析作者页面"""
        from fetch_douban import AuthorParser

        parser = AuthorParser()
        result = parser.parse_author_page(MOCK_AUTHOR_HTML)

        assert result is not None
        assert result['name'] == '曹雪芹'
        assert result['gender'] == '男'
        assert result['birth_date'] == '约1715年'
        assert result['country'] == '中国'
        assert result['birthplace'] == '北京'

    def test_parse_author_info_partial(self):
        """测试解析部分作者信息"""
        from fetch_douban import AuthorParser

        partial_html = """
        <html>
        <body>
            <div class="profile-header">
                <h1>某作者</h1>
                <div class="info">
                    <span>性别: 女</span>
                </div>
            </div>
        </body>
        </html>
        """
        parser = AuthorParser()
        result = parser.parse_author_page(partial_html)

        assert result is not None
        assert result['name'] == '某作者'
        assert result['gender'] == '女'
        assert result['birth_date'] == ''


class TestCoordinateResolver:
    """测试坐标解析"""

    def test_resolve_coordinates_china_beijing(self):
        """测试中国北京的坐标解析"""
        from fetch_douban import CoordinateResolver

        resolver = CoordinateResolver()
        coords = resolver.resolve(country='中国', city='北京')

        assert coords is not None
        assert 'lat' in coords
        assert 'lng' in coords
        assert coords['lat'] == pytest.approx(39.9042, abs=0.01)
        assert coords['lng'] == pytest.approx(116.4074, abs=0.01)

    def test_resolve_coordinates_japan_tokyo(self):
        """测试日本东京的坐标解析"""
        from fetch_douban import CoordinateResolver

        resolver = CoordinateResolver()
        coords = resolver.resolve(country='日本', city='东京')

        assert coords is not None
        assert coords['lat'] == pytest.approx(35.6762, abs=0.01)
        assert coords['lng'] == pytest.approx(139.6503, abs=0.01)

    def test_resolve_coordinates_country_only(self):
        """测试仅根据国家解析坐标(使用首都)"""
        from fetch_douban import CoordinateResolver

        resolver = CoordinateResolver()
        coords = resolver.resolve(country='法国', city=None)

        assert coords is not None
        assert coords['lat'] == pytest.approx(48.8566, abs=0.01)
        assert coords['lng'] == pytest.approx(2.3522, abs=0.01)

    def test_resolve_coordinates_unknown(self):
        """测试未知地点的坐标解析"""
        from fetch_douban import CoordinateResolver

        resolver = CoordinateResolver()
        coords = resolver.resolve(country='未知国家', city='未知城市')

        # 应该返回None或默认值
        assert coords is None or ('lat' in coords and 'lng' in coords)


class TestRegionResolver:
    """测试地区(洲)解析"""

    def test_resolve_region_china(self):
        """测试中国对应地区"""
        from fetch_douban import RegionResolver

        resolver = RegionResolver()
        assert resolver.resolve('中国') == 'Asia'
        assert resolver.resolve('日本') == 'Asia'
        assert resolver.resolve('韩国') == 'Asia'

    def test_resolve_region_europe(self):
        """测试欧洲国家对应地区"""
        from fetch_douban import RegionResolver

        resolver = RegionResolver()
        assert resolver.resolve('英国') == 'Europe'
        assert resolver.resolve('法国') == 'Europe'
        assert resolver.resolve('德国') == 'Europe'

    def test_resolve_region_americas(self):
        """测试美洲国家对应地区"""
        from fetch_douban import RegionResolver

        resolver = RegionResolver()
        assert resolver.resolve('美国') == 'Americas'
        assert resolver.resolve('加拿大') == 'Americas'

    def test_resolve_region_unknown(self):
        """测试未知国家对应地区"""
        from fetch_douban import RegionResolver

        resolver = RegionResolver()
        result = resolver.resolve('未知国家')
        assert result == 'Unknown'


class TestBookListParser:
    """测试图书列表解析"""

    def test_parse_book_list_success(self):
        """测试成功解析图书列表"""
        from fetch_douban import BookListParser

        parser = BookListParser()
        books = parser.parse_list_page(MOCK_BOOK_LIST_HTML)

        assert len(books) == 2
        assert books[0]['rank'] == 1
        assert books[0]['title'] == '红楼梦'
        assert books[1]['rank'] == 2
        assert books[1]['title'] == '活着'


class TestDoubanSpider:
    """测试豆瓣爬虫集成"""

    @patch('requests.Session.get')
    def test_fetch_book_detail(self, mock_session_get):
        """测试获取书籍详情"""
        from fetch_douban import DoubanSpider

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = MOCK_BOOK_DETAIL_HTML
        mock_session_get.return_value = mock_response

        spider = DoubanSpider()
        result = spider.fetch_book_detail('https://book.douban.com/subject/1007305/')

        assert result is not None
        assert result['title'] == '红楼梦'
        mock_session_get.assert_called_once()

    @patch('requests.Session.get')
    def test_fetch_author_info(self, mock_session_get):
        """测试获取作者信息"""
        from fetch_douban import DoubanSpider

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = MOCK_AUTHOR_HTML
        mock_session_get.return_value = mock_response

        spider = DoubanSpider()
        result = spider.fetch_author_info('https://book.douban.com/author/1047866/')

        assert result is not None
        assert result['name'] == '曹雪芹'
        mock_session_get.assert_called_once()

    @patch('requests.Session.get')
    def test_fetch_book_detail_network_error(self, mock_session_get):
        """测试网络错误处理"""
        from fetch_douban import DoubanSpider
        import requests

        mock_session_get.side_effect = requests.RequestException("Network error")

        spider = DoubanSpider()
        result = spider.fetch_book_detail('https://book.douban.com/subject/1007305/')

        assert result is None


class TestCoordinateResolverEdgeCases:
    """测试坐标解析器边界情况"""

    def test_resolve_coordinates_empty_country(self):
        """测试空国家但有城市 - 城市坐标优先"""
        from fetch_douban import CoordinateResolver

        resolver = CoordinateResolver()
        coords = resolver.resolve('', city='北京')
        # 城市坐标优先，所以即使国家为空也能返回北京坐标
        assert coords is not None
        assert coords['lat'] == pytest.approx(39.9042, abs=0.01)

    def test_resolve_coordinates_chinese_city(self):
        """测试中文城市名"""
        from fetch_douban import CoordinateResolver

        resolver = CoordinateResolver()
        coords = resolver.resolve('中国', city='上海')
        assert coords is not None
        assert coords['lat'] == pytest.approx(31.2304, abs=0.01)

    def test_resolve_coordinates_uknown_city_fallback_to_country(self):
        """测试未知城市回退到国家坐标"""
        from fetch_douban import CoordinateResolver

        resolver = CoordinateResolver()
        coords = resolver.resolve('中国', city='未知城市')
        # 应该使用中国首都坐标
        assert coords is not None
        assert coords['lat'] == pytest.approx(39.9042, abs=0.01)


class TestRegionResolverEdgeCases:
    """测试地区解析器边界情况"""

    def test_resolve_region_empty(self):
        """测试空国家"""
        from fetch_douban import RegionResolver

        resolver = RegionResolver()
        assert resolver.resolve('') == 'Unknown'

    def test_resolve_region_oceania(self):
        """测试大洋洲国家"""
        from fetch_douban import RegionResolver

        resolver = RegionResolver()
        assert resolver.resolve('澳大利亚') == 'Oceania'
        assert resolver.resolve('新西兰') == 'Oceania'


class TestBookDetailParserEdgeCases:
    """测试书籍详情解析器边界情况"""

    def test_parse_detail_with_missing_author(self):
        """测试缺少作者的页面"""
        from fetch_douban import BookDetailParser

        html = """
        <html>
        <body>
            <h1><span property="v:itemreviewed">测试书</span></h1>
            <div id="info">
                <span class="pl">出版社:</span> 测试出版社
                <span class="pl">出版年:</span> 2020-05
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
        assert result['author_name'] == ''
        assert result['author_url'] == ''

    def test_parse_detail_with_translator(self):
        """测试有译者的页面"""
        from fetch_douban import BookDetailParser

        html = """
        <html>
        <body>
            <h1><span property="v:itemreviewed">外国文学</span></h1>
            <div id="info">
                <span class="pl">作者:</span> <a href="/author/123/">原作者</a>
                <span class="pl">出版社:</span> 译林出版社
                <span class="pl">出版年:</span> 2019-03
                <span class="pl">页数:</span> 300
                <span class="pl">ISBN:</span> 9787544777777
                <span class="pl">译者:</span> <a href="/translator/456/">张翻译</a>
            </div>
            <div class="rating_wrap">
                <span class="rating_nums">9.0</span>
            </div>
        </body>
        </html>
        """
        parser = BookDetailParser()
        result = parser.parse_detail_page(html)

        assert result is not None
        assert result['translator'] == '张翻译'


class TestDoubanSpiderIntegration:
    """测试豆瓣爬虫集成功能"""

    @patch('requests.Session.get')
    def test_fetch_top250_page(self, mock_session_get):
        """测试获取Top250单页"""
        from fetch_douban import DoubanSpider

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = MOCK_BOOK_LIST_HTML
        mock_session_get.return_value = mock_response

        spider = DoubanSpider()
        books = spider.fetch_top250(0)

        assert len(books) == 2
        assert books[0]['title'] == '红楼梦'
        mock_session_get.assert_called_once()

    @patch('requests.Session.get')
    def test_fetch_all_top250(self, mock_session_get):
        """测试获取全部Top250"""
        from fetch_douban import DoubanSpider

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = MOCK_BOOK_LIST_HTML
        mock_session_get.return_value = mock_response

        spider = DoubanSpider()
        # 只测试第一页，避免实际延迟
        with patch.object(spider, 'fetch_top250', return_value=[{'rank': 1, 'title': '测试'}]) as mock_fetch:
            spider.fetch_all_top250()
            assert mock_fetch.call_count == 10

    @patch('requests.Session.get')
    def test_enrich_book_with_author(self, mock_session_get):
        """测试书籍信息丰富化"""
        from fetch_douban import DoubanSpider

        # Mock book detail response
        detail_response = Mock()
        detail_response.status_code = 200
        detail_response.text = MOCK_BOOK_DETAIL_HTML

        # Mock author response
        author_response = Mock()
        author_response.status_code = 200
        author_response.text = MOCK_AUTHOR_HTML

        mock_session_get.side_effect = [detail_response, author_response]

        spider = DoubanSpider()
        book = {
            'rank': 1,
            'title': '红楼梦',
            'url': 'https://book.douban.com/subject/1007305/',
            'rating': 9.7
        }

        result = spider.enrich_book_with_author(book)

        # 验证数据被丰富
        assert result.get('publisher') == '人民文学出版社'
        assert result.get('author') == '曹雪芹'
        assert result.get('author_country') == '中国'
        assert 'lat' in result
        assert 'lng' in result


class TestLegacyInterface:
    """测试旧接口兼容性"""

    def test_legacy_fetch_page(self):
        """测试旧接口fetch_page"""
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.text = "OK"
            mock_get.return_value = mock_response

            from fetch_douban import fetch_page
            result = fetch_page(0)

            assert result == "OK"
            mock_get.assert_called_once()

    def test_legacy_parse_book_info(self):
        """测试旧接口parse_book_info"""
        from fetch_douban import parse_book_info

        books = parse_book_info(MOCK_BOOK_LIST_HTML)
        assert len(books) == 2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
