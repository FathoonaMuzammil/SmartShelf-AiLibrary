import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LibraryBig,
  BookOpen,
  CheckCircle2,
  ArrowLeftRight,
  AlertTriangle,
  ClipboardList,
  Plus,
  CalendarClock,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { getDashboard } from "../../services/librarianService";

import "./LibrarianDashboardPage.css";

const LibrarianDashboardPage = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard statistics
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDashboard();
      setDashboard(response.data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Dashboard statistics
  const stats = [
    {
      title: "Total Books",
      value: dashboard?.total_books ?? 0,
      description: "Books in the catalogue",
      icon: LibraryBig,
      color: "green",
    },
    {
      title: "Total Copies",
      value: dashboard?.total_copies ?? 0,
      description: "Physical copies in the library",
      icon: BookOpen,
      color: "blue",
    },
    {
      title: "Available Copies",
      value: dashboard?.available_copies ?? 0,
      description: "Ready to be borrowed",
      icon: CheckCircle2,
      color: "teal",
    },
    {
      title: "Active Borrowings",
      value: dashboard?.active_borrowings ?? 0,
      description: "Currently borrowed books",
      icon: ArrowLeftRight,
      color: "purple",
    },
    {
      title: "Overdue Books",
      value: dashboard?.overdue_borrowings ?? 0,
      description: "Books past their due date",
      icon: AlertTriangle,
      color: "red",
    },
    {
      title: "Reservations",
      value: dashboard?.active_reservations ?? 0,
      description: "Active reservations",
      icon: ClipboardList,
      color: "gold",
    },
  ];

  // Quick actions
  const quickActions = [
    {
      title: "Add New Book",
      description: "Add a new book to the library catalogue.",
      icon: Plus,
      path: "/librarian/books",
    },
    {
      title: "Manage Reservations",
      description: "Review and manage student reservations.",
      icon: CalendarClock,
      path: "/librarian/reservations",
    },
    {
      title: "Issue / Return Books",
      description: "Manage book borrowing and returns.",
      icon: ArrowLeftRight,
      path: "/librarian/borrowings",
    },
  ];

  return (
    <DashboardLayout
      role="librarian"
      title="Librarian Dashboard"
      activeItem="Dashboard"
    >
      <div className="ld-page">

        {/* PAGE HEADER */}

        <section className="ld-welcome">
          <div className="ld-welcome-content">
            <span className="ld-eyebrow">
              LIBRARY MANAGEMENT
            </span>

            <h1>Library Overview</h1>

            <p>
              Welcome to your librarian workspace. Monitor library
              activities and manage daily operations from one place.
            </p>
          </div>

          <div className="ld-welcome-icon">
            <LibraryBig size={42} strokeWidth={1.5} />
          </div>
        </section>

        {/* STATISTICS HEADER */}

        <div className="ld-section-heading">
          <div>
            <h2>Library Statistics</h2>
            <p>A quick overview of your library's current status.</p>
          </div>

          <button
            type="button"
            className="ld-refresh-button"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "ld-spinning" : ""}
            />
            Refresh
          </button>
        </div>

        {/* LOADING STATE */}

        {loading && (
          <div className="ld-state-card" role="status">
            <RefreshCw size={25} className="ld-spinning" />
            <p>Loading library statistics...</p>
          </div>
        )}

        {/* ERROR STATE */}

        {!loading && error && (
          <div className="ld-error-card" role="alert">
            <AlertTriangle size={25} />

            <div>
              <h3>Unable to load dashboard</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={fetchDashboard}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* STATISTICS CARDS */}

        {!loading && !error && (
          <section className="ld-stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  className="ld-stat-card"
                  key={stat.title}
                >
                  <div className="ld-stat-top">
                    <div>
                      <p className="ld-stat-title">
                        {stat.title}
                      </p>

                      <h3>
                        {Number(stat.value).toLocaleString()}
                      </h3>
                    </div>

                    <div className={`ld-stat-icon ${stat.color}`}>
                      <Icon size={23} strokeWidth={1.8} />
                    </div>
                  </div>

                  <p className="ld-stat-description">
                    {stat.description}
                  </p>
                </article>
              );
            })}
          </section>
        )}

        {/* QUICK ACTIONS */}

        <section className="ld-actions-section">
          <div className="ld-section-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Access frequently used library operations.</p>
            </div>
          </div>

          <div className="ld-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  type="button"
                  className="ld-action-card"
                  key={action.title}
                  onClick={() => navigate(action.path)}
                >
                  <div className="ld-action-icon">
                    <Icon size={22} />
                  </div>

                  <div className="ld-action-content">
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>

                  <ArrowUpRight
                    size={19}
                    className="ld-action-arrow"
                  />
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
};

export default LibrarianDashboardPage;