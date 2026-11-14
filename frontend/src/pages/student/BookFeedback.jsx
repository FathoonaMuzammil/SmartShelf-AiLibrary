import { useCallback, useEffect, useState } from "react";
import { Star, User } from "lucide-react";

import { getBookFeedback, saveFeedback } from "../../services/studentService";

import "./BookFeedback.css";

// Clickable 1-5 stars
function StarPicker({ value, onChange }) {
  return (
    <div className="star-picker" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((number) => (
        <button
          key={number}
          type="button"
          className="star-button"
          onClick={() => onChange(number)}
          aria-label={`${number} star${number > 1 ? "s" : ""}`}
          aria-checked={value === number}
          role="radio"
        >
          <Star
            size={26}
            fill={number <= value ? "currentColor" : "none"}
            strokeWidth={1.6}
          />
        </button>
      ))}
    </div>
  );
}

// Read-only stars
function StarDisplay({ value }) {
  return (
    <span className="star-display">
      {[1, 2, 3, 4, 5].map((number) => (
        <Star
          key={number}
          size={14}
          fill={number <= value ? "currentColor" : "none"}
          strokeWidth={1.6}
        />
      ))}
    </span>
  );
}

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function BookFeedback({ bookId, topics, onSaved }) {
  const [myFeedback, setMyFeedback] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [topicId, setTopicId] = useState(topics[0]?.topic_id ?? "");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadFeedback = useCallback(() => {
    getBookFeedback(bookId)
      .then((data) => {
        setMyFeedback(data.my_feedback);
        setReviews(data.reviews);
      })
      .catch((err) => setError(err.message));
  }, [bookId]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Fill the form with my existing rating when the topic changes
  useEffect(() => {
    const mine = myFeedback.find(
      (item) => String(item.topic_id) === String(topicId),
    );

    setRating(mine ? mine.rating : 0);
    setReviewText(mine?.review_text || "");
  }, [topicId, myFeedback]);

  const hasExisting = myFeedback.some(
    (item) => String(item.topic_id) === String(topicId),
  );

  const handleSave = async () => {
    setMessage("");
    setError("");

    if (!topicId) {
      setError("Please select a topic.");
      return;
    }

    if (rating < 1) {
      setError("Please choose a rating from 1 to 5 stars.");
      return;
    }

    setSaving(true);

    try {
      const data = await saveFeedback(bookId, topicId, rating, reviewText);
      setMessage(data.message);
      loadFeedback();
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (topics.length === 0) {
    return null;
  }

  return (
    <section className="details-section feedback-section">
      <h2>Rate this book</h2>

      <p className="feedback-hint">
        Ratings are given per topic, because a book can suit one topic better
        than another.
      </p>

      <div className="feedback-form">
        <label htmlFor="feedback-topic">Topic</label>
        <select
          id="feedback-topic"
          value={topicId}
          onChange={(event) => {
            setTopicId(event.target.value);
            setMessage("");
            setError("");
          }}
        >
          {topics.map((topic) => (
            <option key={topic.topic_id} value={topic.topic_id}>
              {topic.topic_name}
            </option>
          ))}
        </select>

        <label>How relevant is this book for this topic?</label>
        <StarPicker value={rating} onChange={setRating} />

        <label htmlFor="feedback-review">Review (optional)</label>
        <textarea
          id="feedback-review"
          rows={4}
          maxLength={1000}
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          placeholder="Write a short review to help other students..."
        />

        <div className="feedback-actions">
          <button
            type="button"
            className="feedback-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : hasExisting
                ? "Update my rating"
                : "Submit rating"}
          </button>
        </div>

        {message && <p className="feedback-success">{message}</p>}
        {error && <p className="feedback-error">{error}</p>}
      </div>

      <h3 className="feedback-subheading">Student reviews</h3>

      {reviews.length === 0 ? (
        <p className="details-muted">No reviews yet. Be the first to write one.</p>
      ) : (
        <div className="details-topic-list">
          {reviews.map((review) => (
            <div className="feedback-review" key={review.review_id}>
              <div className="feedback-review-top">
                <span className="feedback-author">
                  <User size={14} />
                  {review.is_mine ? "You" : review.full_name}
                </span>
                {review.rating && <StarDisplay value={review.rating} />}
              </div>

              <p className="details-muted">
                {review.topic_name} · {formatDate(review.updated_at)}
              </p>

              <p>{review.review_text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default BookFeedback;
