import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getValidSession } from "../services/authUtils";

function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();

  // Check whether a token existed before validation.
  const hadToken = Boolean(sessionStorage.getItem("smartshelf_token"));

  const session = getValidSession();

  if (!session) {
    if (hadToken) {
      sessionStorage.setItem("smartshelf_session_expired", "true");
    }

    const sessionExpired =
      hadToken ||
      sessionStorage.getItem("smartshelf_session_expired") === "true";

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          sessionExpired,
        }}
      />
    );
  }

  const { user } = session;

  if (!allowedRoles.includes(user.role)) {
    const dashboardPaths = {
      student: "/student/dashboard",
      lecturer: "/lecturer/dashboard",
      librarian: "/librarian/dashboard",
      admin: "/librarian/dashboard",
    };

    return <Navigate to={dashboardPaths[user.role] || "/login"} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
