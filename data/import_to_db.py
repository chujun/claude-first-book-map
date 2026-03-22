#!/usr/bin/env python3
"""
数据导入脚本
将豆瓣书籍数据和国家坐标导入 SQLite 数据库
"""

import sqlite3
import json
import os
from typing import List, Dict, Optional


DB_PATH = "bookmap.db"
SCHEMA_PATH = "schema.sql"


def get_country_mapping() -> Dict[str, str]:
    """作者国家到国家代码的映射"""
    return {
        "中国": ("CN", "亚洲", 35.8617, 104.1954),
        "美国": ("US", "北美洲", 37.0902, -95.7129),
        "英国": ("GB", "欧洲", 51.5074, -0.1278),
        "法国": ("FR", "欧洲", 46.2276, 2.2137),
        "德国": ("DE", "欧洲", 51.1657, 10.4515),
        "日本": ("JP", "亚洲", 36.2048, 138.2529),
        "俄罗斯": ("RU", "欧洲", 55.7558, 37.6173),
        "韩国": ("KR", "亚洲", 35.9078, 127.7669),
        "印度": ("IN", "亚洲", 20.5937, 78.9629),
        "巴西": ("BR", "南美洲", -14.2350, -51.9253),
        "澳大利亚": ("AU", "大洋洲", -25.2744, 133.7751),
        "加拿大": ("CA", "北美洲", 56.1304, -106.3468),
        "意大利": ("IT", "欧洲", 41.8719, 12.5674),
        "西班牙": ("ES", "欧洲", 40.4637, -3.7492),
        "墨西哥": ("MX", "北美洲", 23.6345, -102.5528),
        "阿根廷": ("AR", "南美洲", -38.4161, -63.6167),
        "埃及": ("EG", "非洲", 26.8206, 30.8025),
        "南非": ("ZA", "非洲", -30.5595, 22.9375),
        "瑞典": ("SE", "欧洲", 60.1282, 18.6435),
        "挪威": ("NO", "欧洲", 60.4720, 8.4689),
        "芬兰": ("FI", "欧洲", 61.9241, 25.7482),
        "丹麦": ("DK", "欧洲", 56.2639, 9.5018),
        "荷兰": ("NL", "欧洲", 52.1326, 5.2913),
        "比利时": ("BE", "欧洲", 50.5039, 4.4699),
        "瑞士": ("CH", "欧洲", 46.8182, 8.2275),
        "奥地利": ("AT", "欧洲", 47.5162, 14.5501),
        "波兰": ("PL", "欧洲", 51.9194, 19.1451),
        "捷克": ("CZ", "欧洲", 49.8175, 15.4730),
        "希腊": ("GR", "欧洲", 39.0742, 21.8243),
        "葡萄牙": ("PT", "欧洲", 39.3999, -8.2245),
        "土耳其": ("TR", "亚洲", 38.9637, 35.2433),
        "伊朗": ("IR", "亚洲", 32.4279, 53.6880),
        "泰国": ("TH", "亚洲", 15.8700, 100.9925),
        "越南": ("VN", "亚洲", 14.0583, 108.2772),
        "新加坡": ("SG", "亚洲", 1.3521, 103.8198),
        "印度尼西亚": ("ID", "亚洲", -0.7893, 113.9213),
        "哥伦比亚": ("CO", "南美洲", 4.5709, -74.2973),
        "智利": ("CL", "南美洲", -35.6751, -71.5430),
        "秘鲁": ("PE", "南美洲", -9.1900, -75.0152),
        "乌克兰": ("UA", "欧洲", 48.3794, 31.1656),
        "罗马尼亚": ("RO", "欧洲", 45.9432, 24.9668),
        "匈牙利": ("HU", "欧洲", 47.1625, 19.5033),
        "爱尔兰": ("IE", "欧洲", 53.1424, -7.6921),
        "新西兰": ("NZ", "大洋洲", -40.9006, 174.8860),
        "以色列": ("IL", "亚洲", 31.0461, 34.8516),
        "巴基斯坦": ("PK", "亚洲", 30.3753, 69.3451),
        "菲律宾": ("PH", "亚洲", 12.8797, 121.7740),
        "马来西亚": ("MY", "亚洲", 4.2105, 101.9758),
        "尼日利亚": ("NG", "非洲", 9.0820, 8.6753),
        "肯尼亚": ("KE", "非洲", -0.0236, 37.9062),
        "摩洛哥": ("MA", "非洲", 31.7917, -7.0926),
        "阿尔及利亚": ("DZ", "非洲", 28.0339, 1.6596),
        "突尼斯": ("TN", "非洲", 33.8869, 9.5375),
        "古巴": ("CU", "北美洲", 21.5218, -77.7812),
        "委内瑞拉": ("VE", "南美洲", 6.4238, -66.5897),
        "塞尔维亚": ("RS", "欧洲", 44.0165, 21.0059),
        "克罗地亚": ("HR", "欧洲", 45.1000, 15.2000),
        "斯洛文尼亚": ("SI", "欧洲", 46.1512, 14.9955),
        "冰岛": ("IS", "欧洲", 64.9631, -19.0208),
        "卢森堡": ("LU", "欧洲", 49.8153, 6.1296),
    }


def create_tables(conn: sqlite3.Connection):
    """创建数据库表"""
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = f.read()
    conn.executescript(schema)
    conn.commit()
    print("数据库表已创建")


def import_country_coords(conn: sqlite3.Connection, coords: Dict):
    """导入国家坐标"""
    cursor = conn.cursor()

    for code, data in coords.items():
        if isinstance(data, dict) and "lat" in data:
            cursor.execute("""
                INSERT OR REPLACE INTO country_coords (country, capital, lat, lng)
                VALUES (?, ?, ?, ?)
            """, (
                data.get("country", ""),
                data.get("capital", ""),
                data.get("lat", 0),
                data.get("lng", 0)
            ))

    conn.commit()
    print(f"已导入 {len(coords)} 个国家坐标")


def import_books(conn: sqlite3.Connection, books: List[Dict]):
    """导入书籍数据"""
    cursor = conn.cursor()
    imported = 0

    # 国家坐标映射
    country_coords_map = {
        "CN": (35.8617, 104.1954),
        "US": (37.0902, -95.7129),
        "GB": (51.5074, -0.1278),
        "FR": (46.2276, 2.2137),
        "DE": (51.1657, 10.4515),
        "JP": (36.2048, 138.2529),
        "RU": (55.7558, 37.6173),
        "KR": (35.9078, 127.7669),
        "IN": (20.5937, 78.9629),
        "BR": (-14.2350, -51.9253),
        "AU": (-25.2744, 133.7751),
        "CA": (56.1304, -106.3468),
        "IT": (41.8719, 12.5674),
        "ES": (40.4637, -3.7492),
        "MX": (23.6345, -102.5528),
        "AR": (-38.4161, -63.6167),
        "EG": (26.8206, 30.8025),
        "ZA": (-30.5595, 22.9375),
        "SE": (60.1282, 18.6435),
        "NO": (60.4720, 8.4689),
        "FI": (61.9241, 25.7482),
        "DK": (56.2639, 9.5018),
        "NL": (52.1326, 5.2913),
        "BE": (50.5039, 4.4699),
        "CH": (46.8182, 8.2275),
        "AT": (47.5162, 14.5501),
        "PL": (51.9194, 19.1451),
        "CZ": (49.8175, 15.4730),
        "GR": (39.0742, 21.8243),
        "PT": (39.3999, -8.2245),
        "TR": (38.9637, 35.2433),
        "IR": (32.4279, 53.6880),
        "TH": (15.8700, 100.9925),
        "VN": (14.0583, 108.2772),
        "SG": (1.3521, 103.8198),
        "ID": (-0.7893, 113.9213),
        "CO": (4.5709, -74.2973),
        "CL": (-35.6751, -71.5430),
        "PE": (-9.1900, -75.0152),
        "UA": (48.3794, 31.1656),
        "RO": (45.9432, 24.9668),
        "HU": (47.1625, 19.5033),
        "IE": (53.1424, -7.6921),
        "NZ": (-40.9006, 174.8860),
        "IL": (31.0461, 34.8516),
        "PK": (30.3753, 69.3451),
        "PH": (12.8797, 121.7740),
        "MY": (4.2105, 101.9758),
        "NG": (9.0820, 8.6753),
        "KE": (-0.0236, 37.9062),
        "MA": (31.7917, -7.0926),
        "DZ": (28.0339, 1.6596),
        "TN": (33.8869, 9.5375),
        "CU": (21.5218, -77.7812),
        "VE": (6.4238, -66.5897),
        "RS": (44.0165, 21.0059),
        "HR": (45.1000, 15.2000),
        "SI": (46.1512, 14.9955),
        "IS": (64.9631, -19.0208),
        "LU": (49.8153, 6.1296),
    }

    for book in books:
        author = book.get("author", "未知")
        title = book.get("title", "")

        # 使用数据中已有的国家信息
        country = book.get("country", "未知")
        country_code = book.get("countryCode", "")
        region = book.get("region", "其他")

        # 获取坐标
        lat, lng = country_coords_map.get(country_code, (0, 0))

        try:
            cursor.execute("""
                INSERT OR REPLACE INTO books (
                    rank, title, author, country, country_code, region,
                    year, rating, category, publisher, url, lat, lng
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                book.get("rank", 0),
                title,
                author,
                country,
                country_code,
                region,
                book.get("year"),
                book.get("rating", 0),
                book.get("category", "文学"),
                book.get("publisher", ""),
                book.get("url", ""),
                lat,
                lng
            ))
            imported += 1
        except sqlite3.Error as e:
            print(f"导入书籍失败 {title}: {e}")

    conn.commit()
    print(f"已导入 {imported} 本书")


def verify_data(conn: sqlite3.Connection):
    """验证数据"""
    cursor = conn.cursor()

    # 统计书籍
    cursor.execute("SELECT COUNT(*) FROM books")
    book_count = cursor.fetchone()[0]
    print(f"数据库中共有 {book_count} 本书")

    # 统计国家
    cursor.execute("SELECT COUNT(DISTINCT country) FROM books")
    country_count = cursor.fetchone()[0]
    print(f"涉及 {country_count} 个国家")

    # 按国家统计
    cursor.execute("""
        SELECT country, COUNT(*) as cnt
        FROM books
        GROUP BY country
        ORDER BY cnt DESC
        LIMIT 10
    """)
    print("\n书籍数量前 10 的国家:")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]} 本")

    # 按评分排序的前 10 本
    cursor.execute("""
        SELECT title, author, rating
        FROM books
        ORDER BY rating DESC
        LIMIT 10
    """)
    print("\n评分最高的前 10 本书:")
    for row in cursor.fetchall():
        print(f"  {row[0]} - {row[1]}: {row[2]}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description='导入书籍数据到数据库')
    parser.add_argument('--force', action='store_true', help='强制重建数据库')
    args = parser.parse_args()

    print("开始导入数据...")

    # 连接数据库
    if args.force and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"已删除旧数据库 {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)

    try:
        # 创建表
        create_tables(conn)

        # 导入国家坐标
        country_coords = {
            "CN": {"country": "中国", "capital": "北京", "lat": 39.9042, "lng": 116.4074},
            "US": {"country": "美国", "capital": "华盛顿", "lat": 38.9072, "lng": -77.0369},
            "GB": {"country": "英国", "capital": "伦敦", "lat": 51.5074, "lng": -0.1278},
            "FR": {"country": "法国", "capital": "巴黎", "lat": 48.8566, "lng": 2.3522},
            "DE": {"country": "德国", "capital": "柏林", "lat": 52.5200, "lng": 13.4050},
            "JP": {"country": "日本", "capital": "东京", "lat": 35.6762, "lng": 139.6503},
            "RU": {"country": "俄罗斯", "capital": "莫斯科", "lat": 55.7558, "lng": 37.6173},
            "KR": {"country": "韩国", "capital": "首尔", "lat": 37.5665, "lng": 126.9780},
        }
        import_country_coords(conn, country_coords)

        # 读取豆瓣数据 - 尝试多个可能的文件名
        books = []
        for filename in ["douban_books.json", "douban_real.json", "douban_top1000.json"]:
            if os.path.exists(filename):
                with open(filename, "r", encoding="utf-8") as f:
                    books = json.load(f)
                print(f"从 {filename} 读取了 {len(books)} 本书")
                break
        else:
            print("警告: 未找到豆瓣数据文件")

        # 导入书籍
        if books:
            import_books(conn, books)

        # 验证
        verify_data(conn)

        print("\n数据导入完成!")

    except Exception as e:
        print(f"导入失败: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
