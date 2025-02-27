const { OpenAI } = require('openai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate code using OpenAI's API
 * @param {string} prompt - The prompt to send to the API
 * @param {Object} options - Additional options for the API request
 * @returns {Promise<Object>} - The generated code and language
 */
async function generateCode(prompt, options = {}) {
  try {
    const defaultSystemPrompt = "You are a helpful programming assistant. Respond with clean, well-formatted code based on the user's request. Include only the code without explanations unless specifically asked.";
    
    const completion = await openai.chat.completions.create({
      model: options.model || "gpt-4",
      messages: [
        {
          role: "system",
          content: options.systemPrompt || defaultSystemPrompt
        },
        { role: "user", content: prompt }
      ],
      temperature: options.temperature || 0.2,
      max_tokens: options.maxTokens || 2048
    });
    
    // Extract the response text
    const responseText = completion.choices[0].message.content.trim();
    
    // Simple code extraction and language detection
    let code = responseText;
    let language = options.language || 'javascript';
    
    // Check if response is wrapped in markdown code blocks
    const codeBlockRegex = /```([a-zA-Z0-9_+-]+)?\s*\n([\s\S]+?)\n```/;
    const match = responseText.match(codeBlockRegex);
    
    if (match) {
      language = match[1] || language;
      code = match[2].trim();
    }
    
    return { code, language };
  } catch (error) {
    console.error('Error generating code:', error);
    throw new Error('Failed to generate code');
  }
}

module.exports = {
  openai,
  generateCode
}; 