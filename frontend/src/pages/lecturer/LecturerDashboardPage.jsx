import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { getDashboard } from "../../services/lecturerService";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
};

const statGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 24,
};

const LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all_levels: "All levels",
};

function StatCard({ label, value }) {
  return (
    <div style={cardStyle}>
      <p style={{ margin: 0, color: "#6b7280" }}>{label}</p>
      <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 600 }}>
        {value}
      </p>
    </div>
  );
}

function LecturerDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Read the logged-in user's name from the saved session.
  let fullName = "Lecturer";

  try {
    const storedUser = JSON.parse(
      sessionStorage.getItem("smartshelf_user") || "{}",
    );
    fullName = storedUser.full_name || storedUser.fullName || "Lecturer";
  } catch {
    // Keep the default name if the saved user data cannot be read.
  }

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const result = await getDashboard();

        if (!cancelled) {
          setData(result);
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

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardLayout
      role="lecturer"
      title="Lecturer Dashboard"
      activeItem="Dashboard"
    >
      <h2>Welcome, {fullName}</h2>

      {loading && <p>Loading dashboard...</p>}
      {error && <p role="alert">{error}</p>}

      {data && (
        <>
          <div style={statGridStyle}>
            <StatCard
              label="Total recommendations"
              value={data.summary.total_recommendations}
            />
            <StatCard
              label="Recommended books"
              value={data.summary.recommended_books}
            />
            <StatCard
              label="Student ratings"
              value={data.summary.total_ratings}
            />
            <StatCard
              label="Average rating"
              value={
                data.summary.average_rating === null
                  ? "No ratings yet"
                  : `${data.summary.average_rating} / 5`
              }
            />
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Recent recommendations</h3>

            {data.recent_recommendations.length === 0 ? (
              <p>
                You have not created any recommendations yet.{" "}
                <Link to="/lecturer/recommendations/new">
                  Create your first recommendation
                </Link>
              </p>
            ) : (
              <ul>
                {data.recent_recommendations.map((item) => (
                  <li key={item.recommendation_id}>
                    <strong>{item.title}</strong> | {item.topic_name} |{" "}
                    {LEVEL_LABELS[item.difficulty_level] ||
                      item.difficulty_level}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default LecturerDashboardPage;