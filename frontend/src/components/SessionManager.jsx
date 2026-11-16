import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getValidSession } from "../services/authUtils";

function SessionManager() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToLogin = () => {
      sessionStorage.setItem("smartshelf_session_expired", "true");

      clearAuthSession();

      navigate("/login", {
        replace: true,
        state: { sessionExpired: true },
      });
    };

    const session = getValidSession();

    if (!session) {
      redirectToLogin();
      return;
    }

    try {
      const tokenParts = session.token.split(".");

      const base64Payload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");

      const paddedPayload = base64Payload.padEnd(
        Math.ceil(base64Payload.length / 4) * 4,
        "=",
      );

      const tokenPayload = JSON.parse(atob(paddedPayload));

      if (
        typeof tokenPayload.exp !== "number" ||
        tokenPayload.exp * 1000 <= Date.now()
      ) {
        redirectToLogin();
        return;
      }

      const remainingTime = tokenPayload.exp * 1000 - Date.now();

      const expiryTimer = window.setTimeout(redirectToLogin, remainingTime);

      return () => window.clearTimeout(expiryTimer);
    } catch {
      redirectToLogin();
    }
  }, [navigate]);

  return null;
}

export default SessionManager;
