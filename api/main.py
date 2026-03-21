#!/usr/bin/env python3
"""
全球书籍地图 API
提供书籍列表、详情、统计等接口
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal
import sqlite3
import os


DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "bookmap.db")

app = FastAPI(
    title="全球书籍地图 API",
    description="提供全球书籍分布数据的查询接口",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


class Book(BaseModel):
    id: int
    rank: int
    title: str
    author: str
    country: str
    country_code: Optional[str]
    region: str
    year: Optional[int]
    rating: float
    category: Optional[str]
    publisher: Optional[str]
    url: Optional[str]
    lat: Optional[float]
    lng: Optional[float]


class CountryStats(BaseModel):
    country: str
    country_code: Optional[str]
    region: str
    count: int
    avg_rating: float
    lat: Optional[float]
    lng: Optional[float]


class Stats(BaseModel):
    total_books: int
    total_countries: int
    total_regions: int
    avg_rating: float
    top_countries: List[CountryStats]


class CountryInfo(BaseModel):
    country: str
    country_code: Optional[str]
    region: str
    lat: Optional[float]
    lng: Optional[float]


@app.get("/")
def root():
    """API 根路径"""
    return {
        "name": "全球书籍地图 API",
        "version": "1.0.0",
        "endpoints": {
            "books": "/api/books",
            "book_detail": "/api/books/{id}",
            "stats": "/api/stats",
            "countries": "/api/countries"
        }
    }


@app.get("/api/books", response_model=List[Book])
def get_books(
    country: Optional[str] = Query(None, description="按国家筛选(模糊匹配)"),
    region: Optional[str] = Query(None, description="按地区筛选(模糊匹配)"),
    category: Optional[str] = Query(None, description="按类别筛选"),
    decade: Optional[str] = Query(None, description="按年代筛选(如: 90 匹配 1990年代)"),
    min_rating: Optional[float] = Query(None, ge=0, le=10, description="最低评分"),
    limit: int = Query(100, ge=1, le=1000, description="返回数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    sort_by: Literal["rank", "rating", "year", "title"] = Query("rank", description="排序字段"),
    order: Literal["asc", "desc"] = Query("asc", description="排序方向")
):
    """获取书籍列表，支持筛选和分页"""
    conn = get_db()
    cursor = conn.cursor()

    # 构建查询
    conditions = []
    params = []

    if country:
        conditions.append("country LIKE ?")
        params.append(f"%{country}%")

    if region:
        conditions.append("region LIKE ?")
        params.append(f"%{region}%")

    if category:
        conditions.append("category = ?")
        params.append(category)

    if decade:
        # decade: "90" -> 1990-1999, "2000" -> 2000-2009
        if len(decade) == 2:
            year_start = 1900 + int(decade)
        else:
            year_start = int(decade)
        year_end = year_start + 9
        conditions.append("year >= ? AND year <= ?")
        params.append(year_start)
        params.append(year_end)

    if min_rating is not None:
        conditions.append("rating >= ?")
        params.append(min_rating)

    where_clause = " AND ".join(conditions) if conditions else "1=1"
    order_clause = f"{sort_by} {'DESC' if order == 'desc' else 'ASC'}"

    query = f"""
        SELECT id, rank, title, author, country, country_code, region,
               year, rating, category, publisher, url, lat, lng
        FROM books
        WHERE {where_clause}
        ORDER BY {order_clause}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [Book(**dict(row)) for row in rows]


@app.get("/api/books/{book_id}", response_model=Book)
def get_book(book_id: int):
    """获取书籍详情"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, rank, title, author, country, country_code, region,
               year, rating, category, publisher, url, lat, lng
        FROM books WHERE id = ?
    """, (book_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="书籍未找到")

    return Book(**dict(row))


@app.get("/api/stats", response_model=Stats)
def get_stats():
    """获取统计信息"""
    conn = get_db()
    cursor = conn.cursor()

    # 总览统计
    cursor.execute("""
        SELECT COUNT(*) as total,
               COUNT(DISTINCT country) as countries,
               COUNT(DISTINCT region) as regions,
               AVG(rating) as avg_rating
        FROM books
    """)
    row = cursor.fetchone()
    stats = {
        "total_books": row["total"],
        "total_countries": row["countries"],
        "total_regions": row["regions"],
        "avg_rating": round(row["avg_rating"] or 0, 2)
    }

    # 按国家统计前 10
    cursor.execute("""
        SELECT country, country_code, region, COUNT(*) as count,
               AVG(rating) as avg_rating, AVG(lat) as lat, AVG(lng) as lng
        FROM books
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
    """)
    rows = cursor.fetchall()
    conn.close()

    stats["top_countries"] = [
        CountryStats(
            country=row["country"],
            country_code=row["country_code"],
            region=row["region"],
            count=row["count"],
            avg_rating=round(row["avg_rating"] or 0, 2),
            lat=row["lat"],
            lng=row["lng"]
        )
        for row in rows
    ]

    return Stats(**stats)


@app.get("/api/countries", response_model=List[CountryInfo])
def get_countries():
    """获取国家列表"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DISTINCT country, country_code, region,
               AVG(lat) as lat, AVG(lng) as lng
        FROM books
        GROUP BY country
        ORDER BY country
    """)

    rows = cursor.fetchall()
    conn.close()

    return [
        CountryInfo(
            country=row["country"],
            country_code=row["country_code"],
            region=row["region"],
            lat=row["lat"],
            lng=row["lng"]
        )
        for row in rows
    ]


@app.get("/api/categories", response_model=List[str])
def get_categories():
    """获取所有类别"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT category FROM books ORDER BY category")
    rows = cursor.fetchall()
    conn.close()

    return [row["category"] for row in rows]


@app.get("/api/regions", response_model=List[str])
def get_regions():
    """获取所有地区"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT region FROM books ORDER BY region")
    rows = cursor.fetchall()
    conn.close()

    return [row["region"] for row in rows]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
