import { useEffect, useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { getProfile, updateProfile } from "../../services/lecturerService";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
  maxWidth: 560,
};

const fieldStyle = { width: "100%", maxWidth: 420, padding: "8px 10px" };

function LecturerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getProfile();

        if (!cancelled) {
          setProfile(data.profile);
          setFullName(data.profile.full_name);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setMessage("");

    if (fullName.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    try {
      setSaving(true);
      const data = await updateProfile({ full_name: fullName.trim() });

      // Keep the saved session in sync so the topbar shows the new name.
      try {
        const stored = JSON.parse(
          sessionStorage.getItem("smartshelf_user") || "{}",
        );
        stored.full_name = data.full_name;
        sessionStorage.setItem("smartshelf_user", JSON.stringify(stored));
      } catch {
        // Ignore session update problems.
      }

      setProfile((previous) => ({ ...previous, full_name: data.full_name }));
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      role="lecturer"
      title="My Profile"
      activeItem="Profile"
    >
      {loading && <p>Loading profile...</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {profile && (
        <div style={cardStyle}>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Role:</strong> Lecturer
          </p>
          <p>
            <strong>Joined:</strong>{" "}
            {new Date(profile.created_at).toLocaleDateString()}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="full_name">Full name</label>
            <br />
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              style={fieldStyle}
            />
            <br />
            <br />
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

export default LecturerProfilePage;