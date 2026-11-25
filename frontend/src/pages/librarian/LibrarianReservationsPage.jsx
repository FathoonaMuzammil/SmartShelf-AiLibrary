import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

import {
  getReservations,
  allocateReservation,
  cancelReservation,
} from "../../services/librarianService";

import {
  Search,
  RefreshCw,
  CalendarDays,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  MapPin,
  Hash,
  ArrowRight,
  X,
  PackageCheck,
  ClipboardList,
} from "lucide-react";

import "./LibrarianReservationsPage.css";

const statusStyles = {
  pending: "pending",
  waiting: "waiting",
  ready_for_pickup: "ready",
  completed: "completed",
  cancelled: "cancelled",
  expired: "expired",
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (status = "") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const LibrarianReservationsPage = () => {
  const [reservations, setReservations] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [confirmation, setConfirmation] = useState(null);

  // =====================================
  // FETCH RESERVATIONS
  // =====================================

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getReservations();

      setReservations(response.reservations || []);
    } catch (err) {
      setError(err.message || "Unable to load reservations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // =====================================
  // FILTER RESERVATIONS
  // =====================================

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const studentName =
        reservation.student_name ||
        `Student #${reservation.student_id}`;

      const searchText = [
        studentName,
        reservation.student_email,
        reservation.student_id,
        reservation.title,
        reservation.isbn,
        reservation.accession_number,
        reservation.reservation_id,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(
        search.toLowerCase().trim()
      );

      const matchesStatus =
        statusFilter === "all" ||
        reservation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, search, statusFilter]);

  // =====================================
  // STATISTICS
  // =====================================

  const counts = useMemo(
    () => ({
      total: reservations.length,

      pending: reservations.filter(
        (r) => r.status === "pending"
      ).length,

      waiting: reservations.filter(
        (r) => r.status === "waiting"
      ).length,

      ready: reservations.filter(
        (r) => r.status === "ready_for_pickup"
      ).length,

      completed: reservations.filter(
        (r) => r.status === "completed"
      ).length,

      cancelled: reservations.filter(
        (r) => r.status === "cancelled"
      ).length,

      expired: reservations.filter(
        (r) => r.status === "expired"
      ).length,
    }),
    [reservations]
  );

  // =====================================
  // CONFIRMATION DIALOG
  // =====================================

  const openConfirmation = (type, reservation) => {
    setConfirmation({ type, reservation });
  };

  const closeConfirmation = () => {
    if (actionLoading !== null) return;

    setConfirmation(null);
  };

  // =====================================
  // HANDLE RESERVATION ACTION
  // =====================================

  const handleAction = async () => {
    if (!confirmation) return;

    const { type, reservation } = confirmation;

    try {
      setActionLoading(reservation.reservation_id);
      setError("");
      setNotice("");

      let response;

      if (type === "allocate") {
        response = await allocateReservation(
          reservation.reservation_id
        );
      } else {
        response = await cancelReservation(
          reservation.reservation_id
        );
      }

      setNotice(
        response.message ||
          (type === "allocate"
            ? "Reservation allocated successfully."
            : "Reservation cancelled successfully.")
      );

      setConfirmation(null);

      await fetchReservations();
    } catch (err) {
      setError(
        err.message || "Unable to process reservation."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================
  // STATUS BADGE
  // =====================================

  const getStatusClass = (status) =>
    `lr-status ${statusStyles[status] || "default"}`;

  // =====================================
  // RENDER
  // =====================================

  return (
    <DashboardLayout
      role="librarian"
      title="Reservations"
      activeItem="Reservations"
    >
      <div className="lr-page">

        {/* PAGE HEADER */}

        <section className="lr-header">
          <div>
            <span className="lr-eyebrow">
              LIBRARY OPERATIONS
            </span>

            <h1>Reservation Management</h1>

            <p>
              Manage student reservations, waiting lists and
              book collection requests.
            </p>
          </div>

          <button
            type="button"
            className="lr-refresh-button"
            onClick={fetchReservations}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "lr-spinning" : ""}
            />
            Refresh
          </button>
        </section>

        {/* NOTIFICATIONS */}

        {notice && (
          <div className="lr-notice">
            <CheckCircle2 size={19} />
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="lr-error">
            <AlertTriangle size={19} />
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <section className="lr-stats-grid">

          <article className="lr-stat-card">
            <div className="lr-stat-icon total">
              <ClipboardList size={22} />
            </div>

            <div>
              <p>Total Reservations</p>
              <h2>{counts.total}</h2>
            </div>
          </article>

          <article className="lr-stat-card">
            <div className="lr-stat-icon pending">
              <Clock size={22} />
            </div>

            <div>
              <p>Pending</p>
              <h2>{counts.pending}</h2>
            </div>
          </article>

          <article className="lr-stat-card">
            <div className="lr-stat-icon waiting">
              <Users size={22} />
            </div>

            <div>
              <p>Waiting List</p>
              <h2>{counts.waiting}</h2>
            </div>
          </article>

          <article className="lr-stat-card">
            <div className="lr-stat-icon ready">
              <PackageCheck size={22} />
            </div>

            <div>
              <p>Ready for Pickup</p>
              <h2>{counts.ready}</h2>
            </div>
          </article>

        </section>

        {/* SECONDARY SUMMARY */}

        <section className="lr-summary">
          <div>
            <span className="lr-summary-dot completed"></span>
            Completed
            <strong>{counts.completed}</strong>
          </div>

          <div>
            <span className="lr-summary-dot cancelled"></span>
            Cancelled
            <strong>{counts.cancelled}</strong>
          </div>

          <div>
            <span className="lr-summary-dot expired"></span>
            Expired
            <strong>{counts.expired}</strong>
          </div>
        </section>

        {/* SEARCH AND FILTER */}

        <section className="lr-filter-section">

          <div className="lr-search-box">
            <Search size={19} />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, book, ISBN or reservation ID..."
              aria-label="Search reservations"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="lr-filter-control">
            <Filter size={17} />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter reservation status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="waiting">Waiting</option>
              <option value="ready_for_pickup">
                Ready for Pickup
              </option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

        </section>

        {/* RESERVATION TABLE */}

        <section className="lr-catalogue">

          <div className="lr-catalogue-header">
            <div className="lr-catalogue-title">
              <div className="lr-title-icon">
                <CalendarDays size={21} />
              </div>

              <div>
                <h2>All Reservations</h2>
                <p>
                  {filteredReservations.length} reservation(s) found
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="lr-state">
              <RefreshCw
                size={30}
                className="lr-spinning"
              />

              <h3>Loading reservations...</h3>
              <p>Please wait while we retrieve the records.</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="lr-state">
              <div className="lr-empty-icon">
                <CalendarDays size={34} />
              </div>

              <h3>No reservations found</h3>

              <p>
                Try another search or status filter.
              </p>
            </div>
          ) : (
            <div className="lr-table-wrapper">

              <table className="lr-table">

                <thead>
                  <tr>
                    <th>RESERVATION</th>
                    <th>STUDENT</th>
                    <th>BOOK DETAILS</th>
                    <th>COPY DETAILS</th>
                    <th>RESERVED AT</th>
                    <th>PICKUP DEADLINE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReservations.map((reservation) => {
                    const canAllocate = [
                      "pending",
                      "waiting",
                    ].includes(reservation.status);

                    const canCancel = [
                      "pending",
                      "waiting",
                      "ready_for_pickup",
                    ].includes(reservation.status);

                    const isBusy =
                      actionLoading === reservation.reservation_id;

                    return (
                      <tr key={reservation.reservation_id}>

                        {/* RESERVATION ID */}

                        <td>
                          <span className="lr-reservation-id">
                            #{reservation.reservation_id}
                          </span>
                        </td>

                        {/* STUDENT */}

                        <td>
                          <div className="lr-student-info">
                            <div className="lr-student-avatar">
                              <Users size={17} />
                            </div>

                            <div>
                              <h3>
                                {reservation.student_name ||
                                  `Student #${reservation.student_id}`}
                              </h3>

                              <p>
                                {reservation.student_email ||
                                  `ID: ${reservation.student_id}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* BOOK */}

                        <td>
                          <div className="lr-book-info">
                            <div className="lr-book-icon">
                              <BookOpen size={20} />
                            </div>

                            <div>
                              <h3>
                                {reservation.title || "Unknown book"}
                              </h3>

                              <p>
                                {reservation.authors || "Unknown author"}
                              </p>

                              {reservation.isbn && (
                                <span>
                                  ISBN: {reservation.isbn}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* COPY */}

                        <td>
                          <div className="lr-copy-info">
                            <div>
                              <Hash size={14} />

                              <span>
                                {reservation.accession_number ||
                                  "Not allocated"}
                              </span>
                            </div>

                            <div>
                              <MapPin size={14} />

                              <span>
                                {reservation.shelf_location || "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* RESERVED DATE */}

                        <td>
                          <div className="lr-date">
                            {formatDate(reservation.reserved_at)}
                          </div>
                        </td>

                        {/* PICKUP DEADLINE */}

                        <td>
                          <div className="lr-date">
                            {formatDate(reservation.pickup_deadline)}
                          </div>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span className={getStatusClass(reservation.status)}>
                            <span className="lr-status-dot"></span>
                            {formatStatus(reservation.status)}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="lr-actions">

                            {canAllocate && (
                              <button
                                type="button"
                                className="lr-allocate-button"
                                onClick={() =>
                                  openConfirmation("allocate", reservation)
                                }
                                disabled={isBusy || actionLoading !== null}
                              >
                                {isBusy ? (
                                  <RefreshCw
                                    size={14}
                                    className="lr-spinning"
                                  />
                                ) : (
                                  <PackageCheck size={15} />
                                )}

                                Allocate
                              </button>
                            )}

                            {canCancel && (
                              <button
                                type="button"
                                className="lr-cancel-button"
                                onClick={() =>
                                  openConfirmation("cancel", reservation)
                                }
                                disabled={isBusy || actionLoading !== null}
                              >
                                Cancel
                              </button>
                            )}

                            {!canAllocate && !canCancel && (
                              <span className="lr-no-action">
                                No actions
                              </span>
                            )}

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* CONFIRMATION MODAL */}

        {confirmation && (
          <div
            className="lr-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeConfirmation();
              }
            }}
          >
            <div
              className="lr-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lr-modal-title"
            >

              <div className="lr-modal-icon">
                {confirmation.type === "allocate" ? (
                  <PackageCheck size={27} />
                ) : (
                  <AlertTriangle size={27} />
                )}
              </div>

              <button
                type="button"
                className="lr-modal-close"
                onClick={closeConfirmation}
                disabled={actionLoading !== null}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>

              <h2 id="lr-modal-title">
                {confirmation.type === "allocate"
                  ? "Allocate Book Copy?"
                  : "Cancel Reservation?"}
              </h2>

              <p>
                {confirmation.type === "allocate"
                  ? `Are you sure you want to allocate an available copy to ${
                      confirmation.reservation.student_name ||
                      `Student #${confirmation.reservation.student_id}`
                    }?`
                  : `Are you sure you want to cancel reservation #${confirmation.reservation.reservation_id}?`}
              </p>

              <div className="lr-modal-details">
                <span>Book</span>
                <strong>
                  {confirmation.reservation.title}
                </strong>

                <span>Reservation ID</span>
                <strong>
                  #{confirmation.reservation.reservation_id}
                </strong>
              </div>

              <div className="lr-modal-actions">

                <button
                  type="button"
                  className="lr-modal-secondary"
                  onClick={closeConfirmation}
                  disabled={actionLoading !== null}
                >
                  Go Back
                </button>

                <button
                  type="button"
                  className={
                    confirmation.type === "allocate"
                      ? "lr-modal-primary"
                      : "lr-modal-danger"
                  }
                  onClick={handleAction}
                  disabled={actionLoading !== null}
                >
                  {actionLoading !== null ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="lr-spinning"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      {confirmation.type === "allocate"
                        ? "Confirm Allocation"
                        : "Confirm Cancellation"}

                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default LibrarianReservationsPage;