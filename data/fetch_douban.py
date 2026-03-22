#!/usr/bin/env python3
"""
豆瓣图书爬虫 - 重构版本
从豆瓣获取完整的书籍和作者信息

数据获取逻辑:
1. 书籍详情页面: 书名、出版社、出版时间、评分、排名、类别、译者、ISBN、页数
2. 作者页面: 姓名、性别、出生日期、国家、出生地
3. 坐标信息: 根据作者国家和出生地确定
"""

import requests
from bs4 import BeautifulSoup
import time
import random
import json
import re
from typing import List, Dict, Optional


BASE_URL = "https://book.douban.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}


# ============ 坐标数据 ============

# 国家/地区 -> 首都坐标
COUNTRY_COORDS = {
    "中国": {"lat": 39.9042, "lng": 116.4074, "capital": "北京"},
    "日本": {"lat": 35.6762, "lng": 139.6503, "capital": "东京"},
    "韩国": {"lat": 37.5665, "lng": 126.9780, "capital": "首尔"},
    "印度": {"lat": 28.6139, "lng": 77.2090, "capital": "新德里"},
    "美国": {"lat": 38.9072, "lng": -77.0369, "capital": "华盛顿"},
    "英国": {"lat": 51.5074, "lng": -0.1278, "capital": "伦敦"},
    "法国": {"lat": 48.8566, "lng": 2.3522, "capital": "巴黎"},
    "德国": {"lat": 52.5200, "lng": 13.4050, "capital": "柏林"},
    "俄罗斯": {"lat": 55.7558, "lng": 37.6173, "capital": "莫斯科"},
    "意大利": {"lat": 41.9028, "lng": 12.4964, "capital": "罗马"},
    "西班牙": {"lat": 40.4168, "lng": -3.7038, "capital": "马德里"},
    "加拿大": {"lat": 45.4215, "lng": -75.6972, "capital": "渥太华"},
    "巴西": {"lat": -15.7975, "lng": -47.8919, "capital": "巴西利亚"},
    "墨西哥": {"lat": 19.4326, "lng": -99.1332, "capital": "墨西哥城"},
    "阿根廷": {"lat": -34.6037, "lng": -58.3816, "capital": "布宜诺斯艾利斯"},
    "澳大利亚": {"lat": -35.2809, "lng": 149.1300, "capital": "堪培拉"},
    "丹麦": {"lat": 55.6761, "lng": 12.5683, "capital": "哥本哈根"},
    "波兰": {"lat": 52.2297, "lng": 21.0122, "capital": "华沙"},
    "奥地利": {"lat": 48.2082, "lng": 16.3738, "capital": "维也纳"},
    "瑞典": {"lat": 59.3293, "lng": 18.0686, "capital": "斯德哥尔摩"},
    "爱尔兰": {"lat": 53.3498, "lng": -6.2603, "capital": "都柏林"},
    "葡萄牙": {"lat": 38.7223, "lng": -9.1393, "capital": "里斯本"},
    "秘鲁": {"lat": -12.0464, "lng": -77.0428, "capital": "利马"},
    "马来西亚": {"lat": 3.1390, "lng": 101.6869, "capital": "吉隆坡"},
    "哥伦比亚": {"lat": 4.7110, "lng": -74.0721, "capital": "波哥大"},
    "智利": {"lat": -33.4489, "lng": -70.6693, "capital": "圣地亚哥"},
    "荷兰": {"lat": 52.3676, "lng": 4.9041, "capital": "阿姆斯特丹"},
    "比利时": {"lat": 50.8503, "lng": 4.3517, "capital": "布鲁塞尔"},
    "瑞士": {"lat": 46.9480, "lng": 7.4474, "capital": "伯尔尼"},
    "挪威": {"lat": 59.9139, "lng": 10.7522, "capital": "奥斯陆"},
    "芬兰": {"lat": 60.1699, "lng": 24.9384, "capital": "赫尔辛基"},
    "希腊": {"lat": 37.9838, "lng": 23.7275, "capital": "雅典"},
    "捷克": {"lat": 50.0755, "lng": 14.4378, "capital": "布拉格"},
    "匈牙利": {"lat": 47.4979, "lng": 19.0402, "capital": "布达佩斯"},
    "土耳其": {"lat": 39.9334, "lng": 32.8597, "capital": "安卡拉"},
    "埃及": {"lat": 30.0444, "lng": 31.2357, "capital": "开罗"},
    "南非": {"lat": -26.2041, "lng": 28.0473, "capital": "比勒陀利亚"},
    "尼日利亚": {"lat": 9.0765, "lng": 7.3986, "capital": "阿布贾"},
    "肯尼亚": {"lat": -1.2921, "lng": 36.8219, "capital": "内罗毕"},
    "摩洛哥": {"lat": 33.9716, "lng": -6.8498, "capital": "拉巴特"},
    "新西兰": {"lat": -41.2865, "lng": 174.7762, "capital": "惠灵顿"},
    "新加坡": {"lat": 1.3521, "lng": 103.8198, "capital": "新加坡"},
    "泰国": {"lat": 13.7563, "lng": 100.5018, "capital": "曼谷"},
    "越南": {"lat": 21.0285, "lng": 105.8542, "capital": "河内"},
    "菲律宾": {"lat": 14.5995, "lng": 120.9842, "capital": "马尼拉"},
    "印度尼西亚": {"lat": -6.2088, "lng": 106.8456, "capital": "雅加达"},
    "巴基斯坦": {"lat": 33.6844, "lng": 73.0479, "capital": "伊斯兰堡"},
    "伊朗": {"lat": 35.6892, "lng": 51.3890, "capital": "德黑兰"},
    "伊拉克": {"lat": 33.3152, "lng": 44.3661, "capital": "巴格达"},
    "以色列": {"lat": 31.7683, "lng": 35.2137, "capital": "特拉维夫"},
    "沙特阿拉伯": {"lat": 24.7136, "lng": 46.6753, "capital": "利雅得"},
    "阿联酋": {"lat": 24.4539, "lng": 54.3773, "capital": "阿布扎比"},
}

# 城市 -> 坐标 (常用城市)
CITY_COORDS = {
    # 中国城市
    "北京": {"lat": 39.9042, "lng": 116.4074},
    "上海": {"lat": 31.2304, "lng": 121.4737},
    "广州": {"lat": 23.1291, "lng": 113.2644},
    "深圳": {"lat": 22.5431, "lng": 114.0579},
    "南京": {"lat": 32.0603, "lng": 118.7969},
    "杭州": {"lat": 30.2741, "lng": 120.1551},
    "成都": {"lat": 30.5728, "lng": 104.0668},
    "西安": {"lat": 34.3416, "lng": 108.9398},
    "武汉": {"lat": 30.5928, "lng": 114.3055},
    "重庆": {"lat": 29.4316, "lng": 106.9123},
    "天津": {"lat": 39.3434, "lng": 117.3616},
    "苏州": {"lat": 31.2989, "lng": 120.5853},
    "香港": {"lat": 22.3193, "lng": 114.1694},
    "澳门": {"lat": 22.1987, "lng": 113.5439},
    "台北": {"lat": 25.0330, "lng": 121.5654},

    # 日本城市
    "东京": {"lat": 35.6762, "lng": 139.6503},
    "大阪": {"lat": 34.6937, "lng": 135.5023},
    "京都": {"lat": 35.0116, "lng": 135.7681},
    "横滨": {"lat": 35.4437, "lng": 139.6380},
    "名古屋": {"lat": 35.1815, "lng": 136.9066},

    # 韩国城市
    "首尔": {"lat": 37.5665, "lng": 126.9780},
    "釜山": {"lat": 35.1796, "lng": 129.0756},
    "仁川": {"lat": 37.4563, "lng": 126.7052},

    # 欧洲城市
    "伦敦": {"lat": 51.5074, "lng": -0.1278},
    "巴黎": {"lat": 48.8566, "lng": 2.3522},
    "柏林": {"lat": 52.5200, "lng": 13.4050},
    "罗马": {"lat": 41.9028, "lng": 12.4964},
    "马德里": {"lat": 40.4168, "lng": -3.7038},
    "巴塞罗那": {"lat": 41.3851, "lng": 2.1734},
    "阿姆斯特丹": {"lat": 52.3676, "lng": 4.9041},
    "维也纳": {"lat": 48.2082, "lng": 16.3738},
    "布拉格": {"lat": 50.0755, "lng": 14.4378},
    "布达佩斯": {"lat": 47.4979, "lng": 19.0402},
    "哥本哈根": {"lat": 55.6761, "lng": 12.5683},
    "斯德哥尔摩": {"lat": 59.3293, "lng": 18.0686},
    "奥斯陆": {"lat": 59.9139, "lng": 10.7522},
    "赫尔辛基": {"lat": 60.1699, "lng": 24.9384},
    "都柏林": {"lat": 53.3498, "lng": -6.2603},
    "爱丁堡": {"lat": 55.9533, "lng": -3.1883},
    "曼彻斯特": {"lat": 53.4808, "lng": -2.2426},
    "慕尼黑": {"lat": 48.1351, "lng": 11.5820},
    "法兰克福": {"lat": 50.1109, "lng": 8.6821},
    "苏黎世": {"lat": 47.3769, "lng": 8.5417},
    "日内瓦": {"lat": 46.2044, "lng": 6.1432},
    "布鲁塞尔": {"lat": 50.8503, "lng": 4.3517},
    "雅典": {"lat": 37.9838, "lng": 23.7275},
    "里斯本": {"lat": 38.7223, "lng": -9.1393},
    "巴伦西亚": {"lat": 39.4699, "lng": -0.3763},
    "华沙": {"lat": 52.2297, "lng": 21.0122},
    "莫斯科": {"lat": 55.7558, "lng": 37.6173},
    "圣彼得堡": {"lat": 59.9343, "lng": 30.3351},

    # 美国城市
    "纽约": {"lat": 40.7128, "lng": -74.0060},
    "洛杉矶": {"lat": 34.0522, "lng": -118.2437},
    "芝加哥": {"lat": 41.8781, "lng": -87.6298},
    "旧金山": {"lat": 37.7749, "lng": -122.4194},
    "波士顿": {"lat": 42.3601, "lng": -71.0589},
    "华盛顿": {"lat": 38.9072, "lng": -77.0369},
    "西雅图": {"lat": 47.6062, "lng": -122.3321},
    "迈阿密": {"lat": 25.7617, "lng": -80.1918},
    "亚特兰大": {"lat": 33.7490, "lng": -84.3880},
    "费城": {"lat": 39.9526, "lng": -75.1652},
    "底特律": {"lat": 42.3314, "lng": -83.0458},
    "丹佛": {"lat": 39.7392, "lng": -104.9903},

    # 美洲其他城市
    "多伦多": {"lat": 43.6532, "lng": -79.3832},
    "温哥华": {"lat": 49.2827, "lng": -123.1207},
    "蒙特利尔": {"lat": 45.5017, "lng": -73.5673},
    "墨西哥城": {"lat": 19.4326, "lng": -99.1332},
    "布宜诺斯艾利斯": {"lat": -34.6037, "lng": -58.3816},
    "里约热内卢": {"lat": -22.9068, "lng": -43.1729},
    "圣保罗": {"lat": -23.5505, "lng": -46.6333},
    "利马": {"lat": -12.0464, "lng": -77.0428},
    "波哥大": {"lat": 4.7110, "lng": -74.0721},
    "圣地亚哥": {"lat": -33.4489, "lng": -70.6693},

    # 亚洲其他城市
    "新德里": {"lat": 28.6139, "lng": 77.2090},
    "孟买": {"lat": 19.0760, "lng": 72.8777},
    "加尔各答": {"lat": 22.5726, "lng": 88.3639},
    "曼谷": {"lat": 13.7563, "lng": 100.5018},
    "新加坡": {"lat": 1.3521, "lng": 103.8198},
    "吉隆坡": {"lat": 3.1390, "lng": 101.6869},
    "雅加达": {"lat": -6.2088, "lng": 106.8456},
    "马尼拉": {"lat": 14.5995, "lng": 120.9842},
    "河内": {"lat": 21.0285, "lng": 105.8542},
    "胡志明市": {"lat": 10.8231, "lng": 106.6297},
    "德黑兰": {"lat": 35.6892, "lng": 51.3890},
    "特拉维夫": {"lat": 31.7683, "lng": 35.2137},
    "伊斯坦布尔": {"lat": 41.0082, "lng": 28.9784},

    # 大洋洲城市
    "堪培拉": {"lat": -35.2809, "lng": 149.1300},
    "悉尼": {"lat": -33.8688, "lng": 151.2093},
    "墨尔本": {"lat": -37.8136, "lng": 144.9631},
    "布里斯班": {"lat": -27.4698, "lng": 153.0251},
    "珀斯": {"lat": -31.9505, "lng": 115.8605},
    "惠灵顿": {"lat": -41.2865, "lng": 174.7762},
    "奥克兰": {"lat": -36.8485, "lng": 174.7633},

    # 非洲城市
    "开罗": {"lat": 30.0444, "lng": 31.2357},
    "约翰内斯堡": {"lat": -26.2041, "lng": 28.0473},
    "开普敦": {"lat": -33.9249, "lng": 18.4241},
    "内罗毕": {"lat": -1.2921, "lng": 36.8219},
    "拉各斯": {"lat": 6.5244, "lng": 3.3792},
    "阿克拉": {"lat": 5.6037, "lng": -0.1870},
    "达累斯萨拉姆": {"lat": -6.7924, "lng": 39.2083},
    "卡萨布兰卡": {"lat": 33.5731, "lng": -7.5898},
}


# ============ 地区映射 ============

COUNTRY_TO_REGION = {
    # 亚洲
    "中国": "Asia", "日本": "Asia", "韩国": "Asia", "印度": "Asia",
    "新加坡": "Asia", "泰国": "Asia", "马来西亚": "Asia", "越南": "Asia",
    "菲律宾": "Asia", "印度尼西亚": "Asia", "巴基斯坦": "Asia", "伊朗": "Asia",
    "伊拉克": "Asia", "以色列": "Asia", "沙特阿拉伯": "Asia", "阿联酋": "Asia",
    "土耳其": "Asia", "哈萨克斯坦": "Asia", "乌兹别克斯坦": "Asia",

    # 欧洲
    "英国": "Europe", "法国": "Europe", "德国": "Europe", "意大利": "Europe",
    "西班牙": "Europe", "俄罗斯": "Europe", "荷兰": "Europe", "比利时": "Europe",
    "瑞士": "Europe", "奥地利": "Europe", "瑞典": "Europe", "挪威": "Europe",
    "丹麦": "Europe", "芬兰": "Europe", "希腊": "Europe", "捷克": "Europe",
    "匈牙利": "Europe", "波兰": "Europe", "葡萄牙": "Europe", "爱尔兰": "Europe",
    "罗马尼亚": "Europe", "乌克兰": "Europe",

    # 美洲
    "美国": "Americas", "加拿大": "Americas", "墨西哥": "Americas",
    "阿根廷": "Americas", "巴西": "Americas", "智利": "Americas", "哥伦比亚": "Americas",
    "秘鲁": "Americas", "委内瑞拉": "Americas", "厄瓜多尔": "Americas",

    # 非洲
    "埃及": "Africa", "南非": "Africa", "尼日利亚": "Africa", "肯尼亚": "Africa",
    "摩洛哥": "Africa", "加纳": "Africa", "坦桑尼亚": "Africa", "埃塞俄比亚": "Africa",

    # 大洋洲
    "澳大利亚": "Oceania", "新西兰": "Oceania", "巴布亚新几内亚": "Oceania",
}


# ============ 解析器类 ============

class BookDetailParser:
    """书籍详情页面解析器"""

    def parse_detail_page(self, html: str) -> Optional[Dict]:
        """
        解析书籍详情页面

        返回: {
            'title': str,
            'author_name': str,
            'author_url': str,
            'publisher': str,
            'year': int,
            'pages': int,
            'isbn': str,
            'translator': str,
            'rating': float,
            'category': str
        }
        """
        if not html:
            return None

        try:
            soup = BeautifulSoup(html, "html.parser")

            # 解析书名
            title_elem = soup.find("h1")
            title = ""
            if title_elem:
                span = title_elem.find("span", property="v:itemreviewed")
                if span:
                    title = span.get_text().strip()

            if not title:
                return None

            # 解析信息区域
            info_div = soup.find("div", id="info")
            info_text = info_div.get_text() if info_div else ""

            # 解析作者
            author_name = ""
            author_url = ""
            # 首先在 #info 区域查找作者链接
            if info_div:
                author_link = info_div.find("a", href=re.compile(r"/author/\d+"))
                if author_link:
                    author_name = author_link.get_text().strip()
                    author_url = author_link.get("href", "")
            # 如果在 #info 区域没找到，在整个页面查找
            if not author_url:
                page_author_link = soup.find("a", href=re.compile(r"/author/\d+"))
                if page_author_link:
                    author_name = page_author_link.get_text().strip()
                    author_url = page_author_link.get("href", "")

            # 解析出版社
            publisher = self._extract_field(info_text, "出版社:")

            # 解析出版年
            year_str = self._extract_field(info_text, "出版年:")
            year = self._parse_year(year_str)

            # 解析页数
            pages_str = self._extract_field(info_text, "页数:")
            pages = self._parse_pages(pages_str)

            # 解析ISBN
            isbn = self._extract_field(info_text, "ISBN:")

            # 解析译者
            translator = self._extract_translator(info_div)

            # 解析评分
            rating_elem = soup.find("span", class_="rating_nums")
            rating = float(rating_elem.get_text()) if rating_elem else 0.0

            # 解析类别
            category = self._extract_category(soup)

            return {
                "title": title,
                "author_name": author_name,
                "author_url": author_url,
                "publisher": publisher,
                "year": year,
                "pages": pages,
                "isbn": isbn,
                "translator": translator,
                "rating": rating,
                "category": category,
            }
        except Exception as e:
            print(f"解析书籍详情失败: {e}")
            return None

    def _extract_field(self, text: str, field: str) -> str:
        """从信息文本中提取字段 - 处理<br>标签分隔的多行格式"""
        if field not in text:
            return ""
        idx = text.index(field) + len(field)
        # 跳过空白字符，查找下一个非空白内容
        while idx < len(text) and text[idx] in ' \t\n\r':
            idx += 1
        if idx >= len(text):
            return ""
        # 提取到下一个字段或行尾
        end_idx = idx
        while end_idx < len(text):
            if text[end_idx] == ':' and end_idx + 1 < len(text) and text[end_idx + 1] in ' \t\n\r':
                # 遇到下一个字段
                break
            if text[end_idx] == '\n':
                # 遇到换行
                break
            end_idx += 1
        return text[idx:end_idx].strip()

    def _parse_year(self, year_str: str) -> Optional[int]:
        """解析年份"""
        if not year_str:
            return None
        match = re.search(r"\d{4}", year_str)
        return int(match.group()) if match else None

    def _parse_pages(self, pages_str: str) -> Optional[int]:
        """解析页数"""
        if not pages_str:
            return None
        match = re.search(r"\d+", pages_str)
        return int(match.group()) if match else None

    def _extract_translator(self, info_div) -> str:
        """提取译者信息"""
        if not info_div:
            return ""
        # 译者通常在 ISBN 之后
        text = info_div.get_text()
        if "译者:" not in text:
            return ""
        try:
            idx = text.index("译者:") + 3
            end_idx = text.index("\n", idx) if "\n" in text[idx:] else len(text)
            translator = text[idx:end_idx].strip()
            # 清理链接
            return re.sub(r"\[.*?\]", "", translator).strip()
        except ValueError:
            return ""

    def _extract_category(self, soup) -> str:
        """提取类别"""
        # 类别通常在 div id="info" 之后
        info = soup.find("div", id="info")
        if info:
            text = info.get_text()
            # 提取第一个类别标签
            match = re.search(r"\[(\w+)\]", text)
            if match:
                return match.group(1)
        return "文学"


class AuthorParser:
    """作者信息页面解析器"""

    def parse_author_page(self, html: str) -> Optional[Dict]:
        """
        解析作者页面

        返回: {
            'name': str,
            'gender': str,
            'birth_date': str,
            'country': str,
            'birthplace': str
        }
        """
        if not html:
            return None

        try:
            soup = BeautifulSoup(html, "html.parser")

            # 解析作者名
            name_elem = soup.find("h1")
            name = name_elem.get_text().strip() if name_elem else ""

            if not name:
                return None

            # 解析信息区域
            info_div = soup.find("div", class_="info")
            info_text = info_div.get_text() if info_div else ""

            # 解析性别
            gender = self._extract_field(info_text, "性别:")

            # 解析出生日期
            birth_date = self._extract_field(info_text, "出生日期:")

            # 解析国家/地区
            country = self._extract_field(info_text, "国家/地区:")

            # 解析出生地
            birthplace = self._extract_field(info_text, "出生地:")

            return {
                "name": name,
                "gender": gender,
                "birth_date": birth_date,
                "country": country,
                "birthplace": birthplace,
            }
        except Exception as e:
            print(f"解析作者信息失败: {e}")
            return None

    def _extract_field(self, text: str, field: str) -> str:
        """从信息文本中提取字段"""
        if field not in text:
            return ""
        try:
            idx = text.index(field) + len(field)
            end_idx = text.index("\n", idx) if "\n" in text[idx:] else len(text)
            return text[idx:end_idx].strip()
        except ValueError:
            return ""


class AuthorParserWithPlaywright:
    """使用 Playwright 获取作者信息（处理反爬虫验证）"""

    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None

    def _ensure_browser(self):
        """确保浏览器已启动"""
        if not self.playwright:
            from playwright.sync_api import sync_playwright
            self.playwright = sync_playwright().start()
            self.browser = self.playwright.chromium.launch(headless=True)
            self.context = self.browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )

    def fetch_author_info(self, url: str) -> Optional[Dict]:
        """
        使用 Playwright 获取作者页面信息

        Args:
            url: 作者页面URL，如 https://book.douban.com/author/xxx

        Returns: {
            'name': str,
            'gender': str,
            'birth_date': str,
            'country': str,
            'birthplace': str
        }
        """
        try:
            self._ensure_browser()
            page = self.context.new_page()

            page.goto(url, timeout=30000)
            page.wait_for_timeout(3000)

            result = {
                'name': '',
                'gender': '',
                'birth_date': '',
                'country': '',
                'birthplace': ''
            }

            # 获取作者名（从 h1）
            h1 = page.locator('h1')
            if h1.count() > 0:
                h1_text = h1.inner_text()
                if h1_text:
                    result['name'] = h1_text.split()[0]

            # 如果 h1 没有，从 title 提取
            if not result['name']:
                title = page.title()
                if title and '作者' in title:
                    result['name'] = title.split('(')[0].strip()

            # 方法1: 查找地点信息 - 从 span 元素中查找包含逗号的地点
            spans = page.locator('span').all()
            for span in spans:
                text = span.inner_text().strip()
                # 格式如: "中国,山西,阳泉" - 排除版权信息
                if text and ',' in text and not text.startswith('©') and 'douban.com' not in text:
                    parts = [p.strip() for p in text.split(',')]
                    if len(parts) >= 1:
                        result['country'] = parts[0]  # 第一部分是国家
                    if len(parts) >= 2:
                        result['birthplace'] = ','.join(parts[1:])  # 剩余部分是出生地
                    break

            # 方法2: 查找性别信息
            if not result['gender']:
                for span in spans:
                    text = span.inner_text().strip()
                    if text == '男' or text == '女':
                        result['gender'] = text
                        break

            # 方法3: 查找出生日期 - 格式如 "1963年6月23日"
            for span in spans:
                text = span.inner_text().strip()
                import re
                if re.match(r'\d{4}年\d{1,2}月\d{0,2}日?', text):
                    result['birth_date'] = text
                    break

            page.close()
            return result if result['name'] else None

        except Exception as e:
            print(f"Playwright 获取作者信息失败: {e}")
            return None

    def close(self):
        """关闭浏览器"""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()


class BookListParser:
    """图书列表页面解析器"""

    def parse_list_page(self, html: str) -> List[Dict]:
        """
        解析图书列表页面

        返回: [{
            'rank': int,
            'title': str,
            'author': str,
            'publisher': str,
            'year': int,
            'rating': float,
            'category': str,
            'url': str
        }]
        """
        books = []
        if not html:
            return books

        try:
            soup = BeautifulSoup(html, "html.parser")
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
                author = "未知"
                publisher = "未知"
                year = None
                if info:
                    info_text = info.get_text()
                    parts = info_text.split("/")
                    author = parts[0].strip() if len(parts) > 0 else "未知"
                    publisher = parts[-2].strip() if len(parts) > 2 else "未知"
                    try:
                        year = int(parts[-1].strip()[:4]) if len(parts) > 1 else None
                    except (ValueError, IndexError):
                        year = None

                # 获取评分
                rating_elem = td.find("span", class_="rating_nums")
                rating = float(rating_elem.get_text()) if rating_elem else 0.0

                # 获取排名
                rank = None
                rank_elem = td.find("span", class_="rec")
                if rank_elem:
                    rank_text = rank_elem.get_text()
                    match = re.search(r"\d+", rank_text)
                    rank = int(match.group()) if match else None

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

        except Exception as e:
            print(f"解析图书列表失败: {e}")

        return books


class CoordinateResolver:
    """坐标解析器"""

    def resolve(self, country: str, city: Optional[str] = None) -> Optional[Dict[str, float]]:
        """
        根据国家和城市解析坐标

        Args:
            country: 国家/地区名称
            city: 城市名称 (可选)

        Returns:
            {'lat': float, 'lng': float} 或 None
        """
        # 优先使用城市坐标
        if city:
            city_coords = self._find_city_coords(city)
            if city_coords:
                return city_coords

        # 使用国家首都坐标
        if country:
            country_data = COUNTRY_COORDS.get(country)
            if country_data:
                return {
                    "lat": country_data["lat"],
                    "lng": country_data["lng"]
                }

        return None

    def _find_city_coords(self, city: str) -> Optional[Dict[str, float]]:
        """查找城市坐标"""
        return CITY_COORDS.get(city)


class RegionResolver:
    """地区(洲)解析器"""

    def resolve(self, country: str) -> str:
        """
        根据国家确定地区(洲)

        Args:
            country: 国家名称

        Returns:
            地区名称: Asia, Europe, Americas, Africa, Oceania, Unknown
        """
        return COUNTRY_TO_REGION.get(country, "Unknown")


class DoubanSpider:
    """豆瓣爬虫主类"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.book_parser = BookDetailParser()
        self.author_parser = AuthorParser()
        self.list_parser = BookListParser()
        self.coord_resolver = CoordinateResolver()
        self.region_resolver = RegionResolver()

    def fetch_page(self, url: str, timeout: int = 30) -> Optional[str]:
        """获取页面内容"""
        try:
            response = self.session.get(url, timeout=timeout)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"请求失败: {url}, 错误: {e}")
            return None

    def fetch_book_detail(self, url: str) -> Optional[Dict]:
        """获取书籍详情"""
        html = self.fetch_page(url)
        if not html:
            return None
        return self.book_parser.parse_detail_page(html)

    def fetch_author_info(self, url: str) -> Optional[Dict]:
        """获取作者信息"""
        html = self.fetch_page(url)
        if not html:
            return None
        return self.author_parser.parse_author_page(html)

    def fetch_top250(self, page: int = 0) -> List[Dict]:
        """获取豆瓣 Top 250 单页"""
        url = f"{BASE_URL}/top250?start={page * 25}"
        html = self.fetch_page(url)
        if not html:
            return []
        return self.list_parser.parse_list_page(html)

    def fetch_all_top250(self) -> List[Dict]:
        """获取豆瓣 Top 250 全部"""
        all_books = []
        for page in range(10):
            print(f"正在获取第 {page + 1}/10 页...")
            books = self.fetch_top250(page)
            all_books.extend(books)
            print(f"  获取到 {len(books)} 本书")
            time.sleep(random.uniform(2, 4))
        return all_books

    def enrich_book_with_author(self, book: Dict) -> Dict:
        """
        根据书籍详情页URL获取作者信息和坐标

        Args:
            book: 包含 'url' 字段的书籍字典

        Returns:
             enriched 后的书籍字典
        """
        if not book.get("url"):
            return book

        # 获取书籍详情
        detail = self.fetch_book_detail(book["url"])
        if not detail:
            return book

        # 更新书籍信息
        book.update({
            "title": detail.get("title", book.get("title")),
            "publisher": detail.get("publisher"),
            "year": detail.get("year"),
            "pages": detail.get("pages"),
            "isbn": detail.get("isbn"),
            "translator": detail.get("translator"),
            "rating": detail.get("rating", book.get("rating")),
            "category": detail.get("category", book.get("category")),
        })

        # 获取作者信息
        author_url = detail.get("author_url")
        if author_url:
            author_url_full = author_url if author_url.startswith("http") else BASE_URL + author_url
            author_info = self.fetch_author_info(author_url_full)

            if author_info:
                book["author"] = author_info.get("name", book.get("author"))
                book["author_gender"] = author_info.get("gender")
                book["author_birth_date"] = author_info.get("birth_date")
                book["author_country"] = author_info.get("country")
                book["author_birthplace"] = author_info.get("birthplace")

                # 解析坐标
                country = author_info.get("country")
                city = author_info.get("birthplace")
                coords = self.coord_resolver.resolve(country, city)
                if coords:
                    book["lat"] = coords["lat"]
                    book["lng"] = coords["lng"]
                else:
                    # 使用国家默认值
                    coords = self.coord_resolver.resolve(country)
                    if coords:
                        book["lat"] = coords["lat"]
                        book["lng"] = coords["lng"]

                # 解析地区
                if country:
                    book["region"] = self.region_resolver.resolve(country)
                    book["country"] = country

        time.sleep(random.uniform(1, 2))
        return book


# ============ 兼容旧接口 ============

def fetch_page(page: int) -> Optional[str]:
    """获取单页内容 (兼容旧接口)"""
    url = f"{BASE_URL}/top250?start={page * 25}"
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"请求页面 {page} 失败: {e}")
        return None


def parse_book_info(html: str) -> List[Dict]:
    """解析页面中的书籍信息 (兼容旧接口)"""
    parser = BookListParser()
    return parser.parse_list_page(html)


def fetch_all_books() -> List[Dict]:
    """爬取豆瓣 Top 250 图书 (兼容旧接口)"""
    spider = DoubanSpider()
    return spider.fetch_all_top250()


def save_books(books: List[Dict], filepath: str = "douban_books.json"):
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
