import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  Clock,
  Users,
  BookOpen,
  Search,
  RefreshCw,
  CalendarDays,
  Mail,
  Hash,
  MapPin,
  X,
  ClipboardList,
  UserRound,
  ShieldAlert,
  TrendingUp,
  Hourglass,
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout.jsx";
import { getOverdueBorrowings } from "../../services/librarianService.js";

import "./LibrarianOverduePage.css";

const initialSummary = {
  total_overdue: 0,
  affected_students: 0,
  overdue_books: 0,
  oldest_overdue_days: 0,
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function getOverdueLevel(days) {
  if (days > 30) {
    return {
      label: "Critical",
      className: "lo-level-critical",
    };
  }

  if (days >= 8) {
    return {
      label: "High",
      className: "lo-level-high",
    };
  }

  return {
    label: "Recent",
    className: "lo-level-recent",
  };
}

function LibrarianOverduePage() {
  const [overdueBorrowings, setOverdueBorrowings] = useState([]);

  const [summary, setSummary] = useState(initialSummary);

  const [searchTerm, setSearchTerm] = useState("");
  const [durationFilter, setDurationFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lastUpdated, setLastUpdated] = useState(null);

  // Load overdue borrowing records.
  const loadOverdueBorrowings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOverdueBorrowings();

      setOverdueBorrowings(response.overdueBorrowings || []);

      setSummary(response.summary || initialSummary);

      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load overdue records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverdueBorrowings();
  }, [loadOverdueBorrowings]);

  // Search and filter records.
  const filteredBorrowings = useMemo(() => {
    return overdueBorrowings.filter((item) => {
      const search = searchTerm.toLowerCase().trim();

      const searchableFields = [
        item.student_name,
        item.student_email,
        item.student_number,
        item.student_id,
        item.title,
        item.authors,
        item.isbn,
        item.accession_number,
        item.borrowing_id,
      ];

      const matchesSearch =
        !search ||
        searchableFields.some((value) =>
          String(value || "").toLowerCase().includes(search)
        );

      const daysOverdue = Number(item.days_overdue || 0);

      let matchesDuration = true;

      if (durationFilter === "1-7") {
        matchesDuration = daysOverdue >= 1 && daysOverdue <= 7;
      } else if (durationFilter === "8-30") {
        matchesDuration = daysOverdue >= 8 && daysOverdue <= 30;
      } else if (durationFilter === "30+") {
        matchesDuration = daysOverdue > 30;
      }

      return matchesSearch && matchesDuration;
    });
  }, [overdueBorrowings, searchTerm, durationFilter]);

  // Summary cards.
  const summaryCards = [
    {
      label: "Total Overdue",
      value: summary.total_overdue,
      description: "Books past their due dates",
      icon: AlertTriangle,
      color: "red",
    },
    {
      label: "Affected Students",
      value: summary.affected_students,
      description: "Students with overdue books",
      icon: Users,
      color: "orange",
    },
    {
      label: "Overdue Records",
      value: summary.overdue_books,
      description: "Active overdue borrowing records",
      icon: BookOpen,
      color: "blue",
    },
    {
      label: "Longest Overdue",
      value: summary.oldest_overdue_days,
      suffix: "days",
      description: "Highest overdue duration",
      icon: Clock,
      color: "purple",
    },
  ];

  return (
    <DashboardLayout
      role="librarian"
      title="Overdue Management"
      activeItem="Overdue"
    >
      <div className="lo-page">

        {/* PAGE HEADER */}
        <div className="lo-header">
          <div>
            <div className="lo-eyebrow">
              <ShieldAlert size={15} />
              LIBRARY OPERATIONS
            </div>

            <h1>Overdue Management</h1>

            <p>
              Monitor overdue books and identify students who need follow-up.
            </p>

            {lastUpdated && (
              <span className="lo-last-updated">
                Last updated: {lastUpdated.toLocaleTimeString("en-GB")}
              </span>
            )}
          </div>

          <button
            type="button"
            className="lo-refresh-button"
            onClick={loadOverdueBorrowings}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "lo-spin" : ""}
            />
            Refresh Records
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="lo-message lo-message-error">
            <AlertTriangle size={19} />

            <div>
              <strong>Unable to load overdue records</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="lo-stats-grid">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div className="lo-stat-card" key={card.label}>
                <div className="lo-stat-top">
                  <div className={`lo-stat-icon ${card.color}`}>
                    <Icon size={22} />
                  </div>

                  <span className="lo-stat-indicator">
                    <TrendingUp size={13} />
                    Current
                  </span>
                </div>

                <div className="lo-stat-value">
                  {loading ? "..." : card.value}

                  {card.suffix && !loading && (
                    <span>{card.suffix}</span>
                  )}
                </div>

                <h3>{card.label}</h3>

                <p>{card.description}</p>
              </div>
            );
          })}
        </div>

        {/* OVERDUE MONITORING OVERVIEW */}
        <section className="lo-overview-card">
          <div className="lo-overview-icon">
            <Hourglass size={23} />
          </div>

          <div className="lo-overview-content">
            <h2>Overdue Monitoring Overview</h2>

            <p>
              These records represent active borrowings whose due dates
              have passed. Returned books will automatically disappear
              from this list after refreshing the records.
            </p>
          </div>

          <div className="lo-overview-count">
            <strong>
              {loading ? "..." : summary.total_overdue}
            </strong>
            <span>Overdue now</span>
          </div>
        </section>

        {/* OVERDUE RECORDS */}
        <section className="lo-records-card">

          {/* SECTION HEADING */}
          <div className="lo-records-header">
            <div>
              <div className="lo-section-title">
                <div className="lo-section-icon">
                  <ClipboardList size={20} />
                </div>

                <h2>Overdue Borrowing Records</h2>
              </div>

              <p>
                Review overdue borrowing details and identify students
                requiring attention.
              </p>
            </div>

            <span className="lo-record-count">
              {filteredBorrowings.length} Records
            </span>
          </div>

          {/* SEARCH AND FILTER */}
          <div className="lo-toolbar">

            <div className="lo-search">
              <Search size={18} />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student, book, ISBN or accession number..."
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="lo-filter">
              <Clock size={17} />

              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
              >
                <option value="all">All durations</option>
                <option value="1-7">1–7 days overdue</option>
                <option value="8-30">8–30 days overdue</option>
                <option value="30+">More than 30 days</option>
              </select>
            </div>
          </div>

          {/* RESULTS INFORMATION */}
          <div className="lo-results-info">
            <span>
              Showing {loading ? 0 : filteredBorrowings.length} of{" "}
              {overdueBorrowings.length} overdue records
            </span>

            {(searchTerm || durationFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setDurationFilter("all");
                }}
              >
                Clear filters
                <X size={13} />
              </button>
            )}
          </div>

          {/* LOADING STATE */}
          {loading ? (
            <div className="lo-state">
              <RefreshCw size={29} className="lo-spin" />
              <p>Loading overdue records...</p>
            </div>
          ) : filteredBorrowings.length === 0 ? (

            /* EMPTY STATE */
            <div className="lo-state">
              <div className="lo-empty-icon">
                {error ? (
                  <AlertTriangle size={32} />
                ) : (
                  <BookOpen size={32} />
                )}
              </div>

              <h3>
                {error
                  ? "Overdue records unavailable"
                  : overdueBorrowings.length === 0
                    ? "No overdue books"
                    : "No matching records"}
              </h3>

              <p>
                {error
                  ? "Check the backend connection and try refreshing."
                  : overdueBorrowings.length === 0
                    ? "There are currently no books past their due dates."
                    : "Try changing your search term or duration filter."}
              </p>

              {error && (
                <button
                  type="button"
                  className="lo-empty-button"
                  onClick={loadOverdueBorrowings}
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
              )}
            </div>
          ) : (

            /* RECORDS TABLE */
            <div className="lo-table-wrapper">
              <table className="lo-table">
                <thead>
                  <tr>
                    <th>Borrowing ID</th>
                    <th>Student Details</th>
                    <th>Book Details</th>
                    <th>Copy Details</th>
                    <th>Borrowed Date</th>
                    <th>Due Date</th>
                    <th>Overdue Duration</th>
                    <th>Severity</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBorrowings.map((item) => {
                    const days = Number(item.days_overdue || 0);

                    const level = getOverdueLevel(days);

                    return (
                      <tr key={item.borrowing_id}>

                        {/* BORROWING ID */}
                        <td>
                          <span className="lo-borrowing-id">
                            #{item.borrowing_id}
                          </span>
                        </td>

                        {/* STUDENT */}
                        <td>
                          <div className="lo-student">
                            <div className="lo-avatar">
                              <UserRound size={17} />
                            </div>

                            <div>
                              <strong>
                                {item.student_name || "Unknown Student"}
                              </strong>

                              {item.student_number && (
                                <span>
                                  ID: {item.student_number}
                                </span>
                              )}

                              {item.student_email && (
                                <small>
                                  <Mail size={12} />
                                  {item.student_email}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* BOOK */}
                        <td>
                          <div className="lo-book">
                            <strong>
                              {item.title || "Unknown Book"}
                            </strong>

                            <span>
                              {item.authors || "Author not available"}
                            </span>

                            {item.isbn && (
                              <small>ISBN: {item.isbn}</small>
                            )}
                          </div>
                        </td>

                        {/* COPY */}
                        <td>
                          <div className="lo-copy">
                            <span>
                              <Hash size={13} />
                              {item.accession_number || "N/A"}
                            </span>

                            <small>
                              <MapPin size={13} />
                              {item.shelf_location || "No shelf"}
                            </small>
                          </div>
                        </td>

                        {/* BORROWED DATE */}
                        <td>
                          <span className="lo-date">
                            <CalendarDays size={14} />
                            {formatDate(item.borrowed_at)}
                          </span>
                        </td>

                        {/* DUE DATE */}
                        <td>
                          <span className="lo-due-date">
                            {formatDate(item.due_date)}
                          </span>
                        </td>

                        {/* OVERDUE DAYS */}
                        <td>
                          <span className="lo-overdue-days">
                            <AlertTriangle size={14} />
                            {days} {days === 1 ? "day" : "days"}
                          </span>
                        </td>

                        {/* SEVERITY */}
                        <td>
                          <span className={`lo-level ${level.className}`}>
                            {level.label}
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE FOOTER */}
          {!loading && filteredBorrowings.length > 0 && (
            <div className="lo-table-footer">
              <span>
                Displaying {filteredBorrowings.length} overdue records
              </span>

              <span>
                SmartShelf Library Operations
              </span>
            </div>
          )}
        </section>

        {/* FOOTER NOTE */}
        <div className="lo-footer-note">
          <AlertTriangle size={19} />

          <div>
            <strong>Important Reminder</strong>

            <p>
              Overdue status is determined using active borrowing records
              and their due dates. Returning an overdue book removes it
              from this list after the records are refreshed.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default LibrarianOverduePage;