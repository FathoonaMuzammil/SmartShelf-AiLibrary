const API_BASE_URL = "http://localhost:5000/api";

// NOTE: if the token is stored under a different key, change it here only.
const getAuthToken = () => sessionStorage.getItem("smartshelf_token");

// Common helper for all student API calls
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
        { cause: error },
      );
    }

    throw error;
  }
};

// ---------- Book discovery ----------

// Subjects and topics for the filters
export const getFilters = () => request("/student/filters");

// Search books. filters: { search, subject_id, topic_id, availability }
export const getBooks = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  const query = params.toString();

  return request(`/student/books${query ? `?${query}` : ""}`);
};

// Single book details
export const getBookById = (bookId) => request(`/student/books/${bookId}`);

// ---------- Reservations ----------

// Reserve a book (or join the waiting list)
export const reserveBook = (bookId) =>
  request("/student/reservations", {
    method: "POST",
    body: { book_id: bookId },
  });

// All reservations of the logged-in student
export const getMyReservations = () => request("/student/reservations");

// Cancel an active reservation
export const cancelReservation = (reservationId) =>
  request(`/student/reservations/${reservationId}/cancel`, {
    method: "PATCH",
  });

// ---------- Borrowings ----------

// Current loans, due dates and borrowing history
export const getMyBorrowings = () => request("/student/borrowings");

// ---------- Ratings and reviews ----------

// My feedback and all reviews of a book
export const getBookFeedback = (bookId) =>
  request(`/student/books/${bookId}/feedback`);

// Create or edit my rating (1-5) and optional review for a topic
export const saveFeedback = (bookId, topicId, rating, reviewText) =>
  request(`/student/books/${bookId}/topics/${topicId}/feedback`, {
    method: "PUT",
    body: { rating, review_text: reviewText },
  });
