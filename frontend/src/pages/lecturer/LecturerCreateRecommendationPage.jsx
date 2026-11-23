import { useEffect, useState } from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import {
  getFilters,
  getBooks,
  createRecommendation,
} from "../../services/lecturerService";

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all_levels", label: "All levels" },
];

const EMPTY_FORM = {
  subject_id: "",
  topic_id: "",
  book_id: "",
  explanation: "",
  relevant_chapters: "",
  difficulty_level: "",
};

const fieldStyle = { width: "100%", maxWidth: 520, padding: "10px 12px" };
const rowStyle = { marginBottom: 16 };

function LecturerCreateRecommendationPage() {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [books, setBooks] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load subjects, topics and the library catalogue once.
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [filterData, bookData] = await Promise.all([
          getFilters(),
          getBooks(),
        ]);

        if (!cancelled) {
          setSubjects(filterData.subjects);
          setTopics(filterData.topics);
          setBooks(bookData.books);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Only show topics that belong to the selected subject.
  const visibleTopics = topics.filter(
    (topic) => String(topic.subject_id) === form.subject_id,
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const updated = { ...previous, [name]: value };

      // Changing the subject clears the previously selected topic.
      if (name === "subject_id") {
        updated.topic_id = "";
      }

      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prevent duplicate submissions.
    if (submitting) {
      return;
    }

    setError("");
    setSuccess("");

    if (!form.subject_id || !form.topic_id || !form.book_id) {
      setError("Please select a subject, topic and book.");
      return;
    }

    if (!form.explanation.trim()) {
      setError("Please explain why this book is useful.");
      return;
    }

    if (!form.difficulty_level) {
      setError("Please select a difficulty level.");
      return;
    }

    try {
      setSubmitting(true);

      await createRecommendation({
        book_id: Number(form.book_id),
        topic_id: Number(form.topic_id),
        explanation: form.explanation.trim(),
        relevant_chapters: form.relevant_chapters.trim(),
        difficulty_level: form.difficulty_level,
      });

      setSuccess("Recommendation created successfully.");
      setForm(EMPTY_FORM);
    } catch (err) {
      // Form values are kept so the lecturer can correct and retry.
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      role="lecturer"
      title="Create Recommendation"
      activeItem="Create Recommendation"
    >
      {loadingData ? (
        <p>Loading form...</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div style={rowStyle}>
            <label htmlFor="subject_id">Subject *</label>
            <br />
            <select
              id="subject_id"
              name="subject_id"
              value={form.subject_id}
              onChange={handleChange}
              style={fieldStyle}
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div style={rowStyle}>
            <label htmlFor="topic_id">Topic *</label>
            <br />
            <select
              id="topic_id"
              name="topic_id"
              value={form.topic_id}
              onChange={handleChange}
              disabled={!form.subject_id}
              style={fieldStyle}
            >
              <option value="">
                {form.subject_id ? "Select a topic" : "Select a subject first"}
              </option>
              {visibleTopics.map((topic) => (
                <option key={topic.topic_id} value={topic.topic_id}>
                  {topic.topic_name}
                </option>
              ))}
            </select>
          </div>

          <div style={rowStyle}>
            <label htmlFor="book_id">Book *</label>
            <br />
            <select
              id="book_id"
              name="book_id"
              value={form.book_id}
              onChange={handleChange}
              style={fieldStyle}
            >
              <option value="">Select a book from the catalogue</option>
              {books.map((book) => (
                <option key={book.book_id} value={book.book_id}>
                  {book.title} - {book.authors}
                </option>
              ))}
            </select>
          </div>

          <div style={rowStyle}>
            <label htmlFor="explanation">Why is this book useful? *</label>
            <br />
            <textarea
              id="explanation"
              name="explanation"
              rows={4}
              value={form.explanation}
              onChange={handleChange}
              style={fieldStyle}
            />
          </div>

          <div style={rowStyle}>
            <label htmlFor="relevant_chapters">
              Relevant chapters or pages (optional)
            </label>
            <br />
            <input
              id="relevant_chapters"
              name="relevant_chapters"
              type="text"
              value={form.relevant_chapters}
              onChange={handleChange}
              placeholder="e.g. Chapter 4, pages 80-110"
              style={fieldStyle}
            />
          </div>

          <div style={rowStyle}>
            <label htmlFor="difficulty_level">Difficulty level *</label>
            <br />
            <select
              id="difficulty_level"
              name="difficulty_level"
              value={form.difficulty_level}
              onChange={handleChange}
              style={fieldStyle}
            >
              <option value="">Select a difficulty level</option>
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p role="alert">{error}</p>}
          {success && <p role="status">{success}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Create Recommendation"}
          </button>
        </form>
      )}
    </DashboardLayout>
  );
}

export default LecturerCreateRecommendationPage;