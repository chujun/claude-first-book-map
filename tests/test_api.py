"""
Test suite for FastAPI endpoints - TDD RED phase
Tests written first before implementation
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.main import app

client = TestClient(app)


class TestRootEndpoint:
    """Test the root endpoint"""

    def test_root_returns_200(self):
        """Root endpoint should return 200 status"""
        response = client.get("/")
        assert response.status_code == 200

    def test_root_returns_api_info(self):
        """Root endpoint should return API name and version"""
        response = client.get("/")
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "endpoints" in data


class TestBooksEndpoint:
    """Test GET /api/books endpoint"""

    def test_get_books_returns_200(self):
        """Books endpoint should return 200 status"""
        response = client.get("/api/books")
        assert response.status_code == 200

    def test_get_books_returns_list(self):
        """Books endpoint should return a list"""
        response = client.get("/api/books")
        data = response.json()
        assert isinstance(data, list)

    def test_get_books_returns_books_with_required_fields(self):
        """Each book should have required fields"""
        response = client.get("/api/books?limit=1")
        books = response.json()
        assert len(books) > 0
        book = books[0]
        required_fields = ["id", "rank", "title", "author", "country", "region", "rating"]
        for field in required_fields:
            assert field in book, f"Missing required field: {field}"

    def test_get_books_pagination_limit(self):
        """Books endpoint should respect limit parameter"""
        response = client.get("/api/books?limit=5")
        books = response.json()
        assert len(books) <= 5

    def test_get_books_pagination_offset(self):
        """Books endpoint should respect offset parameter"""
        # Get first 5 books
        first_batch = client.get("/api/books?limit=5&sort_by=rank&order=asc").json()
        # Get next 5 books using offset
        second_batch = client.get("/api/books?limit=5&offset=5&sort_by=rank&order=asc").json()

        if len(first_batch) >= 5 and len(second_batch) >= 5:
            # The books should be different
            assert first_batch[0]["id"] != second_batch[0]["id"]

    def test_get_books_filter_by_country(self):
        """Books endpoint should filter by country"""
        # Get a sample country from the data
        sample_book = client.get("/api/books?limit=1").json()[0]
        country = sample_book["country"]

        response = client.get(f"/api/books?country={country}")
        books = response.json()
        assert all(book["country"] == country for book in books)

    def test_get_books_filter_by_region(self):
        """Books endpoint should filter by region"""
        # Get a sample region from the data
        sample_book = client.get("/api/books?limit=1").json()[0]
        region = sample_book["region"]

        response = client.get(f"/api/books?region={region}")
        books = response.json()
        assert all(book["region"] == region for book in books)

    def test_get_books_filter_by_category(self):
        """Books endpoint should filter by category"""
        # Get a sample category from the data
        sample_book = client.get("/api/books?limit=1").json()[0]
        category = sample_book.get("category")

        if category:  # Only test if category exists
            response = client.get(f"/api/books?category={category}")
            books = response.json()
            assert all(book.get("category") == category for book in books)

    def test_get_books_filter_by_min_rating(self):
        """Books endpoint should filter by minimum rating"""
        min_rating = 9.0
        response = client.get(f"/api/books?min_rating={min_rating}")
        books = response.json()
        assert all(book["rating"] >= min_rating for book in books)

    def test_get_books_sort_by_rating_desc(self):
        """Books endpoint should sort by rating descending"""
        response = client.get("/api/books?sort_by=rating&order=desc&limit=10")
        books = response.json()
        if len(books) >= 2:
            # Check that ratings are in descending order
            for i in range(len(books) - 1):
                assert books[i]["rating"] >= books[i + 1]["rating"]

    def test_get_books_sort_by_year(self):
        """Books endpoint should sort by year"""
        response = client.get("/api/books?sort_by=year&order=asc&limit=10")
        books = response.json()
        # Filter out books with no year
        books_with_year = [b for b in books if b.get("year") is not None]
        if len(books_with_year) >= 2:
            for i in range(len(books_with_year) - 1):
                if books_with_year[i].get("year") and books_with_year[i + 1].get("year"):
                    assert books_with_year[i]["year"] <= books_with_year[i + 1]["year"]


class TestBookDetailEndpoint:
    """Test GET /api/books/{id} endpoint"""

    def test_get_book_detail_returns_200(self):
        """Book detail endpoint should return 200 for existing book"""
        # First get a valid book id
        books = client.get("/api/books?limit=1").json()
        book_id = books[0]["id"]

        response = client.get(f"/api/books/{book_id}")
        assert response.status_code == 200

    def test_get_book_detail_returns_book(self):
        """Book detail endpoint should return the correct book"""
        books = client.get("/api/books?limit=1").json()
        book_id = books[0]["id"]

        response = client.get(f"/api/books/{book_id}")
        book = response.json()
        assert book["id"] == book_id

    def test_get_book_detail_returns_404_for_nonexistent(self):
        """Book detail endpoint should return 404 for non-existent book"""
        # Use a very high id that likely doesn't exist
        response = client.get("/api/books/999999")
        assert response.status_code == 404

    def test_get_book_detail_returns_correct_structure(self):
        """Book detail should have all required fields"""
        books = client.get("/api/books?limit=1").json()
        book_id = books[0]["id"]

        response = client.get(f"/api/books/{book_id}")
        book = response.json()
        required_fields = ["id", "rank", "title", "author", "country", "region", "rating"]
        for field in required_fields:
            assert field in book


class TestStatsEndpoint:
    """Test GET /api/stats endpoint"""

    def test_get_stats_returns_200(self):
        """Stats endpoint should return 200"""
        response = client.get("/api/stats")
        assert response.status_code == 200

    def test_get_stats_returns_expected_fields(self):
        """Stats endpoint should return expected fields"""
        response = client.get("/api/stats")
        data = response.json()
        required_fields = ["total_books", "total_countries", "total_regions", "avg_rating", "top_countries"]
        for field in required_fields:
            assert field in data

    def test_get_stats_total_books_matches_db(self):
        """Total books should match actual count from database"""
        import sqlite3
        import os
        response = client.get("/api/stats")
        data = response.json()

        # Query database directly to get actual count
        db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'bookmap.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM books")
        actual_count = cursor.fetchone()[0]
        conn.close()

        assert data["total_books"] == actual_count

    def test_get_stats_top_countries_structure(self):
        """Top countries should have correct structure"""
        response = client.get("/api/stats")
        data = response.json()
        top_countries = data.get("top_countries", [])
        if len(top_countries) > 0:
            country = top_countries[0]
            assert "country" in country
            assert "count" in country
            assert "avg_rating" in country


class TestCountriesEndpoint:
    """Test GET /api/countries endpoint"""

    def test_get_countries_returns_200(self):
        """Countries endpoint should return 200"""
        response = client.get("/api/countries")
        assert response.status_code == 200

    def test_get_countries_returns_list(self):
        """Countries endpoint should return a list"""
        response = client.get("/api/countries")
        data = response.json()
        assert isinstance(data, list)

    def test_get_countries_returns_unique_countries(self):
        """Countries endpoint should return unique countries"""
        response = client.get("/api/countries")
        countries = response.json()
        # Extract country names and check uniqueness
        country_names = [c["country"] for c in countries]
        assert len(country_names) == len(set(country_names))

    def test_get_countries_structure(self):
        """Each country should have required fields"""
        response = client.get("/api/countries")
        countries = response.json()
        if len(countries) > 0:
            country = countries[0]
            required_fields = ["country", "region"]
            for field in required_fields:
                assert field in country


class TestCategoriesEndpoint:
    """Test GET /api/categories endpoint"""

    def test_get_categories_returns_200(self):
        """Categories endpoint should return 200"""
        response = client.get("/api/categories")
        assert response.status_code == 200

    def test_get_categories_returns_list(self):
        """Categories endpoint should return a list"""
        response = client.get("/api/categories")
        data = response.json()
        assert isinstance(data, list)

    def test_get_categories_returns_strings(self):
        """Categories should be strings"""
        response = client.get("/api/categories")
        categories = response.json()
        if len(categories) > 0:
            assert isinstance(categories[0], str)


class TestRegionsEndpoint:
    """Test GET /api/regions endpoint"""

    def test_get_regions_returns_200(self):
        """Regions endpoint should return 200"""
        response = client.get("/api/regions")
        assert response.status_code == 200

    def test_get_regions_returns_list(self):
        """Regions endpoint should return a list"""
        response = client.get("/api/regions")
        data = response.json()
        assert isinstance(data, list)

    def test_get_regions_returns_strings(self):
        """Regions should be strings"""
        response = client.get("/api/regions")
        regions = response.json()
        if len(regions) > 0:
            assert isinstance(regions[0], str)


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_get_books_with_invalid_limit(self):
        """Invalid limit should be rejected"""
        # limit > 1000 should fail due to validation
        response = client.get("/api/books?limit=2000")
        assert response.status_code == 422  # Validation error

    def test_get_books_with_negative_offset(self):
        """Negative offset should be rejected"""
        response = client.get("/api/books?offset=-1")
        assert response.status_code == 422  # Validation error

    def test_get_books_with_invalid_rating(self):
        """Rating > 10 should be rejected"""
        response = client.get("/api/books?min_rating=15")
        assert response.status_code == 422  # Validation error

    def test_get_books_with_invalid_sort_field(self):
        """Invalid sort field should be rejected"""
        response = client.get("/api/books?sort_by=invalid_field")
        assert response.status_code == 422  # Validation error

    def test_get_book_with_invalid_id_type(self):
        """Non-integer book id should return 404 or 422"""
        response = client.get("/api/books/invalid")
        assert response.status_code in [404, 422]

    def test_get_books_filter_nonexistent_country(self):
        """Filter by non-existent country should return empty list"""
        response = client.get("/api/books?country=NonExistentCountry123")
        books = response.json()
        assert books == [] or len(books) == 0

    def test_get_books_filter_nonexistent_region(self):
        """Filter by non-existent region should return empty list"""
        response = client.get("/api/books?region=NonExistentRegion123")
        books = response.json()
        assert books == [] or len(books) == 0
