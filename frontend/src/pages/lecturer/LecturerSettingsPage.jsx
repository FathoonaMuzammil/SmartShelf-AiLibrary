import { useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { changePassword } from "../../services/lecturerService";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
  maxWidth: 560,
};

const fieldStyle = { width: "100%", maxWidth: 420, padding: "8px 10px" };

const EMPTY_FORM = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function LecturerSettingsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setMessage("");

    if (!form.current_password) {
      setError("Please enter your current password.");
      return;
    }

    if (form.new_password.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSaving(true);

      await changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });

      setMessage("Password changed successfully.");
      setForm(EMPTY_FORM);
    } catch (err) {
      // Typed values are kept so the lecturer can correct and retry.
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="lecturer" title="Settings" activeItem="Settings">
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Change password</h3>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="current_password">Current password</label>
          <br />
          <input
            id="current_password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            value={form.current_password}
            onChange={handleChange}
            style={fieldStyle}
          />
          <br />
          <br />

          <label htmlFor="new_password">New password</label>
          <br />
          <input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            value={form.new_password}
            onChange={handleChange}
            style={fieldStyle}
          />
          <br />
          <br />

          <label htmlFor="confirm_password">Confirm new password</label>
          <br />
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            value={form.confirm_password}
            onChange={handleChange}
            style={fieldStyle}
          />
          <br />
          <br />

          {error && <p role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Change password"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default LecturerSettingsPage;
