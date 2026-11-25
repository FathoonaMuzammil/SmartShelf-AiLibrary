import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  BarChart3,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock3,
  Library,
  RefreshCw,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout.jsx";
import { getReports } from "../../services/librarianService.js";
import "./LibrarianReportsPage.css";

const EMPTY_REPORTS = {
  summary: {
    total_books: 0,
    total_issues: 0,
    returned: 0,
    active: 0,
    overdue: 0,
    affected_students: 0,
    oldest_overdue_days: 0,
  },
  popularBooks: [],
  copyStatistics: {
    available: 0,
    reserved: 0,
    borrowed: 0,
    damaged: 0,
    lost: 0,
    total: 0,
  },
  reservationStatistics: {
    pending: 0,
    waiting: 0,
    ready_for_pickup: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  },
  monthlyBorrowings: [],
};

const COPY_ITEMS = [
  { label: "Available", key: "available" },
  { label: "Borrowed", key: "borrowed" },
  { label: "Reserved", key: "reserved" },
  { label: "Damaged", key: "damaged" },
  { label: "Lost", key: "lost" },
];

const RESERVATION_ITEMS = [
  { label: "Pending", key: "pending" },
  { label: "Waiting", key: "waiting" },
  { label: "Ready for Pickup", key: "ready_for_pickup" },
  { label: "Completed", key: "completed" },
  { label: "Cancelled", key: "cancelled" },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatStatus(status) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPercentage(value, total) {
  if (!total) return 0;
  return Math.min(100, (Number(value || 0) / Number(total)) * 100);
}

function StatCard({ label, value, description, icon: Icon, variant }) {
  return (
    <article className="lrep-stat-card">
      <div className="lrep-stat-top">
        <div>
          <p className="lrep-stat-label">{label}</p>
          <h3 className="lrep-stat-value">{formatNumber(value)}</h3>
        </div>

        <div className={`lrep-stat-icon ${variant}`}>
          <Icon size={23} strokeWidth={1.8} />
        </div>
      </div>

      <p className="lrep-stat-description">{description}</p>
    </article>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="lrep-section-heading">
      <div className="lrep-section-icon">
        <Icon size={19} />
      </div>

      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  description,
  icon: Icon,
  items,
  statistics,
  total,
  type,
}) {
  return (
    <section className="lrep-panel">
      <div className="lrep-panel-heading">
        <div className="lrep-panel-icon">
          <Icon size={19} />
        </div>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="lrep-breakdown-total">
        <div>
          <span>Total {type === "copy" ? "Copies" : "Reservations"}</span>
          <strong>{formatNumber(total)}</strong>
        </div>

        <span className="lrep-total-label">Overall count</span>
      </div>

      <div className="lrep-breakdown-list">
        {items.map((item) => {
          const value = Number(statistics[item.key] || 0);
          const percentage = getPercentage(value, total);

          return (
            <div className="lrep-breakdown-item" key={item.key}>
              <div className="lrep-breakdown-info">
                <span>{item.label}</span>
                <strong>{formatNumber(value)}</strong>
              </div>

              <div
                className="lrep-progress-track"
                role="progressbar"
                aria-label={`${item.label} percentage`}
                aria-valuenow={Math.round(percentage)}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className={`lrep-progress-fill ${type}-${item.key}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LibrarianReportsPage() {
  const [reports, setReports] = useState(EMPTY_REPORTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getReports();

      if (!response?.success || !response?.data) {
        throw new Error("The server returned an invalid reports response.");
      }

      const data = response.data;

      setReports({
        ...EMPTY_REPORTS,
        ...data,

        summary: {
          ...EMPTY_REPORTS.summary,
          ...(data.summary || {}),
        },

        copyStatistics: {
          ...EMPTY_REPORTS.copyStatistics,
          ...(data.copyStatistics || {}),
        },

        reservationStatistics: {
          ...EMPTY_REPORTS.reservationStatistics,
          ...(data.reservationStatistics || {}),
        },

        popularBooks: Array.isArray(data.popularBooks)
          ? data.popularBooks
          : [],

        monthlyBorrowings: Array.isArray(data.monthlyBorrowings)
          ? data.monthlyBorrowings
          : [],
      });

      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = reports.summary;

  const returnRate = useMemo(() => {
    if (!Number(summary.total_issues)) return 0;

    return Math.round(
      (Number(summary.returned || 0) /
        Number(summary.total_issues)) *
        100
    );
  }, [summary.returned, summary.total_issues]);

  const maxMonthlyValue = Math.max(
    1,
    ...reports.monthlyBorrowings.map((item) => Number(item.total || 0))
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout
      role="librarian"
      title="Reports & Analytics"
      activeItem="Reports"
    >
      <div className="lrep-page">
        {/* Page Header */}
        <header className="lrep-header">
          <div>
            <div className="lrep-eyebrow">
              <Activity size={15} />
              LIBRARY INSIGHTS
            </div>

            <h1>Reports & Analytics</h1>

            <p>
              Monitor library performance, borrowing activity and collection
              statistics in one place.
            </p>

            {lastUpdated && (
              <span className="lrep-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="lrep-header-actions">
            <button
              type="button"
              className="lrep-button lrep-button-outline"
              onClick={handlePrint}
            >
              <ArrowDownToLine size={17} />
              Print Report
            </button>

            <button
              type="button"
              className="lrep-button lrep-button-primary"
              onClick={loadReports}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                className={loading ? "lrep-spinning" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="lrep-error">
            <AlertCircle size={21} />

            <div>
              <strong>Unable to load reports</strong>
              <p>{error}</p>

              <button type="button" onClick={loadReports}>
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Library Overview */}
        <section className="lrep-section">
          <SectionHeading
            icon={Library}
            title="Library Overview"
            description="A quick overview of the library's current activity."
          />

          <div className="lrep-stats-grid">
            <StatCard
              label="Book Titles"
              value={summary.total_books}
              description="Active book titles in the library"
              icon={BookOpen}
              variant="sage"
            />

            <StatCard
              label="Total Borrowings"
              value={summary.total_issues}
              description="All recorded borrowing transactions"
              icon={TrendingUp}
              variant="olive"
            />

            <StatCard
              label="Active Borrowings"
              value={summary.active}
              description="Books currently on loan"
              icon={Clock3}
              variant="amber"
            />

            <StatCard
              label="Returned Books"
              value={summary.returned}
              description="Successfully returned borrowings"
              icon={CheckCircle2}
              variant="green"
            />
          </div>
        </section>

        {/* Borrowing and Overdue */}
        <section className="lrep-section">
          <SectionHeading
            icon={Activity}
            title="Borrowing Performance"
            description="Understand borrowing progress and overdue activity."
          />

          <div className="lrep-performance-grid">
            <article className="lrep-panel lrep-performance-card">
              <div className="lrep-panel-heading">
                <div className="lrep-panel-icon">
                  <TrendingUp size={19} />
                </div>

                <div>
                  <h2>Borrowing Summary</h2>
                  <p>Current borrowing transaction statistics.</p>
                </div>
              </div>

              <div className="lrep-borrowing-numbers">
                <div className="lrep-number-box active">
                  <span>Active Borrowings</span>
                  <strong>{formatNumber(summary.active)}</strong>
                </div>

                <div className="lrep-number-box returned">
                  <span>Returned</span>
                  <strong>{formatNumber(summary.returned)}</strong>
                </div>
              </div>

              <div className="lrep-return-rate">
                <div className="lrep-return-heading">
                  <span>Return Rate</span>
                  <strong>{returnRate}%</strong>
                </div>

                <div className="lrep-progress-track lrep-return-track">
                  <div
                    className="lrep-progress-fill return-rate"
                    style={{ width: `${returnRate}%` }}
                  />
                </div>

                <p>
                  Percentage of all recorded borrowing transactions that have
                  been returned.
                </p>
              </div>
            </article>

            <article className="lrep-panel lrep-overdue-card">
              <div className="lrep-panel-heading">
                <div className="lrep-panel-icon overdue-icon">
                  <AlertTriangle size={19} />
                </div>

                <div>
                  <h2>Overdue Statistics</h2>
                  <p>Current overdue borrowing records.</p>
                </div>
              </div>

              <div className="lrep-overdue-main">
                <div>
                  <span>Total Overdue</span>
                  <strong>{formatNumber(summary.overdue)}</strong>
                </div>

                <span className="lrep-overdue-badge">
                  <AlertTriangle size={14} />
                  Requires attention
                </span>
              </div>

              <div className="lrep-overdue-details">
                <div>
                  <span>
                    <Users size={15} />
                    Affected Students
                  </span>
                  <strong>{formatNumber(summary.affected_students)}</strong>
                </div>

                <div>
                  <span>
                    <Clock3 size={15} />
                    Oldest Overdue
                  </span>
                  <strong>
                    {formatNumber(summary.oldest_overdue_days)} days
                  </strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Inventory and Reservation Statistics */}
        <section className="lrep-section">
          <SectionHeading
            icon={Package}
            title="Collection & Reservation Statistics"
            description="View the distribution of physical copies and reservations."
          />

          <div className="lrep-breakdown-grid">
            <BreakdownCard
              title="Physical Copy Statistics"
              description="Current status of library copies."
              icon={BookOpen}
              items={COPY_ITEMS}
              statistics={reports.copyStatistics}
              total={reports.copyStatistics.total}
              type="copy"
            />

            <BreakdownCard
              title="Reservation Statistics"
              description="Distribution of reservation records by status."
              icon={Bookmark}
              items={RESERVATION_ITEMS}
              statistics={reports.reservationStatistics}
              total={reports.reservationStatistics.total}
              type="reservation"
            />
          </div>
        </section>

        {/* Monthly Borrowing Activity */}
        <section className="lrep-section lrep-panel">
          <div className="lrep-panel-heading">
            <div className="lrep-panel-icon">
              <BarChart3 size={19} />
            </div>

            <div>
              <h2>Monthly Borrowing Activity</h2>
              <p>
                Borrowing transactions recorded over the latest six-month
                reporting period.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="lrep-empty">
              <RefreshCw className="lrep-spinning" size={24} />
              <p>Loading monthly activity...</p>
            </div>
          ) : reports.monthlyBorrowings.length === 0 ? (
            <div className="lrep-empty">
              <BarChart3 size={30} />
              <strong>No borrowing activity yet</strong>
              <p>
                Monthly statistics will appear here when borrowing records
                are available.
              </p>
            </div>
          ) : (
            <div className="lrep-chart">
              {reports.monthlyBorrowings.map((item) => {
                const value = Number(item.total || 0);

                const height =
                  value > 0
                    ? Math.max(5, (value / maxMonthlyValue) * 190)
                    : 0;

                return (
                  <div className="lrep-chart-column" key={item.month}>
                    <span className="lrep-chart-value">
                      {formatNumber(value)}
                    </span>

                    <div className="lrep-chart-bar-area">
                      <div
                        className="lrep-chart-bar"
                        style={{ height: `${height}px` }}
                        title={`${item.month_label}: ${value} borrowings`}
                      />
                    </div>

                    <span className="lrep-chart-label">
                      {item.month_label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Most Popular Books */}
        <section className="lrep-section lrep-panel lrep-popular-panel">
          <div className="lrep-panel-heading">
            <div className="lrep-panel-icon">
              <TrendingUp size={19} />
            </div>

            <div>
              <h2>Most Popular Books</h2>
              <p>
                Top five books ranked by total borrowing transactions.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="lrep-empty">
              <RefreshCw className="lrep-spinning" size={24} />
              <p>Loading popular books...</p>
            </div>
          ) : reports.popularBooks.length === 0 ? (
            <div className="lrep-empty">
              <BookOpen size={30} />
              <strong>No popular books to display</strong>
              <p>
                Book rankings will appear after borrowing transactions are
                recorded.
              </p>
            </div>
          ) : (
            <div className="lrep-table-wrap">
              <table className="lrep-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Book Title</th>
                    <th>Author</th>
                    <th className="lrep-align-right">Borrowings</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.popularBooks.map((book, index) => (
                    <tr key={book.book_id}>
                      <td>
                        <span className={`lrep-rank rank-${index + 1}`}>
                          {index + 1}
                        </span>
                      </td>

                      <td className="lrep-book-title">
                        {book.title || "Untitled Book"}
                      </td>

                      <td>{book.authors || "Unknown Author"}</td>

                      <td className="lrep-align-right">
                        <strong>
                          {formatNumber(book.borrowing_count)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Report Information */}
        <div className="lrep-information">
          <div className="lrep-information-icon">
            <Users size={19} />
          </div>

          <div>
            <strong>About These Reports</strong>
            <p>
              These statistics are retrieved from the SmartShelf database.
              Borrowing and reservation figures depend on transactions
              recorded in the system. Use Refresh to retrieve the latest
              available data.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default LibrarianReportsPage;