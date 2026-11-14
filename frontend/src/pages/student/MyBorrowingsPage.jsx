import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, MapPin } from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";

import { getMyBorrowings } from "../../services/studentService";

import "./MyBorrowingsPage.css";

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Text and style shown for the due date
const getDueInfo = (item) => {
  if (item.is_overdue) {
    const late = Math.abs(item.days_remaining);
    return {
      text: `Overdue by ${late} ${late === 1 ? "day" : "days"}`,
      className: "due-overdue",
    };
  }

  if (item.days_remaining === 0) {
    return { text: "Due today", className: "due-soon" };
  }

  if (item.days_remaining <= 3) {
    return {
      text: `Due in ${item.days_remaining} ${
        item.days_remaining === 1 ? "day" : "days"
      }`,
      className: "due-soon",
    };
  }

  return {
    text: `Due in ${item.days_remaining} days`,
    className: "due-ok",
  };
};

function MyBorrowingsPage() {
  const [borrowings, setBorrowings] = useState([]);
  const [summary, setSummary] = useState({
    current: 0,
    overdue: 0,
    returned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyBorrowings()
      .then((data) => {
        setBorrowings(data.borrowings);
        setSummary(data.summary);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const current = borrowings.filter((item) => item.is_active);
  const history = borrowings.filter((item) => !item.is_active);

  return (
    <DashboardLayout
      role="student"
      title="My Borrowings"
      activeItem="My Borrowings"
    >
      <section className="borrow-heading">
        <h1>My Borrowings</h1>
        <p>Books you have borrowed, their due dates and your history.</p>
      </section>

      {error && <p className="borrow-error">{error}</p>}

      {loading ? (
        <LoadingSpinner message="Loading borrowings..." />
      ) : borrowings.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No borrowings yet"
          message="Books you borrow from the library will appear here."
        />
      ) : (
        <>
          {/* Summary */}
          <div className="borrow-summary">
            <div className="borrow-summary-card">
              <strong>{summary.current}</strong>
              <span>Currently borrowed</span>
            </div>
            <div className="borrow-summary-card">
              <strong className={summary.overdue > 0 ? "text-overdue" : ""}>
                {summary.overdue}
              </strong>
              <span>Overdue</span>
            </div>
            <div className="borrow-summary-card">
              <strong>{summary.returned}</strong>
              <span>Returned</span>
            </div>
          </div>

          {/* Current loans */}
          <h2 className="borrow-group">Current loans</h2>

          {current.length === 0 ? (
            <p className="borrow-muted">You have no books borrowed right now.</p>
          ) : (
            <div className="borrow-list">
              {current.map((item) => {
                const due = getDueInfo(item);

                return (
                  <article
                    className={`borrow-card ${
                      item.is_overdue ? "borrow-card-overdue" : ""
                    }`}
                    key={item.borrowing_id}
                  >
                    <div>
                      <Link to={`/student/books/${item.book_id}`}>
                        <h3>{item.title}</h3>
                      </Link>
                      <p className="borrow-muted">{item.authors}</p>
                      <p className="borrow-muted">
                        Borrowed on {formatDate(item.borrowed_at)} · Copy{" "}
                        {item.accession_number}
                      </p>
                      {item.shelf_location && (
                        <p className="borrow-muted">
                          <MapPin size={13} /> {item.shelf_location}
                        </p>
                      )}
                    </div>

                    <div className="borrow-side">
                      <span className={`borrow-due ${due.className}`}>
                        {due.text}
                      </span>
                      <span className="borrow-muted">
                        Due {formatDate(item.due_date)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <>
              <h2 className="borrow-group">Borrowing history</h2>

              <div className="borrow-table-wrapper">
                <table className="borrow-table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Borrowed</th>
                      <th>Due</th>
                      <th>Returned</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.borrowing_id}>
                        <td>
                          <Link to={`/student/books/${item.book_id}`}>
                            {item.title}
                          </Link>
                        </td>
                        <td>{formatDate(item.borrowed_at)}</td>
                        <td>{formatDate(item.due_date)}</td>
                        <td>{formatDate(item.returned_at) || "—"}</td>
                        <td>
                          {item.status === "lost" ? "Lost" : "Returned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

export default MyBorrowingsPage;
