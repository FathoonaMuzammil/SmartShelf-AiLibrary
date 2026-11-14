import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { BookOpen, ArrowRight } from "lucide-react";

import { loginUser } from "../services/authService";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import "../App.css";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check whether the session expired.
  const sessionExpired =
    location.state?.sessionExpired ||
    sessionStorage.getItem("smartshelf_session_expired") === "true";

  useEffect(() => {
    if (sessionExpired) {
      sessionStorage.removeItem("smartshelf_session_expired");
    }
  }, [sessionExpired]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(email.trim(), password);

      // Store authentication information.
      sessionStorage.setItem("smartshelf_token", data.token);
      sessionStorage.setItem("smartshelf_user", JSON.stringify(data.user));

      // Clear the previous session-expiration notice.
      sessionStorage.removeItem("smartshelf_session_expired");

      // Redirect according to the user's actual backend role.
      const dashboardPaths = {
        student: "/student/dashboard",
        lecturer: "/lecturer/dashboard",
        librarian: "/librarian/dashboard",
        admin: "/librarian/dashboard",
      };

      const destination = dashboardPaths[data.user?.role];

      if (destination) {
        navigate(destination, { replace: true });
      } else {
        sessionStorage.removeItem("smartshelf_token");
        sessionStorage.removeItem("smartshelf_user");

        setError("Your account has an unrecognized role.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">S</span>
          <span>SmartShelf</span>
        </Link>

        <Link to="/explore" className="auth-back-link">
          Explore Books
        </Link>
      </header>

      <main className="auth-main">
        <section className="auth-card login-card">
          <div className="auth-icon">
            <BookOpen size={27} />
          </div>

          <span className="eyebrow">WELCOME BACK</span>

          <h1>Sign in to SmartShelf</h1>

          <p className="auth-subtitle">
            Continue your learning journey and discover knowledge from your
            university library.
          </p>

          <form onSubmit={handleSubmit}>
            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="Enter your university email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="auth-form-group"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="auth-form-group"
            />

            {/* Session expiration message */}
            {sessionExpired && (
              <div className="auth-error" role="alert">
                Your session has expired. Please sign in again.
              </div>
            )}

            {/* Login error message */}
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
              loading={loading}
            >
              Sign In
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="auth-divider">
            <span>New to SmartShelf?</span>
          </div>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </section>

        <p className="auth-footer">Discover. Learn. Borrow.</p>
      </main>
    </div>
  );
}

export default LoginPage;
