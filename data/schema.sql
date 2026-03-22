-- Books Map Database Schema

CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rank INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code TEXT,
    region TEXT NOT NULL,
    year INTEGER,
    rating REAL,
    rating_count INTEGER,
    category TEXT,
    publisher TEXT,
    url TEXT,
    lat REAL,
    lng REAL,
    price TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    country TEXT NOT NULL,
    region TEXT NOT NULL,
    lat REAL,
    lng REAL
);

CREATE TABLE IF NOT EXISTS country_coords (
    country TEXT UNIQUE NOT NULL,
    capital TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_country ON books(country);
CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating DESC);
CREATE INDEX IF NOT EXISTS idx_books_region ON books(region);
