import { useEffect, useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import {
  getMyRecommendations,
  updateRecommendation,
  deleteRecommendation,
} from "../../services/lecturerService";

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all_levels", label: "All levels" },
];

const difficultyLabel = (value) =>
  DIFFICULTY_OPTIONS.find((option) => option.value === value)?.label || value;

const fieldStyle = { width: "100%", maxWidth: 520, padding: "8px 10px" };
const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};

function LecturerMyRecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    explanation: "",
    relevant_chapters: "",
    difficulty_level: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadRecommendations = async () => {
    try {
      setError("");
      const data = await getMyRecommendations();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const startEdit = (item) => {
    setMessage("");
    setError("");
    setEditingId(item.recommendation_id);
    setEditForm({
      explanation: item.explanation,
      relevant_chapters: item.relevant_chapters || "",
      difficulty_level: item.difficulty_level,
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSave = async (recommendationId) => {
    if (saving) return;

    if (!editForm.explanation.trim()) {
      setError("Please explain why this book is useful.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updateRecommendation(recommendationId, {
        explanation: editForm.explanation.trim(),
        relevant_chapters: editForm.relevant_chapters.trim(),
        difficulty_level: editForm.difficulty_level,
      });

      setMessage("Recommendation updated successfully.");
      setEditingId(null);
      await loadRecommendations();
    } catch (err) {
      // Edit form stays open so the lecturer can retry.
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleting || !deleteTarget) return;

    try {
      setDeleting(true);
      setError("");

      await deleteRecommendation(deleteTarget.recommendation_id);

      setMessage("Recommendation deleted successfully.");
      setDeleteTarget(null);
      await loadRecommendations();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout
      role="lecturer"
      title="My Recommendations"
      activeItem="My Recommendations"
    >
      {loading && <p>Loading recommendations...</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {!loading && recommendations.length === 0 && !error && (
        <p>You have not created any recommendations yet.</p>
      )}

      {recommendations.map((item) => (
        <div key={item.recommendation_id} style={cardStyle}>
          <h3>{item.title}</h3>
          <p>by {item.authors}</p>
          <p>
            <strong>Subject:</strong> {item.subject_name} |{" "}
            <strong>Topic:</strong> {item.topic_name} |{" "}
            <strong>Level:</strong> {difficultyLabel(item.difficulty_level)}
          </p>

          {editingId === item.recommendation_id ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label htmlFor={`explanation-${item.recommendation_id}`}>
                  Why is this book useful? *
                </label>
                <br />
                <textarea
                  id={`explanation-${item.recommendation_id}`}
                  name="explanation"
                  rows={3}
                  value={editForm.explanation}
                  onChange={handleEditChange}
                  style={fieldStyle}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor={`chapters-${item.recommendation_id}`}>
                  Relevant chapters or pages
                </label>
                <br />
                <input
                  id={`chapters-${item.recommendation_id}`}
                  name="relevant_chapters"
                  type="text"
                  value={editForm.relevant_chapters}
                  onChange={handleEditChange}
                  style={fieldStyle}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label htmlFor={`difficulty-${item.recommendation_id}`}>
                  Difficulty level *
                </label>
                <br />
                <select
                  id={`difficulty-${item.recommendation_id}`}
                  name="difficulty_level"
                  value={editForm.difficulty_level}
                  onChange={handleEditChange}
                  style={fieldStyle}
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleSave(item.recommendation_id)}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>{" "}
              <button
                type="button"
                onClick={() => setEditingId(null)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <p>{item.explanation}</p>
              {item.relevant_chapters && (
                <p>
                  <strong>Chapters:</strong> {item.relevant_chapters}
                </p>
              )}
              <button type="button" onClick={() => startEdit(item)}>
                Edit
              </button>{" "}
              <button type="button" onClick={() => setDeleteTarget(item)}>
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Simple confirmation dialog for the destructive action */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ ...cardStyle, maxWidth: 420, marginBottom: 0 }}>
            <h3>Delete recommendation?</h3>
            <p>
              This will remove your recommendation of{" "}
              <strong>{deleteTarget.title}</strong> for{" "}
              <strong>{deleteTarget.topic_name}</strong>. This cannot be undone.
            </p>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>{" "}
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default LecturerMyRecommendationsPage;