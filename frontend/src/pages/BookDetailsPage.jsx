import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  ChevronRight,
  Heart,
  Library,
  Share2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import "../App.css";

// Temporary sample data.
// Later, we will replace this with data from the SmartShelf API.
const books = [
  {
    id: 1,
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    available: true,
    cover: "detail-cover-green",
    initials: "CC",
    description:
      "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Clean Code teaches the principles, patterns and practices of writing readable, maintainable and professional software.",
    publisher: "Prentice Hall",
    publishedYear: "2008",
    language: "English",
    pages: 464,
    isbn: "9780132350884",
    subject: "Software Engineering",
  },
  {
    id: 2,
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt and David Thomas",
    category: "Programming",
    available: true,
    cover: "detail-cover-cream",
    initials: "TPP",
    description:
      "A practical guide to becoming a better programmer. Discover techniques, habits and approaches that help software developers create better solutions and improve their craft.",
    publisher: "Addison-Wesley",
    publishedYear: "1999",
    language: "English",
    pages: 352,
    isbn: "9780201616224",
    subject: "Software Development",
  },
  {
    id: 3,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Personal Growth",
    available: false,
    cover: "detail-cover-blue",
    initials: "AH",
    description:
      "An exploration of how small changes can lead to remarkable results. Learn practical strategies for building good habits, breaking bad ones and making meaningful improvements.",
    publisher: "Avery",
    publishedYear: "2018",
    language: "English",
    pages: 320,
    isbn: "9780735211292",
    subject: "Personal Development",
  },
  {
    id: 4,
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen and others",
    category: "Technology",
    available: true,
    cover: "detail-cover-brown",
    initials: "IA",
    description:
      "A comprehensive introduction to modern computer algorithms, covering algorithm design, analysis, data structures and important computational techniques.",
    publisher: "MIT Press",
    publishedYear: "2009",
    language: "English",
    pages: 1312,
    isbn: "9780262033848",
    subject: "Computer Science",
  },
  {
    id: 5,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    category: "Personal Growth",
    available: true,
    cover: "detail-cover-rose",
    initials: "PM",
    description:
      "Timeless lessons about wealth, greed and happiness, exploring how people think about money and make financial decisions.",
    publisher: "Harriman House",
    publishedYear: "2020",
    language: "English",
    pages: 256,
    isbn: "9780857197689",
    subject: "Finance",
  },
  {
    id: 6,
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    category: "Programming",
    available: false,
    cover: "detail-cover-green",
    initials: "JS",
    description:
      "A focused look at the useful features of JavaScript and the programming techniques that help developers write more reliable code.",
    publisher: "O'Reilly Media",
    publishedYear: "2008",
    language: "English",
    pages: 176,
    isbn: "9780596517748",
    subject: "Web Development",
  },
  {
    id: 7,
    title: "Computer Networking",
    author: "James Kurose and Keith Ross",
    category: "Technology",
    available: true,
    cover: "detail-cover-blue",
    initials: "CN",
    description:
      "An introduction to computer networking concepts, protocols, network architecture and the technologies that make the Internet work.",
    publisher: "Pearson",
    publishedYear: "2021",
    language: "English",
    pages: 864,
    isbn: "9780136681557",
    subject: "Computer Networks",
  },
  {
    id: 8,
    title: "Deep Work",
    author: "Cal Newport",
    category: "Personal Growth",
    available: true,
    cover: "detail-cover-brown",
    initials: "DW",
    description:
      "A guide to developing the ability to focus without distraction on cognitively demanding tasks and produce valuable work.",
    publisher: "Grand Central Publishing",
    publishedYear: "2016",
    language: "English",
    pages: 304,
    isbn: "9781455586691",
    subject: "Productivity",
  },
];

function BookDetailsPage() {
  const { bookId } = useParams();

  const [isSaved, setIsSaved] = useState(false);
  const [notice, setNotice] = useState("");

  // Find the selected book
  const book = books.find((item) => item.id === Number(bookId));

  // Handle invalid book IDs
  if (!book) {
    return (
      <div className="book-not-found">
        <div className="not-found-icon">
          <BookOpen size={34} />
        </div>

        <h1>Book not found</h1>

        <p>
          We couldn't find the book you're looking for. It may have been moved
          or is no longer available.
        </p>

        <Link to="/explore" className="details-primary-button">
          <ArrowLeft size={17} />
          Back to Explore Books
        </Link>
      </div>
    );
  }

  // Find related books from the same category
  const relatedBooks = books
    .filter((item) => item.id !== book.id && item.category === book.category)
    .slice(0, 3);

  // Reservation preview
  const handleReserve = () => {
    if (!book.available) {
      setNotice("This book is currently unavailable.");
      return;
    }

    // Demo only. Real reservation requires login
    // and backend integration.
    setNotice(
      "This is a preview. Please log in when reservations are connected.",
    );
  };

  // Share book
  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: book.title,
          text: `Discover ${book.title} on SmartShelf.`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setNotice("Book link copied to clipboard.");
      }
    } catch {
      // Sharing was cancelled or is unavailable.
    }
  };

  return (
    <div className="app book-details-page">
      {/* Navigation */}
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
        {/* Breadcrumb */}
        <div className="details-breadcrumb">
          <Link to="/">Home</Link>

          <ChevronRight size={15} />

          <Link to="/explore">Explore Books</Link>

          <ChevronRight size={15} />

          <span>{book.title}</span>
        </div>

        {/* Main Book Information */}
        <section className="book-details-container">
          <div className="details-back-link">
            <Link to="/explore">
              <ArrowLeft size={17} />
              Back to collection
            </Link>
          </div>

          <div className="book-details-layout">
            {/* Book Cover */}
            <div className="details-cover-column">
              <div className="details-cover-frame">
                <div className={`details-book-cover ${book.cover}`}>
                  {/* Real book cover image */}
                  <img
                    src={`https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`}
                    alt={`${book.title} book cover`}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />

                  {/* Fallback design */}
                  <span className="details-cover-label">
                    SMARTSHELF LIBRARY
                  </span>

                  <div className="details-cover-art">
                    <span>{book.initials}</span>
                  </div>

                  <h2>{book.title}</h2>

                  <div className="details-cover-line" />

                  <p>{book.author}</p>
                </div>
              </div>

              <div className="cover-caption">
                <ShieldCheck size={16} />

                <span>University library collection</span>
              </div>
            </div>

            {/* Book Information */}
            <div className="details-info-column">
              <div className="details-category-row">
                <span className="details-category">{book.category}</span>

                <span
                  className={
                    book.available
                      ? "details-status available"
                      : "details-status unavailable"
                  }
                >
                  <span className="status-dot" />

                  {book.available ? "Available" : "Currently unavailable"}
                </span>
              </div>

              <h1 className="details-title">{book.title}</h1>

              <div className="details-author">
                <UserRound size={17} />

                <span>By {book.author}</span>
              </div>

              <div className="details-divider" />

              {/* Description */}
              <div className="details-description">
                <h2>About this book</h2>

                <p>{book.description}</p>
              </div>

              {/* Quick Information */}
              <div className="details-quick-info">
                <div>
                  <BookOpen size={19} />
                  <span>{book.pages} pages</span>
                </div>

                <div>
                  <CalendarDays size={19} />
                  <span>{book.publishedYear}</span>
                </div>

                <div>
                  <Library size={19} />
                  <span>{book.language}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="details-actions">
                <button
                  className="details-primary-button"
                  onClick={handleReserve}
                  disabled={!book.available}
                >
                  <Bookmark size={18} />

                  {book.available ? "Reserve this book" : "Unavailable"}
                </button>

                {/* Favourite Button */}
                <button
                  className={
                    isSaved
                      ? "details-icon-button saved"
                      : "details-icon-button"
                  }
                  onClick={() => setIsSaved(!isSaved)}
                  aria-label={isSaved ? "Remove from saved books" : "Save book"}
                  title={isSaved ? "Remove saved book" : "Save book"}
                >
                  <Heart size={19} fill={isSaved ? "currentColor" : "none"} />
                </button>

                {/* Share Button */}
                <button
                  className="details-icon-button"
                  onClick={handleShare}
                  aria-label="Share book"
                  title="Share book"
                >
                  <Share2 size={19} />
                </button>
              </div>

              {/* Notification */}
              {notice && (
                <div className="details-notice" role="status">
                  {notice}

                  <button onClick={() => setNotice("")}>Dismiss</button>
                </div>
              )}

              <p className="details-action-note">
                <ShieldCheck size={15} />
                Library borrowing is subject to account eligibility and library
                rules.
              </p>
            </div>
          </div>
        </section>

        {/* Additional Book Information */}
        <section className="book-metadata-section">
          <div className="metadata-heading">
            <span className="eyebrow">BOOK INFORMATION</span>

            <h2>More about this book</h2>
          </div>

          <div className="metadata-grid">
            <div className="metadata-card">
              <span>Publisher</span>
              <strong>{book.publisher}</strong>
            </div>

            <div className="metadata-card">
              <span>Publication year</span>
              <strong>{book.publishedYear}</strong>
            </div>

            <div className="metadata-card">
              <span>Subject</span>
              <strong>{book.subject}</strong>
            </div>

            <div className="metadata-card">
              <span>Language</span>
              <strong>{book.language}</strong>
            </div>

            <div className="metadata-card">
              <span>Pages</span>
              <strong>{book.pages}</strong>
            </div>

            <div className="metadata-card">
              <span>ISBN</span>
              <strong>{book.isbn}</strong>
            </div>
          </div>
        </section>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section className="related-books-section">
            <div className="related-heading">
              <div>
                <span className="eyebrow">KEEP DISCOVERING</span>

                <h2>Explore similar books</h2>

                <p>More books from the {book.category} collection.</p>
              </div>

              <Link to="/explore" className="related-view-all">
                View all books
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="related-books-grid">
              {relatedBooks.map((item) => (
                <Link
                  to={`/books/${item.id}`}
                  className="related-book-card"
                  key={item.id}
                >
                  {/* Related Book Cover */}
                  <div className={`related-book-cover ${item.cover}`}>
                    <img
                      src={`https://covers.openlibrary.org/b/isbn/${item.isbn}-M.jpg`}
                      alt={`${item.title} book cover`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />

                    <span>{item.initials}</span>
                  </div>

                  <div className="related-book-info">
                    <span>{item.category}</span>

                    <h3>{item.title}</h3>

                    <p>{item.author}</p>

                    <div className="related-book-link">
                      View details
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="details-footer">
        <Link to="/" className="brand">
          <span className="brand-icon">S</span>
          <span>SmartShelf</span>
        </Link>

        <p>Discover. Learn. Borrow.</p>

        <span>© 2026 SmartShelf. University Library Platform.</span>
      </footer>
    </div>
  );
}

export default BookDetailsPage;
