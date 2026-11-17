import { useEffect, useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { getBooks } from "../../services/lecturerService";

function LecturerBrowseBooksPage() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load books from the backend whenever the search text changes.
  useEffect(() => {
    let cancelled = false;

    const loadBooks = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getBooks({ search });

        if (!cancelled) {
          setBooks(data.books);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <DashboardLayout
      role="lecturer"
      title="Browse Books"
      activeItem="Browse Books"
    >
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by title, author, ISBN or topic"
        aria-label="Search books"
        style={{ width: "100%", maxWidth: 480, padding: "10px 12px" }}
      />

      {loading && <p>Loading books...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && books.length === 0 && <p>No books found.</p>}

      <ul>
        {books.map((book) => (
          <li key={book.book_id}>
            <strong>{book.title}</strong> by {book.authors}
            <br />
            Available: {book.available_copies} of {book.total_copies}
            {book.shelf_locations && ` | Shelf: ${book.shelf_locations}`}
          </li>
        ))}
      </ul>
    </DashboardLayout>
  );
}

export default LecturerBrowseBooksPage;