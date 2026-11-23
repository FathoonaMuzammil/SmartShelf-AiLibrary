import { useEffect, useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { getFeedback } from "../../services/lecturerService";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};

function LecturerStudentFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadFeedback = async () => {
      try {
        const data = await getFeedback();

        if (!cancelled) {
          setFeedback(data.feedback);
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

    loadFeedback();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardLayout
      role="lecturer"
      title="Student Feedback"
      activeItem="Student Feedback"
    >
      {loading && <p>Loading feedback...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && feedback.length === 0 && (
        <p>
          No feedback yet. Create a recommendation to start receiving student
          ratings and reviews.
        </p>
      )}

      {feedback.map((item) => (
        <div key={item.recommendation_id} style={cardStyle}>
          <h3>{item.title}</h3>
          <p>by {item.authors}</p>
          <p>
            <strong>Subject:</strong> {item.subject_name} |{" "}
            <strong>Topic:</strong> {item.topic_name}
          </p>
          <p>
            <strong>Average rating:</strong>{" "}
            {item.average_rating === null
              ? "No ratings yet"
              : `${item.average_rating} / 5 (${item.rating_count} ${
                  item.rating_count === 1 ? "rating" : "ratings"
                })`}
          </p>

          {item.reviews.length === 0 ? (
            <p>No written reviews yet.</p>
          ) : (
            <ul>
              {item.reviews.map((review) => (
                <li key={review.review_id}>
                  {review.rating ? `${review.rating}/5: ` : ""}
                  {review.review_text}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </DashboardLayout>
  );
}

export default LecturerStudentFeedbackPage;