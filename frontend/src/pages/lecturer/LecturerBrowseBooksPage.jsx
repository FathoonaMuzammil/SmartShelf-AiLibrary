import { useEffect, useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { getBooks, getFilters } from "../../services/lecturerService";

const fieldStyle = { padding: "10px 12px", minWidth: 160 };

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: 16,
  marginTop: 20,
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
};

const coverBoxStyle = {
  width: "100%",
  aspectRatio: "2 / 3",
  background: "#E8EEE5",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  marginBottom: 12,
  color: "#526B55",
  fontWeight: 600,
};

function LecturerBrowseBooksPage() {
  const [books, setBooks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [availability, setAvailability] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load subject and topic filters once.
  useEffect(() => {
    let cancelled = false;

    getFilters()
      .then((data) => {
        if (!cancelled) {
          setSubjects(data.subjects);
          setTopics(data.topics);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Reload books whenever a search text or filter changes.
  useEffect(() => {
    let cancelled = false;

    const loadBooks = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getBooks({
          search,
          subject_id: subjectId,
          topic_id: topicId,
          availability,
        });

        if (!cancelled) setBooks(data.books);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, [search, subjectId, topicId, availability]);

  const visibleTopics = topics.filter(
    (topic) => String(topic.subject_id) === subjectId,
  );

  const handleSubjectChange = (event) => {
    setSubjectId(event.target.value);
    setTopicId("");
  };

  return (
    <DashboardLayout
      role="lecturer"
      title="Browse Books"
      activeItem="Browse Books"
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, author, ISBN or topic"
          aria-label="Search books"
          style={{ ...fieldStyle, flex: "1 1 260px" }}
        />

        <select
          value={subjectId}
          onChange={handleSubjectChange}
          aria-label="Filter by subject"
          style={fieldStyle}
        >
          <option value="">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject.subject_id} value={subject.subject_id}>
              {subject.subject_name}
            </option>
          ))}
        </select>

        <select
          value={topicId}
          onChange={(event) => setTopicId(event.target.value)}
          disabled={!subjectId}
          aria-label="Filter by topic"
          style={fieldStyle}
        >
          <option value="">All topics</option>
          {visibleTopics.map((topic) => (
            <option key={topic.topic_id} value={topic.topic_id}>
              {topic.topic_name}
            </option>
          ))}
        </select>

        <select
          value={availability}
          onChange={(event) => setAvailability(event.target.value)}
          aria-label="Filter by availability"
          style={fieldStyle}
        >
          <option value="">Any availability</option>
          <option value="available">Available now</option>
          <option value="unavailable">Not available</option>
        </select>
      </div>

      {loading && <p>Loading books...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && books.length === 0 && <p>No books found.</p>}

      <div style={gridStyle}>
        {books.map((book) => {
          const isAvailable = Number(book.available_copies) > 0;

          return (
            <div key={book.book_id} style={cardStyle}>
              <div style={coverBoxStyle}>
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={`Cover of ${book.title}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span>No cover</span>
                )}
              </div>

              <h3 style={{ margin: "0 0 4px" }}>{book.title}</h3>
              <p style={{ margin: "0 0 8px", color: "#6b7280" }}>
                {book.authors}
              </p>

              <p style={{ margin: "0 0 4px" }}>
                <strong>{isAvailable ? "Available" : "Not available"}</strong>
                {" - "}
                {book.available_copies} of {book.total_copies} copies
              </p>

              {book.shelf_locations && (
                <p style={{ margin: 0 }}>Shelf: {book.shelf_locations}</p>
              )}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

export default LecturerBrowseBooksPage;