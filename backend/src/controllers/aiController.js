
const aiService = require('../services/aiService');
const db = require('../config/db');

const chatWithAI = async (req, res, next) => {
    try {
        const body = req.body || {};
        const question = body.question;
        const conversationId = body.conversation_id;

        // Validate the student's question
        if (typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a question.'
            });
        }

        if (question.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Your question must not exceed 1000 characters.'
            });
        }

        const userId = req.user.userId;
        let activeConversationId = conversationId;

        // Create a new conversation if one does not exist
        if (!activeConversationId) {
            activeConversationId = await aiService.createConversation(
                userId,
                question.trim().substring(0, 200)
            );
        } else {
            // Check whether this conversation belongs to the logged-in student
            const [conversations] = await db.execute(
                `SELECT conversation_id
                 FROM AIConversations
                 WHERE conversation_id = ? AND user_id = ?`,
                [activeConversationId, userId]
            );

            if (conversations.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found.'
                });
            }
        }

        // Retrieve previous messages from this conversation
        const conversationHistory = await aiService.getConversationHistory(
            userId,
            activeConversationId
        );

        // Generate an answer using the conversation history
        const answer = await aiService.generateAIResponse(
            question.trim(),
            conversationHistory
        );

        // Save the student's message
        await aiService.saveChatMessage(
            activeConversationId,
            'user',
            question.trim()
        );

        // Save the AI assistant's response
        await aiService.saveChatMessage(
            activeConversationId,
            'assistant',
            answer
        );

        return res.status(200).json({
            success: true,
            conversation_id: activeConversationId,
            answer
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { chatWithAI };
