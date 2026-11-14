import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Bookmark,
  Compass,
  GraduationCap,
  Library,
  Sparkles,
} from "lucide-react";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import LoadingSpinner from "../components/common/LoadingSpinner";

import {
  getDashboard,
  markAllNotificationsRead,
} from "../services/studentService";

import "./StudentDashboardPage.css";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatLevel = (level) => {
  if (!level) return "";
  const text = level.replace("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Short text for a due date
const getDueText = (item) => {
  const days = Math.ceil(
    (new Date(item.due_date) - new Date()) / (24 * 60 * 60 * 1000),
  );

  if (item.is_overdue) {
    const late = Math.abs(days);
    return `Overdue by ${late} ${late === 1 ? "day" : "days"}`;
  }

  if (days === 0) return "Due today";

  return `Due in ${days} ${days === 1 ? "day" : "days"}`;
};

function StudentDashboardPage() {
  const user = JSON.parse(sessionStorage.getItem("smartshelf_user") || "null");
  const displayName = user?.full_name || "Student";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = () => {
    getDashboard()
      .then((result) => setData(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const summary = data?.summary;

  return (
    <DashboardLayout
      role="student"
      title="Student Dashboard"
      activeItem="Dashboard"
    >
      {/* Welcome */}
      <section className="dashboard-welcome">
        <div>
          <span className="dashboard-eyebrow">STUDENT PORTAL</span>

          <h1>Welcome back, {displayName}!</h1>

          <p>
            Discover books, explore knowledge, and make the most of your
            university library.
          </p>
        </div>

        <div className="dashboard-welcome-icon">
          <GraduationCap size={42} />
        </div>
      </section>

      {error && <p className="sd-error">{error}</p>}

      {loading ? (
        <LoadingSpinner message="Loading your dashboard..." />
      ) : (
        data && (
          <>
            {/* Summary cards */}
            <section className="sd-summary">
              <Link to="/student/borrowings" className="sd-card">
                <Library size={22} />
                <strong>{summary.current_loans}</strong>
                <span>Books borrowed</span>
              </Link>

              <Link
                to="/student/borrowings"
                className={`sd-card ${
                  summary.overdue_loans > 0 ? "sd-card-alert" : ""
                }`}
              >
                <BookOpen size={22} />
                <strong>{summary.overdue_loans}</strong>
                <span>Overdue</span>
              </Link>

              <Link to="/student/reservations" className="sd-card">
                <Bookmark size={22} />
                <strong>{summary.active_reservations}</strong>
                <span>
                  Reservations
                  {summary.ready_for_pickup > 0 &&
                    ` (${summary.ready_for_pickup} ready)`}
                </span>
              </Link>

              <div className="sd-card">
                <Bell size={22} />
                <strong>{summary.unread_notifications}</strong>
                <span>Unread notifications</span>
              </div>
            </section>

            <div className="sd-columns">
              {/* Due soon */}
              <section className="sd-panel">
                <div className="sd-panel-heading">
                  <h2>Return soon</h2>
                  <Link to="/student/borrowings">View all</Link>
                </div>

                {data.due_soon.length === 0 ? (
                  <p className="sd-muted">You have no books to return.</p>
                ) : (
                  <ul className="sd-list">
                    {data.due_soon.map((item) => (
                      <li key={item.borrowing_id}>
                        <div>
                          <Link to={`/student/books/${item.book_id}`}>
                            {item.title}
                          </Link>
                          <span className="sd-muted">
                            Due {formatDate(item.due_date)}
                          </span>
                        </div>

                        <span
                          className={`sd-tag ${
                            item.is_overdue ? "sd-tag-overdue" : ""
                          }`}
                        >
                          {getDueText(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Notifications */}
              <section className="sd-panel">
                <div className="sd-panel-heading">
                  <h2>Recent notifications</h2>

                  {summary.unread_notifications > 0 && (
                    <button
                      type="button"
                      className="sd-link-button"
                      onClick={handleMarkAllRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {data.notifications.length === 0 ? (
                  <p className="sd-muted">No notifications yet.</p>
                ) : (
                  <ul className="sd-list">
                    {data.notifications.map((item) => (
                      <li
                        key={item.notification_id}
                        className={item.is_read ? "" : "sd-unread"}
                      >
                        <div>
                          <strong>{item.title}</strong>
                          <span className="sd-muted">{item.message}</span>
                          <span className="sd-muted">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Lecturer recommendations */}
            <section className="sd-panel">
              <div className="sd-panel-heading">
                <h2>Recent lecturer recommendations</h2>
                <Link to="/student/discover">Discover more books</Link>
              </div>

              {data.recommendations.length === 0 ? (
                <p className="sd-muted">
                  Lecturer recommendations will appear here.
                </p>
              ) : (
                <div className="sd-recommendations">
                  {data.recommendations.map((item) => (
                    <Link
                      to={`/student/books/${item.book_id}`}
                      className="sd-recommendation"
                      key={item.recommendation_id}
                    >
                      <div className="sd-recommendation-top">
                        <Sparkles size={16} />
                        <span className="sd-tag">
                          {formatLevel(item.difficulty_level)}
                        </span>
                      </div>

                      <h3>{item.title}</h3>
                      <p className="sd-muted">{item.authors}</p>
                      <p className="sd-topic">{item.topic_name}</p>
                      <p>{item.explanation}</p>
                      <p className="sd-muted">By {item.lecturer_name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Quick access */}
            <section className="sd-quick">
              <Link to="/student/discover" className="dashboard-shortcut-card">
                <div className="dashboard-shortcut-icon">
                  <Compass size={23} />
                </div>

                <div>
                  <h3>Discover Books</h3>
                  <p>Search the library and check availability.</p>
                </div>
              </Link>
            </section>
          </>
        )
      )}
    </DashboardLayout>
  );
}

export default StudentDashboardPage;
