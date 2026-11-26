import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import {
  getBorrowings,
  issueBorrowing,
  returnBorrowing,
} from "../../services/librarianService";
import {
  Search,
  RefreshCw,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  CalendarDays,
  Hash,
  MapPin,
  RotateCcw,
  X,
  ClipboardList,
  UserRound,
  ArrowRight,
  PackageCheck,
} from "lucide-react";
import "./LibrarianBorrowingsPage.css";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
};

const formatStatus = (status = "") =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

const statusConfig = {
  borrowed: {
    label: "Borrowed",
    className: "lbr-status-borrowed",
  },
  overdue: {
    label: "Overdue",
    className: "lbr-status-overdue",
  },
  returned: {
    label: "Returned",
    className: "lbr-status-returned",
  },
  lost: {
    label: "Lost",
    className: "lbr-status-lost",
  },
};

const initialSummary = {
  total: 0,
  active: 0,
  overdue: 0,
  returned: 0,
  lost: 0,
};

const LibrarianBorrowingsPage = () => {
  const [borrowings, setBorrowings] = useState([]);
  const [summary, setSummary] = useState(initialSummary);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [returnLoadingId, setReturnLoadingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Issue form
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [reservationId, setReservationId] = useState("");
  const [copyId, setCopyId] = useState("");

  // Return confirmation
const [selectedBorrowing, setSelectedBorrowing] = useState(null);
const [returnCondition, setReturnCondition] = useState("normal");
const [returnNotes, setReturnNotes] = useState("");

  // Load borrowing records
  const fetchBorrowings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getBorrowings();

      setBorrowings(response.borrowings || []);
      setSummary(response.summary || initialSummary);
    } catch (err) {
      setError(err.message || "Unable to load borrowing records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBorrowings();
  }, [fetchBorrowings]);

  // Search and filtering
  const filteredBorrowings = useMemo(() => {
    return borrowings.filter((borrowing) => {
      const searchText = [
        borrowing.student_name,
        borrowing.student_email,
        borrowing.student_number,
        borrowing.student_id,
        borrowing.title,
        borrowing.isbn,
        borrowing.accession_number,
        borrowing.borrowing_id,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      const isOverdue =
        ["borrowed", "overdue"].includes(borrowing.status) &&
        (borrowing.status === "overdue" ||
          Boolean(borrowing.is_overdue));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "overdue"
          ? isOverdue
          : borrowing.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [borrowings, search, statusFilter]);

  // Issue a book
  const handleIssue = async (e) => {
    e.preventDefault();

    setError("");
    setNotice("");

    if (!studentId.trim()) {
      setError("Please enter a student ID.");
      return;
    }

    if (!reservationId.trim() && !copyId.trim()) {
      setError("Please enter a copy ID for a walk-in borrowing.");
      return;
    }

    const borrowingData = {
      studentId: Number(studentId),
      ...(reservationId.trim()
        ? { reservationId: Number(reservationId) }
        : { copyId: Number(copyId) }),
    };

    if (
      !Number.isInteger(borrowingData.studentId) ||
      borrowingData.studentId <= 0 ||
      (reservationId.trim() &&
        (!Number.isInteger(Number(reservationId)) ||
          Number(reservationId) <= 0)) ||
      (copyId.trim() &&
        (!Number.isInteger(Number(copyId)) || Number(copyId) <= 0))
    ) {
      setError("Please enter valid positive ID numbers.");
      return;
    }

    try {
      setActionLoading(true);

      const response = await issueBorrowing(borrowingData);

      setNotice(response.message || "Book issued successfully.");

      setStudentId("");
      setReservationId("");
      setCopyId("");
      setShowIssueForm(false);

      await fetchBorrowings();
    } catch (err) {
      setError(err.message || "Unable to issue the book.");
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm book return
  const handleReturn = async () => {
  if (!selectedBorrowing) return;

  const borrowing = selectedBorrowing;

  // Notes are required for damaged or lost books
  if (
    ["damaged", "lost"].includes(returnCondition) &&
    !returnNotes.trim()
  ) {
    setError("Please provide notes for damaged or lost books.");
    return;
  }

  try {
    setReturnLoadingId(borrowing.borrowing_id);
    setError("");
    setNotice("");

    const response = await returnBorrowing(
      borrowing.borrowing_id,
      {
        condition: returnCondition,
        notes: returnNotes.trim(),
      }
    );

    setNotice(response.message || "Borrowing record updated successfully.");

    setSelectedBorrowing(null);
    setReturnCondition("normal");
    setReturnNotes("");

    await fetchBorrowings();
  } catch (err) {
    setError(err.message || "Unable to process the borrowing record.");
  } finally {
    setReturnLoadingId(null);
  }
};

  const summaryCards = [
    {
      label: "Total Borrowings",
      count: summary.total,
      icon: BookOpen,
      color: "green",
    },
    {
      label: "Active Borrowings",
      count: summary.active,
      icon: Users,
      color: "blue",
    },
    {
      label: "Overdue Books",
      count: summary.overdue,
      icon: AlertTriangle,
      color: "red",
    },
    {
      label: "Returned Books",
      count: summary.returned,
      icon: CheckCircle2,
      color: "purple",
    },
    {
      label: "Lost Books",
      count: summary.lost,
      icon: XCircle,
      color: "orange",
    },
  ];

  return (
    <DashboardLayout
      role="librarian"
      title="Borrowings"
      activeItem="Borrowings"
    >
      <div className="lbr-page">

        {/* Page Header */}
        <div className="lbr-header">
          <div>
            <div className="lbr-eyebrow">
              <ClipboardList size={15} />
              LIBRARY OPERATIONS
            </div>

            <h1>Borrowings & Returns</h1>

            <p>
              Manage book issues, track active loans and process returns.
            </p>
          </div>

          <div className="lbr-header-actions">
            <button
              className="lbr-button lbr-button-outline"
              onClick={fetchBorrowings}
              disabled={loading}
              type="button"
            >
              <RefreshCw
                size={17}
                className={loading ? "lbr-spin" : ""}
              />
              Refresh
            </button>

            <button
              className="lbr-button lbr-button-primary"
              onClick={() => {
                setShowIssueForm(!showIssueForm);
                setError("");
                setNotice("");
              }}
              type="button"
            >
              {showIssueForm ? <X size={17} /> : <Plus size={18} />}
              {showIssueForm ? "Close Form" : "Issue Book"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="lbr-message lbr-message-error">
            <AlertTriangle size={19} />
            <span>{error}</span>
            <button onClick={() => setError("")} type="button">
              <X size={17} />
            </button>
          </div>
        )}

        {notice && (
          <div className="lbr-message lbr-message-success">
            <CheckCircle2 size={19} />
            <span>{notice}</span>
            <button onClick={() => setNotice("")} type="button">
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="lbr-stats-grid">
          {summaryCards.map((item) => {
            const Icon = item.icon;

            return (
              <div className="lbr-stat-card" key={item.label}>
                <div className={`lbr-stat-icon ${item.color}`}>
                  <Icon size={21} />
                </div>

                <div className="lbr-stat-content">
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* Issue Book Form */}
        {showIssueForm && (
          <section className="lbr-form-card">
            <div className="lbr-section-heading">
              <div className="lbr-heading-icon">
                <BookOpen size={21} />
              </div>

              <div>
                <h2>Issue a Book</h2>
                <p>
                  Create a new borrowing record for a student.
                </p>
              </div>
            </div>

            <form onSubmit={handleIssue}>
              <div className="lbr-form-grid">

                <div className="lbr-field">
                  <label>
                    Student ID <span>*</span>
                  </label>

                  <div className="lbr-input-wrap">
                    <UserRound size={17} />

                    <input
                      type="number"
                      min="1"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="Enter student ID"
                    />
                  </div>

                  <small>Enter the registered student ID.</small>
                </div>

                <div className="lbr-field">
                  <label>Reservation ID</label>

                  <div className="lbr-input-wrap">
                    <Hash size={17} />

                    <input
                      type="number"
                      min="1"
                      value={reservationId}
                      onChange={(e) => {
                        setReservationId(e.target.value);

                        if (e.target.value) {
                          setCopyId("");
                        }
                      }}
                      placeholder="Enter reservation ID"
                    />
                  </div>

                  <small>
                    Use this field for reservation pickups.
                  </small>
                </div>

                <div className="lbr-field">
                  <label>Book Copy ID</label>

                  <div className="lbr-input-wrap">
                    <BookOpen size={17} />

                    <input
                      type="number"
                      min="1"
                      value={copyId}
                      disabled={Boolean(reservationId.trim())}
                      onChange={(e) => setCopyId(e.target.value)}
                      placeholder="Enter available copy ID"
                    />
                  </div>

                  <small>
                    Required for walk-in borrowing.
                  </small>
                </div>
              </div>

              <div className="lbr-form-info">
                <AlertTriangle size={17} />

                <p>
                  Enter either a Reservation ID or a Book Copy ID.
                  Do not enter both. The student must be active and
                  must not have an overdue borrowing.
                </p>
              </div>

              <div className="lbr-form-actions">
                <button
                  type="button"
                  className="lbr-button lbr-button-outline"
                  onClick={() => {
                    setShowIssueForm(false);
                    setStudentId("");
                    setReservationId("");
                    setCopyId("");
                    setError("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="lbr-button lbr-button-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw size={17} className="lbr-spin" />
                      Issuing...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={17} />
                      Confirm Issue
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Records Section */}
        <section className="lbr-records-card">

          <div className="lbr-records-heading">
            <div>
              <h2>Borrowing Records</h2>
              <p>
                View and manage all student borrowing transactions.
              </p>
            </div>

            <div className="lbr-record-count">
              {filteredBorrowings.length} Records
            </div>
          </div>

          {/* Search and Filter */}
          <div className="lbr-toolbar">
            <div className="lbr-search">
              <Search size={18} />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, book, ISBN or accession number..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="lbr-filter">
              <ClipboardList size={17} />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="borrowed">Active</option>
                <option value="overdue">Overdue</option>
                <option value="returned">Returned</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="lbr-state">
              <RefreshCw size={25} className="lbr-spin" />
              <p>Loading borrowing records...</p>
            </div>
          ) : filteredBorrowings.length === 0 ? (
            <div className="lbr-state">
              <BookOpen size={34} />
              <h3>No borrowing records found</h3>
              <p>
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <div className="lbr-table-wrapper">
              <table className="lbr-table">
                <thead>
                  <tr>
                    <th>Borrowing ID</th>
                    <th>Student</th>
                    <th>Book Details</th>
                    <th>Copy Details</th>
                    <th>Borrowed At</th>
                    <th>Due Date</th>
                    <th>Returned At</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBorrowings.map((borrowing) => {
                    const isOverdue =
                      ["borrowed", "overdue"].includes(borrowing.status) &&
                      (borrowing.status === "overdue" ||
                        Boolean(borrowing.is_overdue));

                    const displayStatus = isOverdue
                      ? "overdue"
                      : borrowing.status;

                    const status =
                      statusConfig[displayStatus] || {
                        label: formatStatus(displayStatus),
                        className: "lbr-status-lost",
                      };

                    const canReturn =
                      ["borrowed", "overdue"].includes(borrowing.status) &&
                      !borrowing.returned_at;

                    return (
                      <tr key={borrowing.borrowing_id}>
                        <td>
                          <span className="lbr-id">
                            #{borrowing.borrowing_id}
                          </span>
                        </td>

                        <td>
                          <div className="lbr-student">
                            <div className="lbr-avatar">
                              <UserRound size={17} />
                            </div>

                            <div>
                              <strong>
                                {borrowing.student_name ||
                                  `Student #${borrowing.student_id}`}
                              </strong>

                              <span>
                                {borrowing.student_email ||
                                  `ID: ${borrowing.student_id}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="lbr-book">
                            <strong>
                              {borrowing.title || "Unknown book"}
                            </strong>

                            <span>
                              {borrowing.authors || "Unknown author"}
                            </span>

                            <small>ISBN: {borrowing.isbn || "—"}</small>
                          </div>
                        </td>

                        <td>
                          <div className="lbr-copy">
                            <span>
                              <Hash size={13} />
                              {borrowing.accession_number || "—"}
                            </span>

                            <small>
                              <MapPin size={13} />
                              {borrowing.shelf_location || "No shelf"}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span className="lbr-date">
                            <CalendarDays size={14} />
                            {formatDate(borrowing.borrowed_at)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`lbr-date ${
                              isOverdue ? "lbr-date-overdue" : ""
                            }`}
                          >
                            <Clock size={14} />
                            {formatDate(borrowing.due_date)}
                          </span>
                        </td>

                        <td>
                          <span className="lbr-date">
                            {formatDate(borrowing.returned_at)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`lbr-status ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td>
                          {canReturn ? (
                            <button
                              type="button"
                              className="lbr-return-button"
                              onClick={() =>
                                setSelectedBorrowing(borrowing)
                              }
                              disabled={returnLoadingId !== null}
                            >
                              <RotateCcw size={15} />
                              Record Return
                            </button>
                          ) : (
                            <span className="lbr-no-action">
                              No action
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="lbr-table-footer">
            <span>
              Showing {filteredBorrowings.length} of {borrowings.length} records
            </span>

            <span>
              SmartShelf Library Operations
            </span>
          </div>
        </section>

        {/* Return Confirmation Modal */}
{selectedBorrowing && (
  <div
    className="lbr-modal-overlay"
    onClick={() => {
      setSelectedBorrowing(null);
      setReturnCondition("normal");
      setReturnNotes("");
    }}
  >
    <div
      className="lbr-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="lbr-modal-icon">
        <PackageCheck size={27} />
      </div>

      <button
        type="button"
        className="lbr-modal-close"
        onClick={() => {
          setSelectedBorrowing(null);
          setReturnCondition("normal");
          setReturnNotes("");
        }}
      >
        <X size={19} />
      </button>

      <h2>
        {returnCondition === "normal"
          ? "Confirm Book Return"
          : returnCondition === "damaged"
          ? "Record Damaged Book"
          : "Mark Book as Lost"}
      </h2>

      <p>
        Select the condition of the book before completing this transaction.
      </p>

      <div className="lbr-return-details">
        <div>
          <span>Book</span>
          <strong>
            {selectedBorrowing.title || "Unknown book"}
          </strong>
        </div>

        <div>
          <span>Student</span>
          <strong>
            {selectedBorrowing.student_name ||
              `Student #${selectedBorrowing.student_id}`}
          </strong>
        </div>

        <div>
          <span>Borrowing ID</span>
          <strong>
            #{selectedBorrowing.borrowing_id}
          </strong>
        </div>
      </div>

      {/* Return Condition */}
      <div className="lbr-field">
        <label htmlFor="returnCondition">
          Return Condition <span>*</span>
        </label>

        <select
          id="returnCondition"
          value={returnCondition}
          onChange={(e) => {
            setReturnCondition(e.target.value);
            setReturnNotes("");
            setError("");
          }}
          disabled={returnLoadingId !== null}
        >
          <option value="normal">Normal - Good Condition</option>
          <option value="damaged">Damaged</option>
          <option value="lost">Lost - Not Returned</option>
        </select>
      </div>

      {/* Incident Notes */}
      {["damaged", "lost"].includes(returnCondition) && (
        <div className="lbr-field">
          <label htmlFor="returnNotes">
            Incident Notes <span>*</span>
          </label>

          <textarea
            id="returnNotes"
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder={
              returnCondition === "damaged"
                ? "Describe the damage to the book..."
                : "Explain the circumstances of the lost book..."
            }
            rows={3}
            maxLength={1000}
            disabled={returnLoadingId !== null}
          />

          <small>
            Notes are required for damaged or lost books.
          </small>
        </div>
      )}

      {/* Information Message */}
      <div className="lbr-modal-info">
        <AlertTriangle size={17} />

        <span>
          {returnCondition === "normal"
            ? "If another student is waiting for this book, the copy may be allocated automatically."
            : returnCondition === "damaged"
            ? "This copy will be marked as damaged and will not be available for borrowing."
            : "This borrowing will be marked as lost, and the copy will not be available for borrowing."}
        </span>
      </div>

      {/* Modal Actions */}
      <div className="lbr-modal-actions">
        <button
          type="button"
          className="lbr-button lbr-button-outline"
          onClick={() => {
            setSelectedBorrowing(null);
            setReturnCondition("normal");
            setReturnNotes("");
          }}
          disabled={returnLoadingId !== null}
        >
          Cancel
        </button>

        <button
          type="button"
          className="lbr-button lbr-button-primary"
          onClick={handleReturn}
          disabled={returnLoadingId !== null}
        >
          {returnLoadingId !== null ? (
            <>
              <RefreshCw size={16} className="lbr-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 size={17} />
              {returnCondition === "normal"
                ? "Confirm Return"
                : returnCondition === "damaged"
                ? "Mark as Damaged"
                : "Mark as Lost"}
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

export default LibrarianBorrowingsPage;