import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, MapPin, Star, User } from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";

import { getBookById, reserveBook } from "../../services/studentService";

import "./StudentBookDetailsPage.css";

// Turn "all_levels" into "All levels"
const formatLevel = (level) => {
  if (!level) return "";
  const text = level.replace("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatStatus = (status) => {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

function StudentBookDetailsPage() {
  const { bookId } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reservation state
  const [reserving, setReserving] = useState(false);
  const [reserveMessage, setReserveMessage] = useState("");
  const [reserveError, setReserveError] = useState("");

  const handleReserve = async () => {
    setReserving(true);
    setReserveMessage("");
    setReserveError("");

    try {
      const data = await reserveBook(book.book_id);
      setReserveMessage(data.message);
    } catch (err) {
      setReserveError(err.message);
    } finally {
      setReserving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    getBookById(bookId)
      .then((data) => {
        if (!cancelled) setBook(data.book);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const getCoverUrl = () => {
    if (!book) return "";
    if (book.cover_image_url) return book.cover_image_url;
    if (book.isbn) {
      return `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
    }
    return "";
  };

  return (
    <DashboardLayout
      role="student"
      title="Book Details"
      activeItem="Discover Books"
    >
      <Link to="/student/discover" className="details-back">
        <ArrowLeft size={16} /> Back to Discover Books
      </Link>

      {loading && <LoadingSpinner message="Loading book details..." />}

      {!loading && error && (
        <EmptyState
          icon={BookOpen}
          title="Could not load this book"
          message={error}
        />
      )}

      {!loading && !error && book && (
        <>
          {/* Main information */}
          <section className="details-main">
            <div className="details-cover">
              <img
                src={getCoverUrl()}
                alt={`${book.title} cover`}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <span>{book.title}</span>
            </div>

            <div className="details-summary">
              <h1>{book.title}</h1>
              <p className="details-authors">{book.authors}</p>

              <StatusBadge
                status={book.is_available ? "Available" : "Unavailable"}
              />

              <p className="details-copies">
                {book.available_copies} of {book.total_copies} copies available
              </p>

              <div className="reserve-box">
                <button
                  type="button"
                  className="reserve-button"
                  onClick={handleReserve}
                  disabled={reserving || Boolean(reserveMessage)}
                >
                  {reserving
                    ? "Please wait..."
                    : book.is_available
                      ? "Reserve this book"
                      : "Join waiting list"}
                </button>

                {reserveMessage && (
                  <p className="reserve-success">
                    {reserveMessage}{" "}
                    <Link to="/student/reservations">View my reservations</Link>
                  </p>
                )}

                {reserveError && <p className="reserve-error">{reserveError}</p>}
              </div>

              <dl className="details-meta">
                {book.isbn && (
                  <>
                    <dt>ISBN</dt>
                    <dd>{book.isbn}</dd>
                  </>
                )}
                {book.publisher && (
                  <>
                    <dt>Publisher</dt>
                    <dd>{book.publisher}</dd>
                  </>
                )}
                {book.publication_year && (
                  <>
                    <dt>Year</dt>
                    <dd>{book.publication_year}</dd>
                  </>
                )}
                {book.edition && (
                  <>
                    <dt>Edition</dt>
                    <dd>{book.edition}</dd>
                  </>
                )}
                {book.language && (
                  <>
                    <dt>Language</dt>
                    <dd>{book.language}</dd>
                  </>
                )}
              </dl>

              {book.description && (
                <p className="details-description">{book.description}</p>
              )}
            </div>
          </section>

          {/* Copies and shelf locations */}
          <section className="details-section">
            <h2>Copies and shelf location</h2>

            {book.copies.length === 0 ? (
              <p className="details-muted">No physical copies recorded yet.</p>
            ) : (
              <div className="details-table-wrapper">
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>Accession no.</th>
                      <th>Shelf location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {book.copies.map((copy) => (
                      <tr key={copy.copy_id}>
                        <td>{copy.accession_number}</td>
                        <td>
                          <MapPin size={13} /> {copy.shelf_location || "—"}
                        </td>
                        <td>{formatStatus(copy.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Topics and ratings */}
          <section className="details-section">
            <h2>Topics and relevance ratings</h2>

            {book.topics.length === 0 ? (
              <p className="details-muted">No topics linked to this book.</p>
            ) : (
              <div className="details-topic-list">
                {book.topics.map((topic) => (
                  <div className="details-topic" key={topic.topic_id}>
                    <div>
                      <h3>{topic.topic_name}</h3>
                      <p className="details-muted">{topic.subject_name}</p>
                      {topic.relevance_description && (
                        <p>{topic.relevance_description}</p>
                      )}
                    </div>

                    <div className="details-rating">
                      <Star size={16} />
                      {topic.average_rating !== null ? (
                        <span>
                          {topic.average_rating} / 5 ({topic.rating_count}{" "}
                          {topic.rating_count === 1 ? "rating" : "ratings"})
                        </span>
                      ) : (
                        <span>Not rated yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Lecturer recommendations */}
          <section className="details-section">
            <h2>Lecturer recommendations</h2>

            {book.recommendations.length === 0 ? (
              <p className="details-muted">
                No lecturer has recommended this book yet.
              </p>
            ) : (
              <div className="details-topic-list">
                {book.recommendations.map((item) => (
                  <div
                    className="details-topic"
                    key={item.recommendation_id}
                  >
                    <div>
                      <h3>{item.topic_name}</h3>
                      <p className="details-muted">
                        <User size={13} /> {item.lecturer_name}
                      </p>
                      <p>{item.explanation}</p>
                      {item.relevant_chapters && (
                        <p className="details-muted">
                          Chapters: {item.relevant_chapters}
                        </p>
                      )}
                    </div>

                    <span className="details-level">
                      {formatLevel(item.difficulty_level)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default StudentBookDetailsPage;
