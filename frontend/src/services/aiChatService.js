const API_BASE_URL = "http://localhost:5000/api";

// If the AI backend uses a different URL, change it here only.
const CHAT_ENDPOINT = "/ai/chat";

const getAuthToken = () => sessionStorage.getItem("smartshelf_token");

// Make every book from the AI backend look the same for the page.
const normalizeBook = (book) => ({
  book_id: book.book_id ?? book.bookId ?? book.id,
  title: book.title ?? "Untitled",
  authors: book.authors ?? book.author ?? "",
  is_available:
    book.is_available ??
    book.available ??
    (typeof book.available_copies === "number"
      ? book.available_copies > 0
      : false),
  available_copies: book.available_copies ?? null,
  total_copies: book.total_copies ?? null,
  shelf_location: book.shelf_location ?? book.shelf_locations ?? "",
  explanation: book.explanation ?? book.reason ?? book.why ?? "",
});

// Send one message to the AI Library Assistant.
export const sendChatMessage = async (message, conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}${CHAT_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
            body: JSON.stringify({
        message,
        question: message,
        prompt: message,
        query: message,
        conversation_id: conversationId || undefined,
        conversationId: conversationId || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "The AI assistant could not answer.");
    }

    const books =
      data.books ??
      data.recommendations ??
      data.recommended_books ??
      data.results ??
      [];

    return {
      reply:
        data.reply ?? data.answer ?? data.response ?? data.text ?? data.message ?? "",
      books: Array.isArray(books) ? books.map(normalizeBook) : [],
      conversationId: data.conversation_id ?? data.conversationId ?? null,
    };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to SmartShelf server. Please check whether the backend is running.",
        { cause: error },
      );
    }

    throw error;
  }
};
