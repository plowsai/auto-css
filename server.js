const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Code generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Or use gpt-3.5-turbo for lower cost
      messages: [
        {
          role: "system",
          content: "You are a helpful programming assistant. Respond with clean, well-formatted code based on the user's request. Include only the code without explanations unless specifically asked."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Lower temperature for more deterministic code output
      max_tokens: 2048
    });
    
    // Extract the response text
    const responseText = completion.choices[0].message.content.trim();
    
    // Simple code extraction and language detection
    let code = responseText;
    let language = 'javascript'; // Default
    
    // Check if response is wrapped in markdown code blocks
    const codeBlockRegex = /```([a-zA-Z0-9_+-]+)?\s*\n([\s\S]+?)\n```/;
    const match = responseText.match(codeBlockRegex);
    
    if (match) {
      language = match[1] || 'javascript';
      code = match[2].trim();
    }
    
    res.json({ code, language });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});