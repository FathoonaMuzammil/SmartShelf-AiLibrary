
import API_BASE_URL from "./apiConfig.js";

const getAuthToken = () => sessionStorage.getItem("smartshelf_token");

// Common helper for librarian API calls
const request = async (path, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to SmartShelf server. Please check whether the backend is running.",
        { cause: error }
      );
    }

    throw error;
  }
};

// ==========================================
// LIBRARIAN DASHBOARD
// ==========================================

export const getDashboard = () => request("/librarian/dashboard");

// ==========================================
// BOOK MANAGEMENT API FUNCTIONS
// ==========================================

export const getBooks = (search = "", status = "active") => {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.append("search", search.trim());
  }

  if (status) {
    params.append("status", status);
  }

  return request(`/librarian/books?${params.toString()}`);
};

export const addBook = (bookData) =>
  request("/librarian/books", {
    method: "POST",
    body: bookData,
  });

export const updateBook = (bookId, bookData) =>
  request(`/librarian/books/${bookId}`, {
    method: "PUT",
    body: bookData,
  });

export const archiveBook = (bookId) =>
  request(`/librarian/books/${bookId}/archive`, {
    method: "PATCH",
  });

export const restoreBook = (bookId) =>
  request(`/librarian/books/${bookId}/restore`, {
    method: "PATCH",
  });

// ==========================================
// COPY MANAGEMENT API FUNCTIONS
// ==========================================

export const getCopies = (search = "", status = "") => {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.append("search", search.trim());
  }

  if (status) {
    params.append("status", status);
  }

  return request(`/librarian/copies?${params.toString()}`);
};

export const addCopy = (copyData) =>
  request("/librarian/copies", {
    method: "POST",
    body: copyData,
  });

export const updateCopy = (copyId, copyData) =>
  request(`/librarian/copies/${copyId}`, {
    method: "PUT",
    body: copyData,
  });

// ==========================================
// RESERVATION MANAGEMENT API FUNCTIONS
// ==========================================

export const getReservations = () =>
  request("/librarian/reservations");

export const allocateReservation = (reservationId) =>
  request(`/librarian/reservations/${reservationId}/allocate`, {
    method: "PATCH",
  });

export const cancelReservation = (reservationId) =>
  request(`/librarian/reservations/${reservationId}/cancel`, {
    method: "PATCH",
  });

// ==========================================
// BORROWING MANAGEMENT API FUNCTIONS
// ==========================================

export const getBorrowings = () =>
  request("/librarian/borrowings");

export const issueBorrowing = (borrowingData) =>
  request("/librarian/borrowings", {
    method: "POST",
    body: borrowingData,
  });

// ==========================================
// RETURNS MANAGEMENT API FUNCTIONS
// ==========================================

export const returnBorrowing = (borrowingId, returnData) =>
  request(`/librarian/borrowings/${borrowingId}/return`, {
    method: "PATCH",
    body: returnData,
  });

// ==========================================
// OVERDUE MANAGEMENT API FUNCTIONS
// ==========================================

export const getOverdueBorrowings = () =>
  request("/librarian/overdue");

// ==========================================
// REPORTS & ANALYTICS API FUNCTIONS
// ==========================================

export const getReports = () =>
  request("/librarian/reports");
