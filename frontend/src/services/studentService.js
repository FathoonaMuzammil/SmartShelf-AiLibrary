const API_BASE_URL = "http://localhost:5000/api";

// NOTE: if the token is stored under a different key, change it here only.
const getAuthToken = () => sessionStorage.getItem("smartshelf_token");

// Common helper for all student API calls
const request = async (path) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
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
