<!-- Generated: 2026-03-25 | Files scanned: 12 | Token estimate: ~600 -->

# Book-Map Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  index.html │  │  js/app.js  │  │  js/book-data.js    │ │
│  │  (entry)   │  │  (main app) │  │  (book data)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         │                 │                    │              │
│         └────────────────┴────────────────────┘              │
│                          │                                   │
│                    Globe.gl 3D Earth                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (optional API)
┌─────────────────────────────────────────────────────────────┐
│                    Python FastAPI Backend                    │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  run_api.py     │  │  api/                           │  │
│  │  (entry point)  │  │  routes.py (API endpoints)       │  │
│  │                 │  │  models.py (Pydantic models)      │  │
│  │                 │  │  db.py (SQLite operations)       │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

| File | Purpose | Lines |
|------|---------|-------|
| `js/app.js` | Main application logic, Globe.gl integration, clustering | ~450 |
| `js/book-data.js` | Book data with coordinates, fallback data | ~180 |
| `css/style.css` | Styling | - |
| `index.html` | Entry point | - |

### Key Modules (js/app.js)

```
app.js
├── Global State
│   ├── bookData, filteredBookData
│   ├── currentDecade, currentRegion, currentCountry (filters)
│   └── expandedClusterKey (clustering state)
│
├── Data Processing
│   ├── getBaseCoords(book) → {lat, lng}
│   ├── groupBooksByCoords(books) → Map
│   ├── expandClusterBooks(cluster) → books[]
│   └── processGlobeData(books) → Globe points
│
├── Globe Rendering
│   ├── initGlobe() → Globe.gl setup
│   ├── updateGlobe() → refresh points
│   └── addRandomOffset() → [legacy alias]
│
├── UI Components
│   ├── renderBookList()
│   ├── applyFilters()
│   └── showBookDetail()
│
└── Filters
    ├── initSearch()
    ├── initDecadeFilter()
    ├── initRegionFilter()
    └── initCountryFilter()
```

## Backend Architecture (Python FastAPI)

| File | Purpose |
|------|---------|
| `run_api.py` | FastAPI entry point, serves on :8000 |
| `api/routes.py` | REST API endpoints |
| `api/models.py` | Pydantic request/response models |
| `api/db.py` | SQLite database operations |
| `bookmap.db` | SQLite database file |

### API Endpoints

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/books` | `List[Book]` |
| GET | `/api/stats` | `{"total_books", "total_countries"}` |
| GET | `/api/countries` | `List[{"country", "count"}]` |

## Data Model

```
Book {
  rank: int
  title: str
  author: str
  country: str
  countryCode: str
  region: str (Europe|Asia|Americas|Africa|Oceania)
  lat: float
  lng: float
  category: str
  year: int
  rating: float
  // ... extended fields
}
```

## Clustering Feature

When multiple books share the same coordinates:
- Display cluster marker with count badge
- Click to expand books in spiral pattern around the point
- Click again or click elsewhere to collapse

### Clustering State Flow

```
processGlobeData(books)
    │
    ├── expandedClusterKey == null
    │   └── Show clusters for coords with >1 book
    │
    └── expandedClusterKey != null
        └── Expand that cluster, show other clusters
```

## Key Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Globe.gl | local (vendor/) | 3D Earth rendering |
| FastAPI | - | Python API backend |
| Pydantic | - | Data validation |
| Playwright | 1.58.2 | E2E testing |
