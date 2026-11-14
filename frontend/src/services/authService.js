const API_BASE_URL = "http://localhost:5000/api";

// Login using the SmartShelf backend
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed. Please try again.");
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

// Register a new student account
export const registerUser = async (full_name, email, student_id, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name,
        email,
        student_id,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed. Please try again.");
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
