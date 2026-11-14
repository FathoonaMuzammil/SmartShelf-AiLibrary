import { useEffect, useState } from "react";
import { BookOpen, MapPin, Search } from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import SearchBar from "../../components/common/SearchBar";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";

import { getBooks, getFilters } from "../../services/studentService";

import "./DiscoverBooksPage.css";

function DiscoverBooksPage() {
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [availability, setAvailability] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load subjects and topics once
  useEffect(() => {
    getFilters()
      .then((data) => {
        setSubjects(data.subjects);
        setTopics(data.topics);
      })
      .catch((err) => setError(err.message));
  }, []);

  // Load books whenever a filter changes (search waits 400ms after typing)
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      setLoading(true);
      setError("");

      getBooks({
        search,
        subject_id: subjectId,
        topic_id: topicId,
        availability,
      })
        .then((data) => {
          if (!cancelled) setBooks(data.books);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, subjectId, topicId, availability]);

  // Only show topics of the selected subject
  const visibleTopics = subjectId
    ? topics.filter((topic) => String(topic.subject_id) === String(subjectId))
    : topics;

  const clearFilters = () => {
    setSearch("");
    setSubjectId("");
    setTopicId("");
    setAvailability("");
  };

  const getCoverUrl = (book) => {
    if (book.cover_image_url) return book.cover_image_url;
    if (book.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
    }
    return "";
  };

  return (
    <DashboardLayout
      role="student"
      title="Discover Books"
      activeItem="Discover Books"
    >
      <section className="discover-heading">
        <h1>Discover Books</h1>
        <p>Search the library, check availability and find the shelf.</p>
      </section>

      {/* Search and filters */}
      <section className="discover-controls">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search by title, author, ISBN or topic..."
        />

        <div className="discover-filters">
          <div className="filter-group">
            <label htmlFor="subject">Subject</label>
            <select
              id="subject"
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                setTopicId("");
              }}
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="topic">Topic</label>
            <select
              id="topic"
              value={topicId}
              onChange={(event) => setTopicId(event.target.value)}
            >
              <option value="">All topics</option>
              {visibleTopics.map((topic) => (
                <option key={topic.topic_id} value={topic.topic_id}>
                  {topic.topic_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="availability">Availability</label>
            <select
              id="availability"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
            >
              <option value="">All books</option>
              <option value="available">Available now</option>
              <option value="unavailable">Not available</option>
            </select>
          </div>
        </div>
      </section>

      {error && <p className="discover-error">{error}</p>}

      {/* Results */}
      {loading ? (
        <LoadingSpinner message="Loading books..." />
      ) : books.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No books found"
          message="Try changing your search or filters."
          actionLabel="Clear All Filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          <p className="discover-count">
            <BookOpen size={16} /> {books.length} books found
          </p>

          <div className="discover-grid">
            {books.map((book) => (
              <article className="discover-card" key={book.book_id}>
                <div className="discover-cover">
                  <img
                    src={getCoverUrl(book)}
                    alt={`${book.title} cover`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                  <span>{book.title}</span>
                </div>

                <div className="discover-info">
                  <h3>{book.title}</h3>
                  <p className="discover-author">{book.authors}</p>

                  <StatusBadge
                    status={book.is_available ? "Available" : "Unavailable"}
                  />

                  <p className="discover-copies">
                    {book.available_copies} of {book.total_copies} copies
                    available
                  </p>

                  {book.shelf_locations && (
                    <p className="discover-shelf">
                      <MapPin size={14} /> {book.shelf_locations}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default DiscoverBooksPage;
