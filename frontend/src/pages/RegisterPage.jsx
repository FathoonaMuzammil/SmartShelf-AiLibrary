import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, User, CheckCircle } from "lucide-react";

import { registerUser } from "../services/authService";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import "../App.css";

function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !studentId.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please complete all the required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please check again.");
      return;
    }

    try {
      setLoading(true);

      await registerUser(
        fullName.trim(),
        email.trim(),
        studentId.trim(),
        password,
      );

      setSuccess("Your SmartShelf account has been created successfully!");

      // Clear the form after successful registration.
      setFullName("");
      setEmail("");
      setStudentId("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
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
        <section className="auth-card">
          <div className="auth-icon">
            <User size={27} />
          </div>

          <span className="eyebrow">JOIN SMARTSHELF</span>

          <h1>Create your account</h1>

          <p className="auth-subtitle">
            Join your university library community and discover a smarter way to
            learn.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <Input
              label="Full name"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
              className="auth-form-group"
            />

            {/* Email */}
            <Input
              label="University email address"
              name="email"
              type="email"
              placeholder="Enter your university email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="auth-form-group"
            />

            {/* Student ID */}
            <Input
              label="Student ID"
              name="studentId"
              type="text"
              placeholder="Enter your student ID"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              required
              className="auth-form-group"
            />

            {/* Password */}
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Create a password (minimum 8 characters)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              className="auth-form-group"
            />

            {/* Confirm Password */}
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="Enter your password again"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              className="auth-form-group"
            />

            {/* Error Message */}
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="auth-success" role="status">
                <CheckCircle size={19} />
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
              loading={loading}
            >
              Create Account
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="auth-divider">
            <span>Already a member?</span>
          </div>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>

        <p className="auth-footer">Discover. Learn. Borrow.</p>
      </main>
    </div>
  );
}

export default RegisterPage;
