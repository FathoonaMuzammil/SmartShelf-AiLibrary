const db = require('../config/db');
const ai = require('../config/gemini');

// Search the real SmartShelf book catalogue
const searchBooks = async (searchTerm) => {

    const keyword = `%${searchTerm}%`;

    const [books] = await db.execute(
        `SELECT
            b.book_id,
            b.title,
            b.authors,
            b.description,
            b.publisher,
            b.publication_year,
            b.language,
            b.cover_image_url,
            GROUP_CONCAT(
                DISTINCT bc.shelf_location
                SEPARATOR ', '
            ) AS shelf_locations,
            COUNT(bc.copy_id) AS total_copies,
            COALESCE(
                SUM(
                    CASE
                        WHEN bc.status = 'available' THEN 1
                        ELSE 0
                    END
                ), 0
            ) AS available_copies
        FROM Books b
        LEFT JOIN BookCopies bc
            ON b.book_id = bc.book_id
        WHERE
            b.title LIKE ?
            OR b.authors LIKE ?
            OR b.description LIKE ?
            OR b.publisher LIKE ?
        GROUP BY b.book_id
        ORDER BY b.title ASC
        LIMIT 10`,
        [keyword, keyword, keyword, keyword]
    );

    return books;
};


// Find relevant books using a student's natural-language question
const getRelevantBooks = async (question) => {

    if (typeof question !== 'string' || !question.trim()) {
        return [];
    }

    const stopWords = new Set([
    'the', 'and', 'for', 'with', 'about',
    'what', 'where', 'when', 'which', 'who',
    'can', 'could', 'would', 'should',
    'find', 'show', 'recommend', 'suggest',
    'book', 'books', 'some', 'any', 'please',
    'want', 'need', 'looking', 'give', 'tell',
    'me', 'more', 'related', 'another', 'topic',
    'topics', 'information', 'help', 'like',
    'good', 'best'
]);

    const keywords = question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

const searchTerms = [
    ...keywords,
    keywords.join(' ')
].filter(term => term.length > 0);

    if (keywords.length === 0) {
        return [];
    }

    const results = await Promise.all(
    searchTerms.map(term => searchBooks(term))
);

    const bookScores = new Map();

results.forEach((books, index) => {
    books.forEach(book => {
        const existing = bookScores.get(book.book_id);

        if (!existing) {
            bookScores.set(book.book_id, {
                ...book,
                relevance_score: 0
            });
        }

        bookScores.get(book.book_id).relevance_score +=
            index === keywords.length ? 2 : 1;
    });
});

return Array.from(bookScores.values())
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 10);
};


// Generate an AI response using real catalogue information
const generateAIResponse = async (question, conversationHistory = []) => {

    const previousContext = conversationHistory
    .slice(-4)
    .map(message => message.message_text)
    .join(' ');

const searchContext = `${previousContext} ${question}`;

const books = await getRelevantBooks(searchContext);

    const catalogueContext = books.length > 0
        ? JSON.stringify(books, null, 2)
        : 'No matching books were found in the SmartShelf catalogue.';

    // Format previous conversation messages
    const historyContext = conversationHistory.length > 0
        ? conversationHistory.map(message => {
            return `${message.sender.toUpperCase()}: ${message.message_text}`;
        }).join('\n')
        : 'This is the beginning of the conversation.';

    // Instructions for Gemini
    const prompt = `
You are the SmartShelf AI Library Assistant.

Your job is to help university students discover books.

IMPORTANT RULES:
1. Use the provided catalogue information when recommending books.
2. Never invent book titles, authors or other catalogue details.
3. Never claim that a book is available unless the catalogue confirms it.
4. If no matching books are provided, clearly tell the student that no matching books were found in the current catalogue.
5. Be friendly, clear and helpful.
6. Keep your answers reasonably short.
7. Use previous conversation messages to understand follow-up questions.
8. Maintain the context of the ongoing conversation.

PREVIOUS CONVERSATION:
${historyContext}

STUDENT'S LATEST QUESTION:
${question}

SMARTSHELF CATALOGUE INFORMATION:
${catalogueContext}

Provide a helpful response to the student.
`;

    // Send the request to Gemini
    const response = await ai.interactions.create({
        model: process.env.GEMINI_MODEL,
        input: prompt
    });

    return response.output_text;
};


// Create a new AI conversation for a student
const createConversation = async (userId, title) => {

    const [result] = await db.execute(
        `INSERT INTO AIConversations
        (user_id, conversation_title)
        VALUES (?, ?)`,
        [userId, title]
    );

    return result.insertId;
};


// Save a message in an AI conversation
const saveChatMessage = async (conversationId, sender, messageText) => {

    const [result] = await db.execute(
        `INSERT INTO AIChatMessages
        (conversation_id, sender, message_text)
        VALUES (?, ?, ?)`,
        [conversationId, sender, messageText]
    );

    return result.insertId;
};


// Get conversation history belonging to a specific student
const getConversationHistory = async (userId, conversationId) => {

    const [rows] = await db.execute(
        `SELECT
            m.message_id,
            m.sender,
            m.message_text,
            m.sent_at
        FROM AIChatMessages m
        INNER JOIN AIConversations c
            ON m.conversation_id = c.conversation_id
        WHERE c.user_id = ?
        AND c.conversation_id = ?
        ORDER BY m.sent_at ASC`,
        [userId, conversationId]
    );

    return rows;
};


module.exports = {
    searchBooks,
    getRelevantBooks,
    generateAIResponse,
    createConversation,
    saveChatMessage,
    getConversationHistory
};
