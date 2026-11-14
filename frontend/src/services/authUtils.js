// Clear authentication information from the browser session.
export const clearAuthSession = () => {
  sessionStorage.removeItem("smartshelf_token");
  sessionStorage.removeItem("smartshelf_user");
};

// Get the current authenticated session if the JWT is valid.
export const getValidSession = () => {
  const token = sessionStorage.getItem("smartshelf_token");
  const storedUser = sessionStorage.getItem("smartshelf_user");

  if (!token || !storedUser) {
    return null;
  }

  try {
    const tokenParts = token.split(".");

    if (tokenParts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    // Decode the JWT payload.
    const base64Payload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");

    const paddedPayload = base64Payload.padEnd(
      Math.ceil(base64Payload.length / 4) * 4,
      "=",
    );

    const payload = JSON.parse(atob(paddedPayload));
    const user = JSON.parse(storedUser);

    // Check token expiration.
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
      clearAuthSession();
      return null;
    }

    // Check user information.
    if (!user || !user.role) {
      clearAuthSession();
      return null;
    }

    return { token, user };
  } catch {
    clearAuthSession();
    return null;
  }
};
