import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

import {
  getBooks,
  addBook,
  updateBook,
  archiveBook,
  restoreBook,
} from "../../services/librarianService";

import {
  Search,
  Plus,
  RefreshCw,
  BookOpen,
  Pencil,
  Archive,
  RotateCcw,
  X,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Filter,
  LibraryBig,
} from "lucide-react";

import "./LibrarianBooksPage.css";

const initialFormData = {
  isbn: "",
  title: "",
  authors: "",
  publisher: "",
  publication_year: "",
  edition: "",
  language: "",
  description: "",
  cover_image_url: "",
};

const LibrarianBooksPage = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // =====================================
  // FETCH BOOKS
  // =====================================

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getBooks(search, status);
      setBooks(response.books || []);
    } catch (err) {
      setError(err.message || "Failed to load books.");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // =====================================
  // OPEN ADD MODAL
  // =====================================

  const openAddModal = () => {
    setEditingBook(null);
    setFormData({ ...initialFormData });
    setShowModal(true);
    setError("");
    setNotice("");
  };

  // =====================================
  // OPEN EDIT MODAL
  // =====================================

  const openEditModal = (book) => {
    setEditingBook(book);

    setFormData({
      isbn: book.isbn || "",
      title: book.title || "",
      authors: book.authors || "",
      publisher: book.publisher || "",
      publication_year: book.publication_year || "",
      edition: book.edition || "",
      language: book.language || "",
      description: book.description || "",
      cover_image_url: book.cover_image_url || "",
    });

    setShowModal(true);
    setError("");
    setNotice("");
  };

  // =====================================
  // HANDLE INPUT CHANGES
  // =====================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================
  // SAVE BOOK
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const bookData = {
        ...formData,
        publication_year: formData.publication_year
          ? Number(formData.publication_year)
          : null,
      };

      if (editingBook) {
        await updateBook(editingBook.book_id, bookData);
        setNotice("Book updated successfully.");
      } else {
        await addBook(bookData);
        setNotice("New book added successfully.");
      }

      setShowModal(false);
      setFormData({ ...initialFormData });
      setEditingBook(null);

      await fetchBooks();
    } catch (err) {
      setError(err.message || "Failed to save book.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // ARCHIVE / RESTORE CONFIRMATION
  // =====================================

  const openConfirmation = (book, action) => {
    setConfirmAction({ book, action });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    const { book, action } = confirmAction;

    try {
      setActionLoading(book.book_id);
      setError("");
      setNotice("");
      setConfirmAction(null);

      if (action === "archive") {
        await archiveBook(book.book_id);
        setNotice("Book archived successfully.");
      } else {
        await restoreBook(book.book_id);
        setNotice("Book restored successfully.");
      }

      await fetchBooks();
    } catch (err) {
      setError(
        err.message ||
          `Failed to ${action} book.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================
  // CLOSE MODAL
  // =====================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingBook(null);
    setFormData({ ...initialFormData });
  };

  // =====================================
  // INPUT STYLE
  // =====================================

  const inputClass = "lb-form-input";

  return (
    <DashboardLayout
      role="librarian"
      title="Manage Books"
      activeItem="Manage Books"
    >
      <div className="lb-page">

        {/* PAGE HEADER */}

        <section className="lb-header">
          <div>
            <span className="lb-eyebrow">
              LIBRARY OPERATIONS
            </span>

            <h1>Book Management</h1>

            <p>
              Manage your library catalogue, book details
              and publication information.
            </p>
          </div>

          <button
            type="button"
            className="lb-add-button"
            onClick={openAddModal}
          >
            <Plus size={19} />
            Add New Book
          </button>
        </section>

        {/* NOTIFICATIONS */}

        {notice && (
          <div className="lb-notice">
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
          <div className="lb-error">
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

        {/* SEARCH AND FILTER SECTION */}

        <section className="lb-filter-section">

          <div className="lb-search-box">
            <Search size={19} />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by book title, author or ISBN..."
              aria-label="Search books"
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

          <div className="lb-filter-control">
            <Filter size={17} />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter book status"
            >
              <option value="active">Active Books</option>
              <option value="archived">Archived Books</option>
              <option value="">All Books</option>
            </select>
          </div>

          <button
            type="button"
            className="lb-refresh-button"
            onClick={fetchBooks}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "lb-spinning" : ""}
            />
            Refresh
          </button>

        </section>

        {/* CATALOGUE */}

        <section className="lb-catalogue">

          <div className="lb-catalogue-header">
            <div className="lb-catalogue-title">
              <div className="lb-title-icon">
                <LibraryBig size={21} />
              </div>

              <div>
                <h2>Library Catalogue</h2>

                <p>
                  {books.length}{" "}
                  {books.length === 1 ? "book" : "books"} found
                </p>
              </div>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="lb-state">
              <RefreshCw
                size={30}
                className="lb-spinning"
              />

              <h3>Loading books...</h3>

              <p>Please wait while we retrieve the catalogue.</p>
            </div>
          ) : error && books.length === 0 ? (
            <div className="lb-state">
              <AlertTriangle size={32} />

              <h3>Unable to load books</h3>

              <p>Check your connection and try again.</p>

              <button
                type="button"
                onClick={fetchBooks}
              >
                Try Again
              </button>
            </div>
          ) : books.length === 0 ? (
            <div className="lb-state">
              <div className="lb-empty-icon">
                <BookOpen size={34} />
              </div>

              <h3>No books found</h3>

              <p>
                Try changing your search or filter,
                or add a new book to your catalogue.
              </p>

              <button
                type="button"
                onClick={openAddModal}
              >
                <Plus size={17} />
                Add New Book
              </button>
            </div>
          ) : (
            <div className="lb-table-wrapper">
              <table className="lb-table">

                <thead>
                  <tr>
                    <th>BOOK DETAILS</th>
                    <th>ISBN</th>
                    <th>PUBLISHER</th>
                    <th>COPIES</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {books.map((book) => (
                    <tr key={book.book_id}>

                      {/* BOOK DETAILS */}

                      <td>
                        <div className="lb-book-info">

                          <div className="lb-book-cover">
                            {book.cover_image_url && (
                              <img
                                src={book.cover_image_url}
                                alt={book.title}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}

                            <div className="lb-cover-fallback">
                              <BookOpen size={23} />
                            </div>
                          </div>

                          <div className="lb-book-text">
                            <h3>{book.title}</h3>

                            <p>
                              {book.authors || "Unknown author"}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* ISBN */}

                      <td className="lb-muted-cell">
                        {book.isbn || "—"}
                      </td>

                      {/* PUBLISHER */}

                      <td className="lb-muted-cell">
                        {book.publisher || "—"}
                      </td>

                      {/* COPIES */}

                      <td>
                        <div className="lb-copy-info">
                          <strong>
                            {book.total_copies || 0}
                          </strong>

                          <span>
                            {book.available_copies || 0} available
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={
                            book.is_archived
                              ? "lb-status archived"
                              : "lb-status active"
                          }
                        >
                          <span className="lb-status-dot"></span>

                          {book.is_archived
                            ? "Archived"
                            : "Active"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="lb-actions">

                          {!book.is_archived && (
                            <>
                              <button
                                type="button"
                                className="lb-edit-action"
                                onClick={() => openEditModal(book)}
                                title="Edit book"
                                aria-label={`Edit ${book.title}`}
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                className="lb-archive-action"
                                onClick={() =>
                                  openConfirmation(book, "archive")
                                }
                                disabled={
                                  actionLoading === book.book_id
                                }
                                title="Archive book"
                                aria-label={`Archive ${book.title}`}
                              >
                                <Archive size={16} />
                              </button>
                            </>
                          )}

                          {book.is_archived && (
                            <button
                              type="button"
                              className="lb-restore-action"
                              onClick={() =>
                                openConfirmation(book, "restore")
                              }
                              disabled={
                                actionLoading === book.book_id
                              }
                              title="Restore book"
                              aria-label={`Restore ${book.title}`}
                            >
                              <RotateCcw size={16} />
                              Restore
                            </button>
                          )}

                          {actionLoading === book.book_id && (
                            <RefreshCw
                              size={16}
                              className="lb-spinning"
                            />
                          )}

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </section>

        {/* ADD / EDIT BOOK MODAL */}

        {showModal && (
          <div
            className="lb-modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <div
              className="lb-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lb-modal-title"
            >

              <div className="lb-modal-header">
                <div>
                  <span className="lb-eyebrow">
                    BOOK CATALOGUE
                  </span>

                  <h2 id="lb-modal-title">
                    {editingBook ? "Edit Book" : "Add New Book"}
                  </h2>

                  <p>
                    Enter the publication information below.
                  </p>
                </div>

                <button
                  type="button"
                  className="lb-close-button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close form"
                >
                  <X size={21} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="lb-form"
              >

                <div className="lb-form-section-title">
                  <BookOpen size={18} />
                  <h3>Basic Information</h3>
                </div>

                <div className="lb-form-grid">

                  <div className="lb-form-group lb-full-width">
                    <label htmlFor="lb-title">
                      Book Title <span>*</span>
                    </label>

                    <input
                      id="lb-title"
                      className={inputClass}
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter book title"
                      required
                    />
                  </div>

                  <div className="lb-form-group">
                    <label htmlFor="lb-authors">
                      Author(s) <span>*</span>
                    </label>

                    <input
                      id="lb-authors"
                      className={inputClass}
                      type="text"
                      name="authors"
                      value={formData.authors}
                      onChange={handleChange}
                      placeholder="Enter author name(s)"
                      required
                    />
                  </div>

                  <div className="lb-form-group">
                    <label htmlFor="lb-isbn">ISBN</label>

                    <input
                      id="lb-isbn"
                      className={inputClass}
                      type="text"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleChange}
                      placeholder="Enter ISBN"
                    />
                  </div>

                  <div className="lb-form-group">
                    <label htmlFor="lb-publisher">Publisher</label>

                    <input
                      id="lb-publisher"
                      className={inputClass}
                      type="text"
                      name="publisher"
                      value={formData.publisher}
                      onChange={handleChange}
                      placeholder="Enter publisher"
                    />
                  </div>

                  <div className="lb-form-group">
                    <label htmlFor="lb-year">
                      Publication Year
                    </label>

                    <input
                      id="lb-year"
                      className={inputClass}
                      type="number"
                      name="publication_year"
                      value={formData.publication_year}
                      onChange={handleChange}
                      min="1000"
                      max={new Date().getFullYear() + 1}
                      placeholder="e.g. 2024"
                    />
                  </div>

                  <div className="lb-form-group">
                    <label htmlFor="lb-edition">Edition</label>

                    <input
                      id="lb-edition"
                      className={inputClass}
                      type="text"
                      name="edition"
                      value={formData.edition}
                      onChange={handleChange}
                      placeholder="e.g. 2nd Edition"
                    />
                  </div>

                  <div className="lb-form-group">
                    <label htmlFor="lb-language">Language</label>

                    <input
                      id="lb-language"
                      className={inputClass}
                      type="text"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      placeholder="e.g. English"
                    />
                  </div>

                </div>

                {/* COVER IMAGE */}

                <div className="lb-form-section-title lb-cover-heading">
                  <ImageIcon size={18} />
                  <h3>Book Cover</h3>
                </div>

                <div className="lb-form-group">
                  <label htmlFor="lb-cover-url">
                    Cover Image URL
                  </label>

                  <input
                    id="lb-cover-url"
                    className={inputClass}
                    type="url"
                    name="cover_image_url"
                    value={formData.cover_image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/book-cover.jpg"
                  />

                  <small>
                    Enter an image URL to display the book cover.
                  </small>
                </div>

                {formData.cover_image_url && (
                  <div className="lb-cover-preview">
                    <div className="lb-preview-image">
                      <img
                        src={formData.cover_image_url}
                        alt="Book cover preview"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />

                      <div className="lb-preview-fallback">
                        <ImageIcon size={25} />
                        <span>Image preview unavailable</span>
                      </div>
                    </div>

                    <p>Cover image preview</p>
                  </div>
                )}

                {/* DESCRIPTION */}

                <div className="lb-form-section-title lb-description-heading">
                  <ClipboardIcon />
                  <h3>Description</h3>
                </div>

                <div className="lb-form-group">
                  <label htmlFor="lb-description">
                    Book Description
                  </label>

                  <textarea
                    id="lb-description"
                    className={inputClass}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Write a short description about the book..."
                  />
                </div>

                {/* FORM BUTTONS */}

                {error && (
                  <div className="lb-form-error">
                    <AlertTriangle size={17} />
                    {error}
                  </div>
                )}

                <div className="lb-form-footer">
                  <button
                    type="button"
                    className="lb-cancel-button"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="lb-submit-button"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <RefreshCw
                          size={17}
                          className="lb-spinning"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} />
                        {editingBook
                          ? "Update Book"
                          : "Save Book"}
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* ARCHIVE / RESTORE CONFIRMATION */}

        {confirmAction && (
          <div className="lb-modal-overlay">
            <div
              className="lb-confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lb-confirm-title"
            >
              <div className="lb-confirm-icon">
                <AlertTriangle size={26} />
              </div>

              <h2 id="lb-confirm-title">
                {confirmAction.action === "archive"
                  ? "Archive this book?"
                  : "Restore this book?"}
              </h2>

              <p>
                Are you sure you want to{" "}
                {confirmAction.action}{" "}
                <strong>{confirmAction.book.title}</strong>?
              </p>

              <div className="lb-confirm-actions">
                <button
                  type="button"
                  className="lb-cancel-button"
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="lb-confirm-button"
                  onClick={handleConfirmAction}
                >
                  Yes, {confirmAction.action}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

// Small icon component for description heading
const ClipboardIcon = () => (
  <BookOpen size={18} />
);

export default LibrarianBooksPage;