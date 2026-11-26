import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

import {
  getCopies,
  addCopy,
  updateCopy,
  getBooks,
} from "../../services/librarianService";

import {
  Search,
  Plus,
  RefreshCw,
  BookOpen,
  Pencil,
  X,
  MapPin,
  LibraryBig,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Hash,
  Archive,
  Package,
} from "lucide-react";

import "./LibrarianCopiesPage.css";

const initialFormData = {
  book_id: "",
  accession_number: "",
  shelf_location: "",
  status: "available",
};

const statusOptions = [
  "available",
  "reserved",
  "borrowed",
  "damaged",
  "lost",
];

const LibrarianCopiesPage = () => {
  const [copies, setCopies] = useState([]);
  const [books, setBooks] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCopy, setEditingCopy] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  // =====================================
  // FETCH COPIES
  // =====================================

  const fetchCopies = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCopies(search, status);
      setCopies(response.copies || []);
    } catch (err) {
      setError(err.message || "Failed to load book copies.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchCopies();
  }, [fetchCopies]);

  // =====================================
  // FETCH ACTIVE BOOKS
  // =====================================

  const fetchBooks = async () => {
    try {
      setBooksLoading(true);

      const response = await getBooks("", "active");
      setBooks(response.books || []);
    } catch (err) {
      setError(err.message || "Failed to load books.");
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // =====================================
  // STATUS COUNTS
  // These represent the current results.
  // =====================================

  const availableCount = copies.filter(
    (copy) => copy.status === "available"
  ).length;

  const borrowedCount = copies.filter(
    (copy) => copy.status === "borrowed"
  ).length;

  const otherCount = copies.filter(
    (copy) =>
      copy.status === "reserved" ||
      copy.status === "damaged" ||
      copy.status === "lost"
  ).length;

  // =====================================
  // OPEN ADD MODAL
  // =====================================

  const openAddModal = () => {
    setEditingCopy(null);
    setFormData({ ...initialFormData });
    setError("");
    setNotice("");
    setShowModal(true);

    if (books.length === 0) {
      fetchBooks();
    }
  };

  // =====================================
  // OPEN EDIT MODAL
  // =====================================

  const openEditModal = (copy) => {
    setEditingCopy(copy);

    setFormData({
      book_id: copy.book_id,
      accession_number: copy.accession_number || "",
      shelf_location: copy.shelf_location || "",
      status: copy.status || "available",
    });

    setError("");
    setNotice("");
    setShowModal(true);
  };

  // =====================================
  // HANDLE FORM INPUTS
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================
  // SAVE COPY
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const copyData = {
        accession_number: formData.accession_number.trim(),
        shelf_location: formData.shelf_location.trim() || null,
      };

      if (editingCopy) {
        await updateCopy(editingCopy.copy_id, {
          ...copyData,
          status: formData.status,
        });

        setNotice("Book copy updated successfully.");
      } else {
        await addCopy({
          ...copyData,
          book_id: Number(formData.book_id),
        });

        setNotice("New book copy added successfully.");
      }

      setShowModal(false);
      setEditingCopy(null);
      setFormData({ ...initialFormData });

      await fetchCopies();
    } catch (err) {
      setError(err.message || "Failed to save book copy.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // CLOSE MODAL
  // =====================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCopy(null);
    setFormData({ ...initialFormData });
  };

  // =====================================
  // STATUS BADGE
  // =====================================

  const getStatusClass = (copyStatus) => {
    const classes = {
      available: "lc-status available",
      borrowed: "lc-status borrowed",
      reserved: "lc-status reserved",
      damaged: "lc-status damaged",
      lost: "lc-status lost",
    };

    return classes[copyStatus] || "lc-status";
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <DashboardLayout
      role="librarian"
      title="Manage Copies"
      activeItem="Manage Copies"
    >
      <div className="lc-page">

        {/* PAGE HEADER */}

        <section className="lc-header">
          <div>
            <span className="lc-eyebrow">
              LIBRARY OPERATIONS
            </span>

            <h1>Copy Management</h1>

            <p>
              Manage individual physical copies, accession numbers
              and library shelf locations.
            </p>
          </div>

          <button
            type="button"
            className="lc-add-button"
            onClick={openAddModal}
          >
            <Plus size={19} />
            Add New Copy
          </button>
        </section>

        {/* NOTIFICATIONS */}

        {notice && (
          <div className="lc-notice">
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
          <div className="lc-error">
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

        <section className="lc-stats-grid">

          <article className="lc-stat-card">
            <div className="lc-stat-icon total">
              <Package size={22} />
            </div>

            <div>
              <p>Current Results</p>
              <h2>{copies.length}</h2>
            </div>
          </article>

          <article className="lc-stat-card">
            <div className="lc-stat-icon available">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <p>Available</p>
              <h2>{availableCount}</h2>
            </div>
          </article>

          <article className="lc-stat-card">
            <div className="lc-stat-icon borrowed">
              <BookOpen size={22} />
            </div>

            <div>
              <p>Borrowed</p>
              <h2>{borrowedCount}</h2>
            </div>
          </article>

          <article className="lc-stat-card">
            <div className="lc-stat-icon other">
              <Archive size={22} />
            </div>

            <div>
              <p>Other Statuses</p>
              <h2>{otherCount}</h2>
            </div>
          </article>

        </section>

        {/* SEARCH AND FILTERS */}

        <section className="lc-filter-section">

          <div className="lc-search-box">
            <Search size={19} />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, accession number or shelf..."
              aria-label="Search physical copies"
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

          <div className="lc-filter-control">
            <Filter size={17} />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter copy status"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="borrowed">Borrowed</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <button
            type="button"
            className="lc-refresh-button"
            onClick={fetchCopies}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "lc-spinning" : ""}
            />
            Refresh
          </button>

        </section>

        {/* COPY TABLE */}

        <section className="lc-catalogue">

          <div className="lc-catalogue-header">
            <div className="lc-catalogue-title">
              <div className="lc-title-icon">
                <LibraryBig size={21} />
              </div>

              <div>
                <h2>Physical Book Copies</h2>
                <p>
                  {copies.length}{" "}
                  {copies.length === 1 ? "copy" : "copies"} found
                </p>
              </div>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="lc-state">
              <RefreshCw
                size={30}
                className="lc-spinning"
              />

              <h3>Loading book copies...</h3>
              <p>Please wait while we retrieve the records.</p>
            </div>
          ) : error && copies.length === 0 ? (
            <div className="lc-state">
              <AlertTriangle size={32} />

              <h3>Unable to load copies</h3>
              <p>Check your connection and try again.</p>

              <button
                type="button"
                onClick={fetchCopies}
              >
                Try Again
              </button>
            </div>
          ) : copies.length === 0 ? (
            <div className="lc-state">
              <div className="lc-empty-icon">
                <BookOpen size={34} />
              </div>

              <h3>No copies found</h3>

              <p>
                Try another search or add a physical copy
                to your library.
              </p>

              <button
                type="button"
                onClick={openAddModal}
              >
                <Plus size={17} />
                Add New Copy
              </button>
            </div>
          ) : (
            <div className="lc-table-wrapper">

              <table className="lc-table">

                <thead>
                  <tr>
                    <th>BOOK DETAILS</th>
                    <th>ACCESSION NUMBER</th>
                    <th>SHELF LOCATION</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {copies.map((copy) => (
                    <tr key={copy.copy_id}>

                      {/* BOOK DETAILS */}

                      <td>
                        <div className="lc-book-info">

                          <div className="lc-book-icon">
                            <BookOpen size={21} />
                          </div>

                          <div className="lc-book-text">
                            <h3>
                              {copy.title ||
                                `Book ID: ${copy.book_id}`}
                            </h3>

                            <p>
                              {copy.authors || "Unknown author"}
                            </p>

                            {copy.isbn && (
                              <span>ISBN: {copy.isbn}</span>
                            )}
                          </div>

                        </div>
                      </td>

                      {/* ACCESSION NUMBER */}

                      <td>
                        <div className="lc-accession">
                          <Hash size={15} />
                          <span>{copy.accession_number}</span>
                        </div>
                      </td>

                      {/* SHELF LOCATION */}

                      <td>
                        <div className="lc-shelf">
                          <MapPin size={15} />

                          <span>
                            {copy.shelf_location || "Not assigned"}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span className={getStatusClass(copy.status)}>
                          <span className="lc-status-dot"></span>

                          {copy.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <button
                          type="button"
                          className="lc-edit-button"
                          onClick={() => openEditModal(copy)}
                          title="Edit copy"
                          aria-label={`Edit ${copy.accession_number}`}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ADD / EDIT MODAL */}

        {showModal && (
          <div
            className="lc-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div
              className="lc-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lc-modal-title"
            >

              <div className="lc-modal-header">

                <div>
                  <span className="lc-eyebrow">
                    PHYSICAL COLLECTION
                  </span>

                  <h2 id="lc-modal-title">
                    {editingCopy
                      ? "Edit Book Copy"
                      : "Add New Copy"}
                  </h2>

                  <p>
                    Enter the physical copy information below.
                  </p>
                </div>

                <button
                  type="button"
                  className="lc-close-button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close form"
                >
                  <X size={21} />
                </button>

              </div>

              <form
                onSubmit={handleSubmit}
                className="lc-form"
              >

                {/* BOOK SELECTION */}

                {!editingCopy && (
                  <div className="lc-form-group">
                    <label htmlFor="lc-book">
                      Select Book <span>*</span>
                    </label>

                    <select
                      id="lc-book"
                      name="book_id"
                      value={formData.book_id}
                      onChange={handleChange}
                      required
                      disabled={booksLoading}
                      className="lc-form-input"
                    >
                      <option value="">
                        {booksLoading
                          ? "Loading books..."
                          : "Choose a book"}
                      </option>

                      {books.map((book) => (
                        <option
                          key={book.book_id}
                          value={book.book_id}
                        >
                          {book.title}
                        </option>
                      ))}
                    </select>

                    {!booksLoading && books.length === 0 && (
                      <small>
                        No active books available. Add a book first.
                      </small>
                    )}
                  </div>
                )}

                {/* ACCESSION NUMBER */}

                <div className="lc-form-group">
                  <label htmlFor="lc-accession">
                    Accession Number <span>*</span>
                  </label>

                  <input
                    id="lc-accession"
                    type="text"
                    name="accession_number"
                    value={formData.accession_number}
                    onChange={handleChange}
                    required
                    className="lc-form-input"
                    placeholder="e.g. FOT-002"
                  />

                  <small>
                    A unique identification number for this physical copy.
                  </small>
                </div>

                {/* SHELF LOCATION */}

                <div className="lc-form-group">
                  <label htmlFor="lc-shelf">
                    Shelf Location
                  </label>

                  <input
                    id="lc-shelf"
                    type="text"
                    name="shelf_location"
                    value={formData.shelf_location}
                    onChange={handleChange}
                    className="lc-form-input"
                    placeholder="e.g. A1-01"
                  />
                </div>

                {/* COPY STATUS */}

                {editingCopy && (
                  <div className="lc-form-group">
                    <label htmlFor="lc-status">
                      Copy Status
                    </label>

                    <select
                      id="lc-status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="lc-form-input"
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() +
                            option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* ERROR */}

                {error && (
                  <div className="lc-form-error">
                    <AlertTriangle size={17} />
                    <span>{error}</span>
                  </div>
                )}

                {/* BUTTONS */}

                <div className="lc-form-footer">

                  <button
                    type="button"
                    className="lc-cancel-button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="lc-submit-button"
                    disabled={
                      saving ||
                      (!editingCopy && books.length === 0) ||
                      booksLoading
                    }
                  >
                    {saving ? (
                      <>
                        <RefreshCw
                          size={17}
                          className="lc-spinning"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} />
                        {editingCopy
                          ? "Update Copy"
                          : "Add Copy"}
                      </>
                    )}
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default LibrarianCopiesPage;