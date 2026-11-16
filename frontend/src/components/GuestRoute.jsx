import { Navigate, Outlet } from "react-router-dom";
import { getValidSession } from "../services/authUtils";

function GuestRoute() {
  const session = getValidSession();

  // Allow visitors without a valid session.
  if (!session) {
    return <Outlet />;
  }

  // Redirect authenticated users according to their role.
  const dashboardPaths = {
    student: "/student/dashboard",
    lecturer: "/lecturer/dashboard",
    librarian: "/librarian/dashboard",
    admin: "/librarian/dashboard",
  };

  const destination = dashboardPaths[session.user.role];

  return <Navigate to={destination || "/"} replace />;
}

export default GuestRoute;
