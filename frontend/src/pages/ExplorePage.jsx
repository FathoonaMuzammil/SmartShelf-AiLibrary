import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Search } from "lucide-react";

import SearchBar from "../components/common/SearchBar";
import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";

import "../App.css";

// Temporary sample data.
// Later, we will connect this to the SmartShelf backend API.
const books = [
  {
    id: 1,
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    available: true,
    cover: "cover-green",
    isbn: "9780132350884",
  },
  {
    id: 2,
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt",
    category: "Programming",
    available: true,
    cover: "cover-cream",
    isbn: "9780135957059",
  },
  {
    id: 3,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Personal Growth",
    available: false,
    cover: "cover-blue",
    isbn: "9780735211292",
  },
  {
    id: 4,
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    category: "Technology",
    available: true,
    cover: "cover-brown",
    isbn: "9780262046305",
  },
  {
    id: 5,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    category: "Personal Growth",
    available: true,
    cover: "cover-cream",
    isbn: "9780857197689",
  },
  {
    id: 6,
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    category: "Programming",
    available: false,
    cover: "cover-green",
    isbn: "9780596517748",
  },
  {
    id: 7,
    title: "Computer Networking",
    author: "James Kurose",
    category: "Technology",
    available: true,
    cover: "cover-blue",
    isbn: "9780136681557",
  },
  {
    id: 8,
    title: "Deep Work",
    author: "Cal Newport",
    category: "Personal Growth",
    available: true,
    cover: "cover-brown",
    isbn: "9781455586691",
  },
];

function ExplorePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [sortOrder, setSortOrder] = useState("default");

  const categories = ["All", "Programming", "Technology", "Personal Growth"];

  // Search and filter books.
  let filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = category === "All" || book.category === category;

    const matchesAvailability =
      availability === "All" ||
      (availability === "Available" && book.available) ||
      (availability === "Unavailable" && !book.available);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Sort books.
  if (sortOrder === "title") {
    filteredBooks = [...filteredBooks].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }

  if (sortOrder === "author") {
    filteredBooks = [...filteredBooks].sort((a, b) =>
      a.author.localeCompare(b.author),
    );
  }

  // Reset all filters.
  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setAvailability("All");
    setSortOrder("default");
  };

  return (
    <div className="app explore-page-wrapper">
      {/* Navigation Bar */}
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">S</span>
          <span>SmartShelf</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>

          <Link to="/explore" className="active-link">
            Explore Books
          </Link>

          <Link to="/about">About</Link>
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="login-link">
            Login
          </Link>

          <Link to="/register" className="signup-button">
            Get Started
          </Link>
        </div>
      </header>

      <main className="explore-page">
        {/* Page Heading */}
        <section className="explore-page-heading">
          <span className="eyebrow">DISCOVER YOUR NEXT READ</span>

          <h1>Explore Our Books</h1>

          <p>
            Find books that inspire you, expand your knowledge, and support your
            learning journey.
          </p>
        </section>

        {/* Search and Filters */}
        <section className="explore-controls">
          {/* Reusable Search Bar */}
          <SearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search by book title or author..."
            className="explore-search"
          />

          {/* Filter Section */}
          <div className="explore-filter-row">
            {/* Category Filter */}
            <div className="filter-group">
              <label>Category</label>

              <div className="category-filters">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      category === item
                        ? "category-button active"
                        : "category-button"
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="filter-group">
              <label htmlFor="availability">Availability</label>

              <select
                id="availability"
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
              >
                <option value="All">All Books</option>
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="filter-group">
              <label htmlFor="sort">Sort By</label>

              <select
                id="sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="default">Default</option>
                <option value="title">Book Title</option>
                <option value="author">Author Name</option>
              </select>
            </div>
          </div>
        </section>

        {/* Book Collection */}
        <section className="explore-results">
          <div className="results-heading">
            <div>
              <h2>Our Collection</h2>
              <p>Explore our carefully selected books.</p>
            </div>

            <span className="results-count">
              <BookOpen size={16} />
              {filteredBooks.length} books found
            </span>
          </div>

          {/* Book Cards */}
          <div className="books-grid">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <Link
                  to={`/books/${book.id}`}
                  className="featured-book"
                  key={book.id}
                >
                  {/* Real Book Cover */}
                  <div className={`book-cover ${book.cover}`}>
                    <img
                      src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`}
                      alt={`${book.title} book cover`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />

                    {/* Fallback title */}
                    <span>{book.title}</span>
                  </div>

                  <div className="book-info">
                    <span className="book-category">{book.category}</span>

                    <h3>{book.title}</h3>

                    <p>{book.author}</p>

                    {/* Reusable Status Badge */}
                    <StatusBadge
                      status={book.available ? "Available" : "Unavailable"}
                    />

                    <span className="view-book-details">
                      View book details
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              /* Reusable Empty State */
              <div className="explore-empty">
                <EmptyState
                  icon={Search}
                  title="No books found"
                  message="We couldn't find books matching your search. Try changing your filters."
                  actionLabel="Clear All Filters"
                  onAction={clearFilters}
                />
              </div>
            )}
          </div>
        </section>

        {/* Discovery Footer Banner */}
        <section className="explore-bottom-banner">
          <div>
            <span>YOUR NEXT CHAPTER STARTS HERE</span>

            <h2>Discover. Learn. Borrow.</h2>

            <p>
              Explore knowledge and find your next favourite book with
              SmartShelf.
            </p>
          </div>

          <BookOpen size={55} strokeWidth={1.3} />
        </section>
      </main>
    </div>
  );
}

export default ExplorePage;
