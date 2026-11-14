import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Send, Sparkles, User } from "lucide-react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";

import { sendChatMessage } from "../../services/aiChatService";
import { reserveBook } from "../../services/studentService";

import "./AIAssistantPage.css";

const SUGGESTIONS = [
  "I need books to learn Computer Networks.",
  "Recommend a beginner book for the OSI model.",
  "Which books explain gradient descent?",
  "Show me books about SQL joins.",
];

const GREETING = {
  role: "assistant",
  text: "Hi! I'm the SmartShelf Library Assistant. Tell me what you want to learn and I will suggest books from our library, with availability and shelf location.",
  books: [],
};

function AIAssistantPage() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState(null);

  // Reserve status for each book card: { [bookId]: { text, isError } }
  const [reserveStatus, setReserveStatus] = useState({});

  const bottomRef = useRef(null);

  // Scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (text) => {
    const question = (text ?? input).trim();

    if (!question || sending) return;

    setError("");
    setInput("");
    setMessages((previous) => [
      ...previous,
      { role: "user", text: question, books: [] },
    ]);
    setSending(true);

    try {
      const result = await sendChatMessage(question, conversationId);

      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: result.reply || "Here is what I found.",
          books: result.books,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleReserve = async (bookId) => {
    setReserveStatus((previous) => ({
      ...previous,
      [bookId]: { text: "Reserving...", isError: false },
    }));

    try {
      const data = await reserveBook(bookId);

      setReserveStatus((previous) => ({
        ...previous,
        [bookId]: { text: data.message, isError: false },
      }));
    } catch (err) {
      setReserveStatus((previous) => ({
        ...previous,
        [bookId]: { text: err.message, isError: true },
      }));
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = messages.length === 1;

  return (
    <DashboardLayout
      role="student"
      title="AI Assistant"
      activeItem="AI Assistant"
    >
      <section className="ai-heading">
        <h1>AI Library Assistant</h1>
        <p>Describe what you want to learn and get books from our library.</p>
      </section>

      <div className="ai-chat">
        <div className="ai-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`ai-row ${
                message.role === "user" ? "ai-row-user" : "ai-row-assistant"
              }`}
            >
              <div className="ai-avatar">
                {message.role === "user" ? (
                  <User size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
              </div>

              <div className="ai-content">
                <div className="ai-bubble">{message.text}</div>

                {message.books.length > 0 && (
                  <div className="ai-books">
                    {message.books.map((book) => (
                      <article className="ai-book" key={book.book_id}>
                        <h3>{book.title}</h3>

                        {book.authors && (
                          <p className="ai-muted">{book.authors}</p>
                        )}

                        <StatusBadge
                          status={book.is_available ? "Available" : "Unavailable"}
                        />

                        {book.available_copies !== null &&
                          book.total_copies !== null && (
                            <p className="ai-muted">
                              {book.available_copies} of {book.total_copies}{" "}
                              copies available
                            </p>
                          )}

                        {book.shelf_location && (
                          <p className="ai-shelf">
                            <MapPin size={13} /> {book.shelf_location}
                          </p>
                        )}

                        {book.explanation && (
                          <p className="ai-explanation">{book.explanation}</p>
                        )}

                        <div className="ai-book-actions">
                          <Link
                            to={`/student/books/${book.book_id}`}
                            className="ai-view"
                          >
                            View Book
                          </Link>

                          <button
                            type="button"
                            className="ai-reserve"
                            onClick={() => handleReserve(book.book_id)}
                            disabled={
                              reserveStatus[book.book_id] &&
                              !reserveStatus[book.book_id].isError
                            }
                          >
                            {book.is_available ? "Reserve" : "Join waiting list"}
                          </button>
                        </div>

                        {reserveStatus[book.book_id] && (
                          <p
                            className={
                              reserveStatus[book.book_id].isError
                                ? "ai-status-error"
                                : "ai-status-ok"
                            }
                          >
                            {reserveStatus[book.book_id].text}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="ai-row ai-row-assistant">
              <div className="ai-avatar">
                <Sparkles size={16} />
              </div>
              <div className="ai-bubble ai-typing">Thinking...</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {showSuggestions && (
          <div className="ai-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {error && <p className="ai-error">{error}</p>}

        <div className="ai-input-row">
          <textarea
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about a subject, topic or book..."
            maxLength={1000}
          />

          <button
            type="button"
            className="ai-send"
            onClick={() => handleSend()}
            disabled={sending || input.trim().length === 0}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AIAssistantPage;
