#!/usr/bin/env python3
"""
从 GeoNames 获取国家/城市坐标数据
用于获取各国首都和主要城市经纬度
"""

import requests
import zipfile
import io
import json
from typing import Dict, Optional


GEONAMES_URL = "https://download.geonames.org/export/dump/cities15000.zip"
COUNTRIES_URL = "https://download.geonames.org/export/dump/countryInfo.txt"


def download_file(url: str) -> bytes:
    """下载文件"""
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return response.content


def parse_cities_data(zip_data: bytes) -> Dict[str, Dict]:
    """解析城市数据，提取各国主要城市坐标"""
    cities = {}

    with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
        for filename in z.namelist():
            if filename.startswith("cities") and filename.endswith(".txt"):
                with z.open(filename) as f:
                    for line in f:
                        try:
                            line = line.decode("utf-8")
                            parts = line.strip().split("\t")
                            if len(parts) >= 15:
                                # GeoNames cities format:
                                # geonameid,name,asciiname,alternatenames,latitude,longitude,feature_class,feature_code,country_code,cc2,admin1_code,admin2_code,admin3_code,admin4_code,population,elevation,dem,timezone,modification_date
                                city_name = parts[1]
                                lat = float(parts[4])
                                lng = float(parts[5])
                                country_code = parts[9] if len(parts) > 9 else ""

                                if country_code and city_name:
                                    key = f"{country_code}_{city_name}"
                                    cities[key] = {
                                        "city": city_name,
                                        "country_code": country_code,
                                        "lat": lat,
                                        "lng": lng,
                                    }
                        except (ValueError, IndexError):
                            continue

    return cities


def parse_country_coords(info_data: bytes) -> Dict[str, Dict]:
    """解析国家信息，提取首都坐标"""
    countries = {}

    with zipfile.ZipFile(io.BytesIO(info_data)) as z:
        for filename in z.namelist():
            if filename == "countryInfo.txt":
                with z.open(filename) as f:
                    for line in f:
                        try:
                            line = line.decode("utf-8")
                            # 跳过注释行
                            if line.startswith("#"):
                                continue

                            parts = line.strip().split("\t")
                            if len(parts) >= 6:
                                # ISO, ISO3, ISO-Numeric, fips, Country, Capital, Continent, tld, CurrencyCode, CurrencyName, Phone, PostalCodeFormat, PostalCodeRegex, Languages, geonameid, neighbours, EquivalentFipsCode
                                country_code = parts[0]
                                country_name = parts[4] if len(parts) > 4 else ""
                                capital = parts[5] if len(parts) > 5 else ""

                                if country_code and capital:
                                    countries[country_code] = {
                                        "country": country_name,
                                        "capital": capital,
                                        "country_code": country_code,
                                    }
                        except (ValueError, IndexError):
                            continue

    return countries


def fetch_capital_coords() -> Dict[str, Dict]:
    """获取各国首都坐标"""
    print("正在下载 GeoNames 数据...")

    try:
        # 下载城市数据
        cities_data = download_file(GEONAMES_URL)
        cities = parse_cities_data(cities_data)
        print(f"解析到 {len(cities)} 个城市坐标")

        # 保存城市坐标
        with open("geonames_cities.json", "w", encoding="utf-8") as f:
            json.dump(cities, f, ensure_ascii=False, indent=2)

        return cities

    except requests.RequestException as e:
        print(f"下载失败: {e}")
        return {}


def create_country_coords_fallback() -> Dict[str, Dict]:
    """备用方案：常用国家首都坐标"""
    return {
        "CN": {"country": "中国", "capital": "北京", "lat": 39.9042, "lng": 116.4074},
        "US": {"country": "美国", "capital": "华盛顿", "lat": 38.9072, "lng": -77.0369},
        "GB": {"country": "英国", "capital": "伦敦", "lat": 51.5074, "lng": -0.1278},
        "FR": {"country": "法国", "capital": "巴黎", "lat": 48.8566, "lng": 2.3522},
        "DE": {"country": "德国", "capital": "柏林", "lat": 52.5200, "lng": 13.4050},
        "JP": {"country": "日本", "capital": "东京", "lat": 35.6762, "lng": 139.6503},
        "RU": {"country": "俄罗斯", "capital": "莫斯科", "lat": 55.7558, "lng": 37.6173},
        "KR": {"country": "韩国", "capital": "首尔", "lat": 37.5665, "lng": 126.9780},
        "IN": {"country": "印度", "capital": "新德里", "lat": 28.6139, "lng": 77.2090},
        "BR": {"country": "巴西", "capital": "巴西利亚", "lat": -15.7801, "lng": -47.9292},
        "AU": {"country": "澳大利亚", "capital": "堪培拉", "lat": -35.2809, "lng": 149.1300},
        "CA": {"country": "加拿大", "capital": "渥太华", "lat": 45.4215, "lng": -75.6972},
        "IT": {"country": "意大利", "capital": "罗马", "lat": 41.9028, "lng": 12.4964},
        "ES": {"country": "西班牙", "capital": "马德里", "lat": 40.4168, "lng": -3.7038},
        "MX": {"country": "墨西哥", "capital": "墨西哥城", "lat": 19.4326, "lng": -99.1332},
        "AR": {"country": "阿根廷", "capital": "布宜诺斯艾利斯", "lat": -34.6037, "lng": -58.3816},
        "EG": {"country": "埃及", "capital": "开罗", "lat": 30.0444, "lng": 31.2357},
        "NG": {"country": "尼日利亚", "capital": "阿布贾", "lat": 9.0765, "lng": 7.3986},
        "ZA": {"country": "南非", "capital": "比勒陀利亚", "lat": -25.7479, "lng": 28.2293},
        "KE": {"country": "肯尼亚", "capital": "内罗毕", "lat": -1.2864, "lng": 36.8172},
        "SE": {"country": "瑞典", "capital": "斯德哥尔摩", "lat": 59.3293, "lng": 18.0686},
        "NO": {"country": "挪威", "capital": "奥斯陆", "lat": 59.9139, "lng": 10.7522},
        "FI": {"country": "芬兰", "capital": "赫尔辛基", "lat": 60.1699, "lng": 24.9384},
        "DK": {"country": "丹麦", "capital": "哥本哈根", "lat": 55.6761, "lng": 12.5683},
        "NL": {"country": "荷兰", "capital": "阿姆斯特丹", "lat": 52.3676, "lng": 4.9041},
        "BE": {"country": "比利时", "capital": "布鲁塞尔", "lat": 50.8503, "lng": 4.3517},
        "CH": {"country": "瑞士", "capital": "伯尔尼", "lat": 46.9480, "lng": 7.4474},
        "AT": {"country": "奥地利", "capital": "维也纳", "lat": 48.2082, "lng": 16.3738},
        "PL": {"country": "波兰", "capital": "华沙", "lat": 52.2297, "lng": 21.0122},
        "CZ": {"country": "捷克", "capital": "布拉格", "lat": 50.0755, "lng": 14.4378},
        "GR": {"country": "希腊", "capital": "雅典", "lat": 37.9838, "lng": 23.7275},
        "PT": {"country": "葡萄牙", "capital": "里斯本", "lat": 38.7223, "lng": -9.1393},
        "TR": {"country": "土耳其", "capital": "安卡拉", "lat": 39.9334, "lng": 32.8597},
        "IR": {"country": "伊朗", "capital": "德黑兰", "lat": 35.6892, "lng": 51.3890},
        "IQ": {"country": "伊拉克", "capital": "巴格达", "lat": 33.3152, "lng": 44.3661},
        "SA": {"country": "沙特阿拉伯", "capital": "利雅得", "lat": 24.7136, "lng": 46.6753},
        "AE": {"country": "阿联酋", "capital": "阿布扎比", "lat": 24.4539, "lng": 54.3773},
        "TH": {"country": "泰国", "capital": "曼谷", "lat": 13.7563, "lng": 100.5018},
        "VN": {"country": "越南", "capital": "河内", "lat": 21.0285, "lng": 105.8542},
        "PH": {"country": "菲律宾", "capital": "马尼拉", "lat": 14.5995, "lng": 120.9842},
        "MY": {"country": "马来西亚", "capital": "吉隆坡", "lat": 3.1390, "lng": 101.6869},
        "SG": {"country": "新加坡", "capital": "新加坡", "lat": 1.3521, "lng": 103.8198},
        "ID": {"country": "印度尼西亚", "capital": "雅加达", "lat": -6.2088, "lng": 106.8456},
        "PK": {"country": "巴基斯坦", "capital": "伊斯兰堡", "lat": 33.6844, "lng": 73.0479},
        "BD": {"country": "孟加拉国", "capital": "达卡", "lat": 23.8103, "lng": 90.4125},
        "CO": {"country": "哥伦比亚", "capital": "波哥大", "lat": 4.7110, "lng": -74.0721},
        "CL": {"country": "智利", "capital": "圣地亚哥", "lat": -33.4489, "lng": -70.6693},
        "PE": {"country": "秘鲁", "capital": "利马", "lat": -12.0464, "lng": -77.0428},
        "VE": {"country": "委内瑞拉", "capital": "加拉加斯", "lat": 10.4806, "lng": -66.9036},
        "CU": {"country": "古巴", "capital": "哈瓦那", "lat": 23.1136, "lng": -82.3666},
        "UA": {"country": "乌克兰", "capital": "基辅", "lat": 50.4501, "lng": 30.5234},
        "RO": {"country": "罗马尼亚", "capital": "布加勒斯特", "lat": 44.4268, "lng": 26.1025},
        "HU": {"country": "匈牙利", "capital": "布达佩斯", "lat": 47.4979, "lng": 19.0402},
        "IE": {"country": "爱尔兰", "capital": "都柏林", "lat": 53.3498, "lng": -6.2603},
        "NZ": {"country": "新西兰", "capital": "惠灵顿", "lat": -41.2865, "lng": 174.7762},
    }


def main():
    coords = fetch_capital_coords()

    if not coords:
        print("使用备用坐标数据...")
        coords = create_country_coords_fallback()

    # 保存到文件
    with open("country_coords.json", "w", encoding="utf-8") as f:
        json.dump(coords, f, ensure_ascii=False, indent=2)

    print(f"已保存 {len(coords)} 个国家的坐标到 country_coords.json")


if __name__ == "__main__":
    main()
