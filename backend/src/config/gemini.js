const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Create the Gemini AI client
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Export the client for other backend files
module.exports = ai;