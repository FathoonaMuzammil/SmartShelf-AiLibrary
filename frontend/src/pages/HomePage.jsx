import { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

// Temporary sample data for frontend development
const books = [
  {
    id: 1,
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    cover: "cover-green",
  },
  {
    id: 2,
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt",
    category: "Programming",
    cover: "cover-cream",
  },
  {
    id: 3,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Personal Growth",
    cover: "cover-blue",
  },
  {
    id: 4,
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    category: "Technology",
    cover: "cover-brown",
  },
];

function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Programming", "Technology", "Personal Growth"];

  // Filter books according to search and selected category
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || book.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app">
      {/* Navigation Bar */}
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">S</span>
          <span>SmartShelf</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/explore">Explore Books</Link>
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

      <main>
        {/* Hero Section */}
        <section className="hero-section" id="home">
          <div className="hero-content">
            <span className="eyebrow">YOUR UNIVERSITY LIBRARY, REIMAGINED</span>

            <h1>
              Discover your next
              <span> great read.</span>
            </h1>

            <p>
              Explore books, discover new knowledge, and find your next
              favourite read with SmartShelf — your intelligent library
              companion.
            </p>

            <div className="hero-buttons">
              <Link to="/explore" className="primary-button">
                Explore Books →
              </Link>

              <a href="#about" className="secondary-button">
                Learn More
              </a>
            </div>

            <div className="hero-note">
              <span>✦</span> Discover. Learn. Borrow.
            </div>
          </div>

          <div className="hero-visual">
            <div className="decorative-circle"></div>

            <div className="book-card">
              <div className="book-placeholder">BOOKS</div>

              <div className="book-caption">
                <span>Knowledge begins here.</span>
                <strong>Explore something new.</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Book Discovery Section */}
        <section className="explore-section" id="explore">
          <span className="eyebrow">START YOUR DISCOVERY</span>

          <h2>Find your next favourite book</h2>

          <p>Search through books and explore different categories.</p>

          {/* Search Bar */}
          <div className="book-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search by book title or author..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {/* Category Filters */}
          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                className={
                  selectedCategory === category
                    ? "category-button active"
                    : "category-button"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Book Cards */}
          <div className="books-grid">
            {filteredBooks.length > 0 ? (
              filteredBooks.map((book) => (
                <article className="featured-book" key={book.id}>
                  <div className={`book-cover ${book.cover}`}>
                    <span>{book.title}</span>
                  </div>

                  <div className="book-info">
                    <span className="book-category">{book.category}</span>

                    <h3>{book.title}</h3>

                    <p>{book.author}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="no-books">No books found. Try another search.</p>
            )}
          </div>
        </section>

        {/* About Section */}
        <section className="about-section" id="about">
          <h2>About SmartShelf</h2>

          <p>Your AI-powered library discovery and recommendation system.</p>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
