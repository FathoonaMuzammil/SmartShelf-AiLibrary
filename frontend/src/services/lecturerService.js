const API_BASE_URL = "http://localhost:5000/api";

const getAuthToken = () => sessionStorage.getItem("smartshelf_token");

// Common helper for all lecturer API calls
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

// Subjects and topics for the recommendation form
export const getFilters = () => request("/lecturer/filters");

// Search books. filters: { search, subject_id, topic_id, availability }
export const getBooks = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  const query = params.toString();

  return request(`/lecturer/books${query ? `?${query}` : ""}`);
};

// Create a new recommendation
export const createRecommendation = (recommendation) =>
  request("/lecturer/recommendations", {
    method: "POST",
    body: recommendation,
  });

// All recommendations created by the logged-in lecturer
export const getMyRecommendations = () => request("/lecturer/recommendations");

// Edit one of my recommendations
export const updateRecommendation = (recommendationId, data) =>
  request(`/lecturer/recommendations/${recommendationId}`, {
    method: "PUT",
    body: data,
  });

// Delete one of my recommendations
export const deleteRecommendation = (recommendationId) =>
  request(`/lecturer/recommendations/${recommendationId}`, {
    method: "DELETE",
  });